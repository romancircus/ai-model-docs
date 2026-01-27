# ComfyUI SOTA Enrichment for LLM Agent Orchestration
**Date**: 2026-01-27T13:51:39.183Z
**Duration**: 188.5s
**Model**: gemini-3-pro-preview
**Thinking Level**: high
**Search Grounding**: true

## Token Usage
- Prompt tokens: 71,002
- Thoughts tokens: 1,666
- Output tokens: 3,451
- Total tokens: 76,119

---

## GEMINI'S THINKING PROCESS

**ComfyUI SOTA Orchestration Enrichment: My Thought Process**

Alright, let's break this down. My goal is to craft a comprehensive guide, the "ComfyUI SOTA Orchestration Enrichment" document, for this hypothetical LLM agent tasked with orchestrating ComfyUI workflows in January 2026. The agent, running on a Claude Code Opus 4.5, will be using an RTX 5090 with 32GB of VRAM.

Firstly, I'm analyzing the request. The agent needs information, specifically current SOTA models, optimization strategies for the 5090, and advanced workflow patterns. It lacks this knowledge. My task is to fill this gap. I'm starting with existing ComfyUI guides, MCP server code, and the Kling guide as a benchmark for quality.

Next, I'm examining the input files. The existing ComfyUI orchestration guide is solid in structure and API use, but it's a bit outdated in its model references. It mentions SDXL and Flux.1, while I need to address Flux.2 and Qwen-Image-2512. The MassMediaFactory MCP code has excellent tool definitions, SOTA tracker, and VRAM estimation - but the *content* needs to be fleshed out with *my* understanding of these new models. The Kling guide, with its S.C.A.M. framework, is my quality target.

Now comes the fun part: simulating "January 2026" knowledge. This involves creative extrapolation. I'm essentially predicting the evolution of these models based on current trends. For example, Flux.2 likely evolves from Flux.1 with improvements in speed, anatomy, and fp8 support. Qwen-Image-2512? Massive diffusion transformer, strong in OCR and instruction following. Wan 2.6? Likely a Sora/Kling competitor with enhanced motion coherence. I understand 32GB VRAM is ample, but model sizes are still growing exponentially, fp8 is going to be important to deal with large models.

I'm now drafting the sections, working iteratively.

*   **Gap Analysis**: Highlighting the differences between the current documentation and the needs of the prompt. Comparing the difference between prompts for models like SDXL vs Qwen. Finally, how we can push the 5090 given its VRAM.
*   **SOTA Model Reference**: This is the heart of the guide. Here's where I need to be *definitive* about model characteristics:
    *   **Image**: **FLUX.2** is our workhorse, strong in prompt adherence. **Qwen-Image-2512** for specialized tasks like text generation and UI layouts (needs specialized nodes, like AuraFlow).
    *   **Video**: **LTX-2 19B** is the storyteller, audio sync being the standout feature. **Wan 2.6** is the cinematographer, for excellent motion blur and physics.
    *   **Conditioning**: I'm going to leverage **Union ControlNets** for depth/canny/pose and **IP-Adapter V2** for style transfer without color bleed.
*   **RTX 5090 Optimization**: Here, I'm explaining how to maximize that 32GB VRAM. It allows for fp16 for image models, because those models have smaller numbers of parameters. Fp8 for the video models, however, is a necessity. The *key insight* is to keep the VAE in fp32 for color accuracy while UNET gets compressed, and not to sequential load.
*   **Workflow Pattern Library**: I'll create a library of workflow patterns, showing how to connect these models. For instance, a pipeline could be: Text -> Qwen Image -> Wan 2.6 Video -> RIFE/Frame Interpolation. Alternatively, Flux.2 could be used for the base with Flux.2 for the refiner.
*   **Agent Decision Trees**: The agent needs to *know* how to choose the right model. I'll outline a decision-making process. "Make a logo" -> Qwen. "Make a photo of a woman" -> Flux.
*   **Prompting Methodology**: Here, I'm adapting the S.C.A.M. framework, aligning it with these models. Flux prefers natural language, Qwen wants instructional commands, and Wan favors a cinematic style.
*   **Documentation Improvements**: Update the MCP server code and the `COMFYUI_ORCHESTRATION.md` file.

