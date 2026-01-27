# ComfyUI Agent Orchestration Guide

**Purpose:** Enable coding agents (Claude Code, Cursor, etc.) to programmatically generate, execute, and iterate on ComfyUI workflows with near-perfect accuracy.

**Last Updated:** January 2026
**Version:** 3.0 (Agent-Orchestration Optimized)

---

## Table of Contents

1. [Quick Start for Agents](#quick-start-for-agents)
2. [Workflow JSON Schema](#workflow-json-schema)
3. [API Reference](#api-reference)
4. [Node Connection Rules](#node-connection-rules)
5. [Model-Specific Workflow Templates](#model-specific-workflow-templates)
6. [Multi-Stage Pipeline Patterns](#multi-stage-pipeline-patterns)
7. [Parameter Injection System](#parameter-injection-system)
8. [Error Handling & Recovery](#error-handling--recovery)
9. [Asset Iteration & Publishing](#asset-iteration--publishing)
10. [WebSocket Real-Time Monitoring](#websocket-real-time-monitoring)
11. [Complete Python Client](#complete-python-client)
12. [Workflow Recipe Library](#workflow-recipe-library)
13. [RTX 5090 32GB Optimization Guide](#rtx-5090-32gb-optimization-guide)
14. [SOTA Model Selection (January 2026)](#sota-model-selection-january-2026)
15. [Agent Decision Trees](#agent-decision-trees)
16. [Model-Specific Prompting Methodology](#model-specific-prompting-methodology)
17. [Workflow Pattern Library](#workflow-pattern-library)
18. [Programmatic Quality Assurance (VLM-Based)](#programmatic-quality-assurance-vlm-based)
19. [Text-Based Editing (Inpainting)](#text-based-editing-inpainting)
20. [Auto-Refiner Quality Loop](#auto-refiner-quality-loop)
21. [LoRA Style Library](#lora-style-library)
22. [Audio & Speech Generation](#audio--speech-generation)
23. [Quick Reference Tables](#quick-reference-tables)

---

## Quick Start for Agents

### The Core Loop

```
1. BUILD workflow JSON
2. UPLOAD any input images
3. POST workflow to /prompt
4. MONITOR via WebSocket OR poll /history
5. DOWNLOAD outputs from /view
6. ITERATE if needed
```

### Minimal Working Example

```python
import json
import urllib.request

COMFYUI_URL = "http://localhost:8188"

# 1. Build a simple txt2img workflow
workflow = {
    "1": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": {"ckpt_name": "sdxl_base.safetensors"}
    },
    "2": {
        "class_type": "CLIPTextEncode",
        "inputs": {"text": "a beautiful sunset over mountains", "clip": ["1", 1]}
    },
    "3": {
        "class_type": "CLIPTextEncode",
        "inputs": {"text": "blurry, ugly", "clip": ["1", 1]}
    },
    "4": {
        "class_type": "EmptyLatentImage",
        "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
    },
    "5": {
        "class_type": "KSampler",
        "inputs": {
            "model": ["1", 0],
            "positive": ["2", 0],
            "negative": ["3", 0],
            "latent_image": ["4", 0],
            "seed": 42,
            "steps": 30,
            "cfg": 7.0,
            "sampler_name": "dpmpp_2m_sde",
            "scheduler": "karras",
            "denoise": 1.0
        }
    },
    "6": {
        "class_type": "VAEDecode",
        "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
    },
    "7": {
        "class_type": "SaveImage",
        "inputs": {"images": ["6", 0], "filename_prefix": "output"}
    }
}

# 2. Queue the workflow
data = json.dumps({"prompt": workflow, "client_id": "agent"}).encode()
req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data,
                             headers={"Content-Type": "application/json"})
result = json.loads(urllib.request.urlopen(req).read())
prompt_id = result["prompt_id"]

# 3. Poll for completion
import time
while True:
    history = json.loads(urllib.request.urlopen(
        f"{COMFYUI_URL}/history/{prompt_id}"
    ).read())
    if prompt_id in history and "outputs" in history[prompt_id]:
        break
    time.sleep(1)

# 4. Get output filename
outputs = history[prompt_id]["outputs"]
for node_id, output in outputs.items():
    if "images" in output:
        for img in output["images"]:
            print(f"Output: {img['filename']}")
```

---

## Workflow JSON Schema

### Formal Structure

```typescript
interface ComfyUIWorkflow {
  [nodeId: string]: {
    class_type: string;           // Node type (e.g., "KSampler")
    inputs: {
      [paramName: string]:
        | string                   // Text value
        | number                   // Numeric value
        | boolean                  // Boolean value
        | [string, number];        // Link: [sourceNodeId, outputSlot]
    };
    _meta?: {                      // Optional metadata (stripped on submit)
      title?: string;
    };
  };
}
```

### Link Format

Links connect outputs from one node to inputs of another:

```python
# Format: [source_node_id, output_slot_index]
"model": ["1", 0]    # Output 0 from node "1"
"clip": ["1", 1]     # Output 1 from node "1"
"vae": ["1", 2]      # Output 2 from node "1"
```

### CheckpointLoaderSimple Outputs

| Slot | Type | Description |
|------|------|-------------|
| 0 | MODEL | The diffusion model (UNet) |
| 1 | CLIP | Text encoder |
| 2 | VAE | Variational autoencoder |

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/prompt` | Queue a workflow for execution |
| `GET` | `/queue` | Get current queue status |
| `GET` | `/history/{prompt_id}` | Get execution history |
| `GET` | `/view?filename=X&type=output` | Download output file |
| `POST` | `/upload/image` | Upload image to input folder |
| `POST` | `/interrupt` | Interrupt current execution |
| `POST` | `/free` | Free GPU memory |
| `GET` | `/system_stats` | Get VRAM/system info |
| `WS` | `/ws?clientId={id}` | WebSocket for real-time updates |

### POST /prompt

**Request:**
```json
{
  "prompt": { /* workflow JSON */ },
  "client_id": "my-agent-id"
}
```

**Response:**
```json
{
  "prompt_id": "abc123-def456",
  "number": 42
}
```

### GET /history/{prompt_id}

**Response (success):**
```json
{
  "abc123-def456": {
    "prompt": { /* original workflow */ },
    "outputs": {
      "7": {
        "images": [
          {
            "filename": "output_00001_.png",
            "subfolder": "",
            "type": "output"
          }
        ]
      }
    }
  }
}
```

**Response (error):**
```json
{
  "abc123-def456": {
    "status": {
      "status_str": "error",
      "messages": [
        ["node_id", "exception message"]
      ]
    }
  }
}
```

### POST /upload/image

**Request:** Multipart form data
```
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="image"; filename="input.png"
Content-Type: image/png

<binary data>
------Boundary
Content-Disposition: form-data; name="overwrite"

true
------Boundary--
```

**Response:**
```json
{
  "name": "input.png",
  "subfolder": "",
  "type": "input"
}
```

---

## Node Connection Rules

### Data Type Compatibility

| Output Type | Can Connect To |
|-------------|----------------|
| MODEL | model, MODEL inputs |
| CLIP | clip, CLIP inputs |
| VAE | vae, VAE inputs |
| CONDITIONING | positive, negative, conditioning |
| LATENT | latent_image, samples |
| IMAGE | image, images |
| MASK | mask |

### Common Connection Patterns

#### Standard Text-to-Image

```
CheckpointLoaderSimple
├── [0] MODEL ─────────────────────────► KSampler.model
├── [1] CLIP ──► CLIPTextEncode.clip ──► KSampler.positive
│                CLIPTextEncode.clip ──► KSampler.negative
└── [2] VAE ───────────────────────────► VAEDecode.vae

EmptyLatentImage ─► KSampler.latent_image

KSampler ─► VAEDecode.samples ─► SaveImage.images
```

#### ControlNet Addition

```
LoadImage ─► Preprocessor ─► ControlNetApply.image
                              ControlNetApply.control_net ◄─ ControlNetLoader
                              ControlNetApply.positive ◄─── CLIPTextEncode
                              ControlNetApply.negative ◄─── CLIPTextEncode
                              │
                              └─► [0] = modified positive conditioning
                                  [1] = modified negative conditioning
```

#### IP-Adapter (Flux)

```
LoadImage ─► ApplyIPAdapterFlux.image
              ApplyIPAdapterFlux.model ◄─────── UNETLoader
              ApplyIPAdapterFlux.ipadapter_flux ◄─ IPAdapterFluxLoader
              │
              └─► [0] = IP-Adapter modified MODEL
```

---

## Model-Specific Workflow Templates

### Flux (Text Rendering, High Quality)

```python
FLUX_WORKFLOW = {
    # Model loaders
    "1": {
        "class_type": "UNETLoader",
        "inputs": {"unet_name": "flux1-dev.safetensors", "weight_dtype": "default"}
    },
    "2": {
        "class_type": "DualCLIPLoader",
        "inputs": {
            "clip_name1": "clip_l.safetensors",
            "clip_name2": "t5xxl_fp16.safetensors",
            "type": "flux"
        }
    },
    "3": {
        "class_type": "VAELoader",
        "inputs": {"vae_name": "ae.safetensors"}
    },
    # Prompt encoding
    "4": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["2", 0], "text": "{{PROMPT}}"}
    },
    "5": {
        "class_type": "FluxGuidance",
        "inputs": {"conditioning": ["4", 0], "guidance": 3.5}
    },
    # Sampling (Flux uses advanced sampler)
    "6": {
        "class_type": "EmptyLatentImage",
        "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
    },
    "7": {
        "class_type": "KSamplerSelect",
        "inputs": {"sampler_name": "euler"}
    },
    "8": {
        "class_type": "BasicScheduler",
        "inputs": {"model": ["1", 0], "scheduler": "simple", "steps": 20, "denoise": 1.0}
    },
    "9": {
        "class_type": "RandomNoise",
        "inputs": {"noise_seed": 42}
    },
    "10": {
        "class_type": "BasicGuider",
        "inputs": {"model": ["1", 0], "conditioning": ["5", 0]}
    },
    "11": {
        "class_type": "SamplerCustomAdvanced",
        "inputs": {
            "noise": ["9", 0],
            "guider": ["10", 0],
            "sampler": ["7", 0],
            "sigmas": ["8", 0],
            "latent_image": ["6", 0]
        }
    },
    # Output
    "12": {
        "class_type": "VAEDecode",
        "inputs": {"samples": ["11", 0], "vae": ["3", 0]}
    },
    "13": {
        "class_type": "SaveImage",
        "inputs": {"images": ["12", 0], "filename_prefix": "flux_output"}
    }
}
```

**Flux Settings:**
| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| guidance | 3.0-4.0 | Uses FluxGuidance, not CFG |
| scheduler | simple | Best for Flux |
| sampler | euler | Fast and quality |
| steps | 20-25 | Fewer than SDXL |

### SDXL (General Purpose)

```python
SDXL_WORKFLOW = {
    "1": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": {"ckpt_name": "sdxl_base.safetensors"}
    },
    "2": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["1", 1], "text": "{{PROMPT}}"}
    },
    "3": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["1", 1], "text": "{{NEGATIVE}}"}
    },
    "4": {
        "class_type": "EmptyLatentImage",
        "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
    },
    "5": {
        "class_type": "KSampler",
        "inputs": {
            "model": ["1", 0],
            "positive": ["2", 0],
            "negative": ["3", 0],
            "latent_image": ["4", 0],
            "seed": 42,
            "steps": 30,
            "cfg": 7.0,
            "sampler_name": "dpmpp_2m_sde",
            "scheduler": "karras",
            "denoise": 1.0
        }
    },
    "6": {
        "class_type": "VAEDecode",
        "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
    },
    "7": {
        "class_type": "SaveImage",
        "inputs": {"images": ["6", 0], "filename_prefix": "sdxl_output"}
    }
}
```

**SDXL Settings:**
| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| cfg | 5.0-7.0 | Higher = sharper |
| scheduler | karras | Best for SDXL |
| sampler | dpmpp_2m_sde | Quality + speed |
| steps | 30-40 | More than Flux |

### Qwen-Image (Photorealistic)

```python
QWEN_TXT2IMG_WORKFLOW = {
    "1": {
        "class_type": "UNETLoader",
        "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}
    },
    "2": {
        "class_type": "CLIPLoader",
        "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}
    },
    "3": {
        "class_type": "VAELoader",
        "inputs": {"vae_name": "qwen_image_vae.safetensors"}
    },
    "9": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["2", 0], "text": "{{PROMPT}}"}
    },
    "10": {
        "class_type": "ModelSamplingAuraFlow",
        "inputs": {"model": ["1", 0], "shift": 3.1}
    },
    "11": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["2", 0], "text": "{{NEGATIVE}}"}
    },
    "12": {
        "class_type": "EmptySD3LatentImage",
        "inputs": {"width": 1296, "height": 1296, "batch_size": 1}
    },
    "13": {
        "class_type": "KSampler",
        "inputs": {
            "model": ["10", 0],
            "positive": ["9", 0],
            "negative": ["11", 0],
            "latent_image": ["12", 0],
            "seed": 42,
            "steps": 25,
            "cfg": 3.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0
        }
    },
    "14": {
        "class_type": "VAEDecode",
        "inputs": {"samples": ["13", 0], "vae": ["3", 0]}
    },
    "15": {
        "class_type": "SaveImage",
        "inputs": {"images": ["14", 0], "filename_prefix": "qwen_output"}
    }
}
```

**Qwen Settings:**
| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| cfg | 3.0 | Low CFG like Flux |
| scheduler | simple | Best for Qwen |
| sampler | euler | Fast and quality |
| steps | 25 | Moderate |
| shift | 3.1 | ModelSamplingAuraFlow parameter |

### LTX-Video (Image-to-Video)

```python
LTX_I2V_WORKFLOW = {
    "1": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": {"ckpt_name": "ltx-2-19b-dev-fp8.safetensors"}
    },
    "2": {
        "class_type": "LTXAVTextEncoderLoader",
        "inputs": {
            "text_encoder": "gemma_3_12B_it.safetensors",
            "ckpt_name": "ltx-2-19b-dev-fp8.safetensors",
            "device": "default"
        }
    },
    "3": {
        "class_type": "LoadImage",
        "inputs": {"image": "{{INPUT_IMAGE}}"}
    },
    "4": {
        "class_type": "ImageScaleToTotalPixels",
        "inputs": {"image": ["3", 0], "upscale_method": "lanczos", "megapixels": 0.9216, "resolution_steps": 8}
    },
    "5": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["2", 0], "text": "{{VIDEO_PROMPT}}"}
    },
    "6": {
        "class_type": "CLIPTextEncode",
        "inputs": {"clip": ["2", 0], "text": "static, blurry, low quality"}
    },
    "7": {
        "class_type": "LTXVConditioning",
        "inputs": {"positive": ["5", 0], "negative": ["6", 0], "frame_rate": 24}
    },
    "8": {
        "class_type": "LTXVImgToVideo",
        "inputs": {
            "positive": ["7", 0],
            "negative": ["7", 1],
            "vae": ["1", 2],
            "image": ["4", 0],
            "width": 1280,
            "height": 720,
            "length": 121,
            "batch_size": 1,
            "strength": 0.6
        }
    },
    # Audio components
    "9": {
        "class_type": "LTXVAudioVAELoader",
        "inputs": {"ckpt_name": "ltx-2-19b-dev-fp8.safetensors"}
    },
    "10": {
        "class_type": "LTXVEmptyLatentAudio",
        "inputs": {"frames_number": 121, "frame_rate": 24, "batch_size": 1, "audio_vae": ["9", 0]}
    },
    "11": {
        "class_type": "LTXVConcatAVLatent",
        "inputs": {"video_latent": ["8", 2], "audio_latent": ["10", 0]}
    },
    # Sampling
    "12": {
        "class_type": "LTXVScheduler",
        "inputs": {"steps": 20, "max_shift": 2.05, "base_shift": 0.95, "stretch": True, "terminal": 0.1, "latent": ["11", 0]}
    },
    "13": {
        "class_type": "RandomNoise",
        "inputs": {"noise_seed": 42}
    },
    "14": {
        "class_type": "KSamplerSelect",
        "inputs": {"sampler_name": "euler"}
    },
    "15": {
        "class_type": "CFGGuider",
        "inputs": {"model": ["1", 0], "positive": ["8", 0], "negative": ["8", 1], "cfg": 3.0}
    },
    "16": {
        "class_type": "SamplerCustomAdvanced",
        "inputs": {
            "noise": ["13", 0],
            "guider": ["15", 0],
            "sampler": ["14", 0],
            "sigmas": ["12", 0],
            "latent_image": ["11", 0]
        }
    },
    # Decode video and audio
    "17": {
        "class_type": "VAEDecode",
        "inputs": {"samples": ["16", 0], "vae": ["1", 2]}
    },
    "18": {
        "class_type": "LTXVAudioVAEDecode",
        "inputs": {"samples": ["16", 1], "audio_vae": ["9", 0]}
    },
    # Combine and save
    "19": {
        "class_type": "CreateVideo",
        "inputs": {"images": ["17", 0], "audio": ["18", 0], "fps": 24.0}
    },
    "20": {
        "class_type": "SaveVideo",
        "inputs": {"video": ["19", 0], "filename_prefix": "ltx_output", "format": "mp4", "codec": "h264"}
    }
}
```

**LTX-2 Settings:**
| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| frames | 121 | 5 seconds @ 24fps |
| steps | 20 | Fast for video |
| cfg | 3.0 | Low like Flux |
| strength | 0.6 | I2V adherence |
| max_shift | 2.05 | LTX-specific |

---

## Multi-Stage Pipeline Patterns

### Pattern 1: Reference Image → Style Transfer → Video

```python
async def generate_viral_video(reference_image: Path, style_prompt: str, motion_prompt: str):
    """Complete pipeline: image → style transfer → 4K video"""

    client = ComfyUIClient()

    # Stage 1: Style Transfer with Qwen
    styled_image = await client.run_workflow(
        build_qwen_controlnet_workflow(
            reference_image=reference_image,
            prompt=style_prompt,
            controlnet_strength=0.85
        )
    )

    # Stage 2: Generate Video with LTX
    video = await client.run_workflow(
        build_ltx_i2v_workflow(
            input_image=styled_image,
            prompt=motion_prompt,
            frames=121,
            width=1280,
            height=720
        )
    )

    # Stage 3: Upscale to 4K (optional)
    video_4k = await client.run_workflow(
        build_video_upscale_workflow(
            input_video=video,
            scale_factor=3  # 720p → ~4K
        )
    )

    return video_4k
```

### Pattern 2: Chaining Without Re-upload

ComfyUI keeps outputs in its output folder. Reference them directly:

```python
# Stage 1 output
stage1_result = queue_and_wait(workflow1)
output_filename = stage1_result["outputs"]["7"]["images"][0]["filename"]

# Stage 2: Reference Stage 1 output directly (no re-upload needed)
workflow2["3"]["inputs"]["image"] = output_filename
workflow2["3"]["inputs"]["upload"] = "image"  # Still needed for LoadImage
# Actually, for outputs you need to move/copy to input folder OR use a different approach

# Better approach: Use PreviewImage in stage 1 and save to a specific location
# OR: Chain nodes within a single workflow when possible
```

### Pattern 3: Single Workflow Multi-Stage

For maximum efficiency, combine stages in one workflow:

```python
COMBINED_WORKFLOW = {
    # Stage 1: Generate image
    "1": {"class_type": "CheckpointLoaderSimple", ...},
    "2": {"class_type": "CLIPTextEncode", ...},
    ...
    "7": {"class_type": "VAEDecode", ...},

    # Stage 2: Use generated image for video (direct connection)
    "8": {"class_type": "LTXVImgToVideo", "inputs": {"image": ["7", 0], ...}},
    ...
}
```

---

## Parameter Injection System

### Template Placeholders

Use `{{PARAM_NAME}}` syntax in workflow JSON:

```json
{
  "9": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["2", 0],
      "text": "{{BIO_PROMPT}}"
    }
  },
  "13": {
    "class_type": "KSampler",
    "inputs": {
      "seed": "{{SEED}}",
      ...
    }
  }
}
```

### Injection Function

```python
def inject_parameters(workflow: dict, params: dict) -> dict:
    """Inject parameters into workflow template.

    Args:
        workflow: Workflow with {{PARAM}} placeholders
        params: Dict of param_name -> value

    Returns:
        Workflow with parameters replaced
    """
    # Convert to string for replacement
    workflow_str = json.dumps(workflow)

    for param_name, param_value in params.items():
        placeholder = f"{{{{{param_name}}}}}"

        if isinstance(param_value, (int, float, bool)):
            # Numeric/boolean: remove quotes around placeholder
            workflow_str = workflow_str.replace(f'"{placeholder}"', str(param_value).lower() if isinstance(param_value, bool) else str(param_value))
            workflow_str = workflow_str.replace(placeholder, str(param_value))
        else:
            # String: escape for JSON
            escaped = json.dumps(str(param_value))[1:-1]
            workflow_str = workflow_str.replace(placeholder, escaped)

    return json.loads(workflow_str)

# Usage
workflow = inject_parameters(QWEN_WORKFLOW, {
    "BIO_PROMPT": "photorealistic dragon with scales and fire breath",
    "SEED": 42,
    "OUTPUT_PREFIX": "dragon_bio"
})
```

---

## Error Handling & Recovery

### Error Types and Recovery Strategies

```python
class ComfyUIError(Exception):
    """Base ComfyUI error."""
    pass

class ConnectionError(ComfyUIError):
    """Cannot connect to ComfyUI."""
    # Recovery: Check if ComfyUI is running, wait and retry

class ExecutionError(ComfyUIError):
    """Workflow execution failed."""
    def __init__(self, message, node_id=None, node_type=None):
        self.node_id = node_id
        self.node_type = node_type
        super().__init__(message)

class VRAMError(ExecutionError):
    """Out of GPU memory."""
    # Recovery: Free memory, reduce resolution, enable tiled VAE
```

### Error Decision Tree

```
Error occurred?
│
├─► Connection refused
│   └─► Start ComfyUI: python main.py --highvram
│
├─► "CUDA out of memory"
│   ├─► POST /free {"free_memory": true, "unload_models": true}
│   ├─► Reduce resolution (1024 → 768)
│   ├─► Enable VAEDecodeTiled
│   └─► Reduce batch_size to 1
│
├─► "Model not found"
│   └─► Check model file exists in ComfyUI/models/
│
├─► "Invalid prompt"
│   └─► Check workflow JSON structure, node connections
│
├─► Timeout
│   ├─► Check /queue for stuck jobs
│   ├─► POST /interrupt
│   └─► Retry with longer timeout
│
└─► Node-specific error
    └─► Check node_type in error, consult node documentation
```

### Retry Logic

```python
async def execute_with_retry(workflow, max_retries=3):
    """Execute workflow with automatic retry on recoverable errors."""

    for attempt in range(max_retries):
        try:
            return await execute_workflow(workflow)

        except VRAMError:
            # Free memory and retry
            await free_memory(unload_models=attempt > 0)
            await asyncio.sleep(2)

        except TimeoutError:
            # Clear queue and retry
            await clear_queue()
            await asyncio.sleep(5)

        except ExecutionError as e:
            if "out of memory" in str(e).lower():
                # Reduce resolution
                workflow = reduce_resolution(workflow)
            else:
                raise  # Non-recoverable

    raise Exception("Max retries exceeded")
```

---

## Asset Iteration & Publishing

When orchestrating ComfyUI workflows, agents need to iterate on generated outputs without re-prompting. The **MassMediaFactory MCP** provides asset tracking, regeneration, and publishing capabilities.

### Asset Registry Concept

Every generated output is registered with a unique `asset_id` that enables:

1. **Viewing** - Get preview URLs and metadata
2. **Regeneration** - Re-run with parameter tweaks (CFG, seed, prompt)
3. **Browsing** - List recent generations by session
4. **Publishing** - Export to web directories with compression

```python
# Asset lifecycle
result = execute_workflow(workflow)
output = wait_for_completion(result["prompt_id"])

# Each output includes an asset_id
asset_id = output["outputs"][0]["asset_id"]
# → "a1b2c3d4-5678-90ab-cdef-1234567890ab"
```

### Iteration Workflow

```
1. GENERATE initial output
2. VIEW the result (get URL, preview)
3. DECIDE: acceptable or needs adjustment?
4. REGENERATE with tweaks if needed
5. REPEAT until satisfied
6. PUBLISH final asset to web directory
```

### Regenerate Function

Modify parameters without rebuilding the entire workflow:

```python
def regenerate(
    asset_id: str,
    prompt: str = None,      # Override prompt
    negative_prompt: str = None,
    cfg: float = None,       # Override CFG scale
    seed: int = None,        # None = new random seed
    steps: int = None,       # Override sampling steps
    denoise: float = None,   # Override denoise strength
) -> dict:
    """
    Re-run generation with parameter overrides.

    Returns:
        {"prompt_id": "...", "status": "queued", "parameters": {...}}
    """
```

**Usage patterns:**

```python
# Initial generation
result = execute_workflow(workflow)
output = wait_for_completion(result["prompt_id"])
asset_id = output["outputs"][0]["asset_id"]

# View the result
info = view_output(asset_id)
print(f"Preview: {info['url']}")
print(f"Prompt: {info['prompt_preview']}")

# Not right? Try different seed (same parameters)
result = regenerate(asset_id, seed=None)  # Random new seed
output = wait_for_completion(result["prompt_id"])

# Better, but need more detail? Increase CFG
result = regenerate(output["outputs"][0]["asset_id"], cfg=4.5)
output = wait_for_completion(result["prompt_id"])

# Tweak the prompt
result = regenerate(
    output["outputs"][0]["asset_id"],
    prompt="a majestic dragon with iridescent scales, volumetric lighting, 8k",
    seed=42  # Lock seed to compare prompt changes
)
```

### Session-Based Browsing

All generations within a session are tracked for easy browsing:

```python
def list_assets(
    session_id: str = None,  # Filter by session (default: current)
    limit: int = 20,         # Max results
) -> dict:
    """
    List recent generations.

    Returns:
        {
            "assets": [
                {
                    "asset_id": "...",
                    "filename": "qwen_00001_.png",
                    "prompt_preview": "a majestic dragon...",
                    "created_at": "2026-01-27T10:30:45Z",
                    "parameters": {"cfg": 3.5, "steps": 25, ...}
                },
                ...
            ],
            "count": 5
        }
    """

# Generate multiple variations
for seed in [42, 123, 456, 789]:
    workflow = create_workflow_from_template("qwen_txt2img", {
        "PROMPT": "a dragon breathing fire",
        "SEED": seed
    })
    execute_workflow(workflow["workflow"])
    wait_for_completion(...)

# Browse all from this session
assets = list_assets(limit=10)
for asset in assets["assets"]:
    print(f"{asset['asset_id'][:8]}: {asset['prompt_preview']}")

# Pick the best
best_asset = assets["assets"][2]  # Third one looks best
```

### View Output Details

Get full metadata and preview URL:

```python
def view_output(asset_id: str) -> dict:
    """
    Get asset details for viewing.

    Returns:
        {
            "asset_id": "...",
            "url": "http://localhost:8188/view?filename=...",
            "filename": "qwen_00001_.png",
            "mime_type": "image/png",
            "prompt_preview": "first 200 chars of prompt...",
            "parameters": {
                "cfg": 3.5,
                "steps": 25,
                "seed": 42,
                ...
            },
            "created_at": "2026-01-27T10:30:45Z"
        }
    """
```

### Publishing Assets

Export final assets to web directories for deployment:

```python
def publish_asset(
    asset_id: str,
    target_filename: str = None,   # Explicit filename (demo mode)
    manifest_key: str = None,      # Key for manifest.json (library mode)
    publish_dir: str = None,       # Target directory (auto-detected)
    web_optimize: bool = True,     # Apply compression
) -> dict:
    """
    Publish asset to web directory.

    Returns:
        {
            "success": True,
            "url": "/gen/hero_image.png",
            "path": "/project/public/gen/hero_image.png",
            "bytes": 245000,
            "manifest_updated": True  # If manifest_key provided
        }
    """
```

**Demo mode** (explicit filename):

```python
# Perfect for one-off assets
result = publish_asset(
    asset_id=best_asset["asset_id"],
    target_filename="hero_image.png"
)
print(f"Published to: {result['url']}")
# → "/gen/hero_image.png"
```

**Library mode** (manifest tracking):

```python
# For managed asset libraries
result = publish_asset(
    asset_id=best_asset["asset_id"],
    manifest_key="product_shot_1"
)
# Auto-generates filename with timestamp
# Updates manifest.json for asset management
```

### Complete Iteration Example

```python
"""
Agent Workflow: Generate hero image with iteration
"""

from massmediafactory import (
    create_workflow_from_template,
    execute_workflow,
    wait_for_completion,
    view_output,
    regenerate,
    list_assets,
    publish_asset
)

# 1. Generate initial image
workflow = create_workflow_from_template("qwen_txt2img", {
    "PROMPT": "a majestic phoenix rising from flames, photorealistic, 8k",
    "SEED": 42,
    "WIDTH": 1024,
    "HEIGHT": 1024
})

result = execute_workflow(workflow["workflow"])
output = wait_for_completion(result["prompt_id"])
asset_id = output["outputs"][0]["asset_id"]

# 2. View result
info = view_output(asset_id)
print(f"Generated: {info['url']}")
# Agent or VLM evaluates the image...

# 3. Iterate - try higher CFG for more detail
result = regenerate(asset_id, cfg=4.0, seed=None)
output = wait_for_completion(result["prompt_id"])
asset_id = output["outputs"][0]["asset_id"]

# 4. Iterate again - refine prompt
result = regenerate(
    asset_id,
    prompt="a majestic phoenix rising from volcanic flames, iridescent feathers, volumetric lighting, 8k macro photography",
    cfg=3.5
)
output = wait_for_completion(result["prompt_id"])
asset_id = output["outputs"][0]["asset_id"]

# 5. Browse all attempts
assets = list_assets(limit=5)
for i, asset in enumerate(assets["assets"]):
    print(f"{i+1}. {asset['asset_id'][:8]}: CFG={asset['parameters'].get('cfg')}")

# 6. Publish the best one
final_result = publish_asset(
    asset_id=asset_id,
    target_filename="phoenix_hero.png"
)
print(f"Published: {final_result['url']}")
# → "/gen/phoenix_hero.png"
```

### Asset Registry TTL

Assets expire after a configurable TTL (default 24 hours):

```python
# If asset expired
result = view_output("expired-asset-id")
# → {"error": "ASSET_NOT_FOUND_OR_EXPIRED", "asset_id": "..."}

# Solution: Re-generate from workflow
# Assets store full workflow for regeneration
metadata = get_asset_metadata(asset_id)  # Before expiration
original_workflow = metadata["workflow"]  # Save this!
```

**Environment variable:** `COMFY_MCP_ASSET_TTL_HOURS=24`

---

### Message Types

| Type | Description | Data |
|------|-------------|------|
| `status` | Queue status update | `{"exec_info": {...}}` |
| `executing` | Node started executing | `{"node": "5", "prompt_id": "..."}` |
| `progress` | Sampling progress | `{"value": 15, "max": 30, "node": "5"}` |
| `executed` | Node completed | `{"node": "5", "output": {...}}` |
| `execution_start` | Workflow started | `{"prompt_id": "..."}` |
| `execution_success` | Workflow completed | `{"prompt_id": "..."}` |
| `execution_error` | Workflow failed | `{"exception_message": "...", "node_id": "5"}` |

### Python WebSocket Client

```python
import asyncio
import aiohttp
import json

async def monitor_execution(prompt_id: str, on_progress=None):
    """Monitor workflow execution via WebSocket."""

    ws_url = f"ws://localhost:8188/ws?clientId=agent_{prompt_id}"

    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(ws_url) as ws:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    msg_type = data.get("type")
                    msg_data = data.get("data", {})

                    # Filter to our prompt
                    if msg_data.get("prompt_id") != prompt_id:
                        continue

                    if msg_type == "progress":
                        value = msg_data.get("value", 0)
                        max_val = msg_data.get("max", 100)
                        if on_progress:
                            on_progress(value, max_val)
                        print(f"Progress: {value}/{max_val}")

                    elif msg_type == "execution_success":
                        print("Completed!")
                        return True

                    elif msg_type == "execution_error":
                        error = msg_data.get("exception_message", "Unknown")
                        raise ExecutionError(error, msg_data.get("node_id"))

                elif msg.type == aiohttp.WSMsgType.ERROR:
                    raise ConnectionError(f"WebSocket error: {ws.exception()}")
```

---

## Complete Python Client

```python
"""
ComfyUI Client for Agent Orchestration

Usage:
    client = ComfyUIClient()

    # Text-to-image
    result = client.txt2img(
        prompt="a beautiful sunset",
        model="flux",
        output_path="output.png"
    )

    # Image-to-video
    result = client.img2vid(
        image_path="input.png",
        prompt="the scene comes alive with motion",
        output_path="output.mp4"
    )
"""

import json
import time
import uuid
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass

@dataclass
class ProgressInfo:
    node_id: str = ""
    value: int = 0
    max_value: int = 100

    @property
    def percentage(self) -> float:
        return (self.value / max(self.max_value, 1)) * 100


class ComfyUIClient:
    """Production ComfyUI client for agent orchestration."""

    def __init__(self, host: str = "127.0.0.1", port: int = 8188):
        self.base_url = f"http://{host}:{port}"
        self.client_id = str(uuid.uuid4())

    def is_running(self) -> bool:
        """Check if ComfyUI server is accessible."""
        try:
            urllib.request.urlopen(f"{self.base_url}/system_stats", timeout=5)
            return True
        except:
            return False

    def upload_image(self, image_path: Path) -> str:
        """Upload image and return filename for use in workflows."""
        image_path = Path(image_path)
        filename = f"{uuid.uuid4().hex[:8]}_{image_path.name}"

        with open(image_path, 'rb') as f:
            image_data = f.read()

        boundary = f'----Boundary{uuid.uuid4().hex[:16]}'
        body = (
            f'--{boundary}\r\n'
            f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'
            f'Content-Type: image/png\r\n\r\n'
        ).encode() + image_data + (
            f'\r\n--{boundary}\r\n'
            f'Content-Disposition: form-data; name="overwrite"\r\n\r\n'
            f'true\r\n'
            f'--{boundary}--\r\n'
        ).encode()

        req = urllib.request.Request(
            f"{self.base_url}/upload/image",
            data=body,
            headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
        )

        result = json.loads(urllib.request.urlopen(req).read())
        return result.get('name', filename)

    def queue_prompt(self, workflow: Dict) -> str:
        """Queue workflow and return prompt_id."""
        data = json.dumps({"prompt": workflow, "client_id": self.client_id}).encode()
        req = urllib.request.Request(
            f"{self.base_url}/prompt",
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        result = json.loads(urllib.request.urlopen(req).read())
        return result["prompt_id"]

    def wait_for_completion(
        self,
        prompt_id: str,
        timeout: float = 300,
        poll_interval: float = 1.0,
        on_progress: Optional[Callable[[ProgressInfo], None]] = None
    ) -> Dict:
        """Poll until workflow completes."""
        start = time.time()

        while time.time() - start < timeout:
            try:
                resp = urllib.request.urlopen(f"{self.base_url}/history/{prompt_id}")
                history = json.loads(resp.read())

                if prompt_id in history:
                    entry = history[prompt_id]

                    # Check for error
                    if entry.get("status", {}).get("status_str") == "error":
                        msgs = entry["status"].get("messages", [])
                        raise Exception(f"Execution failed: {msgs}")

                    # Check for completion
                    if "outputs" in entry:
                        return entry

                if on_progress:
                    elapsed = time.time() - start
                    on_progress(ProgressInfo(value=int(elapsed), max_value=int(timeout)))

            except urllib.error.URLError:
                pass

            time.sleep(poll_interval)

        raise TimeoutError(f"Workflow timed out after {timeout}s")

    def download_output(self, filename: str, output_path: Path, folder_type: str = "output"):
        """Download generated file."""
        params = urllib.parse.urlencode({"filename": filename, "type": folder_type})
        resp = urllib.request.urlopen(f"{self.base_url}/view?{params}")

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(resp.read())

    def free_memory(self, unload_models: bool = False):
        """Free GPU memory."""
        data = json.dumps({"free_memory": True, "unload_models": unload_models}).encode()
        req = urllib.request.Request(
            f"{self.base_url}/free",
            data=data,
            method='POST',
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req)

    def run_workflow(
        self,
        workflow: Dict,
        output_path: Path,
        timeout: float = 300,
        on_progress: Optional[Callable[[ProgressInfo], None]] = None
    ) -> Path:
        """Run workflow and download output."""
        prompt_id = self.queue_prompt(workflow)
        result = self.wait_for_completion(prompt_id, timeout, on_progress=on_progress)

        # Find outputs
        for node_id, output in result.get("outputs", {}).items():
            for key in ["images", "video", "gifs", "videos"]:
                if key in output:
                    for item in output[key]:
                        if "filename" in item:
                            self.download_output(item["filename"], output_path)
                            return output_path

        raise Exception("No output found in workflow result")

    # --- Asset Iteration Methods ---

    def view_output(self, asset_id: str) -> Dict:
        """Get asset details for viewing."""
        # This would typically call the MCP server
        # For direct API usage, get from history
        raise NotImplementedError("Use MassMediaFactory MCP for asset iteration")

    def regenerate(
        self,
        asset_id: str,
        prompt: str = None,
        cfg: float = None,
        seed: int = None,
        steps: int = None,
    ) -> str:
        """
        Regenerate an asset with parameter overrides.

        Returns:
            prompt_id for the new generation
        """
        # This would typically call the MCP server
        raise NotImplementedError("Use MassMediaFactory MCP for asset iteration")

    def list_session_assets(self, limit: int = 20) -> list:
        """List recent assets from this session."""
        # This would typically call the MCP server
        raise NotImplementedError("Use MassMediaFactory MCP for asset iteration")

    def publish_asset(
        self,
        asset_id: str,
        target_filename: str = None,
        manifest_key: str = None,
    ) -> Dict:
        """Publish asset to web directory."""
        # This would typically call the MCP server
        raise NotImplementedError("Use MassMediaFactory MCP for asset iteration")


# --- MassMediaFactory MCP Integration ---
# For full asset iteration support, use the MCP server:
#
#   claude mcp add --transport stdio --scope user comfyui-massmediafactory \
#       -- comfyui-massmediafactory-mcp
#
# Then use the MCP tools:
#   - execute_workflow() / wait_for_completion()
#   - view_output(asset_id)
#   - regenerate(asset_id, cfg=4.0, seed=None)
#   - list_assets(limit=10)
#   - publish_asset(asset_id, target_filename="hero.png")
#
# See: MASSMEDIAFACTORY_MCP.md for complete documentation
```

---

## Workflow Recipe Library

### Recipe: Style Transfer with ControlNet

```python
def build_style_transfer_workflow(
    reference_image: str,
    style_prompt: str,
    controlnet_strength: float = 0.85
) -> dict:
    """Transfer art style while preserving structure."""
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "LoadImage", "inputs": {"image": reference_image}},
        "5": {"class_type": "ImageScaleToTotalPixels", "inputs": {"image": ["4", 0], "upscale_method": "area", "megapixels": 1.68}},
        "6": {"class_type": "Canny", "inputs": {"image": ["5", 0], "low_threshold": 0.4, "high_threshold": 0.8}},
        "7": {"class_type": "ModelPatchLoader", "inputs": {"name": "qwen_image_canny_diffsynth_controlnet.safetensors"}},
        "8": {"class_type": "QwenImageDiffsynthControlnet", "inputs": {
            "model": ["10", 0], "model_patch": ["7", 0], "vae": ["3", 0],
            "image": ["6", 0], "strength": controlnet_strength
        }},
        "9": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": style_prompt}},
        "10": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.1}},
        "11": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": "cartoon, anime, blurry, low quality"}},
        "12": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1296, "height": 1296, "batch_size": 1}},
        "13": {"class_type": "KSampler", "inputs": {
            "model": ["8", 0], "positive": ["9", 0], "negative": ["11", 0],
            "latent_image": ["12", 0], "seed": 42, "steps": 25, "cfg": 3.0,
            "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0
        }},
        "14": {"class_type": "VAEDecode", "inputs": {"samples": ["13", 0], "vae": ["3", 0]}},
        "15": {"class_type": "SaveImage", "inputs": {"images": ["14", 0], "filename_prefix": "styled"}}
    }
```

### Recipe: Flux with IP-Adapter

```python
def build_flux_ipadapter_workflow(
    reference_image: str,
    prompt: str,
    ip_weight: float = 0.35
) -> dict:
    """Generate image maintaining style/identity from reference."""
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux1-dev.safetensors"}},
        "2": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp16.safetensors", "type": "flux"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "4": {"class_type": "IPAdapterFluxLoader", "inputs": {"ipadapter": "ip-adapter.bin", "clip_vision": "google/siglip-so400m-patch14-384", "provider": "cuda"}},
        "5": {"class_type": "LoadImage", "inputs": {"image": reference_image}},
        "6": {"class_type": "ApplyIPAdapterFlux", "inputs": {
            "model": ["1", 0], "ipadapter_flux": ["4", 0], "image": ["5", 0],
            "weight": ip_weight, "start_percent": 0.0, "end_percent": 1.0
        }},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": prompt}},
        "8": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["7", 0], "guidance": 3.5}},
        "9": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        "10": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "11": {"class_type": "BasicScheduler", "inputs": {"model": ["6", 0], "scheduler": "simple", "steps": 20, "denoise": 1.0}},
        "12": {"class_type": "RandomNoise", "inputs": {"noise_seed": 42}},
        "13": {"class_type": "BasicGuider", "inputs": {"model": ["6", 0], "conditioning": ["8", 0]}},
        "14": {"class_type": "SamplerCustomAdvanced", "inputs": {
            "noise": ["12", 0], "guider": ["13", 0], "sampler": ["10", 0],
            "sigmas": ["11", 0], "latent_image": ["9", 0]
        }},
        "15": {"class_type": "VAEDecode", "inputs": {"samples": ["14", 0], "vae": ["3", 0]}},
        "16": {"class_type": "SaveImage", "inputs": {"images": ["15", 0], "filename_prefix": "flux_ip"}}
    }
