# ComfyUI Documentation Gap Analysis & Improvement Recommendations
**Date**: 2026-01-28T02:16:27.835Z
**Duration**: 54.0s
**Model**: gemini-3-pro-preview
**Thinking Level**: high
**Search Grounding**: true

## Token Usage
- Prompt tokens: 72,503
- Thoughts tokens: 2,118
- Output tokens: 1,987
- Total tokens: 76,608

---

## GEMINI'S THINKING PROCESS

**Comprehensive Analysis and Recommendations for ComfyUI Workflow Alignment**

Okay, here's how I'm thinking about this task. The goal is to rigorously compare our current ComfyUI documentation, MCP templates, and server code against the "Official ComfyUI Workflow Patterns" for specific models (LTX-Video, Flux, Wan 2.1, and Qwen). My primary audience is LLM agents and developers who are building programmatic ComfyUI workflows, so precision and actionability are paramount.

First, I need to deeply *understand* these official patterns. *LTX-Video* utilizes very specific nodes like `LTXVConditioning`, `LTXVScheduler` (with those precise shift values!), and `SamplerCustom`, and crucially, adheres to that `8n+1` frame math. I need to make sure our code validates this. *Flux* is all about `DualCLIPLoader`, `FluxGuidance`, `ModelSamplingFlux` – note the preference for `SamplerCustom`. *Wan 2.1* is about those dedicated nodes: `WanVideoModelLoader`, `WanImageEncode`, `WanVAEDecode`. *Qwen* is centered around `QwenVLLoader`. And importantly, there's a strong preference for `SamplerCustom` over `KSampler` for advanced models.

Now, I'm diving into *our* stuff. The `Get_Started_ComfyUI.md` documentation has some good high-level concepts, but I need to make sure we're not recommending outdated approaches, especially with the use of `KSampler`. In the Orchestration guide, I need to flag the *Qwen* example. The template files are the core of our comparison. The `ltx2_txt2vid.json` template seems good on the surface, but I'm verifying all parameters and checking for the proper node usages. The `flux2_txt2img.json` template looks correct. The `wan26_img2vid.json` is where the first red flag pops up. Using that "all-in-one" node, `WanImageToVideo` is not aligned with the granular control shown in the official patterns. The `qwen_poster_design.json` also has a big mismatch with the official example – *AuraFlow* isn't the officially-preferred approach here. Finally, the server code structure looks sound, but I must add that validation logic for that `8n+1` frame rule for LTX.

The detailed comparisons start to form into clear patterns. For *LTX-Video*, we're mostly aligned, but I need to double-check that `LTXAVTextEncoderLoader` is a correct custom node, not a deviation from the official "CLIPLoader (separate!)". And it's important to note the audio node inclusion as "nice to have," not critical. *Flux* looks okay, we correctly use `FluxGuidance`. Although, it is missing the `ModelSamplingFlux` node, which might impact optimization. *Wan 2.1* is a bigger concern: the use of that all-in-one node is a deviation from the pattern. The *Qwen* template must get updated to the native Qwen nodes. And the general logic highlights a point about *KSampler*, which needs to be clarified in our documentation.

Synthesizing recommendations becomes critical. I'm focusing on actionable fixes. I will *break out* that all-in-one Wan node to align with the DAG structure. The Qwen template needs rewriting. Validation of the LTX video frame count must be implemented in the MCP server. I want to add `ModelSamplingFlux` to Flux templates. And the *Get_Started* guide needs an explicit update.

Now, I'm drafting the report. I'll include the following points: Executive Summary, Template Reviews, Missing Patterns (e.g., Wan T2V), and additions to the MCP server. I am thinking of adding validation and frame calculations to the server. I have to create this JSON code for the fix, right?

I must then provide those code "fixes." So, I'll write out the JSON structures for the correct Wan (granular) setup, and for the Qwen node.




---

## GEMINI'S RESPONSE

# ComfyUI Documentation Improvement Report

## Executive Summary
Our current documentation and MCP templates are generally high-quality and align well with the Flux and LTX-Video 2.0 standards. However, significant deviations exist in the **Wan 2.1** and **Qwen** workflows, where our templates utilize "all-in-one" wrapper nodes or architecture hacks (AuraFlow sampling) instead of the granular, official native nodes. This limits control and stability. Additionally, our validation logic in the MCP server lacks model-specific constraint checking (e.g., LTX `8n+1` frame rules), which is critical for programmatic video generation.

## 1. Template Accuracy Review

### Templates Correctly Aligned
- **ltx2_txt2vid / ltx2_img2vid**: ✅ **Excellent Alignment**. Correctly uses `LTXVScheduler`, `LTXVConditioning`, and `SamplerCustom`. Parameters (max_shift 2.05) match official docs.
- **ltx2_txt2vid_distilled**: ✅ **Aligned**. Correctly implements the Lightricks Gemma-3 prompt enhancement pipeline.
- **flux2_txt2img**: ⚠️ **Mostly Aligned**. Correctly uses `FluxGuidance` and `DualCLIPLoader`.
    - *Minor Issue:* Missing `ModelSamplingFlux` node (official pattern includes this for resolution shifting). We currently rely on the basic UNET loading which assumes 1024x1024 behavior.

### Templates Requiring Fixes
- **wan26_img2vid**: ❌ **Incorrect Architecture**.
    - *Issue:* Uses `WanImageToVideo` (likely a wrapper from `ComfyUI-Wan-Wrapper`) instead of the official granular node chain (`WanVideoModelLoader` → `WanImageEncode` → `WanSampler`).
    - *Impact:* Prevents granular control over sampling and VAE decoding; harder to debug.
    - *Fix:* Rewrite using the "Wan Node Pattern" defined in official docs.

