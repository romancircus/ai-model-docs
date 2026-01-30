# AI Model Docs - Agent Instructions

This repository contains canonical AI model documentation for all RomanCircus projects.

---

## Standing Orders

### 1. Never Embed Summaries

```javascript
// WRONG - Embedding weak summaries
const NANO_BANANA_BEST_PRACTICES = `
# Summary of Nano Banana...
`;

// CORRECT - Read actual notebook content
const content = await extractNotebookContent('docs/ai-models/gemini/Get_Started_Nano_Banana.ipynb');
```

### 2. Always Extract Notebook Content

When running Gemini consultations about prompting methodology:

```javascript
async function extractNotebookContent(notebookPath) {
  const content = await fs.readFile(notebookPath, 'utf-8');
  const notebook = JSON.parse(content);

  const sections = [];
  for (const cell of notebook.cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    if (!source || source.trim().length === 0) continue;
    if (source.includes('Apache License') || source.includes('Copyright')) continue;

    if (cell.cell_type === 'markdown') {
      sections.push(source);
    } else if (cell.cell_type === 'code') {
      // Include code but skip outputs
      if (source.includes('prompt =') || source.includes('client.models.generate')) {
        sections.push('```python\n' + source + '\n```');
      }
    }
  }
  return sections.join('\n\n');
}
```

### 3. Reference Paths

When this repo is added as a submodule at `docs/ai-models/`:

| Content | Path |
|---------|------|
| Nano Banana (Images) | `docs/ai-models/gemini/Get_Started_Nano_Banana.ipynb` |
| Veo (Video) | `docs/ai-models/gemini/Get_started_Veo.ipynb` |
| Kling (Video) | `docs/ai-models/kling/Get_Started_Kling.md` |

---

## Documentation Index

### Gemini (Google)

| File | Content | Use For |
|------|---------|---------|
| `gemini/Get_Started_Nano_Banana.ipynb` | Image generation best practices | First frame generation, character consistency |
| `gemini/Get_started_Veo.ipynb` | Video generation best practices | Veo 3/3.1 prompting, audio, dialogue |

**Key Nano Banana Features:**
- Character consistency via **chat mode** (recommended!)
- Multi-image mixing (up to 14 images with Pro)
- Aspect ratio & resolution tables (1K/2K/4K)
- Thinking mode with `include_thoughts=True`
- Search grounding with `tools=[{"google_search": {}}]`
- Prompt examples: 80s style, mini-figurine, stickers, sprites

**Key Veo Features:**
- Text-to-video prompting tips
- Control lighting, camera, audio, dialogs
- Image-to-video (first frame workflow)
- First & last frame control
- Reference-to-video (up to 3 images)
- Video extension (up to 148 seconds)
- Duration control (4/6/8 seconds with Veo 3.1)

### Kling (FAL.ai)

| File | Content | Use For |
|------|---------|---------|
| `kling/Get_Started_Kling.md` | Comprehensive prompting guide | All Kling workflows |
| `kling/KLING_API_REFERENCE.md` | API endpoints & parameters | Implementation |

**Key Kling Features:**
- S.C.A.M. prompting framework (Subject, Camera, Action, Mood)
- Text-to-video (v2.5, v2.6)
- Image-to-video (v2.1)
- Motion control (v2.6) - orientation modes
- Video editing (O1) - 4 generation modes
- Camera controls, special effects
- Negative prompt master lists by style
- LLM agent helper functions

### LTX Video (Lightricks - Open Source)

| File | Content | Use For |
|------|---------|---------|
| `ltx/Get_Started_LTX.md` | Comprehensive video + audio guide | Native audio-video generation |

**Key LTX Features:**
- A.V.S. prompting framework (Audio, Visual, Scene)
- **Local deployment** via diffusers or ComfyUI (open weights)
- Native synchronized audio generation (LTX-2 19B)
- Lip sync built-in
- 4K @ 50fps, up to 20 seconds
- LoRA training with Kohya/PEFT
- Open weights (Apache 2.0 for < $10M ARR)