```

---

## Agent Integration Checklist

Before executing a workflow, verify:

- [ ] ComfyUI server is running (`GET /system_stats`)
- [ ] Required models exist in ComfyUI/models/
- [ ] Input images are uploaded (`POST /upload/image`)
- [ ] Workflow JSON is valid (no missing node references)
- [ ] All `{{PARAM}}` placeholders are replaced
- [ ] Node IDs are unique strings
- [ ] Links reference valid source node outputs
- [ ] Output node (SaveImage/SaveVideo) is present

---

## Prompt Engineering for Agents

### The S.A.C.S. Framework

Construct prompts programmatically using these components:

| Component | Purpose | Example |
|-----------|---------|---------|
| **Subject** | Core object/character | "a hyper-realistic dragon" |
| **Action** | What's happening (critical for video) | "breathing fire, wings spread" |
| **Context** | Environment, lighting | "volcanic crater, orange glow" |
| **Style** | Art style, quality tags | "8k, macro photography, cinematic" |

### Image Generation Prompts

```python
def build_image_prompt(subject: str, context: str, style: str) -> str:
    """Build optimized image generation prompt."""
    return f"{subject}, {context}, {style}, highly detailed, sharp focus"

def build_negative_prompt(avoid_styles: list = None) -> str:
    """Build negative prompt to avoid common issues."""
    base = "blurry, low quality, distorted, watermark, text, logo"
    if avoid_styles:
        return f"{base}, {', '.join(avoid_styles)}"
    return base