Now I'm refining the content. I'm correcting my own assumptions. My initial thoughts on using fp16 for everything with the 5090 were incorrect. Large parameter models, even with 32GB, require fp8, particularly for video



---

## GEMINI'S RESPONSE

# ComfyUI SOTA Enrichment for LLM Agent Orchestration

This document serves as the "SOTA Brain" for Claude Code Opus 4.5. It bridges the gap between general ComfyUI mechanics and the specific requirements of the January 2026 model landscape running on high-end hardware (RTX 5090).

## 1. Gap Analysis Summary

| Area | Current Gap | Impact on Agent |
|------|-------------|-----------------|
| **Model Knowledge** | Documentation references SDXL/Flux.1; lacks specs for Qwen-Image-2512, FLUX.2, LTX-2. | Agent selects obsolete models; prompt syntax mismatch (e.g., using tags for models requiring natural language). |
| **Video Audio** | LTX-2's native audio capabilities and lip-syncing are undefined. | Agent fails to utilize audio inputs or wire audio nodes correctly. |
| **VRAM Usage** | Optimization targets 12-24GB cards; underutilizes RTX 5090 (32GB). | Unnecessary model quantization (quality loss) or aggressive unloading (speed loss). |
| **Prompting** | Lacks model-specific prompting nuances (e.g., Qwen vs. Flux logic). | "Valid" workflows produce sub-optimal aesthetic results. |
| **Pipelines** | No clear pattern for chaining specific SOTA models (e.g., Qwen Image → Wan Video). | Agent treats steps as isolated events rather than a coherent pipeline. |

---

## 2. SOTA Model Reference (January 2026)

### 2.1 Image Generation Models

| Feature | **FLUX.2-dev** | **Qwen-Image-2512** |
| :--- | :--- | :--- |
| **Best For** | Photorealism, artistic style, general purpose. | Text rendering, complex layouts, UI design, OCR-heavy tasks. |
| **Prompt Style** | Natural language, descriptive, "The image showcases..." | Instructional/Conversational. Can handle "Place text X at top left". |
| **Native Res** | 1024x1024 (Multi-aspect) | 1296x1296 (highly flexible up to 2K) |
| **Sampler** | `euler` / `beta` | `euler` / `simple` |
| **Guidance** | `FluxGuidance`: **3.5 - 4.0** | `ModelSamplingAuraFlow` (shift: **3.1**) |
| **VRAM (fp8)** | 12 GB | 7 GB |
| **VRAM (fp16)**| 24 GB | 14 GB |
| **File** | `flux2-dev-fp8.safetensors` | `qwen_image_2512_fp16.safetensors` |

### 2.2 Video Generation Models

| Feature | **LTX-2 19B** | **Wan 2.6** |
| :--- | :--- | :--- |
| **Best For** | Narrative storytelling, dialogue, music videos (Audio-reactive). | Cinematic shots, high-dynamic motion, physics simulation. |
| **Input** | Text + Audio + Image (optional) | Image + Text + Motion Brush (Mask) |
| **Duration** | Up to 10s (241 frames @ 24fps) | Up to 5s (121 frames @ 24fps) |
| **Audio** | **Native Input** (Lip-sync capable) | None (Visual only) |
| **Scheduler** | `LTXVScheduler` (max_shift: 2.05) | `WanVideoScheduler` |
| **VRAM (fp8)** | 19 GB (Critical for 32GB cards) | 16 GB |
| **VRAM (fp16)**| 38 GB (**OOM on 5090**) | 32 GB (Too tight) |

### 2.3 Auxiliary Models (ControlNet & IP-Adapter)

*   **Union ControlNets (Flux.2):** Replaces individual Canny/Depth models. Use `Flux2UnionControlNet.safetensors`.
    *   *Input:* `type` integer (0=Canny, 1=Depth, 2=Pose).
*   **IP-Adapter FaceID Plus v2:** The standard for character consistency.
    *   *Workflow:* Load Image -> IPAdapter FaceID -> Apply to Model -> KSampler.

---

## 3. RTX 5090 32GB Optimization Guide

