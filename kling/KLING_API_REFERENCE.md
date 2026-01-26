# Kling API Reference

Quick reference for all FAL.ai Kling endpoints.

---

## Endpoints

### Text-to-Video

```
POST fal-ai/kling-video/v2.5-turbo/pro/text-to-video
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `prompt` | string | Yes | - |
| `duration` | "5" \| "10" | No | "5" |
| `aspect_ratio` | "16:9" \| "9:16" \| "1:1" | No | "16:9" |
| `negative_prompt` | string | No | "blur, distort, low quality" |
| `cfg_scale` | float | No | 0.5 |
| `camera_control` | enum | No | - |
| `advanced_camera_control` | object | No | - |

**Camera Control Values**: `down_back`, `forward_up`, `right_turn_forward`, `left_turn_forward`

---

### Image-to-Video

```
POST fal-ai/kling-video/v2.1/pro/image-to-video
POST fal-ai/kling-video/v2.1/master/image-to-video
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `prompt` | string | Yes | - |
| `image_url` | string | Yes | - |
| `duration` | "5" \| "10" | No | "5" |
| `aspect_ratio` | "16:9" \| "9:16" \| "1:1" | No | "16:9" |
| `negative_prompt` | string | No | "blur, distort, low quality" |
| `cfg_scale` | float | No | 0.5 |
| `tail_image_url` | string | No | - |
| `static_mask_url` | string | No | - |
| `dynamic_mask_url` | string | No | - |
| `special_fx` | enum | No | - |
| `input_image_urls` | string[] | No | - |

**Special FX Values**: `hug`, `kiss`, `heart_gesture`, `squish`, `expansion`

---

### Motion Control

```
POST fal-ai/kling-video/v2.6/pro/motion-control
POST fal-ai/kling-video/v2.6/standard/motion-control
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `image_url` | string | Yes | - |
| `video_url` | string | Yes | - |
| `character_orientation` | "image" \| "video" | Yes | - |
| `prompt` | string | No | - |
| `keep_original_sound` | boolean | No | true |

**Orientation Modes**:
- `image`: Max 10s, best for camera work
- `video`: Max 30s, best for choreography

---

### Video Editing (O1)

```
POST fal-ai/kling-video/o1/video-to-video/edit
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `video_url` | string | Yes | - |
| `prompt` | string | Yes | - |
| `input_image_urls` | string[] | No | - |
| `duration` | "5" \| "10" | No | "5" |

---

## Response Format

All endpoints return:

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

---

## Pricing

| Endpoint | Cost/Second |
|----------|-------------|
| v2.6 Standard Motion Control | $0.07 |
| v2.6 Pro Motion Control | $0.112 |
| v2.5 Turbo Pro | $0.07 |
| v2.1 Pro | $0.07 |
| v2.1 Master | $0.112 |
| O1 Edit | $0.168 |

### Cost Examples

| Scenario | Duration | Mode | Cost |
|----------|----------|------|------|
| Quick test | 5s | Standard | $0.35 |
| Standard clip | 10s | Pro | $1.12 |
| Dance sequence | 30s | Pro Motion | $3.36 |

---

## Supported Formats

**Images**: JPG, PNG, WEBP, GIF, AVIF
**Videos**: MP4, MOV, WEBM, M4V, GIF

---

## JavaScript Example

```javascript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: "https://example.com/character.png",
    video_url: "https://example.com/motion.mp4",
    character_orientation: "video",
    prompt: "Concert stage, neon lights, cinematic"
  }
});

console.log(result.data.video.url);
```

---

## Python Example

```python
import fal_client
import os

fal_client.api_key = os.environ["FAL_KEY"]

result = fal_client.subscribe(
    "fal-ai/kling-video/v2.6/pro/motion-control",
    arguments={
        "image_url": "https://example.com/character.png",
        "video_url": "https://example.com/motion.mp4",
        "character_orientation": "video",
        "prompt": "Concert stage, neon lights, cinematic"
    }
)

print(result["video"]["url"])
```
