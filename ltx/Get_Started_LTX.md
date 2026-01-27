# LTX Video: Comprehensive AI Video Generation Guide

**Provider:** Lightricks (Open Source)
**Last Updated:** January 2026
**Version:** 2.1 (Local Deployment Focus)
**Purpose:** Complete guide for local AI video generation with ComfyUI and Python

---

## Table of Contents

1. [Overview](#overview)
2. [Local Deployment Options](#local-deployment-options)
3. [ComfyUI Integration](#comfyui-integration)
4. [Direct Python Usage](#direct-python-usage)
5. [Model Architecture](#model-architecture)
6. [Key Differentiators](#key-differentiators)
7. [The A.V.S. Prompting Framework](#the-avs-prompting-framework)
8. [Text-to-Video Generation](#text-to-video-generation)
9. [Image-to-Video Generation](#image-to-video-generation)
10. [Audio Pipeline Integration](#audio-pipeline-integration)
11. [LoRA Training](#lora-training)
12. [Comparison with Other Models](#comparison-with-other-models)
13. [Hardware Requirements](#hardware-requirements)
14. [Troubleshooting](#troubleshooting)
15. [LLM Agent Helper Functions](#llm-agent-helper-functions)

---

## Overview

LTX is Lightricks' **open-source video generation model** family, built on the Diffusion Transformer (DiT) architecture. This guide covers both the **current open-weight LTX-Video** and the **upcoming LTX-2** specifications.

### Model Versions

| Version | Parameters | Resolution | Audio | Status |
|---------|------------|------------|-------|--------|
| **LTX-Video (Current)** | ~2B | 768x512 (720p) | External pipeline | Available now |
| **LTX-2 (Roadmap)** | 19B | Up to 4K | Native sync | Enterprise/Future |

### Current LTX-Video Capabilities

| Feature | Specification |
|---------|---------------|
| **Resolution** | 768x512 native (720p equivalent) |
| **Frame Rate** | 24 FPS native |
| **Speed** | Near real-time on H100, fast on consumer GPUs |
| **Architecture** | Diffusion Transformer (DiT) |
| **Parameters** | ~2 billion |
| **Strengths** | High I2V adherence, temporal consistency |

### Future LTX-2 Capabilities (Enterprise/Roadmap)

| Feature | Specification |
|---------|---------------|
| **Resolution** | Up to 4K (2160p) |
| **Frame Rate** | Up to 50 FPS |
| **Duration** | Up to 20 seconds |
| **Audio** | Native synchronized audio generation |
| **Lip Sync** | Accurate lip synchronization |
| **Parameters** | 19 billion (14B video + 5B audio) |
| **Optimization** | NVFP8 quantized (~30% smaller, 2x faster) |

### Licensing

| Use Case | License |
|----------|---------|
| Academic research | Free |
| Commercial (< $10M ARR) | Free |
| Commercial (> $10M ARR) | Commercial license required |

---

## Local Deployment Options

### Decision Tree: How to Run LTX-Video Locally

```
START: How do you want to run LTX-Video?
│
├─► Visual workflow interface?
│   │
│   └─► ComfyUI ────────────────────► See "ComfyUI Integration" section
│
├─► Python scripting?
│   │
│   └─► diffusers library ──────────► See "Direct Python Usage" section
│
└─► Hardware check:
    │
    ├─► 24GB+ VRAM (RTX 4090, 5090)? ─► Full FP16, no quantization needed
    │
    ├─► 12-16GB VRAM? ─────────────────► FP8 quantization or offloading
    │
    └─► < 12GB VRAM? ──────────────────► CPU offloading required
```

### Deployment Comparison

| Method | Best For | Setup Complexity |
|--------|----------|------------------|
| **ComfyUI** | Visual workflows, chaining with other models | Medium |
| **diffusers (Python)** | Scripting, automation, custom pipelines | Low |
| **API (FAL.ai)** | No local GPU, quick prototyping | Lowest |

---

## ComfyUI Integration

**This is the recommended approach for visual workflows and chaining with other models.**

### Installation

```bash
# 1. Navigate to ComfyUI custom_nodes
cd ComfyUI/custom_nodes

# 2. Clone LTX-Video nodes
git clone https://github.com/Lightricks/ComfyUI-LTXVideo

# 3. Install dependencies
pip install -r ComfyUI-LTXVideo/requirements.txt

# 4. Download model (place in ComfyUI/models/checkpoints/)
# From: https://huggingface.co/Lightricks/LTX-Video
```

### Model Files

| File | Size | Location |
|------|------|----------|
| `ltx-video-2b-v0.9.safetensors` | ~4GB | `ComfyUI/models/checkpoints/` |
| `t5xxl_fp16.safetensors` | ~9GB | `ComfyUI/models/clip/` |

### Basic ComfyUI Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LTX-Video ComfyUI Workflow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [LTXVCheckpointLoader: ltx-video-2b-v0.9.safetensors]                     │
│          │                                                                  │
│          ├── MODEL ───────────────────────────────────────┐                │
│          │                                                 │                │
│          └── VAE ─────────────────────────────────────────┼───┐            │
│                                                            │   │            │
│  [CLIPTextEncode] ◄── "A woman walks through forest..."   │   │            │
│          │                                                 │   │            │
│          └── CONDITIONING ────────────────────────────────┤   │            │
│                                                            │   │            │
│  [LTXVEmptyLatent]                                        │   │            │
│          │                                                 │   │            │
│          ├── num_frames: 121 (5 seconds @ 24fps)          │   │            │
│          ├── width: 768                                   │   │            │
│          ├── height: 512                                  │   │            │
│          │                                                 │   │            │
│          └── LATENT ──────────────────────────────────────┤   │            │
│                                                            │   │            │
│                        ┌──────────────────────────────────┘   │            │
│                        ▼                                       │            │
│  [LTXVSampler] ◄───────────────────────────────────────────────┤            │
│          │                                                     │            │
│          ├── steps: 30                                        │            │
│          ├── cfg: 3.5                                         │            │
│          │                                                     │            │
│          └── LATENT ──────────────────────────────────────────┤            │
│                                                                │            │
│                        ┌───────────────────────────────────────┘            │
│                        ▼                                                    │
│  [LTXVDecode] ◄────────────────────────────────────────────────────────────┘
│          │                                                                  │
│          └── VIDEO ──► [VHS_VideoCombine: fps=24, format=mp4]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Image-to-Video (I2V) Workflow

```
[LoadImage] ──► [LTXVImageEncode] ──► [LTXVSampler] ──► [LTXVDecode] ──► [VHS_VideoCombine]
                      │                     ▲
                      │                     │
                      └── LATENT ───────────┘

Note: Prompt should describe MOTION, not the image content
```

### ComfyUI Parameters

| Node | Parameter | Range | Default | Notes |
|------|-----------|-------|---------|-------|
| LTXVEmptyLatent | num_frames | 25-241 | 121 | frames = seconds × 24 |
| LTXVEmptyLatent | width | 512-1024 | 768 | Must be divisible by 32 |
| LTXVEmptyLatent | height | 512-1024 | 512 | Must be divisible by 32 |
| LTXVSampler | steps | 20-50 | 30 | Higher = better quality |
| LTXVSampler | cfg | 1.0-7.0 | 3.5 | Prompt adherence |

### Official Lightricks I2V Workflow Settings (January 2026)

**Source:** [github.com/Lightricks/ComfyUI-LTXVideo/example_workflows](https://github.com/Lightricks/ComfyUI-LTXVideo/blob/master/example_workflows/)

| Parameter | T2V | I2V | Notes |
|-----------|-----|-----|-------|
| **sampler** | euler | **res_2s** | res_2s produces higher quality for I2V |
| **cfg** | 3.0-3.5 | **4.0** | Higher CFG for better motion in I2V |
| **steps** | 20-30 | **25** | Balanced quality/speed |
| **strength** | N/A | **0.6** | I2V identity preservation (0.5-0.7) |
| **scheduler** | LTXVScheduler | LTXVScheduler | Same for both |

**Key I2V Differences:**
- Use `res_2s` sampler instead of euler for better motion quality
- CFG 4.0 (not 3.0) to strengthen prompt adherence and increase visible motion
- Prompt should describe **motion only**, NOT the image content (the image is the visual anchor)

---

## Direct Python Usage

**For scripting, automation, and custom pipelines.**

### Installation

```bash
pip install diffusers transformers accelerate torch
```

### Text-to-Video Example

```python
import torch
from diffusers import LTXPipeline
from diffusers.utils import export_to_video

# Load model (first run downloads ~13GB)
pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")

# Enable memory optimizations for < 24GB VRAM
# pipe.enable_model_cpu_offload()  # Uncomment if needed

# Generate video
video_frames = pipe(
    prompt="A woman walks through a sunlit forest, tracking shot, cinematic",
    negative_prompt="blurry, low quality, distorted",
    num_frames=121,           # 5 seconds at 24fps
    num_inference_steps=30,
    guidance_scale=3.5,
    generator=torch.Generator("cuda").manual_seed(42)
).frames[0]

# Save as MP4
export_to_video(video_frames, "output.mp4", fps=24)
```

### Image-to-Video Example

```python
import torch
from diffusers import LTXImageToVideoPipeline
from diffusers.utils import export_to_video, load_image

# Load I2V pipeline
pipe = LTXImageToVideoPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")

# Load starting image
image = load_image("first_frame.png")

# Generate video from image
video_frames = pipe(
    image=image,
    prompt="The woman turns and smiles, gentle breeze moves her hair",
    num_frames=121,
    num_inference_steps=30,
    guidance_scale=3.5
).frames[0]

export_to_video(video_frames, "output.mp4", fps=24)
```

### Memory Optimization for Different VRAM

```python
# For 24GB+ VRAM (RTX 4090, 5090): No optimization needed
pipe = LTXPipeline.from_pretrained(..., torch_dtype=torch.bfloat16).to("cuda")

# For 16GB VRAM: Enable sequential CPU offload
pipe = LTXPipeline.from_pretrained(..., torch_dtype=torch.bfloat16)
pipe.enable_sequential_cpu_offload()

# For 12GB VRAM: Enable model CPU offload + attention slicing
pipe = LTXPipeline.from_pretrained(..., torch_dtype=torch.float16)
pipe.enable_model_cpu_offload()
pipe.enable_attention_slicing()

# For < 12GB VRAM: Not recommended, very slow
```

---

## Model Architecture

LTX-2 uses a **Diffusion Transformer (DiT)** architecture with separate video and audio components that are trained jointly for synchronization.

```
┌─────────────────────────────────────────────────────────────────┐
│                     LTX-2 Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 TEXT/IMAGE INPUT                          │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VIDEO TRANSFORMER (14B)                      │  │
│  │         Generates visual frames + motion                  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AUDIO TRANSFORMER (5B)                       │  │
│  │     Generates synchronized audio from video features      │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SYNCHRONIZED OUTPUT                          │  │
│  │              Video + Audio merged                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Differentiators

### LTX-2's Unique Value Proposition

| Feature | LTX-2 | Kling | Veo | SVD |
|---------|-------|-------|-----|-----|
| **Native Audio Generation** | Yes | No | Limited | No |
| **Lip Sync** | Built-in | Requires external | Limited | No |
| **Open Weights** | Yes | No | No | Yes |
| **4K Output** | Yes | Yes | Yes | No |
| **Max Duration** | 20s | 10s | 10s | 4s |
| **Local Deployment** | Consumer GPU | No | No | Yes |

### Critical Knowledge for LLM Agents

1. **Current vs Future**: LTX-Video (2B) is available now. LTX-2 (19B with native audio) is enterprise/roadmap.

2. **Audio Requires Pipeline (Current)**: The open-weight LTX-Video is visual-only. Use MMAudio/F5-TTS for audio.

3. **I2V Excellence**: LTX-Video has excellent image-to-video adherence - its strongest current capability.

4. **Open Source Advantage**: LTX can be fine-tuned with custom LoRAs for specific styles/characters.

5. **Speed**: LTX-Video is extremely fast - often faster than real-time on H100s.

---

## Hardware Requirements

### VRAM Requirements

| Configuration | VRAM | Performance | Notes |
|---------------|------|-------------|-------|
| **Full FP16** | 24GB+ | ✅ Fast | RTX 4090, 5090, A100 |
| **BF16 + Offload** | 16GB | Good | RTX 4080, 4070 Ti |
| **FP16 + Full Offload** | 12GB | Slow | RTX 3080, 4070 |
| **CPU Offload** | < 12GB | Very Slow | Not recommended |

### Your Hardware: RTX 5090 32GB

```
╔════════════════════════════════════════════════════════════════════════════════╗
║  RTX 5090 32GB - OPTIMAL FOR LTX-VIDEO                                         ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  ✅ Full BF16 inference - no quantization needed                               ║
║  ✅ Longer videos (more frames without VRAM issues)                            ║
║  ✅ Higher batch sizes for experimentation                                     ║
║  ✅ Can run LTX + upscaler in same session                                     ║
║  ✅ LoRA training possible with this VRAM                                      ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### Recommended Settings by VRAM

| VRAM | torch_dtype | Offload | Max Frames |
|------|-------------|---------|------------|
| 32GB | bfloat16 | None | 241+ |
| 24GB | bfloat16 | None | 200+ |
| 16GB | bfloat16 | Sequential | 121 |
| 12GB | float16 | Model | 60-80 |

---

## The A.V.S. Prompting Framework

For LTX-2, use the **A.V.S.** (Audio-Visual-Scene) framework to structure prompts that leverage native audio generation:

### A - Audio (What should be heard?)

```javascript
// Audio elements to describe
const audioComponents = {
  dialogue: "A woman says 'Welcome to the show!'",
  ambient: "Birds chirping, distant traffic",
  music: "Upbeat electronic music plays",
  effects: "Door creaks, footsteps on gravel"
};
```

### V - Visual (What should be seen?)

```javascript
// Visual elements to describe
const visualComponents = {
  subject: "A young woman with red hair",
  action: "walks through a sunlit forest",
  camera: "tracking shot, following from behind",
  style: "cinematic, film grain, warm colors"
};
```

### S - Scene (Context and environment)

```javascript
// Scene context
const sceneComponents = {
  setting: "enchanted forest at golden hour",
  atmosphere: "magical, peaceful, mystical fog",
  lighting: "volumetric sunlight through trees"
};
```

### Complete A.V.S. Prompt Example

```
[AUDIO] A woman's voice narrates "The forest holds many secrets" while gentle wind
rustles through leaves and distant birds sing.

[VISUAL] A young woman in a flowing white dress walks along a mossy path through
an ancient forest. Camera follows her in a smooth tracking shot.

[SCENE] Golden hour lighting filters through towering oak trees, creating
volumetric light rays. Magical particles float in the air.
```

**Simplified Single-Line Format:**
```
A woman in a white dress walks through a sunlit forest saying "The forest holds
many secrets", gentle wind and birdsong in the background, cinematic tracking shot,
golden hour, magical atmosphere.
```

### The Camera-Subject-Lighting Pattern (Deep Research Finding)

LTX responds best to a structured prompt that separates camera, subject, and atmosphere:

1. **Camera Movement** - Start with how the camera moves (LTX has excellent camera control)
   - Keywords: "Slow pan right," "Zoom in," "Static camera," "Tracking shot," "Dolly in"

2. **Subject & Action** - Define who is doing what
   - Keywords: "A woman with red hair turns to face the camera," "Cars speeding down wet road"

3. **Atmosphere & Tech Specs** - Define the look
   - Keywords: "Cinematic lighting," "Volumetric fog," "4k," "High fidelity," "Blurry background"

**Example Using This Pattern:**
```
Low angle, dolly in shot. A cybernetic samurai drawing a katana in heavy rain.
Neon reflections on the wet pavement. Cinematic lighting, 4k, shallow depth of field,
high contrast.
```

---

## Text-to-Video Generation

### Python (Recommended for Local)

```python
import torch
from diffusers import LTXPipeline
from diffusers.utils import export_to_video

pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")

video_frames = pipe(
    prompt="A chef prepares a gourmet dish in a professional kitchen, steam rising, overhead shot transitioning to close-up, warm lighting",
    negative_prompt="blurry, low quality",
    num_frames=121,           # 5 seconds at 24fps
    num_inference_steps=30,
    guidance_scale=3.5,
    generator=torch.Generator("cuda").manual_seed(42)
).frames[0]

export_to_video(video_frames, "chef_output.mp4", fps=24)
```

### ComfyUI Workflow

See [ComfyUI Integration](#comfyui-integration) section above for node-based workflow.

### Text-to-Video Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | - | Text description of video content |
| `negative_prompt` | string | "" | What to avoid |
| `num_frames` | int | 49 | Number of frames (frames = seconds × 24) |
| `num_inference_steps` | int | 30 | Steps (30-50 recommended) |
| `guidance_scale` | float | 3.5 | Prompt adherence (3.0-5.0) |
| `generator` | Generator | None | For reproducibility with seed |

### Text-to-Video with LoRA

```python
# Load base pipeline
pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")

# Load LoRA weights
pipe.load_lora_weights("path/to/anime-style.safetensors")

video_frames = pipe(
    prompt="A anime_style character dances energetically, colorful stage lights",
    num_frames=121,
    num_inference_steps=30,
    guidance_scale=3.5,
    cross_attention_kwargs={"scale": 0.8}  # LoRA strength
).frames[0]
```

---

## Image-to-Video Generation

**This is LTX's strongest capability.** Excellent adherence to input image.

### Python (Recommended)

```python
import torch
from diffusers import LTXImageToVideoPipeline
from diffusers.utils import export_to_video, load_image

pipe = LTXImageToVideoPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")

# Load starting image
image = load_image("portrait.png")

video_frames = pipe(
    image=image,
    prompt="The woman smiles and turns her head slightly, gentle breeze moves her hair",
    num_frames=121,
    num_inference_steps=30,
    guidance_scale=3.5
).frames[0]

export_to_video(video_frames, "animated_portrait.mp4", fps=24)
```

### Image-to-Video Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_url` | string | Yes | Publicly accessible URL or base64 data URI |
| `prompt` | string | Yes | Motion description (NOT image description) |
| `num_inference_steps` | number | No | Steps (30-50 recommended) |
| `guidance_scale` | number | No | Prompt adherence (3.0-5.0) |
| `seed` | number | No | For reproducibility |

### Image Input Requirements

| Format | Support |
|--------|---------|
| PNG | Yes |
| JPEG | Yes |
| WebP | Yes |
| AVIF | Yes |
| HEIF | Yes |

**Critical Rule:** The prompt should describe **motion and audio**, not the image content. The image already provides the visual reference.

```javascript
// WRONG - describes the image
prompt: "A woman with blonde hair wearing a blue dress"

// CORRECT - describes motion and audio
prompt: "The woman looks up and smiles, gentle breeze moves her hair, birds chirping"
```

---

## Video-to-Video Generation

### Style Transfer Pipeline (Local)

For V2V style transfer, use a frame-by-frame approach:

```python
import torch
import cv2
from diffusers import LTXImageToVideoPipeline
from diffusers.utils import export_to_video
from PIL import Image
import numpy as np

# Load pipeline with LoRA
pipe = LTXImageToVideoPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")
pipe.load_lora_weights("claymation-style.safetensors")

# Extract key frame from source video
cap = cv2.VideoCapture("input_video.mp4")
ret, frame = cap.read()
cap.release()
key_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

# Apply style transfer
video_frames = pipe(
    image=key_frame,
    prompt="Claymation style animation, stop-motion aesthetic, vibrant colors",
    num_frames=121,
    num_inference_steps=30,
    cross_attention_kwargs={"scale": 1.0}
).frames[0]

export_to_video(video_frames, "stylized_output.mp4", fps=24)
```

### Segment Editing (Local Workaround)

For editing specific segments:

```python
# 1. Extract the frame at the edit point
cap = cv2.VideoCapture("input_video.mp4")
cap.set(cv2.CAP_PROP_POS_MSEC, 2000)  # 2 seconds
ret, frame = cap.read()
segment_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

# 2. Generate edited segment
edited_segment = pipe(
    image=segment_frame,
    prompt="The character now wears a red hat, same pose and lighting",
    num_frames=73,  # 3 seconds
    num_inference_steps=30
).frames[0]

# 3. Combine with original video using FFmpeg or moviepy
```

---

## Audio Generation Deep Dive

### Important Note on Current vs Future State

```
╔════════════════════════════════════════════════════════════════════════════════╗
║  CURRENT STATE (2025/Early 2026):                                              ║
║  - Open-weight LTX-Video is ~2B parameters, visual-only                        ║
║  - Native audio requires external pipeline (MMAudio, F5-TTS)                   ║
║  - Native resolution: 768x512 (720p equivalent), 24 FPS                        ║
║                                                                                ║
║  FUTURE "LTX-2" SPEC (Enterprise/Roadmap):                                     ║
║  - 19B parameters with native audio-video sync                                 ║
║  - 4K resolution, 50 FPS                                                       ║
║  - Multi-Modal DiT for synchronized waveform generation                        ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### Audio Pipeline (Current Implementation)

For current LTX-Video, use a two-step pipeline:

```
[LTX-Video: Generate Video] → [MMAudio/F5-TTS: Generate Audio] → [FFmpeg: Merge]
```

**Synchronization Options:**
- **Lip Sync:** Use SyncLabs or wav2lip models post-generation
- **Foley/SFX:** Prompt-based audio generators (like Stable Audio) taking video prompt as audio prompt
- **TTS:** F5-TTS for speech generation matching video content

### Native Audio Types (Future LTX-2)

LTX-2 can generate several types of audio synchronized to video:

| Audio Type | Description | Example Prompt |
|------------|-------------|----------------|
| **Dialogue** | Speech with lip sync | "A man says 'Hello, how are you?'" |
| **Ambient** | Environmental sounds | "Ocean waves, seagulls in distance" |
| **Soundtrack** | Background music | "Upbeat electronic music" |
| **Effects** | Sound effects | "Door slams, glass breaks" |

### Audio Prompting Patterns

#### Dialogue with Lip Sync
```
A news anchor looks at the camera and says "Breaking news tonight, we have
a special report" in a professional tone, studio lighting, teleprompter reflection.
```

#### Ambient Soundscape
```
A rainy cityscape at night, raindrops hitting windows, distant car horns,
neon signs reflecting on wet pavement, slow pan across rooftops.
```

#### Music-Driven Scene
```
A DJ performs at a nightclub, energetic electronic music with heavy bass,
crowd dancing in background, colorful laser lights, dynamic camera movement.
```

#### Mixed Audio
```
A blacksmith hammers red-hot metal, sparks flying, rhythmic clanging sounds,
forge crackling in background, dramatic orchestral music swells.
```

### Audio Quality Parameters

| Setting | Best For |
|---------|----------|
| High dialogue priority | Talking head videos, interviews |
| High ambient priority | Nature scenes, cityscapes |
| Music emphasis | Music videos, promotional content |
| Effects emphasis | Action scenes, product demos |

---

## LoRA Training

### Training Custom LoRAs (Local)

LTX-Video uses a Diffusion Transformer (DiT) architecture similar to Flux, so LoRA training follows similar patterns. Use Kohya-SS or PEFT for local training.

### Option 1: Kohya-SS (Recommended for Beginners)

```bash
# 1. Install Kohya-SS
git clone https://github.com/kohya-ss/sd-scripts
cd sd-scripts
pip install -r requirements.txt

# 2. Prepare dataset structure
# dataset/
# ├── video_001.mp4
# ├── video_001.txt  (caption)
# ├── video_002.mp4
# ├── video_002.txt
# └── ...

# 3. Training command for LTX (DiT architecture)
accelerate launch train_network.py \
  --pretrained_model_name_or_path="Lightricks/LTX-Video" \
  --train_data_dir="./dataset" \
  --output_dir="./output" \
  --network_module="networks.lora" \
  --network_dim=32 \
  --network_alpha=32 \
  --learning_rate=1e-4 \
  --optimizer_type="AdamW8bit" \
  --train_batch_size=1 \
  --max_train_steps=1000 \
  --save_every_n_steps=200 \
  --mixed_precision="bf16"
```

### Option 2: PEFT (Hugging Face)

```python
from peft import LoraConfig, get_peft_model
from diffusers import LTXPipeline
import torch

# Load base model
pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
)

# Configure LoRA
lora_config = LoraConfig(
    r=32,                      # Rank
    lora_alpha=32,             # Alpha (usually same as rank)
    target_modules=["to_q", "to_k", "to_v", "to_out.0"],  # DiT attention layers
    lora_dropout=0.05,
    bias="none"
)

# Apply LoRA to model
pipe.transformer = get_peft_model(pipe.transformer, lora_config)

# Training loop (simplified)
optimizer = torch.optim.AdamW(pipe.transformer.parameters(), lr=1e-4)

for step, batch in enumerate(train_dataloader):
    # Forward pass
    loss = pipe.training_step(batch)

    # Backward pass
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()

    if step % 200 == 0:
        pipe.transformer.save_pretrained(f"./lora_checkpoint_{step}")
```

### Using Trained LoRAs

```python
from diffusers import LTXPipeline
import torch

# Load base pipeline
pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
).to("cuda")

# Load your trained LoRA
pipe.load_lora_weights("./my_trained_lora/")

# Or load from safetensors file
pipe.load_lora_weights("./anime_style.safetensors")

# Generate with LoRA
video_frames = pipe(
    prompt="A anime_style character dances energetically",
    num_frames=121,
    num_inference_steps=30,
    guidance_scale=3.5,
    cross_attention_kwargs={"scale": 0.8}  # LoRA strength (0.0-1.0)
).frames[0]
```

### Training Parameters

| Parameter | Recommended | Description |
|-----------|-------------|-------------|
| `network_dim` (rank) | 32 | LoRA rank (16, 32, 64) |
| `network_alpha` | 32 | Usually same as rank |
| `learning_rate` | 1e-4 to 5e-5 | Lower for fine details |
| `optimizer` | AdamW8bit | Memory efficient |
| `train_batch_size` | 1 | Higher with more VRAM |
| `max_train_steps` | 500-1500 | More for complex styles |
| `mixed_precision` | bf16 | Required for LTX |

### Training Data Requirements

| Requirement | Specification |
|-------------|---------------|
| Format | MP4 videos with paired .txt captions |
| Duration | 2-4 seconds per clip (optimal) |
| Quantity | 10-50 clips recommended |
| Quality | 720p minimum, consistent style |
| Content | Subject should appear in most frames |
| **Captioning** | Dense descriptions including trigger word |

### Captioning Best Practices

```
# Good caption example (video_001.txt):
"anime_style, a young woman with blue hair walks through cherry blossoms,
soft cel-shaded lighting, vibrant colors, smooth animation"

# Include:
# - Trigger word: "anime_style"
# - Subject description
# - Style descriptors
# - Lighting/atmosphere
```

### Hardware Requirements for Training

| VRAM | Batch Size | Notes |
|------|------------|-------|
| 32GB (RTX 5090) | 2-4 | Full training, no offloading |
| 24GB (RTX 4090) | 1-2 | Gradient checkpointing recommended |
| 16GB | 1 | Requires gradient checkpointing + offload |

---

## Comparison with Other Models

### Feature Comparison

| Feature | LTX-2 | Kling v2.6 | Veo 3.1 | SVD-XT |
|---------|-------|------------|---------|--------|
| **Max Resolution** | 4K | 1080p | 4K | 1024x576 |
| **Max Duration** | 20s | 10s | 10s | 4s |
| **Native Audio** | Yes | No | Limited | No |
| **Lip Sync** | Built-in | No | Limited | No |
| **Open Source** | Yes | No | No | Yes |
| **LoRA Training** | Yes | Limited | No | Yes |
| **Motion Control** | Limited | Advanced | Limited | No |
| **Camera Presets** | No | Yes | No | No |
| **Local Deployment** | Yes | No | No | Yes |

### When to Use LTX-2 vs Others

| Use Case | Recommended Model |
|----------|-------------------|
| Video with dialogue/talking heads | **LTX-2** |
| Music videos with sync | **LTX-2** |
| Complex camera movements | Kling v2.6 |
| Reference video motion transfer | Kling v2.6 |
| Google ecosystem integration | Veo 3.1 |
| Short loops from images | SVD-XT |
| Custom style training | **LTX-2** |
| Production without API costs | **LTX-2** (local) |

---

## Pipeline Reference

### Available Pipelines (diffusers)

```python
from diffusers import LTXPipeline, LTXImageToVideoPipeline

# Text-to-Video
pipe = LTXPipeline.from_pretrained("Lightricks/LTX-Video")

# Image-to-Video
pipe = LTXImageToVideoPipeline.from_pretrained("Lightricks/LTX-Video")
```

### Pipeline Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | str | Required | Text description |
| `negative_prompt` | str | "" | What to avoid |
| `num_frames` | int | 49 | Number of output frames |
| `num_inference_steps` | int | 30 | Denoising steps (30-50) |
| `guidance_scale` | float | 3.5 | Prompt adherence (3.0-5.0) |
| `generator` | Generator | None | For reproducible seeds |
| `output_type` | str | "pil" | Output format |

### Output Format

```python
# Generation returns a dict with 'frames' key
result = pipe(prompt="...", num_frames=121)

# Access frames
frames = result.frames[0]  # List of PIL Images

# Export to video
from diffusers.utils import export_to_video
export_to_video(frames, "output.mp4", fps=24)
```

### Memory Optimization Methods

```python
# Sequential CPU offload (moderate memory savings)
pipe.enable_sequential_cpu_offload()

# Model CPU offload (more aggressive)
pipe.enable_model_cpu_offload()

# Attention slicing (for very low VRAM)
pipe.enable_attention_slicing()

# VAE tiling (for high resolution)
pipe.enable_vae_tiling()
```

### Cloud API Alternative (Optional)

If you need cloud inference, FAL.ai hosts LTX-Video:

```bash
# Install FAL client
pip install fal-client

# Set API key
export FAL_KEY="your-key-here"
```

```python
import fal_client

result = fal_client.subscribe("fal-ai/ltx-video", {
    "prompt": "A woman walks through a forest...",
    "num_inference_steps": 30
})
video_url = result["video"]["url"]
```

---

## Troubleshooting

### Decision Tree: Common Issues

```
Issue: Want audio in output (Current LTX-Video)
│
├─► LTX-Video is visual-only
│   └─► Use external audio pipeline (MMAudio, F5-TTS)
│
└─► For lip sync
    └─► Use SyncLabs or wav2lip post-processing
```

```
Issue: LoRA not applying
│
├─► Missing trigger phrase
│   └─► Include trigger_phrase in prompt
│
├─► Scale too low
│   └─► Increase scale (0.7-1.2 recommended)
│
└─► LoRA URL invalid
    └─► Verify URL is publicly accessible
```

### Quality Optimization

| Issue | Solution |
|-------|----------|
| Blurry output | Increase inference steps (30-50) |
| Choppy motion | Reduce scene complexity |
| Motion doesn't match prompt | Increase guidance_scale (3.5-5.0) |
| Style inconsistent | Add style descriptors, use LoRA |

---

## LLM Agent Helper Functions

### Python Video Generator Class

```python
"""
LTX Video Generator - Local deployment helper for LLM agents
"""
import torch
from diffusers import LTXPipeline, LTXImageToVideoPipeline
from diffusers.utils import export_to_video, load_image
from typing import Optional, List
from pathlib import Path


class LTXVideoGenerator:
    """Generate LTX videos locally with optimized settings."""

    def __init__(self, vram_gb: int = 32):
        self.vram_gb = vram_gb
        self.pipe = None
        self.i2v_pipe = None

    def _get_dtype_and_offload(self):
        """Select optimal dtype and offload based on VRAM."""
        if self.vram_gb >= 24:
            return torch.bfloat16, None
        elif self.vram_gb >= 16:
            return torch.bfloat16, "sequential"
        else:
            return torch.float16, "model"

    def load_t2v_pipeline(self, lora_path: Optional[str] = None):
        """Load text-to-video pipeline."""
        dtype, offload = self._get_dtype_and_offload()

        self.pipe = LTXPipeline.from_pretrained(
            "Lightricks/LTX-Video",
            torch_dtype=dtype
        )

        if offload == "sequential":
            self.pipe.enable_sequential_cpu_offload()
        elif offload == "model":
            self.pipe.enable_model_cpu_offload()
        else:
            self.pipe = self.pipe.to("cuda")

        if lora_path:
            self.pipe.load_lora_weights(lora_path)

        return self

    def load_i2v_pipeline(self, lora_path: Optional[str] = None):
        """Load image-to-video pipeline."""
        dtype, offload = self._get_dtype_and_offload()

        self.i2v_pipe = LTXImageToVideoPipeline.from_pretrained(
            "Lightricks/LTX-Video",
            torch_dtype=dtype
        )

        if offload == "sequential":
            self.i2v_pipe.enable_sequential_cpu_offload()
        elif offload == "model":
            self.i2v_pipe.enable_model_cpu_offload()
        else:
            self.i2v_pipe = self.i2v_pipe.to("cuda")

        if lora_path:
            self.i2v_pipe.load_lora_weights(lora_path)

        return self

    def generate(
        self,
        prompt: str,
        image_path: Optional[str] = None,
        output_path: str = "output.mp4",
        num_frames: int = 121,
        num_inference_steps: int = 30,
        guidance_scale: float = 3.5,
        lora_scale: float = 1.0,
        seed: Optional[int] = None,
        negative_prompt: str = "blurry, low quality, distorted"
    ) -> str:
        """Generate video from text or image."""
        generator = None
        if seed is not None:
            generator = torch.Generator("cuda").manual_seed(seed)

        cross_attention_kwargs = {"scale": lora_scale} if lora_scale != 1.0 else None

        if image_path:
            # Image-to-Video
            if self.i2v_pipe is None:
                self.load_i2v_pipeline()
            image = load_image(image_path)
            result = self.i2v_pipe(
                image=image,
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_frames=num_frames,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
                cross_attention_kwargs=cross_attention_kwargs
            )
        else:
            # Text-to-Video
            if self.pipe is None:
                self.load_t2v_pipeline()
            result = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_frames=num_frames,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
                cross_attention_kwargs=cross_attention_kwargs
            )

        export_to_video(result.frames[0], output_path, fps=24)
        return output_path


# Usage example
generator = LTXVideoGenerator(vram_gb=32)
generator.load_t2v_pipeline()
generator.generate(
    prompt="A woman walks through a sunlit forest, tracking shot",
    output_path="forest_walk.mp4",
    num_frames=121,
    seed=42
)
```

### A.V.S. Prompt Builder

```python
def build_avs_prompt(
    audio: dict = None,
    visual: dict = None,
    scene: dict = None
) -> str:
    """
    Build an A.V.S. formatted prompt for LTX.

    Args:
        audio: dict with keys: dialogue, ambient, music, effects
        visual: dict with keys: subject, action, camera, style
        scene: dict with keys: setting, atmosphere, lighting

    Returns:
        Formatted prompt string
    """
    audio = audio or {}
    visual = visual or {}
    scene = scene or {}

    parts = []

    # Audio components (for future LTX-2 or external audio pipeline)
    for key in ['dialogue', 'ambient', 'music', 'effects']:
        if key in audio and audio[key]:
            parts.append(audio[key])

    # Visual components
    for key in ['subject', 'action', 'camera', 'style']:
        if key in visual and visual[key]:
            parts.append(visual[key])

    # Scene components
    for key in ['setting', 'atmosphere', 'lighting']:
        if key in scene and scene[key]:
            parts.append(scene[key])

    return ", ".join(parts)


# Example usage
prompt = build_avs_prompt(
    visual={
        "subject": "A professional host in a sleek suit",
        "action": "gestures towards the camera",
        "camera": "slow push-in shot",
        "style": "broadcast quality, sharp focus"
    },
    scene={
        "setting": "modern TV studio",
        "lighting": "professional studio lighting with blue accents"
    }
)
# Result: "A professional host in a sleek suit, gestures towards the camera, slow push-in shot, broadcast quality, sharp focus, modern TV studio, professional studio lighting with blue accents"
```

### Pipeline Selector

```python
def select_ltx_pipeline(
    has_input_image: bool = False,
    needs_lora: bool = False,
    vram_gb: int = 32
) -> dict:
    """
    Select optimal LTX pipeline configuration.

    Args:
        has_input_image: Whether using I2V mode
        needs_lora: Whether LoRA weights will be loaded
        vram_gb: Available VRAM in GB

    Returns:
        dict with pipeline class, dtype, and notes
    """
    from diffusers import LTXPipeline, LTXImageToVideoPipeline

    pipeline_class = LTXImageToVideoPipeline if has_input_image else LTXPipeline

    if vram_gb >= 24:
        dtype = "bfloat16"
        offload = None
    elif vram_gb >= 16:
        dtype = "bfloat16"
        offload = "sequential_cpu_offload"
    else:
        dtype = "float16"
        offload = "model_cpu_offload"

    notes = []
    if has_input_image:
        notes.append("Prompt should describe motion, not image content")
    if needs_lora:
        notes.append("Include trigger phrase in prompt")
    notes.append("LTX-Video is visual-only; use external audio pipeline for sound")

    return {
        "pipeline_class": pipeline_class.__name__,
        "dtype": dtype,
        "offload_method": offload,
        "notes": "; ".join(notes)
    }


# Example
config = select_ltx_pipeline(has_input_image=True, vram_gb=32)
# {'pipeline_class': 'LTXImageToVideoPipeline', 'dtype': 'bfloat16', 'offload_method': None, ...}
```

### Audio Prompt Enhancer

```python
def enhance_with_audio(
    visual_prompt: str,
    dialogue: str = None,
    ambient_sounds: list = None,
    music_style: str = None,
    sound_effects: list = None
) -> str:
    """
    Enhance a visual prompt with audio elements.
    Note: Current LTX-Video is visual-only. These audio elements
    are for future LTX-2 or for generating matching audio separately.

    Args:
        visual_prompt: Base visual description
        dialogue: Speech/narration
        ambient_sounds: Environmental sounds
        music_style: Background music style
        sound_effects: Specific sound effects

    Returns:
        Enhanced prompt with audio elements
    """
    audio_parts = []

    if dialogue:
        audio_parts.append(dialogue)

    if ambient_sounds:
        audio_parts.extend(ambient_sounds)

    if music_style:
        audio_parts.append(f"{music_style} music")

    if sound_effects:
        audio_parts.extend(sound_effects)

    if audio_parts:
        return f"{visual_prompt}, {', '.join(audio_parts)}"

    return visual_prompt


# Example
enhanced = enhance_with_audio(
    "A blacksmith hammers metal on an anvil, sparks flying, dramatic lighting",
    sound_effects=["rhythmic hammering", "fire crackling"],
    ambient_sounds=["distant thunder"],
    music_style="epic orchestral"
)
# "A blacksmith hammers metal on an anvil, sparks flying, dramatic lighting, rhythmic hammering, fire crackling, distant thunder, epic orchestral music"
```

---

## Quick Reference Card

### Resolution Options

| Setting | Dimensions | Use Case |
|---------|------------|----------|
| "720p" | 1280x720 | Fast preview |
| "1080p" | 1920x1080 | Standard production |
| "2160p" | 3840x2160 | 4K premium |

### Duration Options

| Duration | Best For |
|----------|----------|
| 6 seconds | Quick clips, social media |
| 8 seconds | Standard scenes |
| 10 seconds | Complex narratives |
| 20 seconds | Extended sequences (may need segments) |

### LoRA Scale Guide

| Scale | Effect |
|-------|--------|
| 0.3-0.5 | Subtle influence |
| 0.6-0.8 | Balanced blend |
| 0.9-1.2 | Strong style transfer |
| 1.3+ | Risk of artifacts |

### Audio Prompt Keywords

| Category | Keywords |
|----------|----------|
| Dialogue | "says", "speaks", "narrates", "whispers" |
| Ambient | "background", "distant", "subtle", "environmental" |
| Music | "upbeat", "dramatic", "gentle", "rhythmic" |
| Effects | "crash", "whoosh", "click", "buzz" |

---

*Document Version: 2.0 | Last Updated: January 2026 | Optimized for LLM Agent Consumption*