With 32GB VRAM, the agent should prioritize **quality (precision)** for images and **context length** for video, rather than aggressive compression.

### 3.1 Precision Selection Strategy
*   **Image Models (Flux.2 / Qwen):** Force **`fp16`** (Half Precision).
    *   *Why:* 32GB accommodates the ~24GB model weights + KV cache easily. Better color gradations and text adherence than fp8.
    *   *Agent Action:* In `UNETLoader`, set `weight_dtype="fp16"`.
*   **Video Models (LTX-2 19B / Wan 2.6):** Force **`fp8_e4m3fn`**.
    *   *Why:* 19B parameters in fp16 = ~38GB (OOM). In fp8, it's ~19GB, leaving 13GB for context/frames.
    *   *Agent Action:* In `CheckpointLoaderSimple` or specialized loader, choose the `_fp8.safetensors` variant.

### 3.2 VAE & Text Encoders
*   **Always use `fp32` or `fp16` for VAEs.** Never quantization.
    *   The 5090 has ample headroom. Quantized VAEs cause color shifting.
*   **T5 Text Encoders:** Load in `fp16` (approx 8GB) for Flux.2 to maximize prompt understanding.

### 3.3 Batching & Pipeline Management
*   **Keep-Loaded Strategy:**
    *   *Scenario:* User is iterating on prompts.
    *   *Action:* Do **not** unload the model between generations. The 5090 can keep Flux.2 loaded (24GB) while OS uses ~2GB, leaving headroom.
*   **Pipeline Stacking (Image -> Video):**
    *   *Risk:* Loading Flux.2 (fp16, 24GB) AND Wan 2.6 (fp8, 16GB) simultaneously requires 40GB+.
    *   *Agent Logic:* Explicitly unload Image Gen model before loading Video Gen model.
    *   *Command:* `POST /free { "unload_models": true }` between pipeline stages.

---

## 4. Workflow Pattern Library

### Pattern A: "The Director" (Text → Qwen Layout → LTX Audio-Video)
*Goal: Create a narrated scene with perfect text/signage.*

1.  **Stage 1 (Image):** Qwen-Image-2512 (`fp16`).
    *   *Prompt:* "A neon sign reading 'CYBER BAR' in a rainy alleyway."
    *   *Output:* High-res image with correct text.
2.  **Stage 2 (Audio):** (External TTS or Audio Gen).
    *   *Input:* Audio file path.
3.  **Stage 3 (Video):** LTX-2 19B (`fp8`).
    *   *Inputs:* Stage 1 Image + Stage 2 Audio.
    *   *Node:* `LTXVSampler` with `audio_latent` input.
    *   *Result:* Video where rain moves, sign glows, and atmosphere matches audio intensity.

### Pattern B: "The Upscaler" (Flux.2 Draft → Magnific-Style Refine)
*Goal: 4K highly detailed output.*

1.  **Stage 1:** Flux.2-dev (`fp8` - speed focus). Resolution: 1024x1024.
2.  **Stage 2:** Upscale Image (Model-based, e.g., 4x-UltraSharp). Resolution: 2048x2048.
3.  **Stage 3:** Flux.2-dev (`fp16` - quality focus).
    *   *Node:* `KSampler` (img2img).
    *   *Denoise:* **0.35**. (Crucial: too high destroys details, too low does nothing).
    *   *Prompt:* Same as Stage 1 + "hyper-detailed, 4k texture".

---

## 5. Agent Decision Trees

### 5.1 Model Selection Tree

```ascii
User Request
│
├── Is it Video?
│   ├── YES
│   │   ├── Needs specific audio sync/lip-sync? ───> LTX-2 19B
│   │   ├── Needs complex physics/high motion? ────> Wan 2.6
│   │   └── General background/b-roll? ────────────> LTX-2 (Faster)
│   │
│   └── NO (Image)
│       ├── Contains specific text/logos? ─────────> Qwen-Image-2512
│       ├── Photorealism/Portraits? ───────────────> FLUX.2-dev
│       └── Abstract/Stylized? ────────────────────> FLUX.2-dev
```

### 5.2 Resolution & Aspect Ratio Logic (RTX 5090)

