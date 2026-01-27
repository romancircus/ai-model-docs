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
9. [WebSocket Real-Time Monitoring](#websocket-real-time-monitoring)
10. [Complete Python Client](#complete-python-client)
11. [Workflow Recipe Library](#workflow-recipe-library)

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

## WebSocket Real-Time Monitoring

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
| `"Sizes must match"` | Latent/Image resolution mismatch | Add `ImageScale` or `LatentResize` node |
| `"Input undefined"` | Link points to non-existent node | Check node ID exists and has that slot |
| `"CUDA out of memory"` | VRAM exhausted | Call `/free`, reduce resolution, use tiled VAE |
| `"Model not found"` | Model file missing | Verify file in ComfyUI/models/ |
| `"Invalid prompt"` | Malformed JSON | Validate JSON structure |
| `"Connection refused"` | ComfyUI not running | Start server: `python main.py --highvram` |

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

## Quick Reference Tables

### Checkpoint Output Slots

| Node | Slot 0 | Slot 1 | Slot 2 |
|------|--------|--------|--------|
| CheckpointLoaderSimple | MODEL | CLIP | VAE |
| UNETLoader | MODEL | - | - |
| DualCLIPLoader | CLIP | - | - |
| VAELoader | VAE | - | - |

### Sampler Compatibility

| Model | Recommended Sampler | Scheduler | Steps |
|-------|---------------------|-----------|-------|
| SDXL | dpmpp_2m_sde | karras | 30-40 |
| Flux | euler | simple | 20-25 |
| Qwen | euler | simple | 25 |
| LTX | euler | custom (LTXVScheduler) | 20 |

### Resolution Guide

| Model | Recommended | Notes |
|-------|-------------|-------|
| SD 1.5 | 512×512 | Can stretch to 768 |
| SDXL | 1024×1024 | Best at 1:1 or 16:9 |
| Flux | 1024×1024 | Flexible, multiples of 16 |
| Qwen | 1296×1296 | Up to 2512×2512 |
| LTX-Video | 1280×720 | 720p or 1080p |

---

*Document Version: 3.0 | Last Updated: January 2026 | Optimized for Agent Orchestration*

**Related Documentation:**
- [Get_Started_ComfyUI.md](./Get_Started_ComfyUI.md) - Core concepts and node reference
- [LTX Video Guide](../ltx/Get_Started_LTX.md) - Video generation specifics
- [Qwen Image Guide](../qwen/Get_Started_Qwen_Image.md) - Photorealistic generation