# Usage
prompt = build_image_prompt(
    subject="photorealistic biological illustration of a phoenix",
    context="scientific diagram, anatomical cutaway, parchment background",
    style="8k resolution, macro photography, museum quality"
)
# Result: "photorealistic biological illustration of a phoenix, scientific diagram, anatomical cutaway, parchment background, 8k resolution, macro photography, museum quality, highly detailed, sharp focus"

negative = build_negative_prompt(["cartoon", "anime", "3D render"])
# Result: "blurry, low quality, distorted, watermark, text, logo, cartoon, anime, 3D render"
```

### Video Generation Prompts

**Critical Rule:** For Image-to-Video, describe **motion only**, not the static subject.

```python
def build_video_prompt(motion: str, camera: str = "", atmosphere: str = "") -> str:
    """Build motion-focused video prompt.

    Do NOT describe the subject's appearance - that comes from the input image.
    Only describe what CHANGES: movement, camera, lighting shifts.
    """
    parts = [motion]
    if camera:
        parts.append(camera)
    if atmosphere:
        parts.append(atmosphere)
    return ", ".join(parts)

# WRONG - describing static elements:
bad_prompt = "A red dragon with scales and wings breathing fire"

# CORRECT - describing motion only:
good_prompt = build_video_prompt(
    motion="the creature turns its head slowly, opens its mouth, flames emerge",
    camera="slow push-in shot",
    atmosphere="volumetric lighting, smoke rising"
)
# Result: "the creature turns its head slowly, opens its mouth, flames emerge, slow push-in shot, volumetric lighting, smoke rising"
```

### Model-Specific Prompt Tips

| Model | Prompt Style | Key Tips |
|-------|-------------|----------|
| **Flux** | Natural language | Excels at text rendering, use quotes for text |
| **SDXL** | Tag-based works | Quality tags: "masterpiece, best quality, 8k" |
| **Qwen** | Natural language | Photorealistic focus, detailed descriptions |
| **LTX** | Motion-focused | Describe movement, not static appearance |

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `"Sizes must match"` | Latent/Image resolution mismatch | Add `ImageScaleToTotalPixels` node (see below) |
| `"Input undefined"` | Link points to non-existent node | Check node ID exists and has that slot |
| `"CUDA out of memory"` | VRAM exhausted | Call `/free`, reduce resolution, use tiled VAE |
| `"Model not found"` | Model file missing | Verify file in ComfyUI/models/ |
| `"Invalid prompt"` | Malformed JSON | Validate JSON structure |
| `"Connection refused"` | ComfyUI not running | Start server: `python main.py --highvram` |

### Fixing "Sizes Must Match" Errors

This error occurs when input images don't match the expected latent dimensions. Use `ImageScaleToTotalPixels` to normalize image sizes before processing.

**Node Configuration:**
```python
{
    "class_type": "ImageScaleToTotalPixels",
    "inputs": {
        "image": ["load_image_node", 0],
        "upscale_method": "lanczos",     # Best quality
        "megapixels": 1.0,               # Target size (1MP = ~1024x1024)
        "resolution_steps": 8            # Round to multiples of 8
    }
}
```

**Megapixel Reference Table:**

| Target Resolution | Megapixels Value |
|-------------------|------------------|
| 512×512 | 0.26 |
| 768×768 | 0.59 |
| 1024×1024 | 1.05 |
| 1280×720 (Video) | 0.92 |
| 1296×1296 (Qwen) | 1.68 |
| 2048×2048 | 4.19 |

**Auto-Fix Function:**
```python
def add_image_scale_node(workflow: dict, image_node_id: str, target_mp: float = 1.0) -> dict:
    """
    Insert ImageScaleToTotalPixels node after image loading to prevent size mismatches.

    Args:
        workflow: Workflow dict
        image_node_id: ID of the LoadImage node
        target_mp: Target megapixels (default 1.0 for ~1024x1024)

    Returns:
        Modified workflow with scale node inserted
    """
    import copy
    workflow = copy.deepcopy(workflow)

    # Find next available node ID
    max_id = max(int(k) for k in workflow.keys() if k.isdigit())
    scale_node_id = str(max_id + 1)

    # Insert scale node
    workflow[scale_node_id] = {
        "class_type": "ImageScaleToTotalPixels",
        "inputs": {
            "image": [image_node_id, 0],
            "upscale_method": "lanczos",
            "megapixels": target_mp,
            "resolution_steps": 8
        }
    }

    # Update all nodes that reference the original image node
    for node_id, node in workflow.items():
        if node_id == scale_node_id:
            continue
        for input_name, input_value in node.get("inputs", {}).items():
            if isinstance(input_value, list) and input_value[0] == image_node_id:
                if input_name in ["image", "images", "pixels"]:
                    node["inputs"][input_name] = [scale_node_id, 0]

    return workflow
