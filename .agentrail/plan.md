# voice

Saga 7 of X_eTaL-video: narration in the user's own cloned voice
(the user, 2026-11-18: curiosity is down for major repairs; VoxCPM
with gradio runs on queenbee.local). The same voice sample and
transcript as this year's narrated shorts:
../video-publishing/reference/voice/mike-medium-ref-1.wav and its
prompt-text.txt.

## Steps

1. narrate-nbody -- `just voice SLUG`: each scene's narration, a
   sentence a call, sent one at a time to VoxCPM on queenbee:7860
   with the reference sample and its exact transcript; padded,
   joined, measured; the scene lengths follow the audio; the audio in
   the Remotion composition; the N-body short re-rendered with its
   narration and shown in a local preview.
