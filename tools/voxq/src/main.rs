//! voxq: the one client of the VoxCPM voice server (Gradio on queenbee).
//!
//! Requesters (scripts, agents) never call the server. They write a
//! request file into ROOT/incoming/; voxq takes requests oldest first, one
//! at a time, calls the server with plain HTTP (upload the voice sample,
//! start /call/generate, read its event stream, download the audio), and
//! writes OUT/ID.wav, then OUT/ID.json, into the output directory the
//! request names. A requester polls for OUT/ID.json: when it exists, the
//! request is finished (status "ok" with the wav beside it, or "error").
//!
//! Guards: one voxq per ROOT (a lock file), so never two requests at once;
//! each call has a timeout and is retried; ROOT/status.json is a heartbeat
//! (rewritten every second: state, current request, queue length, counts,
//! last error), so a stall is visible; requests left in processing/ by a
//! crash go back to the head of the queue on start.
//!
//! Measured 2026-11-21: a request through the Python gradio_client took
//! ~90 s; the same request as plain HTTP took 7 s.
//!
//!   voxq serve  [--root DIR] [--server URL] [--timeout SECS] [--retries N]
//!   voxq submit [--root DIR] --out DIR --text TEXT --reference WAV --prompt-file TXT [--label L] [--wait]
//!   voxq status [--root DIR]

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::thread::sleep;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use fs4::fs_std::FileExt;
use serde::{Deserialize, Serialize};

const DEFAULT_ROOT: &str = "work/voxq";
const DEFAULT_SERVER: &str = "http://queenbee.local:7860";

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Request {
    id: String,
    text: String,
    reference: PathBuf,
    prompt_text: String,
    #[serde(default = "default_cfg")]
    cfg: f64,
    #[serde(default = "default_steps")]
    steps: u32,
    out_dir: PathBuf,
    #[serde(default)]
    label: String,
}
fn default_cfg() -> f64 {
    2.0
}
fn default_steps() -> u32 {
    15
}

#[derive(Serialize, Default)]
struct Status {
    pid: u32,
    state: String,
    current: Option<String>,
    current_label: Option<String>,
    current_since: Option<u64>,
    queued: usize,
    done: u64,
    failed: u64,
    last_ok: Option<u64>,
    last_seconds: Option<f64>,
    last_error: Option<String>,
    updated: u64,
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn now_ns() -> u128 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0)
}

/// Write a file so a reader never sees it half written: a temporary
/// name in the same directory, then a rename.
fn write_atomic(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let tmp = path.with_extension(format!("tmp-{}", std::process::id()));
    {
        let mut f = File::create(&tmp)?;
        f.write_all(bytes)?;
        f.sync_all()?;
    }
    fs::rename(&tmp, path)
}

fn arg(args: &[String], name: &str) -> Option<String> {
    args.iter().position(|a| a == name).and_then(|i| args.get(i + 1).cloned())
}

fn dirs(root: &Path) -> std::io::Result<()> {
    for d in ["incoming", "processing", "done", "failed"] {
        fs::create_dir_all(root.join(d))?;
    }
    Ok(())
}

/// Requests waiting, oldest first: ids start with the submit time in
/// nanoseconds, zero-padded, so name order is arrival order.
fn queue(root: &Path) -> Vec<PathBuf> {
    let mut v: Vec<PathBuf> = fs::read_dir(root.join("incoming"))
        .map(|rd| rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.extension().is_some_and(|x| x == "json")).collect())
        .unwrap_or_default();
    v.sort();
    v
}

fn write_status(root: &Path, st: &mut Status) {
    st.updated = now();
    st.queued = queue(root).len();
    if let Ok(b) = serde_json::to_vec_pretty(st) {
        let _ = write_atomic(&root.join("status.json"), &b);
    }
}

fn log(root: &Path, line: &str) {
    let line = format!("{} {}\n", now(), line);
    eprint!("{line}");
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(root.join("voxq.log")) {
        let _ = f.write_all(line.as_bytes());
    }
}

