# Kling Documentation

Video generation via FAL.ai (Kling by Kuaishou).

## Files

| File | Content |
|------|---------|
| `Get_Started_Kling.md` | Comprehensive guide (all features) |
| `KLING_API_REFERENCE.md` | Quick API reference |

## Quick Reference

### Model Selection

| Task | Model | Endpoint |
|------|-------|----------|
| Text-to-video | v2.5 Turbo Pro | `fal-ai/kling-video/v2.5-turbo/pro/text-to-video` |
| Image-to-video | v2.1 Pro | `fal-ai/kling-video/v2.1/pro/image-to-video` |
| Motion control | v2.6 Pro | `fal-ai/kling-video/v2.6/pro/motion-control` |
| Video editing | O1 | `fal-ai/kling-video/o1/video-to-video/edit` |

### Pricing

| Mode | Cost/second |
|------|-------------|
| Standard | $0.07 |
| Pro | $0.112 |
| O1 Edit | $0.168 |

### Duration Limits

| Mode | Max Duration |
|------|--------------|
| Image Orientation | 10 seconds |
| Video Orientation | 30 seconds |
| Text-to-Video | 10 seconds |
| O1 Edit | 10 seconds |

## Key Concepts

### Motion Control Orientation Modes

- **Image Orientation**: Camera work, portraits (10s max)
- **Video Orientation**: Dance, choreography (30s max)

### Prompt Rules

1. DON'T describe motion in motion-control (reference video defines it)
2. DO focus on: character identity, environment, style
3. Keep prompts 50-150 words
4. Use `++emphasis++` for critical elements

## Code Quick Start

```javascript
import { fal } from "@fal-ai/client";

// Text-to-Video
const t2v = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: { prompt: "A cat walking through a garden", duration: "5" }
});

// Image-to-Video
const i2v = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: { prompt: "The subject turns slowly", image_url: "https://..." }
});

// Motion Control
const mc = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: "https://...",
    video_url: "https://...",
    character_orientation: "video",
    prompt: "Character on stage, cinematic lighting"
  }
});
```
