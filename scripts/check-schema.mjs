#!/usr/bin/env node
// Check JSON files against a JSON Schema, with nothing to install: a
// small validator for the keywords schemas/*.json use (type, required,
// properties, additionalProperties: false, items, minItems, oneOf,
// enum, pattern, minLength, maxLength, minimum, exclusiveMinimum). A
// keyword it does not know is an error, never ignored.
//   scripts/check-schema.mjs SCHEMA FILE...
//   scripts/check-schema.mjs --self-test
import { readFileSync } from "node:fs";

const known = new Set(["$schema", "title", "description", "type", "required", "properties", "additionalProperties", "items", "minItems", "oneOf", "enum", "pattern", "minLength", "maxLength", "minimum", "exclusiveMinimum"]);
const kind = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);

// The problems with value v under schema s, each "path: what".
export function check(s, v, path = "$") {
  const bad = [];
  for (const k of Object.keys(s)) if (!known.has(k)) throw new Error(`check-schema: keyword "${k}" is not supported (at ${path})`);
  const t = kind(v);
  if (s.type && !(s.type === t || (s.type === "number" && t === "integer"))) return [`${path}: expected ${s.type}, found ${t}`];
  if (s.enum && !s.enum.includes(v)) bad.push(`${path}: ${JSON.stringify(v)} is not one of ${s.enum.join(", ")}`);
  if (t === "string") {
    if (s.pattern && !new RegExp(s.pattern).test(v)) bad.push(`${path}: "${v}" does not match ${s.pattern}`);
    if (s.minLength !== undefined && v.length < s.minLength) bad.push(`${path}: shorter than ${s.minLength}`);
    if (s.maxLength !== undefined && v.length > s.maxLength) bad.push(`${path}: longer than ${s.maxLength} (${v.length})`);
  }
  if (t === "number" || t === "integer") {
    if (s.minimum !== undefined && v < s.minimum) bad.push(`${path}: ${v} is below ${s.minimum}`);
    if (s.exclusiveMinimum !== undefined && v <= s.exclusiveMinimum) bad.push(`${path}: ${v} is not above ${s.exclusiveMinimum}`);
  }
  if (t === "array") {
    if (s.minItems !== undefined && v.length < s.minItems) bad.push(`${path}: fewer than ${s.minItems} items`);
    if (s.items) v.forEach((x, i) => bad.push(...check(s.items, x, `${path}[${i}]`)));
  }
  if (t === "object") {
    for (const k of s.required ?? []) if (!(k in v)) bad.push(`${path}: "${k}" is missing`);
    for (const [k, x] of Object.entries(v)) {
      if (s.properties && k in s.properties) bad.push(...check(s.properties[k], x, `${path}.${k}`));
      else if (s.additionalProperties === false) bad.push(`${path}: "${k}" is not a known property`);
    }
  }
  if (s.oneOf) {
    const fits = s.oneOf.filter((o) => check(o, v, path).length === 0).length;
    if (fits !== 1) bad.push(`${path}: fits ${fits} of the ${s.oneOf.length} forms allowed, not exactly one`);
  }
  return bad;
}

function selfTest() {
  const schema = JSON.parse(readFileSync(new URL("../schemas/lesson.schema.json", import.meta.url), "utf8"));
  const good = { slug: "a", title: "T", fps: 30, scenes: [{ id: "s", seconds: 1.5, heading: "H", lines: ["x", { code: "y" }] }] };
  const expect = (name, change, n) => {
    const v = JSON.parse(JSON.stringify(good));
    change(v);
    const got = check(schema, v);
    if ((got.length > 0) !== n) throw new Error(`self-test: ${name}: ${n ? "accepted" : "rejected: " + got.join("; ")}`);
  };
  expect("the good lesson", () => {}, false);
  expect("a demo", (v) => { v.demo = { repo: "X_eTaL-demos", slug: "life-microscope" }; }, false);
  expect("no title", (v) => { delete v.title; }, true);
  expect("fps 29.97", (v) => { v.fps = 29.97; }, true);
  expect("fps 0", (v) => { v.fps = 0; }, true);
  expect("no scenes", (v) => { v.scenes = []; }, true);
  expect("seconds 0", (v) => { v.scenes[0].seconds = 0; }, true);
  expect("seconds as text", (v) => { v.scenes[0].seconds = "3"; }, true);
  expect("an id with a space", (v) => { v.scenes[0].id = "two words"; }, true);
  expect("a misspelled property", (v) => { v.scenes[0].heding = "H"; }, true);
  expect("a line that is a number", (v) => { v.scenes[0].lines.push(3); }, true);
  expect("a code line with more in it", (v) => { v.scenes[0].lines.push({ code: "x", size: 2 }); }, true);
  expect("an unknown repository", (v) => { v.demo = { repo: "elsewhere", slug: "x" }; }, true);
  expect("narration too long", (v) => { v.scenes[0].narration = "x".repeat(321); }, true);
  let threw = false;
  try { check({ type: "string", format: "date" }, "x"); } catch { threw = true; }
  if (!threw) throw new Error("self-test: an unknown keyword was ignored");
  console.log("check-schema: self-test ok");
}

const args = process.argv.slice(2);
if (args[0] === "--self-test") selfTest();
else if (args.length < 2) { console.error("usage: check-schema.mjs SCHEMA FILE... | --self-test"); process.exit(2); }
else {
  const schema = JSON.parse(readFileSync(args[0], "utf8"));
  let failed = false;
  for (const f of args.slice(1)) {
    let v;
    try { v = JSON.parse(readFileSync(f, "utf8")); } catch (e) { console.error(`FAIL: ${f}: ${e.message}`); failed = true; continue; }
    for (const m of check(schema, v)) { console.error(`FAIL: ${f}: ${m}`); failed = true; }
  }
  if (failed) process.exit(1);
}