/// One call to the server: upload the voice sample, start generate, read
/// its event stream to the end, download the audio. Every step under the
/// one timeout of the HTTP client.
fn call(http: &reqwest::blocking::Client, server: &str, r: &Request) -> Result<Vec<u8>, String> {
    let api = format!("{server}/gradio_api");
    let form = reqwest::blocking::multipart::Form::new().file("files", &r.reference).map_err(|e| format!("reference {}: {e}", r.reference.display()))?;
    let up: Vec<String> = http.post(format!("{api}/upload")).multipart(form).send().and_then(|x| x.error_for_status()).and_then(|x| x.json()).map_err(|e| format!("upload: {e}"))?;
    let path = up.first().ok_or("upload: no path returned")?;
    let body = serde_json::json!({ "data": [
        r.text,
        { "path": path, "meta": { "_type": "gradio.FileData" } },
        r.prompt_text, r.cfg, r.steps, false, false
    ]});
    let started: serde_json::Value = http.post(format!("{api}/call/generate")).json(&body).send().and_then(|x| x.error_for_status()).and_then(|x| x.json()).map_err(|e| format!("call: {e}"))?;
    let event = started["event_id"].as_str().ok_or("call: no event_id")?;
    let stream = http.get(format!("{api}/call/generate/{event}")).send().and_then(|x| x.error_for_status()).and_then(|x| x.text()).map_err(|e| format!("stream: {e}"))?;
    // The stream: "event: complete\ndata: [ {file} ]" (or "event: error").
    let mut kind = "";
    let mut data = None;
    for line in stream.lines() {
        if let Some(k) = line.strip_prefix("event: ") {
            kind = k.trim();
        } else if let Some(d) = line.strip_prefix("data: ") {
            if kind == "complete" {
                data = Some(d.to_string());
            } else if kind == "error" {
                return Err(format!("server error: {d}"));
            }
        }
    }
    let data = data.ok_or_else(|| format!("stream ended without a result: {}", stream.chars().take(200).collect::<String>()))?;
    let v: serde_json::Value = serde_json::from_str(&data).map_err(|e| format!("result: {e}"))?;
    let file = &v[0];
    let url = file["url"].as_str().map(String::from).or_else(|| file["path"].as_str().map(|p| format!("{api}/file={p}"))).ok_or("result: no file")?;
    let bytes = http.get(url).send().and_then(|x| x.error_for_status()).and_then(|x| x.bytes()).map_err(|e| format!("download: {e}"))?;
    Ok(bytes.to_vec())
}

fn finish(r: &Request, result: &serde_json::Value, wav: Option<&[u8]>) -> std::io::Result<()> {
    fs::create_dir_all(&r.out_dir)?;
    if let Some(w) = wav {
        write_atomic(&r.out_dir.join(format!("{}.wav", r.id)), w)?;
    }
    // The json last: its presence means the request is finished.
    write_atomic(&r.out_dir.join(format!("{}.json", r.id)), &serde_json::to_vec_pretty(result)?)
}

fn serve(args: &[String]) -> Result<(), String> {
    let root = PathBuf::from(arg(args, "--root").unwrap_or(DEFAULT_ROOT.into()));
    let server = arg(args, "--server").unwrap_or(DEFAULT_SERVER.into());
    let timeout: u64 = arg(args, "--timeout").and_then(|s| s.parse().ok()).unwrap_or(180);
    let retries: u32 = arg(args, "--retries").and_then(|s| s.parse().ok()).unwrap_or(2);
    dirs(&root).map_err(|e| e.to_string())?;
    // One voxq per root: never two requests at once.
    let lockf = File::create(root.join("voxq.lock")).map_err(|e| e.to_string())?;
    // fs4's try_lock_exclusive is Ok(false) when another process holds the
    // lock (not an Err): both must refuse (2026-11-21, two ran at once).
    match lockf.try_lock_exclusive() {
        Ok(true) => {}
        Ok(false) => return Err(format!("another voxq is serving {} (its lock: voxq.lock)", root.display())),
        Err(e) => return Err(format!("cannot lock {}: {e}", root.join("voxq.lock").display())),
    }
    // Also hold the lock older narration scripts take for each request
    // (scripts/voice.py voxcpm_turn), so nothing else overlaps a call.
    let legacy = std::env::var("HOME").map(|h| PathBuf::from(h).join(".cache/voxcpm-tts.lock")).ok();
    // Requests a crash left in processing/ go back to the queue.
    if let Ok(rd) = fs::read_dir(root.join("processing")) {
        for e in rd.flatten() {
            let _ = fs::rename(e.path(), root.join("incoming").join(e.file_name()));
        }
    }
    let http = reqwest::blocking::Client::builder().timeout(Duration::from_secs(timeout)).build().map_err(|e| e.to_string())?;
    let mut st = Status { pid: std::process::id(), state: "idle".into(), ..Default::default() };
    log(&root, &format!("serving {} for {} (timeout {timeout} s, {retries} retries)", root.display(), server));
    loop {
        write_status(&root, &mut st);
        let Some(next) = queue(&root).into_iter().next() else {
            sleep(Duration::from_millis(200));
            continue;
        };
        let name = next.file_name().unwrap().to_owned();
        let taken = root.join("processing").join(&name);
        if fs::rename(&next, &taken).is_err() {
            continue;
        }
        let req: Result<Request, String> = fs::read(&taken).map_err(|e| e.to_string()).and_then(|b| serde_json::from_slice(&b).map_err(|e| e.to_string()));
        let req = match req {
            Ok(r) => r,
            Err(e) => {
                log(&root, &format!("bad request {}: {e}", name.to_string_lossy()));
                st.failed += 1;
                st.last_error = Some(e);
                let _ = fs::rename(&taken, root.join("failed").join(&name));
                continue;
            }
        };
        st.state = "working".into();
        st.current = Some(req.id.clone());
        st.current_label = Some(req.label.clone());
        st.current_since = Some(now());
        write_status(&root, &mut st);
        let mut outcome = Err(String::new());
        let t0 = Instant::now();
        for attempt in 0..=retries {
            let guard = legacy.as_ref().and_then(|p| OpenOptions::new().create(true).append(true).open(p).ok());
            if let Some(g) = &guard {
                let _ = g.lock_exclusive();
            }
            let t = Instant::now();
            outcome = call(&http, &server, &req);
            if let Some(g) = &guard {
                let _ = FileExt::unlock(g);
            }
            match &outcome {
                Ok(_) => {
                    log(&root, &format!("ok {} {:.1} s [{}]", req.id, t.elapsed().as_secs_f64(), req.label));
                    break;
                }
                Err(e) => {
                    log(&root, &format!("try {} failed {} after {:.1} s: {e}", attempt + 1, req.id, t.elapsed().as_secs_f64()));
                    if attempt < retries {
                        sleep(Duration::from_secs(5 * (attempt as u64 + 1)));
                    }
                }
            }
        }
        let secs = t0.elapsed().as_secs_f64();
        let wrote = match &outcome {
            Ok(wav) => {
                st.done += 1;
                st.last_ok = Some(now());
                st.last_seconds = Some(secs);
                finish(&req, &serde_json::json!({"id": req.id, "status": "ok", "seconds": secs, "label": req.label, "text": req.text}), Some(wav))
            }
            Err(e) => {
                st.failed += 1;
                st.last_error = Some(format!("{}: {e}", req.id));
                finish(&req, &serde_json::json!({"id": req.id, "status": "error", "error": e, "seconds": secs, "label": req.label}), None)
            }
        };
        if let Err(e) = wrote {
            log(&root, &format!("could not write the result of {}: {e}", req.id));
        }
        let dest = if outcome.is_ok() { "done" } else { "failed" };
        let _ = fs::rename(&taken, root.join(dest).join(&name));
        st.state = "idle".into();
        st.current = None;
        st.current_label = None;
        st.current_since = None;
    }
}

