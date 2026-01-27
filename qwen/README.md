# Qwen Image Models Documentation

Alibaba's open-source models for image generation and vision-language understanding.

## Files

| File | Content |
|------|---------|
| `Get_Started_Qwen_Image.md` | Comprehensive local image generation guide |
| `QWEN_LOCAL_DEPLOYMENT.md` | Hardware & deployment details (coming soon) |

## Quick Reference

### Model Types

| Model | Purpose | VRAM |
|-------|---------|------|
| Qwen-Image-2512 | Image generation | 8GB (2GB GGUF) |
| Qwen2.5-VL-7B | Vision understanding | 6GB |
| Qwen3-VL | Advanced vision | 8GB+ |

### Deployment Options

| Method | Best For |
|--------|----------|
| Native (FP16) | Best quality, 8GB+ VRAM |
| GGUF (Q4/Q8) | Low VRAM, CPU support |
| Ollama | Easiest VL deployment |
| vLLM | Production VL serving |

### The D.E.T.A.I.L. Framework

For Qwen-Image prompting:

- **D** - Description (subject)
- **E** - Environment (setting)
- **T** - Texture (materials)
- **A** - Atmosphere (lighting/mood)
- **I** - Intent (style/camera)
- **L** - Level (quality tags)

## Code Quick Start

### Image Generation

```python
from qwen_image import QwenImageGenerator

gen = QwenImageGenerator(model_path="./qwen-image-2512")
result = gen.generate(
    prompt="A serene mountain lake, photorealistic, 8k",
    width=1024,
    height=1024
)
result.save("output.png")
```

### Vision Analysis (Ollama)

```python
import ollama

response = ollama.chat(
    model='qwen2.5-vl:7b',
    messages=[{
        'role': 'user',
        'content': 'Describe this image',
        'images': ['./photo.jpg']
    }]
)
```

## Key Strengths

- Excellent face/portrait quality
- Superior text rendering
- CPU deployment via GGUF
- Apache 2.0 license (commercial OK)
