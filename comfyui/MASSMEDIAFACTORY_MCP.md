# MassMediaFactory MCP Server

**Provider:** RomanCircus (Custom)
**Last Updated:** January 2026
**Purpose:** ComfyUI workflow orchestration for AI agents (Claude Code, Cursor, etc.)

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Philosophy: Workflow-First vs Asset-First](#philosophy-workflow-first-vs-asset-first)
4. [Tool Reference](#tool-reference)
5. [Workflow Templates](#workflow-templates)
6. [Asset Iteration Patterns](#asset-iteration-patterns)
7. [Publishing Workflow](#publishing-workflow)
8. [Comparison with joenorton/comfyui-mcp-server](#comparison-with-joenortoncomfyui-mcp-server)
9. [Troubleshooting](#troubleshooting)

---

## Overview

MassMediaFactory MCP is a Model Context Protocol server that enables AI assistants to **create, iterate, and maintain** ComfyUI workflows for local image and video generation.

### Key Differentiators

| Feature | MassMediaFactory | joenorton's MCP |
|---------|-----------------|-----------------|
| **SOTA Awareness** | Built-in model freshness checks | None |
| **VRAM Management** | Estimation before execution | None |
| **Workflow Validation** | Pre-flight error checking | None |
| **Batch Execution** | Parameter sweeps, pipelines | None |
| **Asset Iteration** | Regenerate with overrides | Regenerate with overrides |
| **Templates** | Pre-built SOTA workflows | User-provided JSON |

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MassMediaFactory MCP                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ Discovery │  │ Execution │  │   SOTA    │  │ Templates │       │
│  │           │  │           │  │  Tracker  │  │           │       │
│  │ - models  │  │ - queue   │  │           │  │ - Qwen    │       │
│  │ - nodes   │  │ - status  │  │ - freshness│ │ - FLUX.2  │       │
│  │ - search  │  │ - wait    │  │ - recommend│ │ - LTX-2   │       │
│  └───────────┘  └───────────┘  └───────────┘  │ - Wan 2.6 │       │
│                                                └───────────┘       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │   VRAM    │  │ Validation│  │  Assets   │  │ Publishing│       │
│  │           │  │           │  │           │  │           │       │
│  │ - estimate│  │ - pre-run │  │ - registry│  │ - export  │       │
│  │ - fits?   │  │ - fix     │  │ - iterate │  │ - manifest│       │
│  │ - free    │  │ - compat  │  │ - list    │  │ - compress│       │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
│                                                                     │
│                         ▼                                           │
│                   ComfyUI API                                       │
│               (http://localhost:8188)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Installation

### Prerequisites

- ComfyUI running locally (`http://localhost:8188` or custom URL)
- Python 3.10+
- Claude Code or another MCP-compatible client

### Install from PyPI

```bash
pip install comfyui-massmediafactory-mcp
```

### Install from Source

```bash
git clone https://github.com/romancircus/comfyui-massmediafactory-mcp
cd comfyui-massmediafactory-mcp
pip install -e .
```

### Configure Claude Code

```bash
# Standard installation
claude mcp add --transport stdio --scope user comfyui-massmediafactory \
    -- comfyui-massmediafactory-mcp

# From source
claude mcp add --transport stdio --scope user comfyui-massmediafactory \
    -- python -m comfyui_massmediafactory_mcp.server
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COMFYUI_URL` | `http://localhost:8188` | ComfyUI API endpoint |
| `COMFYUI_OUTPUT_DIR` | `/home/user/ComfyUI/output` | Output directory for assets |
| `COMFY_MCP_ASSET_TTL_HOURS` | `24` | Asset registry TTL |

---

## Philosophy: Workflow-First vs Asset-First

### MassMediaFactory: Workflow-First

Build workflows dynamically, validate before execution, track provenance:

```python
# 1. Check SOTA models
models = get_sota_models("image_gen")
# → Qwen-Image-2512, FLUX.2-dev (NOT FLUX.1-dev!)

# 2. Build workflow from template
workflow = create_workflow_from_template("qwen_txt2img", {
    "PROMPT": "a majestic dragon",
    "SEED": 42
})

# 3. Validate before running
validation = validate_workflow(workflow["workflow"])
if validation["valid"]:
    # 4. Execute with asset tracking
    result = execute_workflow(workflow["workflow"])
    output = wait_for_completion(result["prompt_id"])
    # → outputs include asset_id for iteration
```

### joenorton's MCP: Asset-First

Simple generation, focus on iteration:

```python
# Generate directly
result = generate_image(prompt="a dragon")
# → returns asset_id

# Iterate
result = regenerate(asset_id, cfg=4.5)
```

**When to use which:**
- **MassMediaFactory**: Production workflows, SOTA compliance, multi-stage pipelines
- **joenorton's**: Quick prototyping, simple one-off generations

---

## Tool Reference

### Discovery Tools

| Tool | Description |
|------|-------------|
| `list_checkpoints()` | List checkpoint models (.safetensors) |
| `list_unets()` | List UNET models (Flux, SD3, etc.) |
| `list_loras()` | List LoRA models |
| `list_vaes()` | List VAE models |
| `list_controlnets()` | List ControlNet models |
| `get_node_info(node_type)` | Get node schema (inputs/outputs) |
| `search_nodes(query)` | Search nodes by name/category |
| `get_all_models()` | Summary of all installed models |

### Execution Tools

| Tool | Description |
|------|-------------|
| `execute_workflow(workflow)` | Queue workflow, get prompt_id |
| `get_workflow_status(prompt_id)` | Check status (queued/running/completed) |
| `wait_for_completion(prompt_id)` | Wait and return outputs with asset_ids |
| `get_queue_status()` | Running/pending job counts |
| `interrupt_execution()` | Stop current workflow |
| `get_system_stats()` | GPU VRAM usage |
| `free_memory(unload_models)` | Free GPU memory |

### Asset Iteration Tools

| Tool | Description |
|------|-------------|
| `regenerate(asset_id, prompt, cfg, seed, ...)` | Re-run with overrides |
| `list_assets(session_id, limit)` | Browse recent generations |
| `get_asset_metadata(asset_id)` | Full provenance including workflow |
| `view_output(asset_id)` | Get asset URL and preview info |
| `cleanup_expired_assets()` | Remove expired assets |

### Publishing Tools

| Tool | Description |
|------|-------------|
| `publish_asset(asset_id, target_filename, ...)` | Export to web directory |
| `get_publish_info()` | Show publish configuration |
| `set_publish_dir(path)` | Configure publish directory |

### SOTA & Validation Tools

| Tool | Description |
|------|-------------|
| `get_sota_models(category)` | Current SOTA for category |
| `recommend_model(task, vram_gb)` | Best model for task |
| `check_model_freshness(model_name)` | Is model current or deprecated? |
| `get_model_settings(model_name)` | Optimal CFG, steps, sampler |
| `validate_workflow(workflow)` | Pre-flight validation |
| `validate_and_fix_workflow(workflow)` | Auto-fix common issues |
| `estimate_vram(workflow)` | VRAM usage estimate |
| `check_model_fits(model_name)` | Will model fit in VRAM? |

### Template & Batch Tools

| Tool | Description |
|------|-------------|
| `list_workflow_templates()` | Available templates |
| `get_template(name)` | Get template with placeholders |
| `create_workflow_from_template(name, params)` | Build executable workflow |
| `execute_batch_workflows(workflow, param_sets)` | Run multiple variations |
| `execute_parameter_sweep(workflow, sweep_params)` | Test parameter ranges |
| `execute_pipeline_stages(stages, params)` | Multi-stage pipelines |

---

## Workflow Templates

### Available Templates

| Template | Model | Type | Placeholders |
|----------|-------|------|--------------|
| `qwen_txt2img` | Qwen-Image-2512 | Text-to-Image | PROMPT, SEED, WIDTH, HEIGHT |
| `qwen_edit_background` | Qwen Image Edit 2511 | Background Replacement | IMAGE_PATH, EDIT_PROMPT, SEED, CFG, STEPS |
| `flux2_txt2img` | FLUX.2-dev | Text-to-Image | PROMPT, SEED, STEPS, CFG |
| `ltx2_txt2vid` | LTX-2 19B | Text-to-Video | PROMPT, SEED, FRAMES |
| `wan26_img2vid` | Wan 2.6 | Image-to-Video | IMAGE_PATH, PROMPT, SEED |

**Qwen Edit Background Critical Settings:**

| Setting | Value | Why |
|---------|-------|-----|
| **CFG** | 2.0-2.5 | PRIMARY color control. >4 causes oversaturation |
| **Denoise** | 1.0 (fixed) | Must be 1.0. Lower preserves original including background |
| **Latent** | EmptyQwenImageLayeredLatentImage | NOT VAEEncode. VAEEncode fails for background replacement |

```python
# Example: Background replacement
workflow = create_workflow_from_template("qwen_edit_background", {
    "IMAGE_PATH": "uploaded_photo.png",
    "EDIT_PROMPT": "Change the background to an outdoor playground. Keep the person exactly the same.",
    "CFG": 2.0,  # CRITICAL: Keep low
    "STEPS": 20,
    "SEED": 42
})
result = execute_workflow(workflow)
```

### Using Templates

```python
# List available templates
templates = list_workflow_templates()

# Get template with metadata
template = get_template("qwen_txt2img")
# → includes placeholders and default values

# Create executable workflow
workflow = create_workflow_from_template("qwen_txt2img", {
    "PROMPT": "A photorealistic portrait of a woman",
    "WIDTH": 1024,
    "HEIGHT": 1024,
    "SEED": 42
})

# Execute
result = execute_workflow(workflow["workflow"])
```

---

## Asset Iteration Patterns

### Basic Iteration Loop

```python
# 1. Generate initial image
result = execute_workflow(workflow)
output = wait_for_completion(result["prompt_id"])
asset_id = output["outputs"][0]["asset_id"]

# 2. View the result
info = view_output(asset_id)
print(f"Preview: {info['url']}")
print(f"Prompt: {info['prompt_preview']}")

# 3. Not right? Iterate with new seed
result = regenerate(asset_id, seed=None)  # None = random new seed
output = wait_for_completion(result["prompt_id"])

# 4. Better, but need higher CFG
result = regenerate(output["outputs"][0]["asset_id"], cfg=4.5)
output = wait_for_completion(result["prompt_id"])

# 5. Perfect! Publish it
final_asset_id = output["outputs"][0]["asset_id"]
publish_result = publish_asset(final_asset_id, target_filename="hero.png")
```

### Session-Based Browsing

```python
# Generate multiple variations
for seed in [42, 123, 456]:
    workflow = create_workflow_from_template("qwen_txt2img", {
        "PROMPT": "A dragon",
        "SEED": seed
    })
    result = execute_workflow(workflow["workflow"])
    wait_for_completion(result["prompt_id"])

# Browse all from this session
assets = list_assets(limit=10)
for asset in assets["assets"]:
    print(f"{asset['asset_id']}: {asset['prompt_preview']}")

# Pick the best and publish
publish_asset(assets["assets"][0]["asset_id"], target_filename="best_dragon.png")
```

### Parameter Sweep for Optimization

```python
# Find optimal CFG
template = get_template("flux2_txt2img")

results = execute_parameter_sweep(
    workflow=template,
    sweep_params={
        "CFG": [3.0, 3.5, 4.0, 4.5],
        "STEPS": [20, 30]
    },
    fixed_params={
        "PROMPT": "A detailed cityscape",
        "SEED": 42
    }
)

# Results organized by parameter combination
for combo, output in results["results"].items():
    print(f"{combo}: {output['outputs'][0]['filename']}")
```

---

## Publishing Workflow

### Demo Mode (Explicit Filename)

```python
# Publish with specific filename
result = publish_asset(
    asset_id=asset_id,
    target_filename="hero_image.png"
)
# → {"url": "/gen/hero_image.png", "path": "/project/public/gen/hero_image.png"}
```

### Library Mode (Auto-Naming + Manifest)

```python
# Publish with manifest tracking
result = publish_asset(
    asset_id=asset_id,
    manifest_key="product_shot_1"
)
# → {"url": "/gen/product_shot_1_20260127_103045.png", "manifest_updated": true}

# manifest.json is updated:
# {
#   "product_shot_1": {
#     "filename": "product_shot_1_20260127_103045.png",
#     "url": "/gen/product_shot_1_20260127_103045.png",
#     "published_at": "2026-01-27T10:30:45Z"
#   }
# }
```

### Auto-Detection

The server auto-detects publish directories in this order:
1. `public/gen/`
2. `static/gen/`
3. `assets/gen/`
4. `public/images/`
5. `static/images/`

Or set explicitly:
```python
set_publish_dir("/path/to/my/web/assets")
```

---

## Comparison with joenorton/comfyui-mcp-server

| Feature | MassMediaFactory | joenorton's |
|---------|-----------------|-------------|
| **Philosophy** | Workflow-first | Asset-first |
| **SOTA Awareness** | Built-in checks | None |
| **VRAM Estimation** | Before execution | None |
| **Workflow Validation** | Pre-flight | None |
| **Batch Execution** | Parameter sweeps, pipelines | None |
| **Templates** | Pre-built for SOTA models | User-provided JSON |
| **Asset Registry** | TTL-based, deduplication | TTL-based, ephemeral |
| **Regenerate** | Full override support | Full override support |
| **View Inline** | URL-based | Base64 preview |
| **Publishing** | Manifest + compression | Manifest + compression |
| **Transport** | stdio (Claude Code native) | streamable-http |

### When to Use MassMediaFactory

- Production workflows requiring SOTA compliance
- Multi-stage pipelines (image → video)
- VRAM-constrained environments
- Teams needing workflow validation

### When to Use joenorton's

- Quick prototyping
- Simple one-off generations
- Inline image preview (base64)
- HTTP-based integration

---

## Troubleshooting

### Asset Not Found

```
{"error": "ASSET_NOT_FOUND_OR_EXPIRED", "asset_id": "..."}
```

**Cause:** Asset TTL expired (default 24h) or server restarted.
**Fix:** Regenerate from workflow, or extend TTL via `COMFY_MCP_ASSET_TTL_HOURS`.

### Workflow Validation Errors

```
{"valid": false, "errors": ["Node type 'NonExistentNode' not found"]}
```

**Cause:** Workflow references missing nodes or models.
**Fix:** Run `validate_workflow()` before execution, install missing nodes.

### VRAM Overflow

```
{"error": "CUDA out of memory"}
```

**Cause:** Model too large for available VRAM.
**Fix:** Use `estimate_vram()` before execution, or `free_memory(unload_models=True)`.

### Publish Directory Not Found

```
{"error": "NO_PUBLISH_DIR", "message": "No publish directory configured..."}
```

**Cause:** No auto-detected publish directory.
**Fix:** Create `public/gen/` in project root, or use `set_publish_dir()`.

---

*Document Version: 1.0 | Last Updated: January 2026*