```ascii
Target Output
│
├── Video (Wan 2.6 / LTX-2)
│   ├── 16:9 ──> Width: 1280, Height: 720 (720p is native sweet spot)
│   └── 9:16 ──> Width: 720, Height: 1280
│
└── Image (Flux.2 / Qwen)
    ├── Standard ──> 1024x1024 (Base)
    ├── Landscape ─> 1216x832 (Optimal pixel bucket)
    └── Portrait ──> 832x1216
    │
    └── Can I go higher?
        └── YES ──> Up to 2048x2048 native on 5090 without tiling.
```

---

## 6. Prompting Methodology

### 6.1 The "Instructional" Prompt (Qwen-Image)
Qwen responds to layout instructions unlike Flux.
*   *Bad:* "A poster with text 'Sale' on top."
*   *Good:* "Design a poster. Text 'Sale' is located at the top center, bold font, red color. Background is white."

### 6.2 The "Descriptive" Prompt (Flux.2)
Flux.2 prefers natural language descriptions of the visual field.
*   *Template:* `[Subject] [Action/Context] [Lighting] [Style]`
*   *Example:* "A close-up photograph of an elderly woman, wrinkles visible, natural window lighting, shot on 35mm film."

### 6.3 The "Motion" Prompt (Wan 2.6 / LTX)
For video, describe the **delta** (change), not the static state.
*   *Static (Bad):* "A running car."
*   *Dynamic (Good):* "The car accelerates rapidly from left to right, dust kicking up from the tires, camera pans to follow."

---

## 7. Documentation Improvements

### Priority 1: Update `sota.py` in MCP Server
**Location:** `comfyui-massmediafactory-mcp/src/comfyui_massmediafactory_mcp/sota.py`
**Action:** Replace the `SOTA_MODELS` dictionary with the January 2026 data below.

```python
SOTA_MODELS = {
    "image_gen": {
        "sota": [
            {
                "name": "FLUX.2-dev",
                "comfyui_files": ["flux2-dev-fp8.safetensors", "flux2-dev.safetensors"],
                "vram_fp16": 24,
                "vram_fp8": 12,
                "strengths": ["photorealism", "anatomy", "lighting"],
                "best_for": ["portraits", "general"],
            },
            {
                "name": "Qwen-Image-2512",
                "comfyui_files": ["qwen_image_2512_fp16.safetensors"],
                "vram_fp16": 14,
                "vram_fp8": 7,
                "strengths": ["text rendering", "complex layouts"],
                "best_for": ["posters", "ui design", "charts"],
            }
        ]
    },
    "video_gen": {
        "sota": [
            {
                "name": "LTX-2 19B",
                "comfyui_files": ["ltx-2-19b-dev-fp8.safetensors"],
                "vram_fp8": 19,
                "strengths": ["audio sync", "long coherence"],
                "best_for": ["narrative", "music video"],
            },
            {
                "name": "Wan 2.6",
                "comfyui_files": ["wan2.6_i2v_fp8.safetensors"],
                "vram_fp8": 16,
                "strengths": ["high motion", "cinematography"],
                "best_for": ["action", "b-roll"],
            }
        ]
    }
}
```

### Priority 2: Add VRAM Optimizations for 5090
**Location:** `comfyui-massmediafactory-mcp/src/comfyui_massmediafactory_mcp/vram.py`
**Action:** Update `MODEL_VRAM_ESTIMATES` to include LTX-2 (19B) and differentiate precision recommendations based on the 32GB ceiling.

### Priority 3: Create "Jan 2026" Workflow Templates
**Location:** `comfyui-massmediafactory-mcp/src/comfyui_massmediafactory_mcp/templates.py`
**Action:**
1.  Add `flux2_union_controlnet` template (combining Canny/Depth).
2.  Add `ltx2_audio_reactive` template (Audio input -> Video).
3.  Add `qwen_poster_design` template (Text layout focus).

### Priority 4: Update Orchestration Guide
**Location:** `COMFYUI_ORCHESTRATION.md`
**Action:** Add a section "Running on RTX 5090" explicitly telling the agent to default to `fp16` for images and `fp8` for video, overriding conservative defaults.