- **qwen_poster_design / qwen_txt2img**: ❌ **Incorrect Architecture**.
    - *Issue:* Uses `UNETLoader` + `ModelSamplingAuraFlow`. This is a hack to force Qwen to run on generic attention nodes.
    - *Impact:* Suboptimal quality/performance compared to native implementation.
    - *Fix:* Switch to `QwenVLLoader` and `QwenVLTextEncode` as specified in official docs.

## 2. Missing Workflow Patterns

Based on the official sources, we are missing these high-value workflows:

1.  **Wan 2.1 Text-to-Video**: We only have I2V. The official docs list specific 14B 480p/720p T2V workflows.
2.  **Flux Fill (Inpainting/Outpainting)**: We have generic inpainting, but not the specific "Flux Fill" flow which is SOTA for region filling.
3.  **Flux Redux**: Missing style/structure mixing using the Redux model (SOTA for style transfer).
4.  **Hunyuan Video**: Mentioned in our docs but no template exists. It is a major competitor to LTX.

## 3. Documentation Gaps

### COMFYUI_ORCHESTRATION.md
- **SamplerCustom vs. KSampler**: The "Minimal Working Example" still uses `KSampler`. It should be updated to `SamplerCustom` to align with the "Common Patterns" section of the official docs, reinforcing best practices for video models.
- **Frame Calculation Math**: The guide mentions LTX constraints but doesn't provide the explicit formula `(frames - 1) % 8 == 0` in the troubleshooting section.

### Get_Started_ComfyUI.md
- **Model Loading**: Does not clearly distinguish between "All-in-one" loaders (`CheckpointLoaderSimple`) and "Component" loaders (`UNETLoader`/`DualCLIPLoader`) regarding when to use which.
- **Video Resolution**: LTX-Video resolution rules (must be divisible by 32 for optimal performance) are missing from the Resolution Guide.

## 4. MCP Server Improvements

### New Validation Logic
The `validate_workflow` tool is generic. It needs model-specific logic:
- **LTX Validator**: Check if `length` (frames) satisfies `(n-1) % 8 == 0`.
- **Flux Validator**: Check if `weight_dtype` matches the VRAM constraints provided in `estimate_vram`.

### New Utility Tools
- **Tool**: `calculate_video_params(model="ltx", duration_sec=5, fps=24)`
    - *Returns:* `{"frames": 121, "width": 768, "height": 512}` (Auto-corrects to nearest valid model constraints).

## 5. Prioritized Action Items

### High Priority (Critical for Reliability)
1.  **Rewrite `wan26_img2vid.json`**: Replace wrapper node with `WanVideoModelLoader` → `WanImageEncode` chain.
2.  **Rewrite `qwen_txt2img.json`**: Replace AuraFlow hack with `QwenVLLoader` chain.
3.  **Update LTX Validation**: Implement `8n+1` frame count check in `mcp.server.validation`.

### Medium Priority (Enhancement)
1.  **Update Flux Template**: Inject `ModelSamplingFlux` node between `FluxGuidance` and `BasicGuider` for better resolution handling.
2.  **Create `flux_redux.json`**: Add template for style transfer.
3.  **Update Orchestration Guide**: Replace the `KSampler` example with a `SamplerCustom` example to teach modern habits.

### Low Priority (Polish)
1.  **Add `calculate_video_params` tool**: Helper for agents to get math right.
2.  **Create Wan 2.1 T2V Template**: Add the text-to-video variant.

---

## Appendix: Specific Template Fixes

### Fix 1: Wan 2.1 Native Node Structure
*Replace the content of `wan26_img2vid.json` with:*

```json
{
  "1": {
    "class_type": "WanVideoModelLoader",
    "inputs": { "video_model": "Wan2.1-I2V-14B-480P.safetensors" }
  },
  "2": {
    "class_type": "CLIPLoader",
    "inputs": { "clip_name": "umt5_xxl_fp8.safetensors", "type": "wan" }
  },
  "3": {
    "class_type": "WanImageEncode",
    "inputs": {
      "video_model": ["1", 0],
      "image": ["LOAD_IMAGE_NODE_ID", 0]
    }
  },
  "4": {
    "class_type": "CLIPTextEncode",
    "inputs": { "clip": ["2", 0], "text": "{{PROMPT}}" }
  },
  "5": {
    "class_type": "CLIPTextEncode",
    "inputs": { "clip": ["2", 0], "text": "{{NEGATIVE}}" }
  },
  "6": {
    "class_type": "WanSampler",
    "inputs": {
      "model": ["3", 0],
      "positive": ["4", 0],
      "negative": ["5", 0],
      "image_embeds": ["3", 1],
      "steps": 30,
      "cfg": 5.0,
      "sampler_name": "uni_pc",
      "scheduler": "simple"
    }
  },
  "7": {
    "class_type": "WanVAEDecode",
    "inputs": { "samples": ["6", 0], "vae": ["1", 1] }
  }
}
```

### Fix 2: Flux with ModelSamplingFlux
*Insert this node into `flux2_txt2img.json` after FluxGuidance:*

```json
"6_5": {
    "class_type": "ModelSamplingFlux",
    "inputs": {
        "model": ["1", 0],
        "max_shift": 1.15,
        "base_shift": 0.5,
        "width": "{{WIDTH}}",
        "height": "{{HEIGHT}}"
    }
},
// Update BasicGuider input:
"10": {
    "class_type": "BasicGuider",
    "inputs": {
        "model": ["6_5", 0], // Connects to Sampling, not UNETLoader directly
        "conditioning": ["5", 0]
    }
}
```