### ComfyUI (Open Source)

| File | Content | Use For |
|------|---------|---------|
| `comfyui/Get_Started_ComfyUI.md` | Node-based workflow guide | Image & video pipelines |
| `comfyui/COMFYUI_ORCHESTRATION.md` | **Agent orchestration guide** | Programmatic workflow generation |
| `comfyui/MASSMEDIAFACTORY_MCP.md` | **MCP Server documentation** | Tool reference, asset iteration |

**Key ComfyUI Features:**
- N.O.D.E. workflow framework (Navigate, Orchestrate, Diffuse, Export)
- SDXL, Flux.2, Qwen-Image, LTX-2 support (SOTA January 2026)
- Video generation (LTX-Video, Wan 2.6, HunyuanVideo 1.5)
- ControlNet, LoRA, IP-Adapter integration
- API-first for programmatic control
- JSON workflow serialization

**For Coding Agents (COMFYUI_ORCHESTRATION.md):**
- Workflow JSON schema with link syntax
- Node connection type system
- Multi-stage pipeline templates (Image → Style Transfer → 4K Video)
- Complete Python client with error recovery
- Model-specific settings (Flux, SDXL, Qwen, LTX)
- S.A.C.S. prompting framework (Subject, Action, Context, Style)

**For MassMediaFactory MCP (MASSMEDIAFACTORY_MCP.md):**
- Discovery: `list_checkpoints()`, `search_nodes()`, `get_node_info()`
- Execution: `execute_workflow()`, `wait_for_completion()`
- **Asset Iteration**: `regenerate()`, `list_assets()`, `view_output()`
- **Publishing**: `publish_asset()`, `set_publish_dir()`
- **SOTA Awareness**: `get_sota_models()`, `check_model_freshness()`
- **VRAM Management**: `estimate_vram()`, `check_model_fits()`

### Qwen Models (Alibaba)

| File | Content | Use For |
|------|---------|---------|
| `qwen/Get_Started_Qwen_Image.md` | Local image generation guide | CPU-friendly image generation |
| `qwen/QWEN-IMAGE-EDIT-GUIDE.md` | Image editing workflow guide | Background replacement, scene editing |

**Key Qwen Features:**
- D.E.T.A.I.L. prompting framework
- Qwen-Image-2512 for generation
- **Qwen Image Edit 2511** for background replacement/scene editing
- Qwen-VL for vision understanding
- GGUF quantization (CPU deployment)
- Superior face/text rendering
- Ollama, vLLM deployment options

**Qwen Edit Critical Settings (MUST FOLLOW):**
| Setting | Value | Why |
|---------|-------|-----|
| CFG | **2.0-2.5** | PRIMARY color control. >4 = oversaturation |
| Denoise | **1.0** | Must be 1.0 for background changes |
| Latent | EmptyQwenImageLayeredLatentImage | NOT VAEEncode |

### LoRA Training

| File | Content | Use For |
|------|---------|---------|
| `lora-training/Get_Started_LoRA_Training.md` | Fine-tuning guide | Custom model training |

**Key LoRA Features:**
- Model-specific hyperparameters (Flux vs SDXL vs SD1.5)
- Tool comparison (Kohya SS, SimpleTuner, AI-Toolkit)
- Dataset preparation best practices
- Quality assessment guidelines
- ⚠️ WARNING: Do NOT apply SDXL recipes to Flux!

### Remotion (Video Framework)

| File | Content | Use For |
|------|---------|---------|
| `remotion/Get_Started_Remotion.md` | Programmatic video guide | React-based video creation |

**Key Remotion Features:**
- Frame-based React components
- Animation functions (interpolate, spring)
- AI content integration patterns
- Remotion Lambda for cloud rendering
- Remotion Player for embedding

---

## When to Use Which Model

### Image Generation

