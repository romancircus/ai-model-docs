# ComfyUI: Comprehensive Node-Based Generation Guide

**Provider:** ComfyUI (Open Source)
**Last Updated:** January 2026
**Version:** 3.0 (LLM-Agent Optimized)
**Purpose:** Complete guide for image and video generation workflows

---

> **For Coding Agents (Claude Code, Cursor, etc.):**
> See **[COMFYUI_ORCHESTRATION.md](./COMFYUI_ORCHESTRATION.md)** for:
> - Programmatic workflow generation
> - API integration patterns
> - Multi-stage pipeline templates (Image → Style Transfer → 4K Video)
> - Error handling decision trees
> - Production-ready Python client

---

## Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Essential Node Types](#essential-node-types)
4. [Model Selection Guide](#model-selection-guide)
5. [The N.O.D.E. Workflow Framework](#the-node-workflow-framework)
6. [Text-to-Image Workflows](#text-to-image-workflows)
7. [Image-to-Image Workflows](#image-to-image-workflows)
8. [ControlNet Integration](#controlnet-integration)
9. [LoRA Application](#lora-application)
10. [Video Generation Workflows](#video-generation-workflows)
11. [Sampler & Parameter Deep Dive](#sampler--parameter-deep-dive)
12. [Memory & Performance Optimization](#memory--performance-optimization)
13. [Essential Custom Nodes](#essential-custom-nodes)
14. [Resolution & Aspect Ratio Guide](#resolution--aspect-ratio-guide)
15. [Troubleshooting Decision Tree](#troubleshooting-decision-tree)
16. [API & Automation](#api--automation)
17. [Workflow Recipes](#workflow-recipes)
18. [LLM Agent Helper Functions](#llm-agent-helper-functions)

---

## Overview

ComfyUI is a **node-based graphical interface** for diffusion models that exposes the full generation pipeline as a visual flowchart. Unlike traditional UIs that hide complexity behind tabs, ComfyUI makes every step explicit and modifiable.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Text-to-Image** | Generate images from prompts using SD1.5, SDXL, Flux, SD3.5 |
| **Image-to-Image** | Transform existing images with varying strength |
| **ControlNet** | Structure-guided generation (pose, depth, edges) |
| **LoRA Support** | Apply style/character adapters with stackable weights |
| **Video Generation** | SVD, AnimateDiff, LTX-Video, Hunyuan for image-to-video and text-to-video |
| **Inpainting** | Selective region editing with masks |
| **Upscaling** | Hires Fix workflows for detail enhancement |
| **API-First** | Designed for programmatic automation |

### Why ComfyUI for LLM Agents?

1. **Deterministic Workflows** - Same nodes + same parameters = reproducible results
2. **JSON Serialization** - Workflows export as structured JSON for programmatic control
3. **Granular Control** - Every parameter is exposed and adjustable
4. **Extensible** - Custom nodes for any new model or technique
5. **Memory Efficient** - Lazy evaluation only re-runs changed nodes

---

## Core Architecture

### The DAG (Directed Acyclic Graph)

ComfyUI operates as a **flowchart** where data flows in one direction from inputs to outputs.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ComfyUI Data Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  CHECKPOINT  │───▶│    CLIP      │───▶│  CONDITIONING│      │
│  │   LOADER     │    │  TEXT ENCODE │    │   (Positive) │      │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘      │
│         │                                        │              │
│         │            ┌──────────────┐           │              │
│         │            │    CLIP      │───▶┌──────┴───────┐      │
│         │            │  TEXT ENCODE │    │  CONDITIONING│      │
│         │            │  (Negative)  │    │   (Negative) │      │
│         │            └──────────────┘    └──────┬───────┘      │
│         │                                        │              │
│         ▼                                        ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    MODEL     │───▶│   KSAMPLER   │◀───│   LATENT     │      │
│  │   (UNet)     │    │   (Engine)   │    │   (Noise)    │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │     VAE      │───▶│  VAE DECODE  │───▶│  SAVE IMAGE  │      │
│  │   (Decoder)  │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Concept: Latent vs Pixel Space

| Space | Description | Memory Usage |
|-------|-------------|--------------|
| **Pixel Space** | Standard RGB images (what you see) | High (1024x1024 = 3MB) |
| **Latent Space** | Compressed representation (where generation happens) | Low (128x128 = ~64KB) |

**The VAE is the bridge:**
- `VAE Encode`: Pixels → Latents (for Img2Img input)
- `VAE Decode`: Latents → Pixels (for final output)

### Lazy Evaluation

ComfyUI **only re-runs nodes where inputs changed**. This means:
- Changing seed? Only KSampler and downstream nodes re-execute
- Changing prompt? CLIP encode and downstream re-execute
- Model stays loaded in VRAM between runs

**Critical for LLM agents:** This makes iteration fast - you don't pay the model loading cost on every tweak.

---

## Essential Node Types

### Core Nodes Reference

| Node | Type | Purpose | Key Inputs | Key Outputs |
|------|------|---------|------------|-------------|
| `CheckpointLoaderSimple` | Loader | Loads model + CLIP + VAE | `ckpt_name` | MODEL, CLIP, VAE |
| `CLIPTextEncode` | Conditioning | Text → Embedding | `text`, CLIP | CONDITIONING |
| `KSampler` | Sampler | The generation engine | MODEL, pos/neg, LATENT, seed, steps, cfg | LATENT |
| `EmptyLatentImage` | Latent | Creates noise canvas | `width`, `height`, `batch_size` | LATENT |
| `VAEDecode` | Decoder | Latent → Pixels | LATENT, VAE | IMAGE |
| `VAEEncode` | Encoder | Pixels → Latent | IMAGE, VAE | LATENT |
| `LoadImage` | Input | Loads external image | `image` (file) | IMAGE, MASK |
| `SaveImage` | Output | Saves to disk | IMAGE, `filename_prefix` | - |
| `PreviewImage` | Output | Shows in UI (no save) | IMAGE | - |

### Specialized Nodes

| Node | Purpose | When to Use |
|------|---------|-------------|
| `DualCLIPLoader` | Loads T5 + CLIP-L for Flux | Any Flux workflow |
| `LoraLoader` | Applies LoRA weights | Style/character consistency |
| `ControlNetLoader` | Loads ControlNet model | Structure-guided generation |
| `ControlNetApply` | Applies ControlNet to conditioning | After ControlNet loaded |
| `ImageScale` | Resizes images | Preparing inputs, upscaling |
| `LatentUpscale` | Upscales in latent space | Hires Fix workflows |

---

## Model Selection Guide

### Decision Tree: Which Model to Use?

```
START: What do you need to generate?
│
├─► High-quality realistic images?
│   │
│   ├─► Need best text rendering? ──────► Flux.1 Dev
│   │
│   ├─► Need speed (< 5 steps)? ────────► Flux.1 Schnell or SDXL Turbo
│   │
│   └─► Balance of quality/speed? ──────► SDXL Base + Refiner
│
├─► Anime / Stylized art?
│   │
│   ├─► High detail anime? ─────────────► Pony Diffusion XL
│   │
│   └─► Classic anime style? ───────────► SD1.5 + Anime checkpoint
│
├─► Video generation?
│   │
│   ├─► From a single image? ───────────► LTX-Video (best) or SVD
│   │
│   ├─► Text-to-video with motion? ─────► LTX-Video or AnimateDiff
│   │
│   ├─► Fast local inference? ──────────► LTX-Video (DiT, very fast)
│   │
│   └─► High quality video? ────────────► Hunyuan Video / Kling API nodes
│
└─► Limited VRAM (< 8GB)?
    │
    └─► Use SD1.5 models with --lowvram flag
```

### Model Specifications

| Model | Architecture | Native Resolution | VRAM (fp16) | Best For |
|-------|--------------|-------------------|-------------|----------|
| **Flux.1 Dev** | DiT | 1024x1024 | 24GB (12GB fp8) | Text rendering, realism |
| **Flux.1 Schnell** | DiT | 1024x1024 | 24GB (12GB fp8) | Fast generation (4 steps) |
| **SDXL Base** | UNet | 1024x1024 | 8GB | General purpose |
| **SDXL Turbo** | UNet | 512x512 | 6GB | Real-time generation |
| **SD 3.5 Large** | MMDiT | 1024x1024 | 12GB | Balanced quality |
| **SD 1.5** | UNet | 512x512 | 4GB | Low VRAM, LoRA compatibility |
| **SVD** | Video | 576x1024 | 12GB | Image-to-video |
| **LTX-Video** | DiT Video | 768x512 | 8-12GB | Fast I2V/T2V, excellent motion |
| **AnimateDiff** | Motion | 512x512 | 8GB | Text-to-video |

---

## The N.O.D.E. Workflow Framework

For LLM agents building ComfyUI workflows, use the **N.O.D.E.** framework:

### N - Navigate (Load Models)

What models, LoRAs, and resources do you need?

```javascript
// Required nodes for navigation
const navigation = {
  checkpoint: "CheckpointLoaderSimple",
  lora: "LoraLoader",           // Optional: for style/character
  controlnet: "ControlNetLoader", // Optional: for structure
  vae: "VAELoader"              // Optional: if separate VAE needed
};
```

### O - Orchestrate (Set Up Conditioning)

How will text prompts influence generation?

```javascript
// Conditioning setup
const orchestration = {
  positive: {
    node: "CLIPTextEncode",
    structure: "[Subject] [Action] [Environment] [Style] [Quality tags]"
  },
  negative: {
    node: "CLIPTextEncode",
    defaults: "blurry, low quality, distorted, deformed"
  }
};
```

### D - Diffuse (Sample)

What sampler settings produce the best results?

```javascript
// Sampling configuration by model
const diffusion = {
  flux: { sampler: "euler", scheduler: "simple", steps: 20, cfg: 3.5 },
  sdxl: { sampler: "dpmpp_2m_sde", scheduler: "karras", steps: 30, cfg: 7 },
  sd15: { sampler: "dpmpp_2m", scheduler: "karras", steps: 25, cfg: 7.5 }
};
```

### E - Export (Decode & Save)

How will the output be processed and saved?

```javascript
// Export configuration
const exportConfig = {
  decode: "VAEDecode",           // Standard decode
  decodeTiled: "VAEDecodeTiled", // For 4K+ images
  save: "SaveImage",
  preview: "PreviewImage"        // For iteration without saving
};
```

---

## Text-to-Image Workflows

### Basic Text-to-Image (Flux)

The 2026 standard workflow for high-quality generation:

```
[CheckpointLoaderSimple: flux1-dev.safetensors]
        │
        ├── MODEL ──────────────────────┐
        ├── CLIP ─► [DualCLIPLoader] ──► [CLIPTextEncode: Positive]
        │                               │
        │   [CLIPTextEncode: Negative] ◄┘
        │           │
        └── VAE ────┼───────────────────────────────────────┐
                    │                                        │
                    ▼                                        ▼
        [EmptyLatentImage] ──► [KSampler] ──► [VAEDecode] ──► [SaveImage]
          1024x1024              seed: random
          batch: 1               steps: 20
                                 cfg: 3.5
                                 sampler: euler
                                 scheduler: simple
```

**Key Flux Differences:**
- Use `DualCLIPLoader` for T5 + CLIP-L text encoding
- Lower CFG (3.0-4.0) than SDXL/SD1.5
- Minimal or empty negative prompts work best
- Use `BasicGuider` + `SamplerCustomAdvanced` for full control

### Basic Text-to-Image (SDXL)

```
[CheckpointLoaderSimple: sdxl_base.safetensors]
        │
        ├── MODEL ──► [KSampler] ◄── [EmptyLatentImage: 1024x1024]
        │                 │
        ├── CLIP ──► [CLIPTextEncode: Positive] ──┤
        │                                          │
        │            [CLIPTextEncode: Negative] ──┤
        │                                          │
        └── VAE ──► [VAEDecode] ◄─────────────────┘
                         │
                         ▼
                    [SaveImage]
```

**SDXL Optimal Settings:**
- Steps: 30-40
- CFG: 5.0-7.0
- Sampler: `dpmpp_2m_sde`
- Scheduler: `karras` or `exponential`

### Hires Fix Workflow (Latent Upscale)

For higher resolution output with more detail:

```
[Standard T2I Workflow at 1024x1024]
        │
        ▼
[LatentUpscale]  ◄── method: nearest-exact
  1.5x scale          │
        │             │
        ▼             │
[KSampler] ◄──────────┘
  denoise: 0.35-0.5
  steps: 15-20
        │
        ▼
[VAEDecode] ──► [SaveImage]
```

**Key Parameters:**
- `denoise`: 0.35-0.5 (lower = keeps more original, higher = adds more detail)
- Scale factor: 1.5x is safe, 2x may introduce artifacts

---

## Image-to-Image Workflows

### Basic Img2Img

Transform an existing image with a new prompt:

```
[LoadImage] ──► [VAEEncode] ──► [KSampler] ──► [VAEDecode] ──► [SaveImage]
                    │               │
                    │               │◄── denoise: 0.5-0.8
                    │               │
                    └── LATENT ─────┘
```

**Denoise Strength Guide:**
| Denoise | Effect |
|---------|--------|
| 0.2-0.3 | Subtle changes, keeps original composition |
| 0.4-0.5 | Moderate transformation, maintains structure |
| 0.6-0.7 | Significant changes, loose interpretation |
| 0.8-1.0 | Near-complete regeneration |

### Inpainting Workflow

Edit specific regions of an image:

```
[LoadImage] ──┬── IMAGE ──► [VAEEncode] ──► [SetLatentNoiseMask] ──► [KSampler]
              │                                      │
              └── MASK ──────────────────────────────┘
```

**Mask Rules:**
- **White (255)** = Areas to regenerate
- **Black (0)** = Areas to preserve
- **Feathered edges** = Smoother blending

---

## ControlNet Integration

### ControlNet Types

| Type | Purpose | Best For |
|------|---------|----------|
| **Canny** | Edge detection | Preserving shapes, line art |
| **Depth** | Depth estimation | 3D-consistent scenes |
| **OpenPose** | Human pose | Character positioning |
| **Scribble** | Rough sketches | Quick concept art |
| **Lineart** | Clean line detection | Anime/illustration styles |
| **Tile** | Detail preservation | Upscaling with consistency |
| **IP-Adapter** | Image prompt | Style/subject transfer |

### ControlNet Workflow

```
[LoadImage] ──► [CannyEdgePreprocessor] ──► [ControlNetApply] ──► [KSampler]
                    │                            │
                    │                            ├── strength: 0.8
                    │                            │
[ControlNetLoader] ─┴── CONTROLNET ─────────────┘
```

### Stacking Multiple ControlNets

```
[LoadImage] ──► [OpenPosePreprocessor] ──► [ControlNetApply: Pose]
                                               │
[LoadImage] ──► [DepthPreprocessor] ──► [ControlNetApply: Depth]
                                               │
                                               ▼
                                          [KSampler]
```

**Strength Guidelines:**
- Single ControlNet: 0.7-1.0
- Stacked ControlNets: Reduce each to 0.4-0.6
- Total combined strength should not exceed 1.5

---

## LoRA Application

### Basic LoRA Workflow

```
[CheckpointLoaderSimple]
        │
        ├── MODEL ─┬─► [LoraLoader] ──► [KSampler]
        │          │      │
        ├── CLIP ──┘      │ strength_model: 0.8
        │                 │ strength_clip: 0.8
        └── VAE           │
                          │
[CLIPTextEncode] ◄────────┘
  (include trigger word)
```

### Stacking Multiple LoRAs

```
[CheckpointLoaderSimple]
        │
        ▼
[LoraLoader: Style LoRA] ──► [LoraLoader: Character LoRA] ──► [KSampler]
   strength: 0.6                   strength: 0.7
```

### LoRA Strength Guide

| Strength | Effect |
|----------|--------|
| 0.3-0.5 | Subtle influence, blends with base model |
| 0.6-0.8 | Strong influence, LoRA style dominant |
| 0.9-1.0 | Full LoRA effect, may overwhelm base model |
| 1.0+ | Over-trained artifacts may appear |

**Critical Rule:** Always include the LoRA's **trigger word** in your prompt!

---

## Video Generation Workflows

### LTX-Video (Recommended for Local)

LTX-Video is a fast DiT-based video model with excellent I2V adherence. **See [LTX Documentation](../ltx/Get_Started_LTX.md) for full details.**

**Install Custom Nodes:**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Lightricks/ComfyUI-LTXVideo
pip install -r ComfyUI-LTXVideo/requirements.txt
```

**Basic LTX-Video Workflow:**
```
[CheckpointLoader: ltx-video-2b-v0.9.safetensors]
        │
        ├── MODEL ──────────────────────────────────────┐
        │                                                │
[CLIPTextEncode: "A woman walks through forest..."] ────┤
        │                                                │
[LTXVImageEncode] ◄── [LoadImage] (optional for I2V)    │
        │                                                │
        ▼                                                │
[LTXVSampler] ◄─────────────────────────────────────────┘
        │
        ├── num_frames: 121 (5 seconds @ 24fps)
        ├── steps: 30
        ├── cfg: 3.5
        │
        ▼
[LTXVDecode] ──► [VHS_VideoCombine: fps=24]
```

**LTX-Video Parameters:**
| Parameter | Range | Effect |
|-----------|-------|--------|
| `num_frames` | 25-241 | Video length (frames = seconds × 24) |
| `steps` | 20-50 | Quality (30 recommended) |
| `cfg` | 2.0-5.0 | Prompt adherence (3.5 default) |

**LTX-Video vs SVD:**
| Feature | LTX-Video | SVD |
|---------|-----------|-----|
| Speed | ✅ Much faster | Slower |
| I2V Quality | ✅ Excellent adherence | Good |
| T2V Support | ✅ Yes | No (I2V only) |
| Motion Control | Prompt-based | motion_bucket_id |
| VRAM (32GB) | Comfortable FP16 | Comfortable |

---

### Stable Video Diffusion (Image-to-Video)

```
[LoadImage] ──► [SVD_img2vid_Conditioning]
                    │
                    ├── motion_bucket_id: 127 (0-255)
                    ├── fps: 6
                    ├── augmentation_level: 0.0
                    │
[CheckpointLoader: svd_xt.safetensors]
        │
        ├── MODEL ──► [KSampler] ──► [VAEDecode] ──► [VHS_VideoCombine]
        │               │                                   │
        └── VAE ────────┘                                   │
                                                            ▼
                                                        output.mp4
```

**SVD Parameters:**
| Parameter | Range | Effect |
|-----------|-------|--------|
| `motion_bucket_id` | 0-255 | Amount of motion (127 = moderate) |
| `augmentation_level` | 0.0-1.0 | Noise added to input (0 = none) |
| `fps` | 6-30 | Output frame rate |
| `frames` | 14 (SVD) / 25 (SVD-XT) | Number of frames |

### AnimateDiff (Text-to-Video)

```
[CheckpointLoader: sd15_base.safetensors]
        │
[AnimateDiffLoaderWithContext]
        │
        ├── context_length: 16
        ├── context_stride: 1
        │
        ▼
[EmptyLatentImage: batch_size=16] ──► [KSampler] ──► [VAEDecode] ──► [VHS_VideoCombine]
```

**AnimateDiff Key Concepts:**
- `batch_size` = number of frames
- `context_length` = how many frames the model "sees" at once
- Motion modules inject temporal consistency

### Frame Interpolation (RIFE)

Smooth low-fps AI video to higher frame rates:

```
[VHS_LoadVideo: 8fps] ──► [RIFE_VFI] ──► [VHS_VideoCombine]
                            │
                            ├── multiplier: 4 (8fps → 32fps)
                            └── model: rife47
```

---

## Sampler & Parameter Deep Dive

### Sampler Selection Matrix

| Sampler | Speed | Quality | Best For |
|---------|-------|---------|----------|
| `euler` | Fast | Good | Flux, quick iterations |
| `euler_ancestral` | Fast | Varied | Creative exploration |
| `dpmpp_2m` | Medium | High | SD1.5 general purpose |
| `dpmpp_2m_sde` | Medium | Highest | SDXL, detailed images |
| `dpmpp_3m_sde` | Slow | Very High | Maximum quality |
| `ddim` | Fast | Medium | Img2Img, deterministic |
| `uni_pc` | Fast | Good | Fast convergence |

### Scheduler Selection

| Scheduler | Behavior | Best Paired With |
|-----------|----------|------------------|
| `normal` | Linear noise reduction | Basic workflows |
| `karras` | Emphasizes early/late steps | dpmpp samplers |
| `exponential` | Smooth transitions | SDXL |
| `simple` | Minimal processing | Flux |
| `sgm_uniform` | Stable Diffusion 3 specific | SD3 models |

### CFG Scale Guide

| Model | Recommended CFG | Notes |
|-------|-----------------|-------|
| Flux.1 | 3.0-4.0 | Uses "Guidance" not CFG |
| SDXL | 5.0-7.0 | Higher = sharper but risk of artifacts |
| SD1.5 | 7.0-8.5 | Classic range |
| SD3.5 | 4.0-6.0 | Lower than SDXL |

**CFG Too High Symptoms:**
- "Burnt" or oversaturated colors
- Harsh contrast
- Unnatural edges
- Deep fried appearance

---

## Memory & Performance Optimization

### Command Line Flags

| Flag | Effect | When to Use |
|------|--------|-------------|
| `--lowvram` | Offload everything to RAM | < 6GB VRAM |
| `--medvram` | Balance VRAM/RAM usage | 6-8GB VRAM |
| `--highvram` | Keep everything in VRAM | > 16GB VRAM |
| `--fp8_e4m3fn-unet` | 8-bit UNet weights | Flux on 12GB cards |
| `--fp8_e4m3fn-text-enc` | 8-bit text encoder | Save more VRAM |

### VRAM Requirements

| Configuration | Approximate VRAM |
|---------------|------------------|
| SD1.5 @ 512px | 4GB |
| SDXL @ 1024px | 8GB |
| Flux @ 1024px (fp16) | 24GB |
| Flux @ 1024px (fp8) | 12GB |
| SVD @ 576x1024 | 12GB |

### Optimization Techniques

#### 1. Tiled VAE Decode
For large images that exceed VRAM:
```
[KSampler output] ──► [VAEDecodeTiled] ──► [SaveImage]
                         tile_size: 512
```

#### 2. Latent Upscaling Instead of Pixel
Generate at lower resolution, upscale in latent space:
```
1024x1024 generation → LatentUpscale 1.5x → KSampler (denoise 0.4) → VAEDecode
```
More efficient than pixel upscaling with models like ESRGAN.

#### 3. Batch Processing
Generate multiple images efficiently:
```
[EmptyLatentImage: batch_size=4] → [KSampler] → [VAEDecode] → [SaveImage]
```

---

## Essential Custom Nodes

### Must-Have Node Packs

| Node Pack | Purpose | Key Nodes |
|-----------|---------|-----------|
| **ComfyUI-Manager** | Install/update other nodes | Manager menu |
| **ComfyUI-Impact-Pack** | Face fixing, segmentation | FaceDetailer, SAMDetector |
| **ComfyUI-VideoHelperSuite** | Video I/O | VHS_LoadVideo, VHS_VideoCombine |
| **rgthree-comfy** | Workflow organization | Mute, Bypass, Context, Portals |
| **ComfyUI_Essentials** | Optimized operations | Faster resize, better masking |
| **ComfyUI-AnimateDiff-Evolved** | Video generation | AnimateDiff loader, context |
| **ComfyUI-GGUF** | Quantized model loading | Load Flux in fp8 |
| **ComfyUI-KJNodes** | Utility nodes | Many helpers |

### Installation

```bash
# Clone manager into custom_nodes
cd ComfyUI/custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager

# Restart ComfyUI, then use Manager menu to install others
```

---

## Resolution & Aspect Ratio Guide

### Optimal Resolutions by Model

| Model | Base Resolution | Supported Aspects |
|-------|-----------------|-------------------|
| **SD 1.5** | 512x512 | 1:1, 2:3, 3:2 |
| **SDXL** | 1024x1024 | 1:1, 9:16, 16:9, 3:4, 4:3 |
| **Flux** | 1024x1024 | Any (flexible) |
| **SD 3.5** | 1024x1024 | 1:1, 9:16, 16:9 |
| **SVD** | 576x1024 | Fixed (portrait video) |

### SDXL Optimal Dimensions

| Aspect | Dimensions | Use Case |
|--------|------------|----------|
| 1:1 | 1024x1024 | Profile pictures, icons |
| 9:16 | 768x1344 | Mobile wallpapers, stories |
| 16:9 | 1344x768 | Desktop wallpapers, thumbnails |
| 3:4 | 896x1152 | Portrait photos |
| 4:3 | 1152x896 | Landscape scenes |
| 21:9 | 1536x640 | Cinematic/ultrawide |

### Resolution Rules

1. **Always use multiples of 64** - Models expect this
2. **SD1.5 max: ~768px** on any dimension without artifacts
3. **SDXL sweet spot: 1024-1280px** - Higher needs Hires Fix
4. **Flux handles arbitrary resolutions** better than others

---

## Troubleshooting Decision Tree

### Output is Black/Solid Color

```
Black/solid output?
│
├─► Check VAE connection
│   └─► VAE must connect from Loader to Decoder
│
├─► Check if wrong VAE for model
│   └─► SDXL needs SDXL VAE, SD1.5 needs SD1.5 VAE
│
└─► Steps too low?
    └─► Increase to at least 15-20 steps
```

### Output is Noisy/Grainy

```
Noisy output?
│
├─► Steps too low
│   └─► Increase steps (20-30 for SDXL, 15-20 for Flux)
│
├─► CFG too low
│   └─► Increase CFG (but not above 10)
│
└─► Wrong scheduler
    └─► Try karras or exponential scheduler
```

### "Burnt"/Oversaturated Output

```
Burnt images?
│
├─► CFG too high
│   └─► Lower CFG (Flux: 3-4, SDXL: 5-7)
│
├─► Wrong VAE
│   └─► Use VAE that matches model architecture
│
└─► Negative prompt too aggressive
    └─► Reduce negative prompt complexity
```

### Out of Memory (OOM)

```
OOM Error?
│
├─► Image resolution too high
│   └─► Reduce to model's native resolution
│
├─► Batch size too high
│   └─► Reduce batch_size to 1
│
├─► Need Tiled VAE
│   └─► Use VAEDecodeTiled for large images
│
└─► Try lower precision
    └─► Use --fp8 flags or GGUF quantized models
```

### Distorted/Melted Faces

```
Face issues?
│
├─► Resolution mismatch
│   └─► Use model's native resolution
│
├─► CFG too high
│   └─► Lower CFG, faces are sensitive
│
└─► Use FaceDetailer
    └─► Impact Pack's FaceDetailer auto-fixes faces
```

---

## API & Automation

### Enabling API Mode

1. Enable "Enable Dev Mode Options" in Settings
2. Click "Save (API Format)" to export workflow as JSON
3. The JSON contains only execution data (not UI layout)

### API Endpoint Structure

```
ComfyUI Server: http://localhost:8188

Endpoints:
- POST /prompt    - Queue a workflow
- GET  /queue     - Check queue status
- GET  /history   - Get execution history
- GET  /view      - Retrieve generated images
- WS   /ws        - WebSocket for real-time updates
```

### Python API Example

```python
import json
import urllib.request
import urllib.parse

COMFYUI_URL = "http://localhost:8188"

def queue_prompt(workflow_json: dict, client_id: str = "api_client"):
    """Queue a ComfyUI workflow for execution."""
    payload = {
        "prompt": workflow_json,
        "client_id": client_id
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    response = urllib.request.urlopen(req)
    return json.loads(response.read())

def modify_workflow(workflow: dict, modifications: dict) -> dict:
    """Modify specific node parameters in a workflow.

    Args:
        workflow: The workflow JSON
        modifications: Dict of {node_id: {param: value}}

    Example:
        modify_workflow(wf, {
            "3": {"seed": 12345},
            "6": {"text": "a cat"}
        })
    """
    for node_id, params in modifications.items():
        if node_id in workflow:
            for param, value in params.items():
                workflow[node_id]["inputs"][param] = value
    return workflow

# Example usage
with open("workflow_api.json", "r") as f:
    workflow = json.load(f)

# Modify seed and prompt
workflow = modify_workflow(workflow, {
    "3": {"seed": 42},           # KSampler node
    "6": {"text": "a red fox in snow"}  # CLIP encode node
})

result = queue_prompt(workflow)
print(f"Queued with ID: {result['prompt_id']}")
```

### JavaScript API Example

```javascript
const COMFYUI_URL = "http://localhost:8188";

async function queuePrompt(workflow, clientId = "api_client") {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId
    })
  });
  return response.json();
}

// WebSocket for real-time updates
function connectWebSocket(clientId) {
  const ws = new WebSocket(`ws://localhost:8188/ws?clientId=${clientId}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "executing") {
      console.log(`Executing node: ${data.data.node}`);
    } else if (data.type === "executed") {
      console.log("Generation complete!");
      // Retrieve images from /view endpoint
    }
  };

  return ws;
}
```

---

## Workflow Recipes

### Recipe 1: Portrait with Face Fix

Perfect for character portraits with consistent face quality.

```json
{
  "workflow_name": "Portrait with FaceDetailer",
  "nodes": [
    "CheckpointLoaderSimple → SDXL base",
    "CLIPTextEncode → portrait prompt",
    "EmptyLatentImage → 896x1152 (3:4)",
    "KSampler → steps: 35, cfg: 6.5, dpmpp_2m_sde",
    "VAEDecode",
    "FaceDetailer → auto-enhance faces",
    "SaveImage"
  ],
  "recommended_settings": {
    "denoise_facedetailer": 0.4,
    "guide_size": 384
  }
}
```

### Recipe 2: Consistent Character Series

Generate multiple images of the same character.

```json
{
  "workflow_name": "Character Consistency",
  "nodes": [
    "CheckpointLoaderSimple",
    "LoraLoader → character LoRA (strength: 0.8)",
    "CLIPTextEncode → 'trigger_word, [outfit], [pose], [setting]'",
    "EmptyLatentImage → batch_size: 4",
    "KSampler → FIXED SEED for consistency",
    "VAEDecode",
    "SaveImage"
  ],
  "tips": [
    "Keep seed fixed across generations",
    "Change only outfit/pose/setting in prompt",
    "Use character LoRA for face consistency"
  ]
}
```

### Recipe 3: Image-to-Video Pipeline

Convert a still image to video using SVD.

```json
{
  "workflow_name": "Image to Video (SVD)",
  "nodes": [
    "LoadImage → high quality still (min 576x1024)",
    "ImageResize → 576x1024 if needed",
    "SVD_img2vid_Conditioning → motion_bucket: 127, fps: 8",
    "CheckpointLoader → svd_xt.safetensors",
    "KSampler → steps: 20, cfg: 2.5, euler_ancestral",
    "VAEDecode",
    "VHS_VideoCombine → format: mp4, fps: 8"
  ],
  "recommended_settings": {
    "motion_bucket_id": "100-150 for moderate motion",
    "augmentation_level": "0.0 for clean, 0.02 for slight variation"
  }
}
```

### Recipe 4: ControlNet Pose Transfer

Apply a pose from a reference image to a new generation.

```json
{
  "workflow_name": "Pose Transfer",
  "nodes": [
    "LoadImage → reference pose image",
    "DWPreprocessor → extract pose skeleton",
    "ControlNetLoader → control_v11p_sd15_openpose",
    "ControlNetApply → strength: 0.85",
    "CheckpointLoaderSimple → SD1.5 or SDXL",
    "CLIPTextEncode → new subject description",
    "EmptyLatentImage",
    "KSampler",
    "VAEDecode → SaveImage"
  ]
}
```

### Recipe 5: Flux Text Generation

Generate images with accurate text rendering.

```json
{
  "workflow_name": "Flux Text Rendering",
  "nodes": [
    "CheckpointLoaderSimple → flux1-dev.safetensors",
    "DualCLIPLoader → load T5 + CLIP-L",
    "CLIPTextEncode → 'A sign that says \"HELLO WORLD\"'",
    "EmptyLatentImage → 1024x1024",
    "KSampler → steps: 20, cfg: 3.5, euler, simple",
    "VAEDecode → SaveImage"
  ],
  "text_tips": [
    "Put text in quotes within the prompt",
    "Keep text short (2-4 words optimal)",
    "Describe the sign/surface holding the text"
  ]
}
```

---

## LLM Agent Helper Functions

### Workflow Builder Function

```javascript
/**
 * Build a basic ComfyUI workflow programmatically
 * @param {Object} config - Workflow configuration
 * @returns {Object} - ComfyUI API-format workflow
 */
function buildBasicWorkflow(config) {
  const {
    checkpoint = "sdxl_base.safetensors",
    positivePrompt,
    negativePrompt = "blurry, low quality, distorted",
    width = 1024,
    height = 1024,
    seed = Math.floor(Math.random() * 1000000),
    steps = 30,
    cfg = 7.0,
    sampler = "dpmpp_2m_sde",
    scheduler = "karras"
  } = config;

  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": checkpoint }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": positivePrompt, "clip": ["1", 1] }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": negativePrompt, "clip": ["1", 1] }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": sampler,
        "scheduler": scheduler,
        "denoise": 1.0
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["5", 0], "vae": ["1", 2] }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": { "images": ["6", 0], "filename_prefix": "ComfyUI" }
    }
  };
}
```

### Model Selector Function

```javascript
/**
 * Select optimal model configuration based on requirements
 * @param {Object} requirements - Generation requirements
 * @returns {Object} - Model configuration
 */
function selectModelConfig(requirements) {
  const {
    needsTextRendering = false,
    needsSpeed = false,
    needsAnime = false,
    vramLimit = 24,
    needsVideo = false
  } = requirements;

  // Video requirements
  if (needsVideo) {
    return {
      checkpoint: "svd_xt.safetensors",
      sampler: "euler_ancestral",
      scheduler: "karras",
      steps: 20,
      cfg: 2.5,
      notes: "Use SVD_img2vid_Conditioning node"
    };
  }

  // Text rendering priority
  if (needsTextRendering) {
    return {
      checkpoint: vramLimit >= 12 ? "flux1-dev.safetensors" : "sdxl_base.safetensors",
      sampler: "euler",
      scheduler: "simple",
      steps: 20,
      cfg: 3.5,
      notes: "Use DualCLIPLoader for Flux"
    };
  }

  // Speed priority
  if (needsSpeed) {
    return {
      checkpoint: "sdxl_turbo.safetensors",
      sampler: "euler_ancestral",
      scheduler: "normal",
      steps: 4,
      cfg: 1.0,
      notes: "Turbo models need very low steps and cfg"
    };
  }

  // Anime priority
  if (needsAnime) {
    return {
      checkpoint: "ponyDiffusionXL.safetensors",
      sampler: "dpmpp_2m_sde",
      scheduler: "karras",
      steps: 35,
      cfg: 6.5,
      notes: "Include score tags: score_9, score_8_up"
    };
  }

  // VRAM-limited
  if (vramLimit < 8) {
    return {
      checkpoint: "sd15_base.safetensors",
      sampler: "dpmpp_2m",
      scheduler: "karras",
      steps: 25,
      cfg: 7.5,
      resolution: { width: 512, height: 512 },
      notes: "Use --lowvram flag"
    };
  }

  // Default: SDXL balanced
  return {
    checkpoint: "sdxl_base.safetensors",
    sampler: "dpmpp_2m_sde",
    scheduler: "karras",
    steps: 30,
    cfg: 7.0,
    resolution: { width: 1024, height: 1024 }
  };
}
```

### Resolution Calculator

```javascript
/**
 * Calculate optimal resolution for a given aspect ratio and model
 * @param {string} aspect - Aspect ratio (e.g., "16:9", "1:1")
 * @param {string} model - Model type ("sd15", "sdxl", "flux")
 * @returns {Object} - Width and height
 */
function calculateResolution(aspect, model = "sdxl") {
  const baseResolutions = {
    sd15: 512,
    sdxl: 1024,
    flux: 1024
  };

  const aspectRatios = {
    "1:1": [1, 1],
    "16:9": [16, 9],
    "9:16": [9, 16],
    "4:3": [4, 3],
    "3:4": [3, 4],
    "3:2": [3, 2],
    "2:3": [2, 3],
    "21:9": [21, 9]
  };

  const base = baseResolutions[model] || 1024;
  const [w, h] = aspectRatios[aspect] || [1, 1];

  // Calculate dimensions maintaining aspect ratio and pixel count
  const totalPixels = base * base;
  const ratio = w / h;

  let width = Math.sqrt(totalPixels * ratio);
  let height = width / ratio;

  // Round to nearest 64
  width = Math.round(width / 64) * 64;
  height = Math.round(height / 64) * 64;

  return { width, height };
}

// Examples:
// calculateResolution("16:9", "sdxl") → { width: 1344, height: 768 }
// calculateResolution("9:16", "sdxl") → { width: 768, height: 1344 }
```

### Prompt Enhancer

```javascript
/**
 * Enhance a basic prompt with quality tags based on model
 * @param {string} prompt - Basic user prompt
 * @param {string} model - Model type
 * @param {string} style - Style preference
 * @returns {Object} - Enhanced positive and negative prompts
 */
function enhancePrompt(prompt, model = "sdxl", style = "photorealistic") {
  const qualityTags = {
    sdxl: {
      photorealistic: "masterpiece, best quality, highly detailed, sharp focus, 8k uhd",
      anime: "masterpiece, best quality, detailed anime style",
      artistic: "masterpiece, artistic, painterly, expressive"
    },
    flux: {
      photorealistic: "professional photography, sharp details, natural lighting",
      anime: "", // Flux handles prompts more literally
      artistic: "artistic style, creative composition"
    },
    sd15: {
      photorealistic: "masterpiece, best quality, highly detailed, realistic",
      anime: "masterpiece, best quality, anime style, detailed",
      artistic: "masterpiece, artistic, detailed illustration"
    }
  };

  const negativePrompts = {
    sdxl: {
      photorealistic: "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text",
      anime: "blurry, low quality, bad anatomy, extra limbs, missing limbs, text",
      artistic: "blurry, low quality, amateur"
    },
    flux: {
      // Flux often works better with minimal negatives
      photorealistic: "blurry, distorted",
      anime: "",
      artistic: ""
    },
    sd15: {
      photorealistic: "blurry, low quality, distorted, deformed, ugly, bad anatomy",
      anime: "blurry, low quality, bad anatomy, extra fingers",
      artistic: "blurry, low quality"
    }
  };

  const quality = qualityTags[model]?.[style] || "";
  const negative = negativePrompts[model]?.[style] || "blurry, low quality";

  return {
    positive: quality ? `${prompt}, ${quality}` : prompt,
    negative: negative
  };
}
```

---

## Quick Reference Card

### Essential Keyboard Shortcuts (ComfyUI)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Queue prompt |
| `Ctrl+Shift+Enter` | Queue prompt (front of queue) |
| `Space` | Open node search |
| `Ctrl+M` | Mute selected node |
| `Ctrl+B` | Bypass selected node |
| `Ctrl+C/V` | Copy/paste nodes |
| `Ctrl+G` | Group selected nodes |

### Node Connection Colors

| Color | Data Type |
|-------|-----------|
| **Pink** | MODEL |
| **Yellow** | CLIP |
| **Red** | VAE |
| **Purple** | LATENT |
| **Green** | IMAGE |
| **Cyan** | CONDITIONING |
| **Orange** | MASK |

### Quick Settings Reference

| Setting | SD1.5 | SDXL | Flux |
|---------|-------|------|------|
| Resolution | 512x512 | 1024x1024 | 1024x1024 |
| CFG | 7-8.5 | 5-7 | 3-4 |
| Steps | 20-30 | 30-40 | 20-25 |
| Sampler | dpmpp_2m | dpmpp_2m_sde | euler |
| Scheduler | karras | karras | simple |

---

*Document Version: 2.0 | Last Updated: January 2026 | Optimized for LLM Agent Consumption*
