# ComfyUI Agent Orchestration Deep Research
**Date**: 2026-01-27T04:39:40.252Z
**Duration**: 59.4s
**Model**: gemini-3-pro-preview
**Thinking Level**: high
**Search Grounding**: true

## Token Usage
- Prompt tokens: 48,705
- Thoughts tokens: 1,423
- Output tokens: 3,113
- Total tokens: 53,241

---

## GEMINI'S THINKING PROCESS

**Comprehensive Documentation for Coding Agents Orchestrating ComfyUI Workflows**

Okay, so here's how I see this, as a seasoned professional in this domain. My immediate goal is to create documentation that's *absolutely* usable by an AI agent, like Claude Code, to flawlessly run ComfyUI workflows. The user wants to, specifically, generate viral videos by transforming a reference image into a new art style and then generating a 4K video. This implies a clear multi-stage pipeline: Image-to-Image/Style Transfer, Video Generation, and Upscaling. We're talking about a significant challenge here, not just a simple task.

I need to understand the underlying mechanics, which means delving into workflow JSON structures, how the API works, orchestration methods for multi-stage processes, model-specific configurations for things like Flux, SDXL, Qwen, and LTX, how nodes interact, error handling considerations, and, of course, prompt engineering techniques.

I'm starting with a deep dive into the resources: ComfyUI docs, the production Python client, and workflow templates (Qwen, LTX). LTX docs are there as well.

The ComfyUI Python client is a good initial point. It shows how to upload images, queue prompts, handle WebSockets, and parse history, but it doesn't give a full guide on building the JSON data from scratch. So the documentation should connect using a static JSON file to generating a dynamic JSON file based on the intent of the user. The main ComfyUI docs cover nodes and connections well. I need to convert those concepts into a more formal structure that an agent can parse deterministically. Finally, the LTX docs cover video generation effectively, but need to be integrated into the overall pipeline logic. And those workflow templates, while useful as examples, need to be generalized into usable patterns.

Given this understanding, here's how I think the output should be structured, as the agent requires:

1.  Executive Summary
2.  Workflow JSON Schema (the "Grammar" of the system)
3.  Node Connection Rules (the "Syntax")
4.  Pipeline Templates (the "Recipes" for complex tasks)
5.  API Integration Patterns (the "Protocol")
6.  Error Handling Decision Tree (the "resilience")
7.  Model-Specific Quick Reference (the "Data")
8.  Prompt Engineering (the "Input")

Now, let's craft these sections, step by step:

*   **Executive Summary:** It's all about the "Agentic" approach. ComfyUI is a Directed Acyclic Graph (DAG) system, so determinism is absolutely crucial, and JSON is the language to make that happen.

*   **Workflow JSON Schema:** Here's where the rubber meets the road. It's *critical* to point out that the API format *differs* from the UI save format. The UI format is about `nodes`, `links`, and `groups`, which are visual. The API format is a dictionary mapping `node_id` to `inputs` and `class_type`. *Important*: Links in the API format are represented as `[node_id, slot_index]`. This is the single biggest "gotcha" for automated agents.

*   **Node Connection Rules (the "Type System"):** Let's define the fundamental data types: `MODEL`, `CLIP`, `VAE`, `LATENT`, `IMAGE`, `CONDITIONING`. Then, I'll build a compatibility matrix (or list) to ensure that the correct data flows. For example, a `KSampler` node *requires* a `MODEL`, `POSITIVE`, `NEGATIVE`, and a `LATENT`.

*   **Pipeline Templates (Multi-Stage):** For our viral video use case, consider Ref Image -> Style Transfer -> Video -> Upscale. The key is how to pass data between these stages. Two methods exist: Method A, one giant workflow. Hard to debug. Lots of VRAM. Method B, Chained API calls. Best for agents! Step 1 saves an image, and Step 2 loads it. I'll outline the chain: User Image. Stage 1: Qwen/Flux Style Transfer (Img2Img or ControlNet). Output: `style_image.png`. Stage 2: LTX Video Gen. Input: `style_image.png`. Output: `video.mp4`. Stage 3: Video Upscale (optional).