| Task | Recommended Model | Doc |
|------|-------------------|-----|
| Generate character image (API) | Gemini Image (Nano Banana) | `gemini/Get_Started_Nano_Banana.ipynb` |
| Generate first frame for video | Gemini Image (Nano Banana) | `gemini/Get_Started_Nano_Banana.ipynb` |
| Local image generation | Qwen-Image-2512 | `qwen/Get_Started_Qwen_Image.md` |
| CPU-only image generation | Qwen-Image-2512 GGUF | `qwen/Get_Started_Qwen_Image.md` |
| Image with text rendering | Flux or Qwen-Image-2512 | `comfyui/Get_Started_ComfyUI.md` |
| **Background replacement** | Qwen Image Edit 2511 | `qwen/QWEN-IMAGE-EDIT-GUIDE.md` |
| **Scene editing (local)** | Qwen Image Edit 2511 | `qwen/QWEN-IMAGE-EDIT-GUIDE.md` |
| Node-based workflows | ComfyUI | `comfyui/Get_Started_ComfyUI.md` |
| **Agent-orchestrated local gen** | MassMediaFactory MCP + ComfyUI | `comfyui/comfyui_massmediafactory_mcp.py` |

### Video Generation

| Task | Recommended Model | Doc |
|------|-------------------|-----|
| Text-to-video (Google) | Veo 3/3.1 | `gemini/Get_started_Veo.ipynb` |
| Image-to-video (Google) | Veo 3/3.1 | `gemini/Get_started_Veo.ipynb` |
| Text-to-video (FAL) | Kling v2.5/v2.6 | `kling/Get_Started_Kling.md` |
| Image-to-video (FAL) | Kling v2.1 | `kling/Get_Started_Kling.md` |
| Motion transfer | Kling v2.6 Motion Control | `kling/Get_Started_Kling.md` |
| Video editing | Kling O1 | `kling/Get_Started_Kling.md` |
| Video with dialogue/audio | LTX-2 | `ltx/Get_Started_LTX.md` |
| Lip sync video | LTX-2 | `ltx/Get_Started_LTX.md` |
| Local video (ComfyUI) | SVD / AnimateDiff | `comfyui/Get_Started_ComfyUI.md` |

### Model Customization

| Task | Recommended Tool | Doc |
|------|------------------|-----|
| Train Flux LoRA | SimpleTuner / AI-Toolkit | `lora-training/Get_Started_LoRA_Training.md` |
| Train SDXL LoRA | Kohya SS | `lora-training/Get_Started_LoRA_Training.md` |
| Train video LoRA | FAL.ai Video Trainer | `ltx/Get_Started_LTX.md` |

### Video Post-Processing

| Task | Recommended Tool | Doc |
|------|------------------|-----|
| Programmatic video creation | Remotion | `remotion/Get_Started_Remotion.md` |
| Add overlays to AI video | Remotion | `remotion/Get_Started_Remotion.md` |
| Batch video generation | Remotion Lambda | `remotion/Get_Started_Remotion.md` |

### Agent Orchestration (Claude Code / Cursor)

| Component | Purpose | Doc |
|-----------|---------|-----|
| **COMFYUI_ORCHESTRATION.md** | Knowledge: workflow schema, node connections, model settings, templates | `comfyui/COMFYUI_ORCHESTRATION.md` |
| **MASSMEDIAFACTORY_MCP.md** | MCP tool reference: iteration, publishing, SOTA awareness | `comfyui/MASSMEDIAFACTORY_MCP.md` |

**Setup (from PyPI):**
```bash
pip install comfyui-massmediafactory-mcp
claude mcp add --transport stdio --scope user comfyui-massmediafactory \
    -- comfyui-massmediafactory-mcp
```

**Setup (from source):**
```bash
git clone https://github.com/romancircus/comfyui-massmediafactory-mcp
cd comfyui-massmediafactory-mcp && pip install -e .
claude mcp add --transport stdio --scope user comfyui-massmediafactory \
    -- python -m comfyui_massmediafactory_mcp.server
```

---

## Updating This Repo

If documentation needs updates:

1. Edit files in this repo
2. Commit and push
3. In consuming repos: `git submodule update --remote`

Do NOT copy documentation to other repos - always reference via submodule.
