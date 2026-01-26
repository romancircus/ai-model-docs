# Get Started with Kling AI Video Generation

Comprehensive guide for Kling AI video generation via FAL.ai.

**Provider:** FAL.ai (not direct Kling API)
**Last Updated:** 2026-01-26

---

## Table of Contents

1. [Overview](#overview)
2. [Model Versions](#model-versions)
3. [Text-to-Video Generation](#text-to-video-generation)
4. [Image-to-Video Generation](#image-to-video-generation)
5. [Motion Control (v2.6)](#motion-control-v26)
6. [Video Editing (O1)](#video-editing-o1)
7. [API Reference](#api-reference)
8. [Prompting Best Practices](#prompting-best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Code Examples](#code-examples)

---

## Overview

Kling AI is developed by Kuaishou Technology and provides:
- **@Kolors** - Image generation technology
- **@Kling** - Video generation technology

We access Kling through **FAL.ai** which provides:
- No Kling account needed
- All supported features
- Competitive pricing
- JavaScript/Python SDKs

### Capabilities Matrix

| Feature | Kling v2.1 | Kling v2.5 | Kling v2.6 | Kling O1 |
|---------|------------|------------|------------|----------|
| Text-to-Video | Yes | Yes (Turbo) | Yes | Yes |
| Image-to-Video | Yes (Pro) | Yes | Yes | Yes |
| Motion Control | No | No | **Yes** | No |
| Video Editing | No | No | No | **Yes** |
| Multi-Image Input | 4 images | 4 images | Via reference | 4 images |
| Max Duration | 10s | 10s | 30s | 10s |

---

## Model Versions

### Available via FAL.ai

| Version | Endpoint | Best For |
|---------|----------|----------|
| **v2.6 Pro** | `fal-ai/kling-video/v2.6/pro` | Motion control, choreography |
| **v2.6 Standard** | `fal-ai/kling-video/v2.6/standard` | Motion control (budget) |
| **v2.5 Turbo Pro** | `fal-ai/kling-video/v2.5-turbo/pro` | Fast text-to-video |
| **v2.1 Pro** | `fal-ai/kling-video/v2.1/pro` | Image-to-video |
| **v2.1 Master** | `fal-ai/kling-video/v2.1/master` | Highest quality |
| **O1 Edit** | `fal-ai/kling-video/o1/video-to-video/edit` | Video editing |

### Pricing

| Mode | Cost | Max Duration |
|------|------|--------------|
| v2.6 Standard | $0.07/sec | 30s |
| v2.6 Pro | $0.112/sec | 30s |
| v2.5 Turbo Pro | $0.07/sec | 10s |
| v2.1 Pro | $0.07/sec | 10s |
| O1 Edit | $0.168/sec | 10s |

---

## Text-to-Video Generation

### Prompt Structure (4 Components)

1. **Scene Setting**: Environment and lighting
2. **Subject Description**: Main subjects with attributes
3. **Motion Directives**: Movement you want to see
4. **Stylistic Guidance**: Visual aesthetic preferences

### Example Prompt

```
A noble lord walks among his people, his presence a comforting reassurance.
He greets them with a gentle smile, embodying their hopes and earning their
respect through simple interactions. The atmosphere is intimate and sincere,
highlighting the bond between the leader and community.
```

### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Text description |
| `duration` | enum | No | `"5"` or `"10"` seconds |
| `aspect_ratio` | enum | No | `"16:9"`, `"9:16"`, `"1:1"` |
| `negative_prompt` | string | No | Elements to avoid |
| `cfg_scale` | float | No | Prompt adherence (default: 0.5) |
| `camera_control` | enum | No | Camera movement preset |
| `advanced_camera_control` | object | No | Precise camera parameters |

### Camera Control Presets

- `down_back` - Camera moves down and back
- `forward_up` - Camera moves forward and up
- `right_turn_forward` - Camera turns right while moving forward
- `left_turn_forward` - Camera turns left while moving forward

### Code Example

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "A futuristic cityscape at sunset, with flying cars and holographic advertisements",
    duration: "10",
    aspect_ratio: "16:9",
    negative_prompt: "blur, distort, low quality",
    camera_control: "forward_up"
  }
});

console.log(result.data.video.url);
```

---

## Image-to-Video Generation

### Input Requirements

| Requirement | Details |
|-------------|---------|
| Resolution | 1080p+ recommended |
| Composition | Well-composed, properly lit |
| Format | JPG, PNG, WEBP, GIF, AVIF |
| Subject Size | Must occupy >5% of frame |

### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Motion and scene description |
| `image_url` | string | Yes | Source image URL |
| `duration` | enum | No | `"5"` or `"10"` seconds |
| `aspect_ratio` | enum | No | `"16:9"`, `"9:16"`, `"1:1"` |
| `negative_prompt` | string | No | Default: "blur, distort, low quality" |
| `cfg_scale` | float | No | Default: 0.5 |
| `tail_image_url` | string | No | End frame image |
| `static_mask_url` | string | No | Static motion brush mask |
| `dynamic_mask_url` | string | No | Dynamic motion brush mask |
| `special_fx` | enum | No | Special effects |
| `input_image_urls` | array | No | Up to 4 images for multi-image |

### Special Effects

- `hug` - Hugging motion
- `kiss` - Kissing motion
- `heart_gesture` - Heart hand gesture
- `squish` - Squishing/compression effect
- `expansion` - Expanding effect

### Code Example

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    prompt: "The woman turns her head slowly, sunlight catching her hair",
    image_url: "https://example.com/portrait.jpg",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "blur, distort, low quality"
  }
});

console.log(result.data.video.url);
```

---

## Motion Control (v2.6)

Motion Control transfers choreography from a reference video to your character image.

### Core Concept

```
Character Image  +  Reference Video  +  Context Prompt  =  Output Video
(visual identity)   (choreography)      (scene setting)    (combined)
```

### Orientation Modes

| Mode | Max Duration | Best For |
|------|--------------|----------|
| **Image Orientation** | 10 seconds | Camera work, portraits, simple animations |
| **Video Orientation** | 30 seconds | Dance, athletic movements, complex choreography |

**Image Orientation**: Maintains your reference image's pose while adopting movements. Best for pans, tilts, tracking shots.

**Video Orientation**: Transfers both motion AND spatial orientation literally. Body positioning, turns, and spatial relationships follow the reference video.

### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_url` | string | Yes | Character reference image |
| `video_url` | string | Yes | Motion source video |
| `character_orientation` | enum | Yes | `"image"` or `"video"` |
| `prompt` | string | No | Scene context (NOT motion description) |
| `keep_original_sound` | boolean | No | Preserve reference audio (default: true) |

### Input Requirements

**Character Image:**
- Subject must occupy >5% of frame
- Clear body proportions, no occlusion
- High resolution, well-lit
- Limbs should be visible (avoid hands in pockets if motion requires waving)

**Reference Video:**
- Realistic character with visible head + upper/full body
- Duration: 2-30 seconds (video mode), 2-10 seconds (image mode)
- Format: MP4, MOV, WEBM, M4V, GIF
- Avoid: blurry, shaky, sudden fast-paced motion
- Avoid: heavy camera movement, complex hand gestures

### Prompting Strategy

**DO focus on:**
- Character identity enhancement
- Environmental context
- Style modifiers

**DO NOT describe:**
- Motion (reference video defines this)
- Choreography
- Movement sequences

### Good Prompts

```
# Character + Environment + Style
"Rumi, purple braided hair, yellow racing jacket, performing on a neon-lit
K-pop stage, cinematic lighting, consistent character appearance"

# Layered descriptive elements
"A graceful ballet dancer on a grand theater stage, soft pink lighting
casting gentle shadows, audience seats visible in the darkness beyond"
```

### Bad Prompts

```
# Over-describing motion (reference video already defines this!)
"Dancing energetically with spinning and jumping movements"
"Character doing the griddy dance with arm movements"
"Walking forward then turning around quickly"
```

### Temporal Consistency Keywords

Include these for smooth output:
- "consistent lighting"
- "steady camera"
- "continuous motion"
- "smooth transitions"
- "maintains exact appearance throughout"

### Style Transfer

Add stylistic descriptors to change visual treatment while preserving motion:
- "rendered in anime style"
- "photorealistic with film grain"
- "cinematic color grading"
- "documentary style"

### Code Example

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: "https://example.com/character.png",
    video_url: "https://example.com/dance-reference.mp4",
    character_orientation: "video",
    prompt: "Rumi, vivid purple long braid, yellow cropped racing jacket, performing on concert stage, neon lights, cinematic quality, consistent character appearance, smooth motion"
  }
});

console.log(result.data.video.url);
```

### Iterative Workflow

1. Start with minimal prompts ("a person performing") to verify motion transfer
2. Incrementally add character identity details
3. Add environmental context
4. Layer stylistic modifiers last
5. Maintain a prompt library organized by use case

---

## Video Editing (O1)

Kling O1 provides four generation modes for video creation and editing.

### Four Generation Modes

| Mode | Description |
|------|-------------|
| **Image-to-Video** | Transforms static images into dynamic clips |
| **Video-to-Video Reference** | Style transfers while maintaining motion |
| **Reference-to-Video** | Uses up to 4 reference images for consistency |
| **Video-to-Video Edit** | Surgical modifications to existing footage |

### Prompt Structure

1. Subject and primary action
2. Environmental context
3. Camera movement/perspective
4. Style and quality descriptors

**Optimal length**: 50-150 words

### Reference Element Mapping

Explicitly identify which reference image corresponds to scene elements:

```
"Character from reference image 1 walks through the marketplace,
wearing the outfit from reference image 2, under the lighting
conditions shown in reference image 3."
```

### Advanced Techniques

**Motion Layering**: Separate foreground, midground, and background movement:
```
"Foreground: character walks left to right.
Midground: crowd mills about slowly.
Background: clouds drift imperceptibly."
```

**Lighting Choreography**: Specify temporal light changes:
```
"Scene begins in shadow, sunlight gradually breaks through clouds
at the 3-second mark, fully illuminating the subject by the 5-second mark."
```

**Physics-Aware Descriptions**:
```
"Fabric drapes and flows with gravity, responding to body movement
with slight delay. Hair settles naturally after motion stops."
```

### Masking Language for Edits

```
"Replace only the sky while keeping foreground unchanged"
"Modify the character's outfit but preserve facial features and motion"
"Change background to forest scene, maintain all foreground elements"
```

### Code Example

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://example.com/source.mp4",
    prompt: "Replace the background with a futuristic cityscape at night, neon lights reflecting on wet streets, maintain the character and their motion exactly",
    input_image_urls: [
      "https://example.com/cityscape-reference.jpg"
    ]
  }
});

console.log(result.data.video.url);
```

---

## API Reference

### All Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `fal-ai/kling-video/v2.6/pro/motion-control` | POST | Motion transfer (Pro) |
| `fal-ai/kling-video/v2.6/standard/motion-control` | POST | Motion transfer (Standard) |
| `fal-ai/kling-video/v2.5-turbo/pro/text-to-video` | POST | Text-to-video |
| `fal-ai/kling-video/v2.1/pro/image-to-video` | POST | Image-to-video |
| `fal-ai/kling-video/v2.1/master/image-to-video` | POST | Image-to-video (highest quality) |
| `fal-ai/kling-video/o1/video-to-video/edit` | POST | Video editing |

### Common Response Format

```json
{
  "video": {
    "url": "https://v3.fal.media/files/.../output.mp4",
    "file_name": "output.mp4",
    "file_size": 13228873,
    "content_type": "video/mp4"
  }
}
```

### Supported Formats

**Images**: JPG, PNG, WEBP, GIF, AVIF
**Videos**: MP4, MOV, WEBM, M4V, GIF

---

## Prompting Best Practices

### Optimal Prompt Length

- **Text-to-Video**: 50-150 words
- **Image-to-Video**: 30-80 words (focus on motion)
- **Motion Control**: 20-50 words (scene context only)

### Emphasis Weighting

Use `++` to highlight critical elements:
```
"++sleek red convertible++ driving along coastal highway, sunset lighting"
```

### Negative Prompting

Default: `"blur, distort, and low quality"`

For specific issues:
```
"No people, no text overlays, no distortion in vehicle proportions"
"No morphing, no flickering, no sudden camera movements"
```

### Technical Specifications as Style Cues

Reference camera settings to guide aesthetic:
```
"Shot on 35mm film, f/2.8, 24mm anamorphic lens"
"Cinematic color grading, shallow depth of field"
```

### Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Vague motion | "make it dynamic" | Specific verbs: "walks left, turns, pauses" |
| Buried info | Critical details mid-prompt | Place essential requirements first |
| Contradictions | "bright sunny day with dark moody shadows" | Consistent terminology |
| Over-length | >150 words | Trim to essentials |
| Motion in motion-control | Describing choreography | Let reference video define motion |

### Controlling Unwanted Motion

When clips get too alive:
```
"background remains motionless: only the character moves"
"static environment, all motion limited to subject"
```

---

## Troubleshooting

### Motion Distortion

**Symptom**: Jerky, unnatural movement

**Solutions**:
- Reduce prompt complexity
- Add "stable camera movement" explicitly
- Use shorter duration (5s instead of 10s)
- Switch to Standard mode for testing

### Object Morphing

**Symptom**: Objects change shape during video

**Solutions**:
- Use Elements feature with multiple reference angles
- Add "maintains exact appearance throughout"
- Include specific object descriptions in prompt

### Visual Coherence Issues

**Symptom**: Inconsistent lighting, style shifts

**Solutions**:
- Apply consistent style terminology
- Avoid mixing contradictory lighting descriptions
- Add "consistent lighting, steady atmosphere"

### Character Identity Loss

**Symptom**: Output character doesn't match reference

**Solutions**:
- Ensure reference image >5% of frame
- Use high-res, well-lit reference
- Don't over-describe appearance in prompt (let image define it)
- Try Standard mode before Pro

### Motion Not Transferring (Motion Control)

**Symptom**: Character appears static or wrong poses

**Solutions**:
- Check orientation mode (video for dance, image for portraits)
- Improve source video lighting
- Use cleaner source footage
- Ensure source character has realistic humanoid motion

---

## Code Examples

### JavaScript Setup

```javascript
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY
});
```

### Python Setup

```python
import fal_client

fal_client.api_key = os.environ["FAL_KEY"]
```

### Full Workflow: Character Video from Reference

```javascript
import { fal } from "@fal-ai/client";
import fs from "fs/promises";

async function generateCharacterVideo(characterImagePath, motionVideoPath, outputPath) {
  // Upload files to FAL
  const characterUrl = await fal.storage.upload(
    await fs.readFile(characterImagePath)
  );
  const motionUrl = await fal.storage.upload(
    await fs.readFile(motionVideoPath)
  );

  // Generate video with motion control
  const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
    input: {
      image_url: characterUrl,
      video_url: motionUrl,
      character_orientation: "video",
      prompt: "Professional dancer on stage, concert lighting, cinematic quality, consistent character appearance, smooth motion"
    }
  });

  // Download result
  const response = await fetch(result.data.video.url);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));

  return result.data.video.url;
}
```

---

## Sources

- [FAL.ai Kling Models](https://fal.ai/models/fal-ai/kling-video)
- [FAL.ai Motion Control Guide](https://fal.ai/learn/devs/kling-video-2-6-motion-control-prompt-guide)
- [FAL.ai Kling 2.6 Pro Guide](https://fal.ai/learn/devs/kling-2-6-pro-prompt-guide)
- [FAL.ai Kling O1 Guide](https://fal.ai/learn/devs/kling-o1-prompt-guide)
- [Official Kling AI API](https://app.klingai.com/global/dev/document-api)
- [GitHub: TechWithTy/kling](https://github.com/TechWithTy/kling) - Python SDK
- [GitHub: 199-mcp/mcp-kling](https://github.com/199-mcp/mcp-kling) - MCP Server

---

*Created: 2026-01-26*
*Equivalent to Get_Started_Nano_Banana.ipynb and Get_started_Veo.ipynb in quality and comprehensiveness*
