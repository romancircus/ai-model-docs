# Qwen Image Edit 2511 Guide

Complete guide for using Qwen Image Edit 2511 in ComfyUI for background replacement and image editing.

---

## Overview

Qwen Image Edit is a diffusion-based image editing model that:
1. Takes an original image as **visual reference**
2. Takes a text instruction describing the edit
3. Regenerates the image while following both constraints

**Key insight**: It's not modifying pixels directly. It's regenerating the entire image while trying to match both your text instruction AND the reference image.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  TextEncodeQwenImageEditPlus does TWO things:               │
│                                                             │
│  1. Reads TEXT: "Change background to playground"           │
│  2. Sees IMAGE: Original photo as VISUAL REFERENCE          │
│                                                             │
│  Then generates NEW image matching both constraints         │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Settings

| Setting | Value | Why |
|---------|-------|-----|
| **CFG** | **2.0-2.5** | PRIMARY color control. >4 causes oversaturation/distortion |
| **Denoise** | **1.0** | Must be 1.0 for background changes. Lower preserves original (including background) |
| **Latent** | EmptyQwenImageLayeredLatentImage | NOT VAEEncode. VAEEncode approach fails |
| **Steps** | 20 | 15-30 range works well |
| **Sampler** | euler | Standard choice |
| **Scheduler** | normal | Standard choice |

### Why CFG is Critical

CFG (Classifier-Free Guidance) controls color intensity in Qwen Edit:

| CFG | Result |
|-----|--------|
| 2.0 | Natural colors, matches reference well |
| 2.5 | Slightly more saturated, still good |
| 3.5 | Getting saturated |
| 4.0+ | Oversaturated, burnt skin, color distortion |

**Always start at CFG 2.0** and only increase if prompt adherence is weak.

### Why Denoise Must Be 1.0

For background replacement specifically:
- Denoise 0.5 → Preserves 50% of original latent → Background stays
- Denoise 1.0 → Full regeneration from empty latent → Background changes

If your background isn't changing, check denoise first.

---

## Required Nodes

```
LoadImage (original)
     ↓
UNETLoader (qwen_image_edit_2511_fp8mixed.safetensors)
CLIPLoader (qwen_2.5_vl_7b_fp8_scaled.safetensors, type=qwen_image)
VAELoader (qwen_image_vae.safetensors)
     ↓
TextEncodeQwenImageEditPlus (prompt + image1=original)
ConditioningZeroOut (negative)
     ↓
EmptyQwenImageLayeredLatentImage (layers=0)
     ↓
KSampler (CFG=2.0, steps=20, denoise=1.0)
     ↓
VAEDecode
     ↓
SaveImage
```

---

## Node Details

### TextEncodeQwenImageEditPlus
- **Use this**, not TextEncodeQwenImageEdit (Plus version has better instruction following)
- Pass original image to `image1` input
- This is how the model "sees" your reference

### EmptyQwenImageLayeredLatentImage
- Use `layers=0` for better character preservation
- Do NOT use VAEEncode of the original image
- The image reference comes through TextEncoder, not through latent

### ConditioningZeroOut
- Creates empty negative conditioning
- Required for the workflow to function

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| VAEEncode instead of EmptyLatent | Background doesn't change | Use EmptyQwenImageLayeredLatentImage |
| CFG too high (>4) | Colors oversaturated, burnt | Lower to 2.0-2.5 |
| Denoise too low (<1.0) | Background preserved, edit ignored | Use denoise 1.0 |
| Wrong text encoder | Poor instruction following | Use TextEncodeQwenImageEditPlus |
| Wrong CLIP type | Errors or bad results | Use type="qwen_image" |

---

## Example Prompts

### Background Replacement
```
Change the background to an outdoor playground with green grass and blue sky. Keep the child exactly the same.
```

### Scene Change
```
Change the setting to a cozy living room with warm lighting. Preserve the person's appearance exactly.
```

### Environment Swap
```
Replace the white studio background with a beach at sunset. Maintain all subject details.
```

**Tip**: Always include "keep/preserve the [subject] exactly the same" to reinforce identity preservation.

---

## MCP Template

The ComfyUI MassMediaFactory MCP includes a ready-to-use template:

```python
from mcp import get_template, create_workflow_from_template

wf = create_workflow_from_template("qwen_edit_background", {
    "IMAGE_PATH": "my_photo.png",
    "EDIT_PROMPT": "Change background to a garden with flowers. Keep the person exactly the same.",
    "SEED": 42,
    "CFG": 2.0,
    "STEPS": 20
})
```

---

## Workflow JSON

Complete working workflow:

```json
{
  "1": {"class_type": "LoadImage", "inputs": {"image": "original.png"}},
  "2": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_edit_2511_fp8mixed.safetensors", "weight_dtype": "default"}},
  "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image"}},
  "4": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
  "5": {"class_type": "TextEncodeQwenImageEditPlus", "inputs": {"clip": ["3", 0], "prompt": "YOUR_EDIT_PROMPT", "vae": ["4", 0], "image1": ["1", 0]}},
  "6": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["5", 0]}},
  "7": {"class_type": "EmptyQwenImageLayeredLatentImage", "inputs": {"width": 720, "height": 1280, "layers": 0, "batch_size": 1}},
  "8": {"class_type": "KSampler", "inputs": {"model": ["2", 0], "seed": 42, "steps": 20, "cfg": 2.0, "sampler_name": "euler", "scheduler": "normal", "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0], "denoise": 1.0}},
  "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["4", 0]}},
  "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": "qwen_edit"}}
}
```

---

## Troubleshooting

### Background Not Changing
1. Check denoise = 1.0
2. Check using EmptyQwenImageLayeredLatentImage (not VAEEncode)
3. Make prompt explicit: "change the background to..."

### Colors Look Wrong (Oversaturated)
1. Lower CFG to 2.0
2. Check VAE is qwen_image_vae.safetensors

### Subject Doesn't Match Reference
1. Check image passed to TextEncodeQwenImageEditPlus image1
2. Add "keep the [subject] exactly the same" to prompt
3. Try layers=0 in EmptyQwenImageLayeredLatentImage

### Model Loading Errors
1. Ensure using UNETLoader (not CheckpointLoaderSimple)
2. Ensure CLIPLoader type="qwen_image" (not other types)
3. Check model files exist in ComfyUI models folder

---

*Last updated: January 30, 2026*
