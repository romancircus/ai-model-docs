# ComfyUI Wan I2V Workflow Reference

**Last Tested:** January 2026
**ComfyUI Version:** 0.8.2
**WanVideoWrapper:** Latest

## Working Workflow: Wan 2.1 I2V 14B

### Complete API Workflow JSON

```json
{
  "1": {
    "class_type": "WanVideoModelLoader",
    "inputs": {
      "model": "wan_i2v_fp8/Wan2_1-I2V-14B-480p_fp8_e4m3fn_scaled_KJ.safetensors",
      "base_precision": "bf16",
      "quantization": "fp8_e4m3fn_scaled",
      "load_device": "offload_device",
      "attention_mode": "sdpa"
    }
  },
  "2": {
    "class_type": "WanVideoVAELoader",
    "inputs": {
      "model_name": "wan_2.1_vae.safetensors",
      "precision": "bf16"
    }
  },
  "3": {
    "class_type": "LoadWanVideoT5TextEncoder",
    "inputs": {
      "model_name": "umt5_xxl_fp16.safetensors",
      "precision": "bf16",
      "load_device": "offload_device"
    }
  },
  "4": {
    "class_type": "CLIPVisionLoader",
    "inputs": {
      "clip_name": "clip_vision_h.safetensors"
    }
  },
  "5": {
    "class_type": "LoadImage",
    "inputs": {
      "image": "<YOUR_IMAGE_FILENAME>"
    }
  },
  "6": {
    "class_type": "WanVideoTextEncode",
    "inputs": {
      "positive_prompt": "<MOTION_PROMPT>",
      "negative_prompt": "morphing, shape-shifting, identity loss, flickering, glitching, stuttering, jerky movements, watermark, text, logo",
      "force_offload": true,
      "t5": ["3", 0]
    }
  },
  "7": {
    "class_type": "WanVideoClipVisionEncode",
    "inputs": {
      "clip_vision": ["4", 0],
      "image_1": ["5", 0],
      "strength_1": 1,
      "strength_2": 1,
      "crop": "center",
      "combine_embeds": "average",
      "force_offload": true
    }
  },
  "8": {
    "class_type": "WanVideoImageToVideoEncode",
    "inputs": {
      "width": 640,
      "height": 384,
      "num_frames": 49,
      "noise_aug_strength": 0.025,
      "start_latent_strength": 0.85,
      "end_latent_strength": 0.85,
      "force_offload": true,
      "vae": ["2", 0],
      "clip_embeds": ["7", 0],
      "start_image": ["5", 0]
    }
  },
  "9": {
    "class_type": "WanVideoSampler",
    "inputs": {
      "steps": 25,
      "cfg": 6,
      "shift": 5,
      "seed": 54321,
      "force_offload": true,
      "scheduler": "euler",
      "riflex_freq_index": 0,
      "model": ["1", 0],
      "image_embeds": ["8", 0],
      "text_embeds": ["6", 0]
    }
  },
  "10": {
    "class_type": "WanVideoDecode",
    "inputs": {
      "enable_vae_tiling": true,
      "tile_x": 272,
      "tile_y": 272,
      "tile_stride_x": 144,
      "tile_stride_y": 128,
      "vae": ["2", 0],
      "samples": ["9", 0]
    }
  },
  "11": {
    "class_type": "SaveAnimatedWEBP",
    "inputs": {
      "filename_prefix": "wan_i2v_output",
      "fps": 16,
      "lossless": false,
      "quality": 90,
      "method": "default",
      "images": ["10", 0]
    }
  }
}
```

## Node Connection Map

```
LoadImage ─────────────────────────────────────┬─► WanVideoClipVisionEncode
CLIPVisionLoader ──────────────────────────────┘         │
                                                         ▼
                                               ┌── clip_embeds
                                               │
WanVideoVAELoader ────► vae ──────────────────┬┼─► WanVideoImageToVideoEncode
LoadImage ────────────► start_image ──────────┘│         │
                                               │         ▼
LoadWanVideoT5TextEncoder ─► WanVideoTextEncode ──► text_embeds
                                               │         │
WanVideoModelLoader ──────► model ─────────────┼─► WanVideoSampler
                                               │         │
                                               │         ▼ samples
                                               │
WanVideoVAELoader ────► vae ───────────────────┴─► WanVideoDecode
                                                         │
                                                         ▼ images
                                               SaveAnimatedWEBP
```

## Critical Type Connections

| Output Type | From Node | To Node |
|-------------|-----------|---------|
| `WANVIDEOMODEL` | WanVideoModelLoader | WanVideoSampler.model |
| `WANVAE` | WanVideoVAELoader | WanVideoImageToVideoEncode.vae, WanVideoDecode.vae |
| `WANTEXTENCODER` | LoadWanVideoT5TextEncoder | WanVideoTextEncode.t5 |
| `CLIP_VISION` | CLIPVisionLoader | WanVideoClipVisionEncode.clip_vision |
| `IMAGE` | LoadImage | WanVideoClipVisionEncode.image_1, WanVideoImageToVideoEncode.start_image |
| `WANVIDIMAGE_CLIPEMBEDS` | WanVideoClipVisionEncode | WanVideoImageToVideoEncode.clip_embeds |
| `WANVIDEOTEXTEMBEDS` | WanVideoTextEncode | WanVideoSampler.text_embeds |
| `WANVIDIMAGE_EMBEDS` | WanVideoImageToVideoEncode | WanVideoSampler.image_embeds |
| `LATENT` | WanVideoSampler | WanVideoDecode.samples |

## Common Errors & Fixes

### Frame Corruption (white/black/green artifacts after frame 0)

**Cause:** Using `WanVideoImageClipEncode` instead of the two-node chain.

**Fix:** Use `WanVideoClipVisionEncode` → `WanVideoImageToVideoEncode` chain.

### Static Video (Ken Burns effect)

**Cause:** `noise_aug_strength = 0`

**Fix:** Set `noise_aug_strength = 0.025`

### OOM at Sampler

**Cause:** High resolution or frame count

**Fixes:**
1. Reduce resolution (640x384 works on 32GB)
2. Reduce frames (49 or less)
3. Add WanVideoBlockSwap node (30+ blocks for 14B)

### OOM at Decode

**Cause:** VAE tiling disabled

**Fix:** Set `enable_vae_tiling = true` with default tile sizes

### Pixelation (Wan 2.2 A14B-HIGH)

**Cause:** Unknown VAE/architecture mismatch

**Status:** Unfixable with current WanVideoWrapper. Use Wan 2.1 instead.

### Channel Mismatch (Wan 2.2 TI2V 5B)

**Error:** `expected input to have 48 channels, but got 64 channels`

**Cause:** Model architecture incompatibility

**Status:** Requires different encode node. Not currently supported.

## MCP Tool Usage

```python
# Execute workflow
result = mcp__comfyui-massmediafactory__execute_workflow(workflow_json)
prompt_id = result["prompt_id"]

# Wait for completion
output = mcp__comfyui-massmediafactory__wait_for_completion(prompt_id, timeout_seconds=600)

# Check VRAM before running
stats = mcp__comfyui-massmediafactory__get_system_stats()
print(f"Free VRAM: {stats['devices'][0]['vram_free_gb']}GB")
```

## Performance Reference (RTX 5090 32GB)

| Resolution | Frames | Steps | Time | VRAM Used |
|------------|--------|-------|------|-----------|
| 640x384 | 49 | 25 | ~130s | ~26GB peak |
| 512x320 | 33 | 20 | ~80s | ~20GB peak |