*   **API Integration Patterns:** Reference the `comfyui_client.py` logic. Key steps: Upload the image, then Modify the JSON (remember dynamic IDs), Queue the prompt, Monitor via WebSocket, and finally, Download the output. *Dynamic IDs are essential*. Agents will struggle with fixed IDs if templates merge. A UUID or incremental strategy for dynamic generation is the best option.



---

## GEMINI'S RESPONSE

# ComfyUI Agent Orchestration Guide

**Version:** 3.0 (Agent-Native)
**Purpose:** Definitive reference for Coding Agents (Claude, GPT-4o, etc.) to programmatically construct, execute, and monitor ComfyUI workflows.

---

## 1. Executive Summary

ComfyUI is a node-based execution engine for Stable Diffusion and Transformers. For an Agent, ComfyUI is a **state machine** that executes a **Directed Acyclic Graph (DAG)** defined in JSON.

**Critical Distinctions for Agents:**
1.  **API Format vs. UI Format:** You must generate the **API Format** (Prompt Format), not the visual UI format. The API format maps `Node ID` → `Inputs`.
2.  **Link Syntax:** In API JSON, a connection is an array: `["Source_Node_ID", Output_Slot_Index]`.
3.  **Determinism:** Given specific seeds and inputs, outputs are pixel-perfect reproducible.
4.  **State Management:** The server creates a queue. You must track `prompt_id` via WebSockets to map requests to results.

---

## 2. Workflow JSON Schema (API Format)

Agents must generate JSON strictly following this schema. Do not include visual data (x/y positions).

### Structure
```json
{
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "seed": 156680208700286,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],       // Link to Node 4, Slot 0
      "positive": ["6", 0],    // Link to Node 6, Slot 0
      "negative": ["7", 0],    // Link to Node 7, Slot 0
      "latent_image": ["5", 0] // Link to Node 5, Slot 0
    }
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly.ckpt"
    }
  }
}
```

### Dynamic Generation Rules
1.  **Node IDs:** Must be unique strings (e.g., "1", "2", "100"). Sequential integers are safest.
2.  **Links:** Format `[String(NodeID), Int(SlotIndex)]`.
3.  **Widgets:** Non-link inputs (strings, ints, floats) are passed directly as values.

---

## 3. Node Connection Rules (The Type System)

ComfyUI implies a strict type system. Connections are valid only if types match.

### Core Data Types & Flow
| Type | Color | Produced By | Consumed By |
|------|-------|-------------|-------------|
| **MODEL** | Purple | CheckpointLoader, LoRALoader, UNETLoader | KSampler, LoRALoader, IPAdapter |
| **CLIP** | Yellow | CheckpointLoader, DualCLIPLoader | CLIPTextEncode, LoraLoader |
| **VAE** | Red | CheckpointLoader, VAELoader | VAEEncode, VAEDecode |
| **CONDITIONING** | Orange | CLIPTextEncode, ControlNetApply | KSampler (positive/negative) |
| **LATENT** | Pink | EmptyLatentImage, VAEEncode, KSampler | KSampler, VAEDecode |
| **IMAGE** | Blue | LoadImage, VAEDecode | VAEEncode, SaveImage, ControlNetApply |
| **MASK** | Grey | LoadImage, SolidMask | Inpainting, SetLatentNoiseMask |

### Essential Connection Patterns

#### 1. Basic Generation (Txt2Img)
```mermaid
graph LR
    Checkpoint[CheckpointLoader] -->|MODEL| KSampler
    Checkpoint -->|CLIP| TextPos[CLIPTextEncode (Pos)]
    Checkpoint -->|CLIP| TextNeg[CLIPTextEncode (Neg)]
    Checkpoint -->|VAE| Decode[VAEDecode]
    TextPos -->|CONDITIONING| KSampler
    TextNeg -->|CONDITIONING| KSampler
    Empty[EmptyLatent] -->|LATENT| KSampler
    KSampler -->|LATENT| Decode
    Decode -->|IMAGE| Save[SaveImage]
```

