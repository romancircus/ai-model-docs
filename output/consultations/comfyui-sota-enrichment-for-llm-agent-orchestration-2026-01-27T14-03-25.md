# ComfyUI SOTA Enrichment for LLM Agent Orchestration
**Date**: 2026-01-27T14:03:25.372Z
**Duration**: 58.9s
**Model**: gemini-3-pro-preview
**Thinking Level**: high
**Search Grounding**: true

## Token Usage
- Prompt tokens: 80,971
- Thoughts tokens: 1,478
- Output tokens: 3,355
- Total tokens: 85,804

---

## GEMINI'S THINKING PROCESS

**My ComfyUI SOTA Enrichment Guide Thought Process**

Alright, let's break this down. My goal is to craft a top-tier ComfyUI enrichment guide, tailored for a hypothetical January 2026 LLM agent (Claude Code Opus 4.5) running ComfyUI on an RTX 5090 (32GB VRAM). The target is *actionable*, *agent-readable*, and of the highest quality, comparable to that Kling guide we're referencing. Here's how I'm thinking about it:

1.  **Understanding the Scope**: First off, what's the mission? Deliverance! We are giving this agent the keys to the future of media generation.

    *   I need to absorb the existing documents: `COMFYUI_ORCHESTRATION.md`, `MASSMEDIAFACTORY_MCP.md`, `Get_Started_ComfyUI.md`, and the "Kling Guide." Plus, any relevant code snippets from the MCP server.
    *   I have to factor in the hypothetical 2026 timeframe with advanced SOTA models: Flux.2, Qwen-Image, LTX-2, and Wan 2.6.
    *   The guide must be *specifically* designed for this new hardware setup.

2.  **The "Before" Picture**: Let's assess the current docs.

    *   `COMFYUI_ORCHESTRATION.md`: A decent starting point. Good structure, JSON is the backbone, and has a grasp of base nodes, but it's not geared towards these *future* SOTA models.
    *   `MASSMEDIAFACTORY_MCP.md`: The MCP code has a SOTA tracker, good. I need to make the agent aware of this logic, so it doesn't just blindly invoke tools, but understands the *strategy*.
    *   The `sota.py` and `vram.py` scripts: These are gold mines! The documentation *must* expose the logic within these files.

3.  **The January 2026 Landscape (Mental Modeling)**: Let's do a quick mental simulation.

    *   *Image:* Flux.1 is ancient, Flux.2 will likely be the realism champ. Qwen-Image-2512 is the layout virtuoso.
    *   *Video:* LTX-Video (LTX-2) is the champion for sound. Wan 2.6 is the motion specialist. I'm assuming HunyuanVideo 1.5 would probably be a player in the cinematic space.
    *   *Hardware:* RTX 5090 (32GB). Huge VRAM, but *not* infinite.
    *   *Constraint:* fp16 LTX-2 (19B params) would be ~38GB -> OOM. We *have* to use fp8 for this model. Flux.2 is likely in the 12B-20B range, meaning fp16 should be feasible.

