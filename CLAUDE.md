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
- Text-to-video (v2.5, v2.6)
- Image-to-video (v2.1)
- Motion control (v2.6) - orientation modes
- Video editing (O1) - 4 generation modes
- Camera controls, special effects
- Multi-image input (up to 4 images)

---

## When to Use Which Model

| Task | Recommended Model | Doc |
|------|-------------------|-----|
| Generate character image | Gemini Image (Nano Banana) | `gemini/Get_Started_Nano_Banana.ipynb` |
| Generate first frame for video | Gemini Image (Nano Banana) | `gemini/Get_Started_Nano_Banana.ipynb` |
| Text-to-video (Google) | Veo 3/3.1 | `gemini/Get_started_Veo.ipynb` |
| Image-to-video (Google) | Veo 3/3.1 | `gemini/Get_started_Veo.ipynb` |
| Text-to-video (FAL) | Kling v2.5/v2.6 | `kling/Get_Started_Kling.md` |
| Image-to-video (FAL) | Kling v2.1 | `kling/Get_Started_Kling.md` |
| Motion transfer | Kling v2.6 Motion Control | `kling/Get_Started_Kling.md` |
| Video editing | Kling O1 | `kling/Get_Started_Kling.md` |

---

## Updating This Repo

If documentation needs updates:

1. Edit files in this repo
2. Commit and push
3. In consuming repos: `git submodule update --remote`

Do NOT copy documentation to other repos - always reference via submodule.
