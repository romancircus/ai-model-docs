# AI Model Documentation

Canonical documentation for AI models and services used across RomanCircus projects.

**Single source of truth** - All projects reference this repo via git submodule.

---

## Quick Reference

| Model | Documentation | Use Case |
|-------|---------------|----------|
| **Gemini Image** (Nano Banana) | `gemini/Get_Started_Nano_Banana.ipynb` | Image generation, character consistency |
| **Gemini Video** (Veo 3) | `gemini/Get_started_Veo.ipynb` | Video generation, dialogue, audio |
| **Kling** (via FAL.ai) | `kling/Get_Started_Kling.md` | Video generation, motion control |
| **Claude** | `anthropic/claude_prompting.md` | Text generation, reasoning |
| **GPT** | `openai/gpt_prompting.md` | Text generation |
| **ElevenLabs** | `elevenlabs/voice_synthesis.md` | Text-to-speech |
| **Remotion** | `remotion/video_rendering.md` | Programmatic video rendering |

---

## Usage as Submodule

### Adding to a Project

```bash
cd your-project
git submodule add git@github.com:RomanCircus/ai-model-docs.git docs/ai-models
git commit -m "feat: Add ai-model-docs submodule"
```

### Cloning a Project with Submodules

```bash
# Option 1: Clone with submodules
git clone --recurse-submodules git@github.com:RomanCircus/your-project.git

# Option 2: Initialize after clone
git clone git@github.com:RomanCircus/your-project.git
cd your-project
git submodule init
git submodule update
```

### Updating to Latest

```bash
cd your-project
git submodule update --remote docs/ai-models
git add docs/ai-models
git commit -m "chore: Update ai-model-docs submodule"
```

---

## Structure

```
ai-model-docs/
├── gemini/
│   ├── Get_Started_Nano_Banana.ipynb   # Image generation (official Google)
│   ├── Get_started_Veo.ipynb           # Video generation (official Google)
│   └── README.md
│
├── kling/
│   ├── Get_Started_Kling.md            # Master guide (FAL.ai provider)
│   ├── KLING_API_REFERENCE.md          # All API endpoints
│   └── README.md
│
├── anthropic/
│   └── claude_prompting.md
│
├── openai/
│   └── gpt_prompting.md
│
├── elevenlabs/
│   └── voice_synthesis.md
│
└── remotion/
    └── video_rendering.md
```

---

## For AI Agents

See `CLAUDE.md` for instructions on how to use this documentation in AI workflows.

Key principles:
1. **Always read actual files** - Never embed summaries in scripts
2. **Extract notebook content** - Parse .ipynb cells for consultations
3. **Reference by path** - Use relative paths from submodule root

---

## Contributing

1. Update documentation in this repo
2. Push to main branch
3. In consuming repos, run `git submodule update --remote`

---

## Repos Using This Submodule

| Repo | Primary AI Models |
|------|-------------------|
| KDH-Automation | Gemini, Kling |
| NanoBanana-CLI | Gemini, Kling |
| pullo-v3 | Gemini, Claude, OpenAI, ElevenLabs |
| VidrushPipeline | Gemini, Claude, OpenAI |
| PostProduction | Gemini, Claude, ElevenLabs |
| YoutubeGodMode | Gemini, Claude, OpenAI |
| Chatkut | Gemini, Claude, OpenAI, ElevenLabs |
| VidrushGodMode | Gemini |
| openart_cli | Gemini |
| proxys | Gemini |
| pokedex-generator | Gemini |

---

*Created: 2026-01-26*