4.  **Crafting the Guide – Section by Section**: Now, let's get into the structure.

    *   **1. Gap Analysis**: What's missing from the existing docs?
        *   The guide currently assumes standard SDXL workflows work for everything. We need to create rigid node graphs. Different schedulers/guiders are needed for Flux and LTX.
        *   VRAM management is missing. Specify fp8 vs fp16 rules.
        *   We need to have a concrete prompting guide based on which model is selected.
    *   **2. SOTA Model Reference**: Time for a "Fact Sheet."
        *   *Flux.2-dev:* The default for realism, and requires `FluxGuidance`.
        *   *Qwen-Image-2512:* The graphic designer, and requires `ModelSamplingAuraFlow`.
        *   *LTX-2 19B:* The "director," audio-native. Needs fp8.
        *   *Wan 2.6:* The "physicist." High motion.
    *   **3. RTX 5090 Optimization**: Here's how to harness this hardware:
        *   32GB is the *danger zone* for models over 19B in fp16.
        *   Image models -> fp16 (Quality). Video models -> fp8 (Capacity/Frames).
        *   Sequential unloading is critical. No running Flux + Wan at the same time.
    *   **4. Workflow Pattern Library**: Let's build some "recipes."
        *   We need complex chains.
        *   *Pattern 1:* Text -> Image (Qwen) -> Video (LT



---

## GEMINI'S RESPONSE

# ComfyUI SOTA Orchestration Enrichment

## 1. Gap Analysis Summary

Based on the review of the current documentation against the capabilities of an RTX 5090 and the January 2026 SOTA landscape, the following gaps must be addressed to enable autonomous agent orchestration.

| Area | Current State | Missing Information (Gap) | Risk |
|------|---------------|---------------------------|------|
| **Model Selection** | Generic SDXL/Flux mentions | Specific guidance on **Flux.2**, **Qwen-Image**, **LTX-2**, **Wan 2.6**. | Agent uses outdated models; poor text/motion quality. |
| **VRAM Strategy** | Generic "Free Memory" | **RTX 5090 Specifics**: When to enforce `fp8` vs `fp16` (32GB limit). | OOM on LTX-2 (19B) or Wan 2.6 if loaded in fp16. |
| **Node Graph** | Basic KSampler patterns | **Model-Specific Graphs**: `FluxGuidance`, `AuraFlow`, `LTXVScheduler`. | Broken workflows; noise generation instead of images. |
| **Prompting** | Basic text prompts | **Modal Prompting**: Instructional (Qwen) vs. Descriptive (Flux) vs. Motion Delta (Video). | Poor adherence; static videos. |
| **Pipelines** | Single workflow examples | **Chained Execution**: Passing outputs from Image Gen → Video Gen without re-upload. | Inefficient execution; context loss between stages. |
| **Quality QA** | "Monitor via WS" | **Programmatic QA**: Using VLMs to score output before returning to user. | Agent returns hallucinations or black images. |

---

## 2. SOTA Model Reference (January 2026)

*Note: File paths assume standard ComfyUI `models/` structure.*

### 2.1 Image Generation Models

| Model | **FLUX.2-dev** | **Qwen-Image-2512** | **Z-Image-Turbo** |
|-------|----------------|---------------------|-------------------|
| **Best For** | Photorealism, anatomy, artistic style | **Text rendering**, UI layouts, posters, OCR | Rapid iteration, drafts, batching |
| **Filename** | `flux2-dev.safetensors` | `qwen_image_2512_fp16.safetensors` | `z-image-turbo.safetensors` |
| **Loader** | `UNETLoader` | `UNETLoader` | `CheckpointLoaderSimple` |
| **Clip** | `t5xxl_fp16` + `clip_l` | `qwen_2.5_vl_7b` | `clip_l` |
| **Guidance** | `FluxGuidance` (Value: 3.5) | `ModelSamplingAuraFlow` (Shift: 3.1) | Standard CFG (Value: 1.5) |
| **Sampler** | `euler` / `simple` | `euler` / `simple` | `euler_ancestral` / `karras` |
| **Resolution** | 1024x1024 (Native) | 1296x1296 (Native) | 512x512 / 1024x1024 |
| **Prompt Style** | Descriptive / Natural | Instructional / Layout-focused | Tags / Short |

### 2.2 Video Generation Models

| Model | **LTX-2 19B** | **Wan 2.6** | **HunyuanVideo 1.5** |
|-------|---------------|-------------|----------------------|
| **Best For** | **Audio Sync**, Talking Heads, Narrative | **Physics**, High Motion, Action | Cinematic B-Roll, Aesthetic |
| **Filename** | `ltx-2-19b-dev-fp8.safetensors` | `wan2.6_i2v_fp8.safetensors` | `hunyuan-video-1.5.safetensors` |
| **Loader** | `CheckpointLoaderSimple` | `WanImageToVideo` | `HunyuanVideoLoader` |
| **Audio** | **Native Input** (VAE encodes audio) | No | No |
| **VRAM (5090)** | **MUST USE FP8** (19GB) | **Use FP8** (16GB) | FP16 OK (24GB) |
| **Scheduler** | `LTXVScheduler` | `WanVideoScheduler` | `HunyuanScheduler` |
| **Max Frames** | 241 (~10s @ 24fps) | 121 (~5s @ 24fps) | 129 (~5s @ 24fps) |

### 2.3 Auxiliary Models

| Type | Model Name | Filename | Usage Node |
|------|------------|----------|------------|
| **ControlNet** | **Flux.2 Union** | `Flux2UnionControlNet.safetensors` | `FluxControlNetApply` |
| **ControlNet** | **Qwen Canny** | `qwen_image_canny.safetensors` | `QwenControlNetApply` |
| **IP-Adapter** | **FaceID Plus v2** | `ip-adapter-faceid-plusv2.bin` | `IPAdapterApply` |
| **Upscaler** | **4x-UltraSharp** | `4x-UltraSharp.pth` | `ImageUpscaleWithModel` |

---

## 3. RTX 5090 32GB Optimization

While 32GB is generous, modern 19B+ parameter video models will OOM (Out of Memory) if loaded in `fp16`.

### 3.1 Precision Strategy Matrix

| Task | Model Class | Recommended Precision | VRAM Load | Headroom |
|------|-------------|-----------------------|-----------|----------|
| **Image Gen** | Flux.2 / Qwen | **fp16** | ~24 GB | 8 GB (Safe) |
| **Video Gen** | LTX-2 (19B) | **fp8** (MANDATORY) | ~19 GB | 13 GB (Safe) |
| **Video Gen** | Wan 2.6 | **fp8** | ~16 GB | 16 GB (Safe) |
| **Video Gen** | Hunyuan 1.5 | **fp16** | ~24 GB | 8 GB (Tight) |

### 3.2 Pipeline Management Rules
1.  **Sequential Unload:** When chaining Image → Video, **explicitly unload** the image model before loading the video model.
    *   *Endpoint:* `POST /free` with `{"unload_models": true}`
2.  **Tiled VAE:** For resolutions > 2048x2048 (Image) or > 1280x720 (Video), use `VAEDecodeTiled` to prevent VRAM spikes during decoding.
3.  **Latent Batching:** Keep video batch size = 1. RTX 5090 handles high frame counts (241 frames) better than multiple batches.

---

## 4. Workflow Pattern Library

### Pattern A: "The Director" (Image → Audio-Reactive Video)
**Goal:** Create a talking head or music video segment.

1.  **Stage 1 (Flux/Qwen):** Generate base image.
    *   *Node:* `SaveImage` (filename: `stage1_ref.png`)
2.  **Middleware:** Agent downloads image, validates, selects Audio file (`speech.wav`).
3.  **Stage 2 (LTX-2):**
    *   Input: `stage1_ref.png` (Image) + `speech.wav` (Audio).
    *   Node: `LTXVImgToVideo` + `LTXVAudioVAELoader`.
    *   Prompt: "speaking naturally, subtle head movements" (Motion Delta).

### Pattern B: "The Publisher" (Layout → Polish)
**Goal:** Create a high-quality poster with text.

1.  **Stage 1 (Qwen):** Generate layout with text instructions.
    *   *Prompt:* "Layout: Title 'FUTURE' top center bold. Cyberpunk city background."
2.  **Stage 2 (Flux.2 img2img):** Refine texture/lighting (low denoise 0.35).
    *   *Input:* Stage 1 output.
    *   *Prompt:* "Cyberpunk city, 8k, volumetric lighting, photorealistic."
    *   *ControlNet:* Use `Qwen Canny` to lock text structure.

### Pattern C: "The Iterator" (Draft → Upscale)
**Goal:** Fast iteration to find composition, then high-res final.

1.  **Stage 1 (Z-Image):** 4-batch generation @ 512x512 (Steps: 8).
2.  **Middleware:** VLM selects best seed/composition.
3.  **Stage 2 (Flux.2):** High-res generation @ 1024x1024 using selected seed.
4.  **Stage 3 (UltimateSDUpscale):** 2x Upscale to 2048x2048.

---

## 5. Agent Decision Trees

### 5.1 Model Selection Tree

```ascii
USER REQUEST
│
├── VIDEO?
│   ├── Needs Audio/Lip-Sync? ────► LTX-2 19B (fp8)
│   ├── Needs High Action/Physics? ► Wan 2.6 (fp8)
│   └── Needs Cinematic Beauty? ──► HunyuanVideo 1.5 (fp16)
│
└── IMAGE?
    ├── Specific Text/Layout? ────► Qwen-Image-2512
    ├── Photorealism/Beauty? ─────► FLUX.2-dev
    └── Fast Draft/Iterate? ──────► Z-Image-Turbo
```

### 5.2 Resolution & Ratio Logic

```ascii
TARGET ASPECT RATIO
│
├── 16:9 (Cinematic)
│   ├── Image ──► 1216 x 680 (Flux optimal bucket)
│   └── Video ──► 1280 x 720 (Standard 720p)
│
├── 9:16 (Social)
│   ├── Image ──► 680 x 1216
│   └── Video ──► 720 x 1280
│
└── 1:1 (Square)
    ├── Image ──► 1024 x 1024
    └── Video ──► 720 x 720 (LTX limit) or 960x960 (Wan)
```

### 5.3 Error Recovery Logic

```ascii
ERROR RECEIVED
│
├── "CUDA out of memory"
│   ├── First Occurrence ──► POST /free {unload: true}, Retry
│   ├── Second Occurrence ─► Switch Model Precision (fp16 -> fp8), Retry
│   └── Third Occurrence ──► Reduce Resolution by 25%, Retry
│
├── "Sizes must match"
│   └── Action ──► Insert `ImageScaleToTotalPixels` node before KSampler
│
└── "Connection refused"
    └── Action ──► Check if ComfyUI is running; Wait 5s; Retry
```

---

## 6. Prompting Methodology

### 6.1 Flux.2 (Descriptive)
*   **Style:** Natural language, verbose, describing the visual field.
*   **Structure:** `[Subject] [Context] [Lighting] [Style] [Camera]`
*   **Example:** "A close-up photograph of an elderly woman with deep wrinkles, silver hair catching the light, natural window lighting from the left, shot on 35mm Kodak Portra 400."

### 6.2 Qwen-Image (Instructional)
*   **Style:** Command-based, spatial, explicit layout.
*   **Structure:** `[Element 1] at [Position]. [Element 2] at [Position]. [Style].`
*   **Example:** "Design a movie poster. Title 'MIDNIGHT' at the top center, bold white font. Silhouette of a detective in the middle. City skyline at the bottom."

### 6.3 Video Motion (The "Delta" Rule)
*   **Rule:** **Never describe the static subject if using Image-to-Video.** Describe only the *movement*.
*   **Bad:** "A red dragon with scales." (Redundant, confuses model).
*   **Good:** "The dragon turns its head slowly, smoke billows from nostrils, camera pans right."

### 6.4 Negative Prompt Templates

| Model | Template |
|-------|----------|
| **Flux** | `blurry, low quality, distorted, watermark, text, logo, oversaturated, illustration, 3d render` |
| **Qwen** | `blurry, distorted text, misspelled, low quality, watermark, ugly, cropped` |
| **Video** | `static, frozen, morphing, glitch, shaky camera, distortion, watermarks` |

---

## 7. Documentation Improvements

To implement this enrichment, the following specific updates are recommended for `COMFYUI_ORCHESTRATION.md`:

1.  **Replace "Model-Specific Workflow Templates" Section:**
    *   *Action:* Deprecate SDXL examples. Insert the JSON templates for Flux.2, Qwen, and LTX-2 provided in the code files.
    *   *Rationale:* Agents copying SDXL workflows for Flux will fail (wrong conditioning nodes).

2.  **Add "RTX 5090 Configuration" Section:**
    *   *Action:* Insert the "Precision Strategy Matrix" (Section 3.1 above).
    *   *Rationale:* Prevents OOM loops on high-end hardware.

3.  **Update "Node Connection Rules":**
    *   *Action:* Add rules for `FluxGuidance` (connects to Conditioning) and `ModelSamplingAuraFlow` (connects to Model).
    *   *Rationale:* These are non-standard connections not found in SD1.5/SDXL.

4.  **Add "Prompt Engineering" Appendix:**
    *   *Action:* Add the Prompting Methodology (Section 6 above).
    *   *Rationale:* Drastically improves generation quality by matching prompt style to model architecture.

5.  **Enhance "Python Client" with Pipeline Support:**
    *   *Action:* Add the `execute_pipeline` helper function logic to the client code example.
    *   *Rationale:* Enables multi-stage generation without complex manual state management.