```

**Error Recovery Logic:**
```python
async def execute_with_size_fix(workflow: dict, max_retries: int = 2) -> dict:
    """Execute workflow with automatic size mismatch recovery."""

    for attempt in range(max_retries):
        try:
            return await execute_workflow(workflow)
        except Exception as e:
            if "sizes must match" in str(e).lower() and attempt < max_retries - 1:
                # Find LoadImage nodes and add scale nodes
                for node_id, node in workflow.items():
                    if node["class_type"] == "LoadImage":
                        workflow = add_image_scale_node(workflow, node_id)
                print(f"Added ImageScaleToTotalPixels, retrying...")
            else:
                raise

    return await execute_workflow(workflow)
```

### Error Recovery Code

```python
async def execute_with_recovery(client, workflow, max_retries=3):
    """Execute workflow with automatic error recovery."""

    for attempt in range(max_retries):
        try:
            return await client.run_workflow(workflow)

        except Exception as e:
            error_msg = str(e).lower()

            if "out of memory" in error_msg or "cuda" in error_msg:
                # VRAM exhaustion - free memory and retry
                client.free_memory(unload_models=attempt > 1)
                await asyncio.sleep(3)

                # On second retry, reduce resolution
                if attempt >= 1:
                    workflow = reduce_workflow_resolution(workflow, factor=0.75)

            elif "sizes must match" in error_msg:
                # Resolution mismatch - add scale node
                workflow = add_image_scale_node(workflow)

            elif "connection refused" in error_msg:
                # Server not running
                raise RuntimeError("ComfyUI server is not running")

            elif "model not found" in error_msg:
                # Model missing - fatal
                raise RuntimeError(f"Required model not found: {e}")

            else:
                # Unknown error - retry with delay
                await asyncio.sleep(5)

    raise RuntimeError(f"Failed after {max_retries} attempts")