#### 2. Image-to-Image (Img2Img)
*Replace `EmptyLatent` with:*
`LoadImage` -> `VAEEncode` -> `KSampler` (denoise < 1.0)

#### 3. ControlNet (Structure Guidance)
*Insert between TextEncode and KSampler:*
`CLIPTextEncode` -> `ControlNetApply` -> `KSampler`
*Requires:* `ControlNetLoader` and `LoadImage` -> `Preprocessor` -> `ControlNetApply`

---

## 4. Pipeline Templates (Multi-Stage Orchestration)

To achieve complex goals (e.g., "Viral Video from Reference"), chain workflows using the **Load/Save Handoff Pattern**.

**Strategy:** Do not create one massive JSON. Execute Stage 1, wait for file output, pass filename to Stage 2.

### Stage 1: Style Transfer (Qwen/Flux)
*Goal: Transform input reference to stylized biological art.*
1.  **Load:** `reference.png`
2.  **Nodes:** `QwenImageDiffsynthControlnet` or `Flux` + `Canny ControlNet`.
3.  **Prompt:** "Biological illustration of [Subject], intricate details, 8k..."
4.  **Output:** Saves `bio_style_v1.png`.

### Stage 2: Video Generation (LTX-Video)
*Goal: Animate the stylized image.*
1.  **Input:** Path to `bio_style_v1.png` (from Stage 1).
2.  **Nodes:** `LTXVImgToVideo`, `LTXVConditioning`.
3.  **Prompt:** "The creature breathes and looks around, cinematic lighting..."
4.  **Parameters:** `strength: 0.6` (preserves identity), `frames: 121`.
5.  **Output:** Saves `bio_anim_v1.mp4`.

### Stage 3: Audio Synthesis (Optional/Future)
*Goal: Add sound.*
1.  **Nodes:** `LTXVEmptyLatentAudio` (if LTX-2) or external Audio model.
2.  **Input:** Video latent or synchronized prompt.

---

## 5. API Integration Patterns

Use the provided `comfyui_client.py` as the implementation reference. Here is the logic flow an Agent must enforce:

### The Execution Loop
1.  **Upload Phase:**
    *   POST binary image data to `/upload/image`.
    *   **Capture response name:** The server may rename files (e.g., `image_001.png`). You *must* use the returned name in the JSON.

2.  **Construction Phase:**
    *   Load Template JSON.
    *   Inject Parameters (Seed, Prompt, Input Filenames).
    *   **Dynamic ID Fix:** If merging workflows, ensure Node IDs do not collide. Re-index if necessary.

3.  **Execution Phase:**
    *   WebSocket Connect: `/ws?clientId={uuid}`.
    *   Queue Prompt: POST JSON to `/prompt`.
    *   **Get Prompt ID:** Response contains `prompt_id`.

4.  **Monitoring Phase (WebSocket):**
    *   Listen for `executing`: Update progress bar.
    *   Listen for `execution_success`: Workflow done.
    *   Listen for `executed`: Contains `{node_id, output: {filenames: []}}`. **CRITICAL:** This is how you find the output filename.

5.  **Retrieval Phase:**
    *   GET `/view?filename={output_name}`.

---

## 6. Error Handling Decision Tree

Agents should implement this logic to handle failures autonomously.

```mermaid
graph TD
    Error[Error Detected] --> Type{Error Type?}
    
    Type -->|Connection Refused| Retry[Wait 5s & Retry connection]
    Type -->|404 Not Found| CheckPath[Verify file uploads/paths]
    
    Type -->|WebSocket: execution_error| AnalyzeMsg[Parse 'exception_message']
    
    AnalyzeMsg -->|Out of Memory (OOM)| OOMAction{Strategy}
    OOMAction -->|Method 1| Free[Call /free endpoint]
    OOMAction -->|Method 2| Tiled[Switch to VAEDecodeTiled]
    OOMAction -->|Method 3| Restart[Restart ComfyUI Service]
    
    AnalyzeMsg -->|Node Missing| Fail[Fatal: Install Custom Node]
    AnalyzeMsg -->|Input Missing| FixInput[Check previous stage output]
    
    AnalyzeMsg -->|Timeout| IncTimeout[Increase timeout & Retry]
```

