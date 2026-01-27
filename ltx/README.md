# LTX Video Documentation

Lightricks' open-source AI video generation with native audio synchronization.

## Files

| File | Content |
|------|---------|
| `Get_Started_LTX.md` | Comprehensive guide for video + audio generation |
| `LTX_API_REFERENCE.md` | API endpoints quick reference (coming soon) |

## Quick Reference

### Key Differentiator

LTX-2 is the **first production-ready model with native synchronized audio-video generation**.

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `fal-ai/ltx-2/text-to-video/fast` | Fast text-to-video |
| `fal-ai/ltx-2-19b/text-to-video/lora` | T2V with custom LoRA |
| `fal-ai/ltx-2/image-to-video/fast` | Fast image-to-video |
| `fal-ai/ltx-2-19b/image-to-video/lora` | I2V with custom LoRA |
| `fal-ai/ltx-2-19b/video-to-video/lora` | Style transfer |
| `fal-ai/ltx-2-19b/video-trainer` | LoRA training |

### Specifications

| Feature | Specification |
|---------|---------------|
| Resolution | Up to 4K (2160p) |
| Frame Rate | 25 or 50 FPS |
| Duration | Up to 20 seconds |
| Audio | Native synchronized |
| Parameters | 19B (14B video + 5B audio) |

## The A.V.S. Framework

Structure prompts with Audio, Visual, and Scene components:

```javascript
const prompt = buildAVSPrompt({
  audio: {
    dialogue: "A woman says 'Welcome!'",
    ambient: "coffee shop background"
  },
  visual: {
    subject: "A barista",
    action: "prepares a latte",
    camera: "close-up shot"
  },
  scene: {
    setting: "cozy cafe",
    lighting: "warm morning light"
  }
});
```

## Code Quick Start

```javascript
import * as fal from "@fal-ai/serverless-client";

const result = await fal.subscribe("fal-ai/ltx-2/text-to-video/fast", {
  input: {
    prompt: "A chef says 'Let me show you how it's done' while chopping vegetables, kitchen sounds, professional lighting",
    resolution: "1080p",
    fps: 25,
    duration: 6,
    audio_generation: true
  }
});

console.log(result.video.url);
```

## When to Use LTX vs Others

| Use Case | Model |
|----------|-------|
| Video with dialogue | LTX-2 |
| Music videos | LTX-2 |
| Complex camera control | Kling |
| Motion transfer | Kling |
| Short loops | SVD |