def reduce_workflow_resolution(workflow: dict, factor: float = 0.75) -> dict:
    """Reduce all resolution parameters in workflow."""
    for node_id, node in workflow.items():
        inputs = node.get("inputs", {})

        for key in ["width", "height"]:
            if key in inputs and isinstance(inputs[key], (int, float)):
                # Round to nearest 8 (required for latents)
                new_val = int(inputs[key] * factor)
                inputs[key] = (new_val // 8) * 8

        # Handle megapixels
        if "megapixels" in inputs:
            inputs["megapixels"] = inputs["megapixels"] * (factor ** 2)

    return workflow
```

---

## Complete Multi-Stage Pipeline Example

```python
"""
Complete Example: Reference Image → Style Transfer → 4K Video

This demonstrates the full agent orchestration flow:
1. Upload reference image
2. Generate styled image with Qwen + ControlNet
3. Generate video with LTX-2
4. (Optional) Upscale to 4K
"""

import asyncio
from pathlib import Path
from comfyui_client import ComfyUIClient

async def create_viral_video(
    reference_image: Path,
    style_prompt: str,
    motion_prompt: str,
    output_dir: Path
) -> Path:
    """Generate a viral video from a reference image."""

    client = ComfyUIClient()

    if not client.is_running():
        raise RuntimeError("ComfyUI is not running!")

    # Stage 1: Style Transfer
    print("Stage 1: Applying style transfer...")
    uploaded_ref = client.upload_image(reference_image)

    style_workflow = build_qwen_controlnet_workflow(
        reference_image=uploaded_ref,
        prompt=f"{style_prompt}, highly detailed, photorealistic, 8k",
        negative_prompt="cartoon, anime, blurry, low quality",
        controlnet_strength=0.85,
        seed=42
    )

    styled_image_path = output_dir / "styled_frame.png"
    await execute_with_recovery(client, style_workflow)

    # Download and re-upload for Stage 2
    # (In production, you might chain nodes in one workflow)
    styled_filename = extract_output_filename(style_workflow_result)
    client.download_output(styled_filename, styled_image_path)
    uploaded_styled = client.upload_image(styled_image_path)

    # Stage 2: Video Generation
    print("Stage 2: Generating video...")
    video_workflow = build_ltx_i2v_workflow(
        input_image=uploaded_styled,
        prompt=motion_prompt,  # Motion only, not appearance!
        frames=121,  # 5 seconds @ 24fps
        width=1280,
        height=720,
        strength=0.6,
        seed=42
    )

    video_path = output_dir / "output_video.mp4"
    await execute_with_recovery(client, video_workflow)

    video_filename = extract_output_filename(video_workflow_result)
    client.download_output(video_filename, video_path)

    print(f"Video saved to: {video_path}")
    return video_path


# Usage
if __name__ == "__main__":
    asyncio.run(create_viral_video(
        reference_image=Path("my_character.png"),
        style_prompt="photorealistic dragon with iridescent scales, volumetric lighting",
        motion_prompt="the creature breathes fire, flames billow, slow motion, cinematic",
        output_dir=Path("./output")
    ))
```

---

## RTX 5090 32GB Optimization Guide

This section provides specific guidance for maximizing quality and performance on RTX 5090 (32GB VRAM).

### Precision Selection Strategy

**Core Principle:** With 32GB VRAM, prioritize **quality (precision)** for images and **context length** for video.

| Model Type | Recommended Precision | VRAM Usage | Rationale |
|------------|----------------------|------------|-----------|
| **Image (FLUX.2, Qwen)** | `fp16` | 14-24 GB | 32GB handles fp16 easily; better color gradations |
| **Video (LTX-2 19B)** | `fp8` (MANDATORY) | 19 GB | fp16 = 38GB → OOM! |
| **Video (Wan 2.6)** | `fp8` | 16 GB | Leave headroom for frames/latents |
| **Video (HunyuanVideo)** | `fp16` | 24 GB | Can fit with 8GB headroom |
| **VAE** | `fp32` or `fp16` | 1-2 GB | Never quantize VAE (causes color shift) |
| **T5 Text Encoder** | `fp16` | 8 GB | Full precision for Flux prompt understanding |

### Agent Configuration for RTX 5090

```python
RTX_5090_CONFIG = {
    "total_vram_gb": 32,
    "safe_margin_gb": 4,  # Leave for OS/system
    "usable_vram_gb": 28,

    # Image model defaults
    "image_precision": "fp16",
    "image_max_resolution": 2048,

    # Video model defaults
    "video_precision": "fp8",
    "video_max_frames": 241,  # LTX-2 limit

    # Pipeline management
    "unload_between_stages": True,  # For Image→Video pipelines
}
```

### Pipeline Memory Management

**Single Model Workflows:**
```
FLUX.2 (fp16, 24GB) + VAE (2GB) + T5 (8GB) = 34GB → Use fp8 for T5 OR keep-loaded strategy
Qwen (fp16, 14GB) + VAE (2GB) + CLIP (3GB) = 19GB → Fits easily, keep loaded
LTX-2 (fp8, 19GB) + Audio VAE (2GB) = 21GB → Fits with headroom
```

**Multi-Stage Pipeline Strategy:**

```python
# WRONG - Loading both models simultaneously
# FLUX.2 (24GB) + Wan 2.6 (16GB) = 40GB → OOM!

# CORRECT - Sequential unload
async def image_to_video_pipeline():
    # Stage 1: Generate image
    image = await run_flux_workflow(...)

    # CRITICAL: Unload image model before video
    await client.free_memory(unload_models=True)
    await asyncio.sleep(2)  # Allow VRAM to clear

    # Stage 2: Generate video
    video = await run_wan_workflow(image_path=image)
```

### Tiled VAE for High Resolutions

For high-resolution outputs, use `VAEDecodeTiled` instead of `VAEDecode` to prevent VRAM spikes during decoding.

**When to use Tiled VAE:**

| Output Type | Standard VAEDecode | Use VAEDecodeTiled |
|-------------|--------------------|--------------------|
| Image | ≤ 2048×2048 | > 2048×2048 |
| Video | ≤ 1280×720 | > 1280×720 or > 121 frames |

**Tiled VAE Node Configuration:**
```python
{
    "class_type": "VAEDecodeTiled",
    "inputs": {
        "samples": ["sampler_node", 0],
        "vae": ["vae_loader", 0],
        "tile_size": 512,      # 512 for images, 256 for video
        "overlap": 64          # Overlap to prevent seams
    }
}
```

**Agent Logic:**
```python
def select_vae_decoder(width: int, height: int, frames: int = 1) -> str:
    """Select appropriate VAE decoder based on output size."""
    total_pixels = width * height * frames

    # Threshold: ~2.1 billion pixels (2048x2048 or 1280x720x121)
    if total_pixels > 2_100_000_000:
        return "VAEDecodeTiled"
    return "VAEDecode"
```

### OOM Prevention Checklist

Before executing workflows on RTX 5090:

- [ ] LTX-2 19B uses `_fp8.safetensors` variant (NOT fp16)
- [ ] Wan 2.6 uses `_fp8.safetensors` variant
- [ ] VAE is NOT quantized
- [ ] Pipeline stages unload models between phases
- [ ] Total estimated VRAM < 28GB
- [ ] High-resolution outputs use `VAEDecodeTiled`

---

## SOTA Model Selection (January 2026)

### Image Generation Models

| Model | Best For | Prompt Style | Precision (5090) | VRAM |
|-------|----------|--------------|------------------|------|
| **FLUX.2-dev** | Photorealism, portraits, artistic | Natural language | fp16 | 24 GB |
| **Qwen-Image-2512** | Text rendering, UI, layouts | Instructional | fp16 | 14 GB |
| **Z-Image-Turbo** | Fast iteration, drafts | Natural language | fp16 | 12 GB |

### Video Generation Models

| Model | Best For | Audio | Max Duration | Precision (5090) | VRAM |
|-------|----------|-------|--------------|------------------|------|
| **LTX-2 19B** | Dialogue, music videos, lip-sync | Native input | 10s | fp8 (MUST) | 19 GB |
| **Wan 2.6** | Action, cinematography, I2V | None | 5s | fp8 | 16 GB |
| **HunyuanVideo 1.5** | Cinematic quality | None | 5s | fp16 | 24 GB |

### Auxiliary Models

| Model | Purpose | VRAM |
|-------|---------|------|
| Flux.2 Union ControlNet | Multi-mode (Canny/Depth/Pose) | 3 GB |
| Qwen ControlNet (Canny) | Edge-guided generation | 2.5 GB |
| IP-Adapter FaceID Plus v2 | Character consistency | 3 GB |
| IP-Adapter Flux | Style transfer | 3.5 GB |

---

## Agent Decision Trees

### Model Selection Tree

```
User Request
│
├── Is output VIDEO?
│   │
│   ├── YES
│   │   │
│   │   ├── Needs audio sync / lip-sync / dialogue?
│   │   │   └── YES → LTX-2 19B (fp8)
│   │   │
│   │   ├── Needs complex physics / high-dynamic motion?
│   │   │   └── YES → Wan 2.6 (fp8)
│   │   │
│   │   ├── Needs highest cinematic quality?
│   │   │   └── YES → HunyuanVideo 1.5 (fp16)
│   │   │
│   │   └── General b-roll / background footage?
│   │       └── → Wan 2.6 (fp8) - faster
│   │
│   └── NO (IMAGE)
│       │
│       ├── Contains specific text / logos / UI elements?
│       │   └── YES → Qwen-Image-2512 (fp16)
│       │
│       ├── Photorealism / portraits / people?
│       │   └── YES → FLUX.2-dev (fp16)
│       │
│       ├── Fast iteration / drafts / batch generation?
│       │   └── YES → Z-Image-Turbo (fp16)
│       │
│       └── Artistic / stylized / general purpose?
│           └── → FLUX.2-dev (fp16)
```

### Resolution Selection Tree

```
Target Output
│
├── VIDEO
│   ├── Standard (16:9) → 1280×720 (720p sweet spot)
│   ├── Vertical (9:16) → 720×1280 (mobile-first)
│   └── Square (1:1) → 720×720
│
└── IMAGE
    ├── Standard → 1024×1024 (base)
    ├── Landscape → 1216×832 (optimal bucket)
    ├── Portrait → 832×1216
    ├── Ultra-wide → 1536×640
    │
    └── Can I go higher? (RTX 5090)
        └── YES → Up to 2048×2048 without tiling
```

### CFG Selection Tree

```
Model
│
├── FLUX.2-dev
│   └── Use FluxGuidance node (NOT cfg parameter)
│       ├── Standard: guidance = 3.5
│       ├── More adherence: guidance = 4.0
│       └── Creative freedom: guidance = 3.0
│
├── Qwen-Image-2512
│   └── Use ModelSamplingAuraFlow (shift = 3.1)
│       └── cfg = 3.0 (fixed, like Flux)
│
├── LTX-2 / Wan 2.6
│   ├── I2V (from image): cfg = 3.0
│   └── T2V (text only): cfg = 5.0
│
└── HunyuanVideo
    └── cfg = 6.0
```

---

## Model-Specific Prompting Methodology

### The Prompt Style Matrix

| Model | Style | Key Principle |
|-------|-------|---------------|
| FLUX.2-dev | **Descriptive** | Describe what you SEE |
| Qwen-Image | **Instructional** | Give layout COMMANDS |
| Video (all) | **Motion** | Describe CHANGE, not state |

### FLUX.2 Prompting (Descriptive Style)

FLUX.2 responds best to natural language descriptions of the visual field.

**Template:** `[Subject] [Action/Context] [Lighting] [Style]`

```python
# GOOD - Descriptive, natural language
prompt = """
A close-up photograph of an elderly woman with deep wrinkles,
silver hair catching the light, natural window lighting from the left,
shot on 35mm Kodak Portra 400 film, soft bokeh background.
"""

# BAD - Tag-based (works but suboptimal)
prompt = "elderly woman, wrinkles, silver hair, portrait, 35mm, bokeh"
```

**FLUX.2 Negative Prompt Template:**
```python
negative = "blurry, low quality, distorted, watermark, text, logo, oversaturated"
```

### Qwen-Image Prompting (Instructional Style)

Qwen responds to explicit layout instructions - it can understand spatial relationships.

**Template:** `[Design Type]. [Element 1 at Position]. [Element 2 at Position]. [Style]`

```python
# GOOD - Instructional with positions
prompt = """
Design a movie poster.
Title 'MIDNIGHT' at the top center, bold white font with blue glow.
Silhouette of a detective in the middle, noir style.
City skyline at the bottom, dark gradient.
Overall style: minimalist, noir, dark blue and black palette.
"""

# BAD - Vague description
prompt = "A movie poster for Midnight with a detective and city skyline"
```

**Qwen-Image Negative Prompt Template:**
```python
negative = "blurry, distorted text, misspelled, low quality, watermark, ugly, cropped"
```

### Video Prompting (Motion Style)

**Critical Rule:** For video, describe the **DELTA** (change), NOT the static state.

```python
# WRONG - Describing static appearance
bad_prompt = "A red dragon with scales and wings breathing fire in a cave"

# CORRECT - Describing motion and change
good_prompt = """
The dragon turns its head slowly toward the camera,
opens its massive jaws revealing glowing embers,
flames erupt forward with volumetric fire and smoke,
camera pulls back to reveal the full creature.
"""
```

**Video Motion Prompt Template:**
```python
def build_video_prompt(motion: str, camera: str = "", atmosphere: str = "") -> str:
    """
    Build motion-focused video prompt.

    Do NOT describe subject appearance - that comes from input image.
    Only describe CHANGES: movement, camera, lighting shifts.
    """
    parts = [motion]
    if camera:
        parts.append(f"Camera: {camera}")
    if atmosphere:
        parts.append(f"Atmosphere: {atmosphere}")
    return ", ".join(parts)

# Usage
prompt = build_video_prompt(
    motion="the figure walks forward slowly, fabric flowing in the wind",
    camera="slow dolly forward, slight low angle",
    atmosphere="dust particles catching golden hour light"
)
```

### Prompt Building Helper Functions

```python
def build_image_prompt(
    subject: str,
    context: str,
    style: str,
    model: str = "flux2"
) -> dict:
    """Build model-optimized image prompt."""

    if model == "qwen":
        # Qwen: Instructional style
        prompt = f"{subject}. {context}. Style: {style}."
        negative = "blurry, distorted text, misspelled, low quality"
    else:
        # FLUX.2: Descriptive style
        prompt = f"{subject}, {context}, {style}, highly detailed, sharp focus"
        negative = "blurry, low quality, distorted, watermark, text, logo"

    return {"prompt": prompt, "negative": negative}


def build_video_motion_prompt(
    action: str,
    camera_movement: str = None,
    duration_hint: str = None
) -> str:
    """
    Build video prompt focused on motion.

    Args:
        action: The motion/change happening
        camera_movement: Camera motion (pan, dolly, zoom, etc.)
        duration_hint: Pacing hint (slowly, rapidly, gradually)
    """
    parts = []

    if duration_hint:
        parts.append(f"{action} {duration_hint}")
    else:
        parts.append(action)

    if camera_movement:
        parts.append(f"camera {camera_movement}")

    return ", ".join(parts)
```

---

## Workflow Pattern Library

### Pattern A: "The Director" (Text → Image → Audio-Reactive Video)

**Goal:** Create a narrated scene with perfect text/signage.

```python
async def director_pipeline(
    scene_description: str,
    audio_path: str,
    output_dir: Path
):
    """
    Stage 1: Qwen generates image with text
    Stage 2: External audio (TTS or music)
    Stage 3: LTX-2 creates audio-reactive video
    """
    client = ComfyUIClient()

    # Stage 1: Generate image with text using Qwen
    image_workflow = create_workflow_from_template("qwen_poster_design", {
        "PROMPT": f"Design a scene: {scene_description}",
        "WIDTH": 1280,
        "HEIGHT": 720,
        "SEED": 42
    })
    result = await client.run_workflow(image_workflow)
    image_path = extract_output_path(result)

    # CRITICAL: Unload Qwen before LTX-2
    await client.free_memory(unload_models=True)
    await asyncio.sleep(2)

    # Stage 2: Audio is provided externally
    # (Could be TTS, music file, or voice recording)

    # Stage 3: LTX-2 audio-reactive video
    video_workflow = create_workflow_from_template("ltx2_audio_reactive", {
        "IMAGE_PATH": image_path,
        "AUDIO_PATH": audio_path,
        "PROMPT": "the scene comes alive, subtle motion matching the audio rhythm",
        "FRAMES": 121,
        "SEED": 42
    })
    result = await client.run_workflow(video_workflow)

    return extract_output_path(result)
```

### Pattern B: "The Upscaler" (Draft → Upscale → Refine)

**Goal:** 4K highly detailed output with fast iteration.

```python
async def upscaler_pipeline(
    prompt: str,
    output_dir: Path,
    target_resolution: int = 2048
):
    """
    Stage 1: Fast draft with FLUX.2 (fp8)
    Stage 2: Model-based upscale
    Stage 3: Refinement pass with FLUX.2 (fp16)
    """
    client = ComfyUIClient()

    # Stage 1: Fast draft (fp8 for speed)
    draft_workflow = create_workflow_from_template("flux2_txt2img", {
        "PROMPT": prompt,
        "WIDTH": 1024,
        "HEIGHT": 1024,
        "SEED": 42
    })
    # Override to fp8 for speed
    draft_workflow["1"]["inputs"]["weight_dtype"] = "fp8_e4m3fn"

    result = await client.run_workflow(draft_workflow)
    draft_path = extract_output_path(result)

    # Stage 2: Upscale 2x
    upscale_workflow = create_workflow_from_template("upscale_2x", {
        "IMAGE_PATH": draft_path,
        "UPSCALE_MODEL": "4x-UltraSharp.pth"
    })
    result = await client.run_workflow(upscale_workflow)
    upscaled_path = extract_output_path(result)

    # Stage 3: Refine with FLUX.2 (fp16 for quality)
    refine_workflow = create_workflow_from_template("flux2_img2img", {
        "IMAGE_PATH": upscaled_path,
        "PROMPT": f"{prompt}, hyper-detailed, 4k texture, sharp",
        "DENOISE": 0.35,  # CRITICAL: Low denoise preserves details
        "SEED": 42
    })
    result = await client.run_workflow(refine_workflow)

    return extract_output_path(result)
```

### Pattern C: "The Animator" (Reference → Style Transfer → Video)

**Goal:** Transform a reference image into a new style, then animate it.

```python
async def animator_pipeline(
    reference_image: Path,
    style_prompt: str,
    motion_prompt: str,
    output_dir: Path
):
    """
    Stage 1: Qwen + ControlNet for style transfer
    Stage 2: Wan 2.6 for high-motion video
    """
    client = ComfyUIClient()

    # Upload reference image
    uploaded_ref = await client.upload_image(reference_image)

    # Stage 1: Style transfer with Qwen ControlNet
    style_workflow = create_workflow_from_template("qwen_controlnet_canny", {
        "IMAGE_PATH": uploaded_ref,
        "PROMPT": style_prompt,
        "CONTROL_STRENGTH": 0.85,
        "WIDTH": 1280,
        "HEIGHT": 720,
        "SEED": 42
    })
    result = await client.run_workflow(style_workflow)
    styled_path = extract_output_path(result)

    # CRITICAL: Unload image model
    await client.free_memory(unload_models=True)
    await asyncio.sleep(2)

    # Upload styled image for video stage
    uploaded_styled = await client.upload_image(styled_path)

    # Stage 2: Animate with Wan 2.6
    video_workflow = create_workflow_from_template("wan26_img2vid", {
        "IMAGE_PATH": uploaded_styled,
        "PROMPT": motion_prompt,  # Motion only!
        "FRAMES": 121,
        "SEED": 42
    })
    result = await client.run_workflow(video_workflow)

    return extract_output_path(result)
```

### Pattern D: "The Iterator" (Generate → Evaluate → Refine)

**Goal:** Quality iteration loop with parameter optimization.

```python
async def iterator_pipeline(
    prompt: str,
    target_quality: str = "high",
    max_iterations: int = 5
):
    """
    Iteration loop:
    1. Generate initial image
    2. Evaluate quality (VLM or human)
    3. Adjust parameters and regenerate
    4. Repeat until satisfied
    """
    client = ComfyUIClient()

    # Initial parameters
    cfg = 3.5
    seed = 42

    for i in range(max_iterations):
        # Generate
        workflow = create_workflow_from_template("flux2_txt2img", {
            "PROMPT": prompt,
            "SEED": seed,
            "WIDTH": 1024,
            "HEIGHT": 1024
        })
        # Apply current CFG
        workflow["7"]["inputs"]["guidance"] = cfg

        result = await client.run_workflow(workflow)
        asset_id = result["outputs"][0]["asset_id"]

        # View and evaluate
        info = await client.view_output(asset_id)
        print(f"Iteration {i+1}: CFG={cfg}, Seed={seed}")
        print(f"Preview: {info['url']}")

        # Quality check (could be VLM-based)
        quality_score = await evaluate_quality(asset_id)

        if quality_score >= 0.9:
            print("Quality target met!")
            return await client.publish_asset(asset_id, target_filename="final.png")

        # Adjust parameters for next iteration
        if quality_score < 0.5:
            # Low quality - try different seed
            seed = None  # Random new seed
        elif quality_score < 0.7:
            # Medium quality - increase CFG
            cfg = min(cfg + 0.5, 5.0)
        else:
            # Good quality - small tweaks
            cfg = cfg + 0.2
            seed = seed + 1

    # Return best attempt
    return await client.publish_asset(asset_id, target_filename="final.png")
```

---

## Programmatic Quality Assurance (VLM-Based)

Before returning generated outputs to users, agents should validate quality using Vision Language Models (VLMs). The MassMediaFactory MCP provides `qa_output()` for automated quality checks.

### VLM QA Setup

**Requirements:**
```bash
# Install Ollama and pull a VLM
ollama pull qwen2.5-vl:7b
```

**Check VLM Availability:**
```python
# MCP Tool
result = check_vlm_available(model="qwen2.5-vl:7b")
# → {"available": true, "model": "qwen2.5-vl:7b"}
```

### QA Checks Available

| Check | What It Detects |
|-------|-----------------|
| `prompt_match` | Does image match the original prompt? |
| `artifacts` | Visual artifacts, distortions, blur? |
| `faces` | Face/hand issues (extra fingers, asymmetry)? |
| `text` | Text rendering issues (misspelled, distorted)? |
| `composition` | Overall composition quality? |

### Automated QA Workflow

```python
async def generate_with_qa(
    workflow: dict,
    prompt: str,
    quality_threshold: float = 0.7,
    max_retries: int = 3
) -> dict:
    """
    Generate output with automatic quality validation.
    Retries with different seed if quality is below threshold.
    """
    for attempt in range(max_retries):
        # Generate
        result = await execute_workflow(workflow)
        output = await wait_for_completion(result["prompt_id"])
        asset_id = output["outputs"][0]["asset_id"]

        # QA Check
        qa_result = await qa_output(
            asset_id=asset_id,
            prompt=prompt,
            checks=["prompt_match", "artifacts", "faces"]
        )

        # Evaluate
        if qa_result["overall_score"] >= quality_threshold:
            return {
                "asset_id": asset_id,
                "qa_score": qa_result["overall_score"],
                "qa_details": qa_result["checks"],
                "attempts": attempt + 1
            }

        # Log failure reason
        failed_checks = [
            check for check, score in qa_result["checks"].items()
            if score < quality_threshold
        ]
        print(f"Attempt {attempt + 1} failed: {failed_checks}")

        # Retry with new seed
        workflow = inject_parameters(workflow, {"SEED": None})

    # Return best attempt with warning
    return {
        "asset_id": asset_id,
        "qa_score": qa_result["overall_score"],
        "warning": "Quality threshold not met after max retries"
    }
```

### QA Decision Tree

```
Generated Output
│
├── Run qa_output(checks=["prompt_match", "artifacts"])
│
├── overall_score >= 0.8?
│   └── YES → Return to user ✓
│
├── overall_score >= 0.5?
│   ├── prompt_match failed?
│   │   └── Regenerate with refined prompt
│   ├── artifacts failed?
│   │   └── Regenerate with higher steps / different seed
│   └── faces failed?
│       └── Regenerate with negative prompt: "extra fingers, asymmetrical"
│
└── overall_score < 0.5?
    └── Log error, notify user, suggest manual review
```

### MCP Tool Reference

```python
# Run QA on generated asset
qa_result = qa_output(
    asset_id="abc-123-def",
    prompt="a majestic dragon breathing fire",
    checks=["prompt_match", "artifacts", "faces", "composition"]
)

# Response format
{
    "asset_id": "abc-123-def",
    "overall_score": 0.85,
    "checks": {
        "prompt_match": 0.9,
        "artifacts": 0.8,
        "faces": 0.85,
        "composition": 0.85
    },
    "feedback": "Image matches prompt well. Minor artifacts in background.",
    "model": "qwen2.5-vl:7b"
}
```

---

## Text-Based Editing (Inpainting)

**The Agent's Mask Problem:** Agents cannot "click" or "draw" masks like humans can in a GUI. The solution is **text-based segmentation** using CLIPSeg, GroundingDINO, or Segment Anything Model (SAM).

### Mental Model for Agents

```
To edit a specific object in an image:
1. Describe the object textually → CLIPSeg generates a mask
2. Feed image + mask to VAEEncodeForInpaint
3. Describe replacement → standard diffusion process
```

### Segmentation Node Options

| Node | Best For | Precision | Speed |
|------|----------|-----------|-------|
| **CLIPSeg** | General objects, simple descriptions | Medium | Fast |
| **GroundingDINO** | Precise object detection, multiple instances | High | Medium |
| **SAM (Segment Anything)** | Complex shapes, fine edges | Highest | Slow |

### Template: `flux2_edit_by_text.json`

**Use Case:** Replace DALL-E's "Select & Edit" functionality

**Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `IMAGE_PATH` | Path to image to edit | `"input/photo.png"` |
| `SELECT_TEXT` | Text description of object to select | `"the red car"` |
| `REPLACE_PROMPT` | What the selected area should become | `"a blue sports car"` |
| `DENOISE` | 0.7-0.9 for major changes, 0.3-0.5 for subtle | `0.85` |

**Example Usage:**

```python
# Change a person's shirt color
workflow = load_template("flux2_edit_by_text")
workflow = inject_parameters(workflow, {
    "IMAGE_PATH": "input/portrait.png",
    "SELECT_TEXT": "the person's shirt",
    "REPLACE_PROMPT": "wearing a bright red silk shirt, same lighting and pose",
    "DENOISE": 0.75
})
result = await execute_workflow(workflow)
```

### Segmentation Tips for Agents

1. **Be specific:** "the cat on the left" not just "cat"
2. **Use relationships:** "the object behind the person"
3. **Include color/size:** "the large blue vase"
4. **For faces:** Use FaceDetailer node instead (better quality)

### When CLIPSeg Fails

If CLIPSeg generates a poor mask:

```
Poor Mask Detected?
│
├── Object too small → Use GroundingDINO with box output
├── Multiple instances → Add "leftmost" / "largest" to description
├── Complex shape → Use SAM with point prompts
└── Text/Logo → Use binary threshold on grayscale
```

---

## Auto-Refiner Quality Loop

**Pattern:** Generate → VLM Check → Auto-Fix → Return

Instead of just checking quality, the agent should automatically *fix* common issues using specialized nodes.

### Auto-Fixer Decision Tree

```
VLM QA Result
│
├── "Face issues detected" (score < 0.7)
│   └── ACTION: Run FaceDetailer workflow
│       ├── Input: Generated image
│       ├── Auto-mask: Face detection (no text needed)
│       ├── Denoise: 0.3 (subtle refinement)
│       └── Output: Fixed face, rest unchanged
│
├── "Hand/finger issues detected" (score < 0.6)
│   └── ACTION: Run Inpaint with hand fix
│       ├── SELECT_TEXT: "person's hands"
│       ├── REPLACE_PROMPT: "{original_prompt}, anatomically correct hands"
│       └── Denoise: 0.5
│
├── "Artifacts/blur in background" (score < 0.7)
│   └── ACTION: Run Inpaint with low denoise
│       ├── SELECT_TEXT: "blurry background area"
│       ├── REPLACE_PROMPT: "{original_prompt} background"
│       └── Denoise: 0.4
│
└── "Text rendering issues" (score < 0.6)
    └── ACTION: Regenerate with Qwen-Image
        └── Qwen has superior text rendering
```

### FaceDetailer Workflow Pattern

```python
async def auto_fix_face(asset_id: str, original_prompt: str) -> str:
    """Automatically fix face issues using FaceDetailer."""

    # FaceDetailer auto-detects and masks faces
    workflow = {
        "1": {"class_type": "LoadImage", "inputs": {"image": asset_id}},
        "2": {
            "class_type": "FaceDetailer",
            "inputs": {
                "image": ["1", 0],
                "model": ["3", 0],  # Same model as original
                "clip": ["4", 0],
                "vae": ["5", 0],
                "positive": ["6", 0],  # Original prompt
                "negative": ["7", 0],
                "denoise": 0.3,  # Low denoise for refinement
                "feather": 5,
                "force_inpaint": True
            }
        },
        # ... model loaders ...
    }

    result = await execute_workflow(workflow)
    return result["outputs"][0]["asset_id"]
```

### Complete Auto-Refiner Loop

```python
async def generate_with_auto_refine(
    workflow: dict,
    prompt: str,
    max_refinements: int = 2
) -> dict:
    """Generate with automatic quality refinement."""

    result = await execute_workflow(workflow)
    asset_id = result["outputs"][0]["asset_id"]

    for i in range(max_refinements):
        # Run QA
        qa = await qa_output(
            asset_id=asset_id,
            prompt=prompt,
            checks=["faces", "artifacts", "prompt_match"]
        )

        if qa["overall_score"] >= 0.85:
            return {"asset_id": asset_id, "qa": qa, "refinements": i}

        # Auto-fix based on lowest scoring check
        lowest_check = min(qa["checks"], key=qa["checks"].get)

        if lowest_check == "faces" and qa["checks"]["faces"] < 0.7:
            asset_id = await auto_fix_face(asset_id, prompt)
        elif lowest_check == "artifacts":
            # Regenerate with higher steps
            workflow = inject_parameters(workflow, {"STEPS": 30, "SEED": None})
            result = await execute_workflow(workflow)
            asset_id = result["outputs"][0]["asset_id"]
        else:
            # General retry with new seed
            workflow = inject_parameters(workflow, {"SEED": None})
            result = await execute_workflow(workflow)
            asset_id = result["outputs"][0]["asset_id"]

    return {"asset_id": asset_id, "qa": qa, "refinements": max_refinements}
```

---

## LoRA Style Library

**The Agent's Style Problem:** Midjourney handles styles via keywords (`--style raw`, `--niji`). ComfyUI needs specific LoRA files and trigger words.

### Style Mapping Table

| User Intent | LoRA Filename | Trigger Word | Strength | Best Model |
|-------------|---------------|--------------|----------|------------|
| **Anime** | `anime_style_xl.safetensors` | `anime style` | 0.8 | FLUX.2 |
| **Anime (Detailed)** | `animetarot_v2.safetensors` | `detailed anime` | 0.7 | FLUX.2 |
| **Photorealistic** | `add_detail_xl.safetensors` | `detailed` | 0.5 | FLUX.2 |
| **Cinematic** | `cinematic_xl.safetensors` | `cinematic lighting` | 0.7 | FLUX.2 |
| **Oil Painting** | `oil_painting_xl.safetensors` | `oil painting style` | 0.8 | FLUX.2 |
| **Watercolor** | `watercolor_v3.safetensors` | `watercolor painting` | 0.75 | FLUX.2 |
| **3D Render** | `3d_render_style.safetensors` | `3d render` | 0.7 | FLUX.2 |
| **Pixel Art** | `pixel_art_xl.safetensors` | `pixel art` | 0.9 | FLUX.2 |
| **Claymation** | `claymation_style.safetensors` | `claymation style` | 0.85 | FLUX.2 |
| **Vintage Photo** | `vintage_film.safetensors` | `vintage photograph` | 0.6 | FLUX.2 |
| **Line Art** | `lineart_xl.safetensors` | `line art, lineart` | 0.8 | FLUX.2 |
| **Sticker** | `sticker_style.safetensors` | `sticker design` | 0.9 | Qwen |
| **Logo** | `logo_design_xl.safetensors` | `logo design` | 0.8 | Qwen |
| **Fashion** | `fashion_photography.safetensors` | `fashion photo` | 0.6 | FLUX.2 |
| **Architecture** | `architectural_render.safetensors` | `architectural` | 0.7 | FLUX.2 |

### LoRA Application Pattern

```python
def apply_style_lora(workflow: dict, style: str) -> dict:
    """Apply style LoRA based on user intent."""

    LORA_MAPPING = {
        "anime": {
            "file": "anime_style_xl.safetensors",
            "trigger": "anime style",
            "strength": 0.8
        },
        "cinematic": {
            "file": "cinematic_xl.safetensors",
            "trigger": "cinematic lighting",
            "strength": 0.7
        },
        # ... more mappings
    }

    if style.lower() not in LORA_MAPPING:
        return workflow  # No LoRA needed

    lora = LORA_MAPPING[style.lower()]

    # Insert LoRA loader after model loader
    workflow["lora_1"] = {
        "class_type": "LoraLoader",
        "inputs": {
            "model": ["1", 0],  # From model loader
            "clip": ["2", 0],   # From CLIP loader
            "lora_name": lora["file"],
            "strength_model": lora["strength"],
            "strength_clip": lora["strength"]
        }
    }

    # Update downstream connections to use LoRA output
    # ... connection updates ...

    # Add trigger word to prompt
    prompt_node = find_prompt_node(workflow)
    original_prompt = workflow[prompt_node]["inputs"]["text"]
    workflow[prompt_node]["inputs"]["text"] = f"{lora['trigger']}, {original_prompt}"

    return workflow
```

### Style Detection from User Request

```python
def detect_requested_style(user_prompt: str) -> str | None:
    """Extract style intent from natural language request."""

    STYLE_KEYWORDS = {
        "anime": ["anime", "manga", "japanese animation"],
        "cinematic": ["cinematic", "movie", "film", "dramatic lighting"],
        "oil_painting": ["oil painting", "painted", "artistic"],
        "watercolor": ["watercolor", "watercolour", "aquarelle"],
        "3d_render": ["3d", "render", "blender", "octane"],
        "pixel_art": ["pixel", "8-bit", "retro game"],
        "claymation": ["clay", "stop motion", "claymation"],
        "vintage": ["vintage", "retro", "old photo", "film grain"],
    }

    prompt_lower = user_prompt.lower()

    for style, keywords in STYLE_KEYWORDS.items():
        if any(kw in prompt_lower for kw in keywords):
            return style

    return None
```

### Multi-LoRA Stacking

For complex styles, stack multiple LoRAs:

```python
# Anime + Cinematic = Dramatic Anime
workflow = apply_style_lora(workflow, "anime")      # Primary style
workflow = apply_style_lora(workflow, "cinematic")  # Secondary (lower strength)

# Adjust secondary LoRA strength
workflow["lora_2"]["inputs"]["strength_model"] = 0.4
workflow["lora_2"]["inputs"]["strength_clip"] = 0.4
```

---

## Audio & Speech Generation

**Replaces:** ElevenLabs TTS ($5-330/month)

ComfyUI supports text-to-speech (TTS) and voice cloning through custom nodes like F5-TTS and Kokoro-82M. This enables complete audio-visual pipelines without cloud API dependencies.

### TTS Model Options

| Model | Quality | Speed | Voice Cloning | VRAM |
|-------|---------|-------|---------------|------|
| **F5-TTS** | Excellent | Medium | Yes | ~4GB |
| **Kokoro-82M** | Good | Fast | No | ~1GB |
| **ChatTTS** | Good | Fast | Limited | ~2GB |

### Installation

```bash
# Via ComfyUI Manager
1. Open ComfyUI Manager
2. Search: "F5-TTS" or "Kokoro"
3. Install and restart ComfyUI
```

### Templates Available

| Template | Use Case |
|----------|----------|
| `audio_tts_f5.json` | Basic TTS (text to speech) |
| `audio_tts_voice_clone.json` | Clone voice from reference audio |

### Audio-Video Sync Formula

**Critical for LTX-2 and video pipelines:**

```
video_frames = audio_duration_seconds × fps

Example:
- Audio: 5.5 seconds
- Target FPS: 24
- Required frames: 5.5 × 24 = 132 frames
```

### TTS → Video Pipeline Pattern

```python
async def talking_head_pipeline(
    portrait_image: str,
    text_to_speak: str,
    reference_voice: str = None
) -> str:
    """Generate talking head video from portrait + text."""

    # Stage 1: Generate audio
    if reference_voice:
        tts_workflow = load_template("audio_tts_voice_clone")
        tts_workflow = inject_parameters(tts_workflow, {
            "TEXT": text_to_speak,
            "REFERENCE_AUDIO": reference_voice,
            "REFERENCE_TEXT": "...",  # Transcript of reference
        })
    else:
        tts_workflow = load_template("audio_tts_f5")
        tts_workflow = inject_parameters(tts_workflow, {
            "TEXT": text_to_speak
        })

    tts_result = await execute_workflow(tts_workflow)
    audio_path = tts_result["outputs"][0]["path"]
    audio_duration = tts_result["metadata"]["duration_seconds"]

    # Stage 2: Calculate video frames
    fps = 24
    required_frames = int(audio_duration * fps) + 1

    # Stage 3: Generate lip-synced video with LTX-2
    video_workflow = load_template("ltx2_audio_reactive")
    video_workflow = inject_parameters(video_workflow, {
        "IMAGE_PATH": portrait_image,
        "AUDIO_PATH": audio_path,
        "FRAMES": required_frames,
        "PROMPT": "speaking naturally, subtle head movements, lip sync"
    })

    video_result = await execute_workflow(video_workflow)
    return video_result["outputs"][0]["asset_id"]
```

### Voice Cloning Best Practices

1. **Reference audio length:** 3-10 seconds (sweet spot: 5-7 seconds)
2. **Audio quality:** Clear speech, no background noise, consistent volume
3. **Reference text:** Must exactly match what's spoken in reference
4. **Generated text:** Similar style/length to reference works best

### Quality Checklist

```
TTS Generation Checklist
│
├── Reference audio clean? (no music, no noise)
├── Reference text matches audio exactly?
├── Generated text appropriate length? (< 500 chars)
└── Speed setting reasonable? (0.8-1.2 typical)

If quality poor:
├── Try different seed
├── Reduce text length
├── Use cleaner reference audio
└── Switch to Kokoro for faster iteration
```

---

## Quick Reference Tables

### Checkpoint Output Slots

| Node | Slot 0 | Slot 1 | Slot 2 |
|------|--------|--------|--------|
| CheckpointLoaderSimple | MODEL | CLIP | VAE |
| UNETLoader | MODEL | - | - |
| DualCLIPLoader | CLIP | - | - |
| VAELoader | VAE | - | - |
| LTXVLoader | MODEL | CLIP | VAE |

### Sampler Compatibility (January 2026)

| Model | Recommended Sampler | Scheduler | Steps | CFG/Guidance |
|-------|---------------------|-----------|-------|--------------|
| FLUX.2 | euler | simple | 20 | FluxGuidance: 3.5 |
| Qwen | euler | simple | 25 | cfg: 3.0 (AuraFlow shift: 3.1) |
| LTX-2 | euler | LTXVScheduler | 20 | cfg: 3.0 |
| Wan 2.6 | euler | WanVideoScheduler | 30 | cfg: 5.0 |
| HunyuanVideo | dpmpp_2m | karras | 30 | cfg: 6.0 |

### Resolution Guide (RTX 5090 Optimized)

| Model | Native | Max (32GB) | Aspect Ratios |
|-------|--------|------------|---------------|
| FLUX.2 | 1024×1024 | 2048×2048 | 1:1, 16:9, 9:16 |
| Qwen | 1296×1296 | 2512×2512 | Flexible |
| LTX-2 | 1280×720 | 1920×1080 | 16:9, 9:16 |
| Wan 2.6 | 848×480 | 1280×720 | 16:9 |

### RTX 5090 VRAM Quick Reference

| Model | fp16 VRAM | fp8 VRAM | Recommendation |
|-------|-----------|----------|----------------|
| FLUX.2-dev | 24 GB | 12 GB | **Use fp16** |
| Qwen-Image | 14 GB | 7 GB | **Use fp16** |
| LTX-2 19B | 38 GB ⚠️ | 19 GB | **MUST use fp8** |
| Wan 2.6 | 32 GB | 16 GB | **Use fp8** |
| HunyuanVideo | 24 GB | 12 GB | **Use fp16** |

---

*Document Version: 4.0 | Last Updated: January 2026 | Optimized for RTX 5090 + Claude Code Opus 4.5*

**Related Documentation:**
- [MASSMEDIAFACTORY_MCP.md](./MASSMEDIAFACTORY_MCP.md) - **MCP Server for asset iteration & publishing**
- [Get_Started_ComfyUI.md](./Get_Started_ComfyUI.md) - Core concepts and node reference
- [LTX Video Guide](../ltx/Get_Started_LTX.md) - Video generation specifics
- [Qwen Image Guide](../qwen/Get_Started_Qwen_Image.md) - Photorealistic generation