fn submit(args: &[String]) -> Result<(), String> {
    let root = PathBuf::from(arg(args, "--root").unwrap_or(DEFAULT_ROOT.into()));
    dirs(&root).map_err(|e| e.to_string())?;
    let out = PathBuf::from(arg(args, "--out").ok_or("--out DIR")?);
    let prompt_file = arg(args, "--prompt-file").ok_or("--prompt-file TXT")?;
    let prompt = fs::read_to_string(&prompt_file).map_err(|e| e.to_string())?.split_whitespace().collect::<Vec<_>>().join(" ");
    let id = format!("{:020}-{}", now_ns(), std::process::id());
    let req = Request {
        id: id.clone(),
        text: arg(args, "--text").ok_or("--text TEXT")?,
        reference: fs::canonicalize(arg(args, "--reference").ok_or("--reference WAV")?).map_err(|e| e.to_string())?,
        prompt_text: prompt,
        cfg: default_cfg(),
        steps: default_steps(),
        out_dir: fs::create_dir_all(&out).and_then(|_| fs::canonicalize(&out)).map_err(|e| e.to_string())?,
        label: arg(args, "--label").unwrap_or_default(),
    };
    let tmp = root.join(format!("incoming/.{id}.json"));
    write_atomic(&tmp, &serde_json::to_vec_pretty(&req).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    fs::rename(&tmp, root.join(format!("incoming/{id}.json"))).map_err(|e| e.to_string())?;
    println!("{id}");
    if args.iter().any(|a| a == "--wait") {
        let done = req.out_dir.join(format!("{id}.json"));
        while !done.exists() {
            sleep(Duration::from_millis(250));
        }
        println!("{}", fs::read_to_string(done).map_err(|e| e.to_string())?);
    }
    Ok(())
}

fn status(args: &[String]) -> Result<(), String> {
    let root = PathBuf::from(arg(args, "--root").unwrap_or(DEFAULT_ROOT.into()));
    let s = fs::read_to_string(root.join("status.json")).map_err(|e| format!("no status (is voxq serving {}?): {e}", root.display()))?;
    println!("{s}");
    Ok(())
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let r = match args.get(1).map(String::as_str) {
        Some("serve") => serve(&args),
        Some("submit") => submit(&args),
        Some("status") => status(&args),
        Some("--version") | Some("-V") => {
            println!("voxq {}", env!("CARGO_PKG_VERSION"));
            Ok(())
        }
        _ => Err("usage: voxq serve|submit|status [--root DIR] ... (see the source's header)".into()),
    };
    if let Err(e) = r {
        eprintln!("voxq: {e}");
        std::process::exit(1);
    }
}
