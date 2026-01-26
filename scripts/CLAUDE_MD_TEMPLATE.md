# CLAUDE.md Addition Template

Add this section to CLAUDE.md in each repo after adding the ai-model-docs submodule:

---

## AI Model Documentation (Submodule)

Canonical AI model docs are in `docs/ai-models/` (git submodule).

| Need | Go To |
|------|-------|
| Gemini Image (Nano Banana) | `docs/ai-models/gemini/Get_Started_Nano_Banana.ipynb` |
| Gemini Video (Veo) | `docs/ai-models/gemini/Get_started_Veo.ipynb` |
| Kling Video (FAL.ai) | `docs/ai-models/kling/Get_Started_Kling.md` |
| Kling API Reference | `docs/ai-models/kling/KLING_API_REFERENCE.md` |

### Submodule Commands

```bash
# Update to latest docs
git submodule update --remote docs/ai-models
git add docs/ai-models
git commit -m "chore: Update ai-model-docs submodule"

# Clone repo with submodules
git clone --recurse-submodules <repo-url>

# Initialize submodules after clone
git submodule init
git submodule update
```

### For Gemini Consultations

**IMPORTANT**: Always extract actual notebook content. Never embed summaries.

```javascript
async function extractNotebookContent(notebookPath) {
  const content = await fs.readFile(notebookPath, 'utf-8');
  const notebook = JSON.parse(content);
  const sections = [];
  for (const cell of notebook.cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    if (!source || source.trim().length === 0) continue;
    if (cell.cell_type === 'markdown') {
      sections.push(source);
    } else if (cell.cell_type === 'code') {
      if (source.includes('prompt =') || source.includes('client.models.generate')) {
        sections.push('```python\n' + source + '\n```');
      }
    }
  }
  return sections.join('\n\n');
}
```

---