### specific Error Signatures
*   **"Sizes must match"**: You are connecting a 1024x1024 Latent to a 512x512 Image. Add an `ImageScale` or `LatentResize` node.
*   **"Input undefined"**: A link `[ID, Slot]` points to a node that doesn't exist or doesn't have that slot. Check JSON generation.

---

## 7. Model-Specific Quick Reference

Use these settings when generating JSON for specific models.

### Flux.1 (Dev/Schnell)
| Component | Node Type | Setting |
|-----------|-----------|---------|
| **Loader** | `UNETLoader` + `DualCLIPLoader` | `t5xxl_fp16` + `clip_l` |
| **Sampler** | `KSamplerSelect` | `euler` |
| **Scheduler** | `BasicScheduler` | `simple` |
| **Guidance** | `FluxGuidance` | Dev: `3.5`, Schnell: `1.0` |
| **Latent** | `EmptyLatentImage` | Multiples of 16 (e.g., 1024x1024) |

### LTX-Video (Image-to-Video)
| Component | Node Type | Setting |
|-----------|-----------|---------|
| **Resolution** | `LTXVImgToVideo` | 768x512 (Standard) or 1280x720 |
| **Frames** | `LTXVImgToVideo` | `8n + 1` (e.g., 121 for 5s) |
| **FPS** | `LTXVConditioning` | 24 |
| **Strength** | `LTXVImgToVideo` | `0.6` (Balanced) |
| **Prompt** | `CLIPTextEncode` | Describe **motion**, not the static subject. |

### Qwen-Image (Bio Generation)
| Component | Node Type | Setting |
|-----------|-----------|---------|
| **Loader** | `UNETLoader` | `qwen_image_2512_fp8...` |
| **VAE** | `VAELoader` | `qwen_image_vae.safetensors` |
| **ControlNet**| `QwenImageDiffsynthControlnet` | `strength: 0.85` |
| **Steps** | `KSampler` | 25 |
| **CFG** | `KSampler` | 3.0 |

---

## 8. Prompt Engineering Guidelines

Agents should construct prompts programmatically based on the user request.

### The "S.A.C.S." Framework
Construct prompts by joining these fields:
1.  **Subject:** Detailed description of the core object.
2.  **Action:** What is happening (vital for Video).
3.  **Context:** Environment, lighting, background.
4.  **Style:** Art style, medium, fidelity.

### Examples

**For Bio-Generation (Static):**
> **Prompt:** "A hyper-realistic biological diagram of a Pikachu, anatomical cutaway, muscle structure visible, scientific labeling, parchment texture, 8k resolution, macro photography style."
> **Negative:** "cartoon, anime, flat color, low quality, watermark"

**For LTX Video (Motion):**
> **Prompt:** "The creature turns its head slowly to the left, blinking its eyes, fur ruffling in a gentle wind, cinematic camera pan, volumetric lighting."
> **Note:** Do NOT describe the creature's colors/shape if using Img2Img; the image provides that. Describe the *movement*.

---

## 9. Helper Function Stub (Python)

When the agent needs to generate a workflow dynamically, use this structure:

```python
def build_workflow(mode="txt2img", model="flux", prompt="", seed=0):
    workflow = {}
    
    # 1. Define Nodes
    loader_id = "1"
    sampler_id = "3"
    save_id = "9"
    
    # 2. Add Loader
    if model == "flux":
        workflow[loader_id] = {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "flux1-dev.safetensors"}
        }
    
    # 3. Add Sampler
    workflow[sampler_id] = {
        "class_type": "KSampler",
        "inputs": {
            "model": [loader_id, 0],
            "seed": seed,
            "steps": 20,
            # ... other params
        }
    }
    
    # 4. Return
    return workflow
```
