# Gemini Documentation

Official Google notebooks for Gemini AI models.

## Files

| File | Model | Purpose |
|------|-------|---------|
| `Get_Started_Nano_Banana.ipynb` | Gemini Image 3 Pro | Image generation, character consistency |
| `Get_started_Veo.ipynb` | Veo 3/3.1 | Video generation, dialogue, audio |

## Nano Banana (Image Generation)

**Model IDs:**
- `gemini-2.5-flash-image` = "nano-banana" (cheap, fast)
- `gemini-3-pro-image-preview` = "nano-banana-pro" (thinking, 2K/4K)

**Key Features:**
- Character consistency via chat mode
- Multi-image mixing (up to 14 with Pro, 3 with Flash)
- Thinking mode: `include_thoughts=True`
- Search grounding: `tools=[{"google_search": {}}]`
- Resolutions: 1K (default), 2K, 4K (Pro only)

**Aspect Ratios:**
- 1:1 (1024x1024)
- 16:9 (1344x768)
- 9:16 (768x1344)
- 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 21:9

## Veo (Video Generation)

**Model:** Veo 3 / Veo 3.1

**Key Features:**
- Text-to-video
- Image-to-video (first frame)
- First & last frame control
- Reference-to-video (up to 3 images)
- Video extension (up to 148 seconds)
- Duration control: 4, 6, or 8 seconds (Veo 3.1)

**Audio Syntax:**
```
Soundtrack: [description]
Ambient: [description]
Dialogue: "Speaker: [words]"
```

## Usage

For consultations, extract notebook content:

```javascript
const content = await extractNotebookContent('docs/ai-models/gemini/Get_Started_Nano_Banana.ipynb');
consultation.addText('Nano Banana Guide', content);
```

See parent `CLAUDE.md` for extraction function.
