# ComfyUI Documentation

Node-based GUI for Stable Diffusion and modern diffusion models (Flux, SDXL, SD3.5).

## Files

| File | Purpose | Audience |
|------|---------|----------|
| `Get_Started_ComfyUI.md` | Comprehensive guide for image & video generation | All users |
| `COMFYUI_ORCHESTRATION.md` | **Agent orchestration guide** - programmatic workflow generation, API patterns, multi-stage pipelines | **Coding Agents** |
| `MASSMEDIAFACTORY_MCP.md` | **MCP Server documentation** - tool reference, asset iteration, publishing | **Coding Agents** |
| `COMFYUI_WORKFLOWS_REFERENCE.md` | Workflow templates (coming soon) | All users |

## For Coding Agents

If you're an LLM agent orchestrating ComfyUI:

### Option 1: MCP Server (Recommended)

Use **`MASSMEDIAFACTORY_MCP.md`** with the MassMediaFactory MCP server:

```bash
claude mcp add --transport stdio --scope user comfyui-massmediafactory \
    -- comfyui-massmediafactory-mcp
```

Features: SOTA model awareness, VRAM management, asset iteration, publishing.

### Option 2: Direct API

Use **`COMFYUI_ORCHESTRATION.md`** which includes:

- Workflow JSON schema and generation rules
- Node connection type system
- Multi-stage pipeline templates (Image → Style Transfer → 4K Video)
- Complete Python client with error recovery
- API endpoints reference
- Model-specific settings tables (Flux, SDXL, Qwen, LTX-Video)
- Prompt engineering frameworks (S.A.C.S.)

## Quick Reference

### Model Selection

| Task | Model | Resolution |
|------|-------|------------|
| High-quality realism | Flux.1 Dev | 1024x1024 |
| Fast generation | Flux.1 Schnell / SDXL Turbo | 512-1024 |
| General purpose | SDXL Base | 1024x1024 |
| Low VRAM | SD 1.5 | 512x512 |
| Image-to-Video | SVD / SVD-XT | 576x1024 |
| Text-to-Video | AnimateDiff | 512x512 |

### Sampler Quick Reference

| Model | Sampler | Scheduler | CFG |
|-------|---------|-----------|-----|
| Flux | euler | simple | 3.5 |
| SDXL | dpmpp_2m_sde | karras | 6.5 |
| SD1.5 | dpmpp_2m | karras | 7.5 |
| SVD | euler_ancestral | karras | 2.5 |

### VRAM Requirements

| Configuration | VRAM |
|---------------|------|
| SD1.5 @ 512px | 4GB |
| SDXL @ 1024px | 8GB |
| Flux (fp8) | 12GB |
| SVD | 12GB |

## Key Concepts

### The N.O.D.E. Framework

- **N - Navigate**: Load models (checkpoint, LoRA, ControlNet)
- **O - Orchestrate**: Set up conditioning (prompts)
- **D - Diffuse**: Configure sampler (steps, cfg, seed)
- **E - Export**: Decode and save output

### Essential Nodes

```
CheckpointLoader → CLIPTextEncode → KSampler → VAEDecode → SaveImage
                          ↑
                  EmptyLatentImage
```

## Code Quick Start

### Python API

```python
import json
import urllib.request

def queue_prompt(workflow: dict):
    data = json.dumps({"prompt": workflow}).encode()
    req = urllib.request.Request(
        "http://localhost:8188/prompt",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    return json.loads(urllib.request.urlopen(req).read())
```

### JavaScript API

```javascript
async function queuePrompt(workflow) {
  const res = await fetch("http://localhost:8188/prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow })
  });
  return res.json();
}
```

## Must-Have Custom Nodes

1. **ComfyUI-Manager** - Node installer and updater
2. **ComfyUI-Impact-Pack** - FaceDetailer, segmentation
3. **ComfyUI-VideoHelperSuite** - Video I/O
4. **rgthree-comfy** - Workflow organization
5. **ComfyUI-AnimateDiff-Evolved** - Video generation
