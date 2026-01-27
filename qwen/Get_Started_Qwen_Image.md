# Qwen Image Models: Local AI Image Generation Guide

**Provider:** Alibaba Qwen (Open Source)
**Last Updated:** January 2026
**Version:** 2.0 (LLM-Agent Optimized)
**Purpose:** Complete guide for local image generation with Qwen models

---

## Table of Contents

1. [Overview](#overview)
2. [Model Lineup](#model-lineup)
3. [Qwen-Image-2512 Deep Dive](#qwen-image-2512-deep-dive)
4. [Qwen-VL Vision-Language Models](#qwen-vl-vision-language-models)
5. [Local Deployment Options](#local-deployment-options)
6. [Hardware Requirements](#hardware-requirements)
7. [ComfyUI Integration](#comfyui-integration)
8. [Prompting Best Practices](#prompting-best-practices)
9. [Comparison with Other Models](#comparison-with-other-models)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)
12. [LLM Agent Helper Functions](#llm-agent-helper-functions)

---

## Overview

Qwen Image models are **open-source diffusion models** from Alibaba that excel at realistic image generation, particularly human portraits with rich facial details and accurate text rendering. They can run **locally on consumer hardware**, including CPU-only systems.

### Key Capabilities

| Feature | Specification |
|---------|---------------|
| **Model Type** | Diffusion Transformer |
| **Image Quality** | Photorealistic, detailed faces |
| **Text Rendering** | Superior accuracy |
| **Local Deployment** | Yes (GPU + CPU options) |
| **Open Weights** | Yes (Apache 2.0) |
| **ComfyUI Support** | Yes |
| **GGUF Quantization** | Yes (CPU-friendly) |

### Critical Knowledge for LLM Agents

1. **Qwen-Image-2512** = Image generation (diffusion model)
2. **Qwen-VL** = Vision-Language understanding (multimodal LLM)
3. **Different deployment methods for each** - Don't confuse them
4. **GGUF format enables CPU-only deployment** for resource-constrained environments

---

## Model Lineup

### Qwen Image Generation Models

| Model | Purpose | Parameters | Best For |
|-------|---------|------------|----------|
| **Qwen-Image-2512** | Image generation | ~2.5B | Photorealistic images, portraits |
| **Qwen-Image-2512-Instruct** | Instruction-tuned | ~2.5B | Complex prompts |

### Qwen Vision-Language Models

| Model | Purpose | Parameters | Best For |
|-------|---------|------------|----------|
| **Qwen2.5-VL-7B** | Vision understanding | 7B | Image analysis, captioning |
| **Qwen3-VL** | Advanced vision | Various | Complex reasoning, agents |
| **Qwen2.5-VL-72B** | Large-scale | 72B | Highest accuracy tasks |

### Model Selection Decision Tree

```
START: What do you need?
│
├─► Generate images from text?
│   │
│   ├─► Need photorealistic humans? ───► Qwen-Image-2512
│   │
│   ├─► Need accurate text in image? ──► Qwen-Image-2512 or Flux
│   │
│   └─► Need speed + quality balance? ─► Qwen-Image-2512-Instruct
│
├─► Understand/analyze existing images?
│   │
│   ├─► Local deployment needed? ──────► Qwen2.5-VL-7B + Ollama
│   │
│   ├─► Complex reasoning needed? ─────► Qwen3-VL
│   │
│   └─► Highest accuracy needed? ──────► Qwen2.5-VL-72B (API or large GPU)
│
└─► Limited hardware (< 8GB VRAM)?
    │
    └─► Use GGUF quantized version ────► Qwen-Image-2512-GGUF + CPU
```

---

## Qwen-Image-2512 Deep Dive

### Key Strengths

Based on December 2024 updates:

| Capability | Description |
|------------|-------------|
| **Human Depiction** | More realistic with rich facial details |
| **Environmental Context** | Enhanced texture richness in scenes |
| **Text Rendering** | Superior accuracy for text in images |
| **Detail Refinement** | Significantly improved over earlier versions |

### Technical Specifications

| Specification | Value |
|---------------|-------|
| Architecture | Diffusion Transformer |
| Native Resolution | 2512x2512 max |
| Recommended Resolution | 1024x1024 |
| Quantization | FP16, FP8, GGUF |
| VRAM (FP16) | ~8GB |
| VRAM (GGUF Q4) | ~4GB |
| CPU-Only | Yes (with GGUF) |

### Output Quality Comparison

| Aspect | Qwen-Image-2512 | Flux.1 Dev | SDXL |
|--------|-----------------|------------|------|
| Face Details | Excellent | Good | Good |
| Text Rendering | Excellent | Excellent | Poor |
| Environments | Excellent | Good | Good |
| Speed (same HW) | Fast | Slow | Fast |
| VRAM Usage | Low | High | Medium |

---

## Qwen-VL Vision-Language Models

### Qwen2.5-VL-7B

The most practical local deployment option for vision-language tasks:

```python
# Via Ollama (easiest local deployment)
import ollama

response = ollama.chat(
    model='qwen2.5-vl:7b',
    messages=[{
        'role': 'user',
        'content': 'Describe this image in detail',
        'images': ['./image.jpg']
    }]
)
print(response['message']['content'])
```

### Qwen3-VL Features

The most powerful in the Qwen-VL series:

| Feature | Description |
|---------|-------------|
| **Text Understanding** | Superior comprehension |
| **Visual Perception** | Deeper scene analysis |
| **Extended Context** | Longer conversations |
| **Spatial Dynamics** | Better understanding of video |
| **Agent Interaction** | Enhanced tool use capabilities |

### Vision-Language Use Cases

| Task | Recommended Model | Deployment |
|------|-------------------|------------|
| Image captioning | Qwen2.5-VL-7B | Ollama |
| OCR / Text extraction | Qwen2.5-VL-7B | Ollama |
| Image Q&A | Qwen2.5-VL-7B | Ollama |
| Complex reasoning | Qwen3-VL | vLLM |
| Video understanding | Qwen3-VL | vLLM |
| Agent workflows | Qwen3-VL | vLLM |

---

## Local Deployment Options

### Option 1: Unsloth GGUF (CPU-Friendly)

Run Qwen-Image-2512 on CPU + RAM without GPU:

```bash
# Install dependencies
pip install unsloth

# Download GGUF model
wget https://huggingface.co/unsloth/Qwen-Image-2512-GGUF/resolve/main/qwen-image-2512-Q4_K_M.gguf

# Run inference (Python)
from unsloth import FastQwenImage

model = FastQwenImage.from_gguf("qwen-image-2512-Q4_K_M.gguf")
image = model.generate(
    prompt="A serene mountain lake at sunset, photorealistic",
    width=1024,
    height=1024
)
image.save("output.png")
```

### Option 2: vLLM (GPU-Optimized)

For Qwen-VL models with optimal performance:

```bash
# Install vLLM (requires vllm >= 0.11.0)
pip install vllm

# Start server
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-VL-7B-Instruct \
    --dtype auto \
    --api-key token-abc123
```

```python
# Client usage
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="token-abc123"
)

response = client.chat.completions.create(
    model="Qwen/Qwen2.5-VL-7B-Instruct",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
        ]
    }]
)
```

### Option 3: Ollama (Simplest)

Easiest setup for Qwen-VL models:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull qwen2.5-vl:7b

# Run interactively
ollama run qwen2.5-vl:7b

# Or via API
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-vl:7b",
  "messages": [
    {
      "role": "user",
      "content": "Describe this image",
      "images": ["base64_encoded_image"]
    }
  ]
}'
```

**Ollama Vision Config (Deep Research Finding):**

Common issue: "Vision Encoder OOM" (Out of Memory)

Create a custom `Modelfile` for low-VRAM cards (12-16GB):

```dockerfile
FROM qwen2.5-vl:7b

# Reduce context to prevent vision encoder OOM
PARAMETER num_ctx 8192

# Low temperature for OCR tasks (prevents hallucinations)
PARAMETER temperature 0.1
```

```bash
# Build custom model
ollama create qwen-vl-lowvram -f Modelfile

# Use the custom model
ollama run qwen-vl-lowvram
```

### Option 4: ComfyUI (Workflow Integration)

See [ComfyUI Integration](#comfyui-integration) section.

---

## Hardware Requirements

### Qwen-Image-2512

| Configuration | VRAM | RAM | Notes |
|---------------|------|-----|-------|
| FP16 (Full) | 8GB | 16GB | Best quality |
| FP8 | 6GB | 12GB | Slight quality loss |
| GGUF Q8 | 4GB | 16GB | Good balance |
| GGUF Q4 | 2GB | 12GB | CPU-feasible |
| CPU-Only | 0GB | 24GB | Slow but works |

### Qwen-VL Models

| Model | VRAM (FP16) | VRAM (Q4) | Ollama Default |
|-------|-------------|-----------|----------------|
| Qwen2.5-VL-7B | 16GB | 6GB | Q4 |
| Qwen2.5-VL-32B | 64GB | 20GB | Q4 |
| Qwen2.5-VL-72B | 144GB | 40GB | Q4 |
| Qwen3-VL-7B | 16GB | 6GB | Q4 |

### Recommended GPU Tiers

| GPU | VRAM | Best Configuration |
|-----|------|-------------------|
| RTX 3060 | 12GB | Qwen-Image FP16, Qwen-VL-7B Q4 |
| RTX 3080 | 10GB | Qwen-Image FP16, Qwen-VL-7B Q4 |
| RTX 4080 | 16GB | All 7B models FP16 |
| RTX 4090 | 24GB | Qwen-VL-32B Q4 |
| A100 40GB | 40GB | All models FP16 |

---

## ComfyUI Integration

### Installing Qwen Nodes

```bash
# Navigate to custom_nodes
cd ComfyUI/custom_nodes

# Clone Qwen ComfyUI nodes
git clone https://github.com/comfyanonymous/ComfyUI_Qwen

# Install dependencies
pip install -r ComfyUI_Qwen/requirements.txt

# Restart ComfyUI
```

### Qwen-Image-2512 Workflow

```
[QwenImageLoader]
        │
        ├── MODEL ──────────────────────────────────────┐
        │                                                │
[QwenCLIPEncode] ◄── prompt ──────────────────────────┐ │
        │                                              │ │
        ▼                                              │ │
[QwenSampler] ◄── [EmptyLatentImage: 1024x1024] ──────┼─┤
        │        steps: 25, cfg: 7.0                   │ │
        │                                              │ │
        ▼                                              │ │
[QwenVAEDecode] ◄── VAE ───────────────────────────────┘ │
        │                                                │
        ▼                                                │
[SaveImage]                                              │
```

### Integration with Other Models

Qwen-Image-2512 works well in pipelines:

```
[Qwen-Image-2512: Generate base image]
        │
        ▼
[Kling/LTX: Animate to video]
        │
        ▼
[Output: AI Video]
```

---

## Prompting Best Practices

### The D.E.T.A.I.L. Framework

For Qwen-Image-2512, use the **D.E.T.A.I.L.** prompting framework:

| Component | Description | Example |
|-----------|-------------|---------|
| **D** - Description | Core subject | "A young woman with auburn hair" |
| **E** - Environment | Setting/background | "in a cozy coffee shop" |
| **T** - Texture | Material details | "wearing a soft cashmere sweater" |
| **A** - Atmosphere | Mood/lighting | "warm golden afternoon light" |
| **I** - Intent | Purpose/style | "portrait photography, Canon EOS R5" |
| **L** - Level | Quality tags | "8k, highly detailed, sharp focus" |

### Complete D.E.T.A.I.L. Example

```
A young woman with auburn hair and freckles (Description),
sitting by the window in a cozy coffee shop (Environment),
wearing a soft cream cashmere sweater (Texture),
warm golden afternoon light streaming through glass (Atmosphere),
portrait photography, Canon EOS R5, 85mm lens (Intent),
8k, highly detailed, sharp focus, photorealistic (Level)
```

### Prompt Patterns by Use Case

#### Portraits (Qwen's Strength)

```
A [age] [gender] with [hair description] and [facial features],
[expression], [clothing], [lighting type], [camera/lens],
photorealistic, highly detailed skin texture, sharp eyes
```

**Example:**
```
A 30-year-old man with short salt-and-pepper hair and warm brown eyes,
confident smile, wearing a navy blazer, soft studio lighting with rim light,
Canon EOS R5 85mm f/1.4, photorealistic, highly detailed skin texture
```

#### Text in Images

```
[Scene description], with text that reads "[EXACT TEXT]" on [surface],
[font style], clearly legible, [lighting]
```

**Example:**
```
A vintage wooden sign hanging on a brick wall, with text that reads
"OPEN 24 HOURS" in bold retro typography, neon glow effect,
clearly legible, nighttime urban lighting
```

#### Environments

```
[Scene type] with [key elements], [time of day], [weather/atmosphere],
[style], highly detailed, [resolution]
```

**Example:**
```
A serene Japanese garden with a wooden bridge over a koi pond,
cherry blossoms in full bloom, early morning mist,
zen atmosphere, photorealistic, 8k resolution
```

### Critical: NLP Prompting (Deep Research Finding)

```
╔════════════════════════════════════════════════════════════════════════════════╗
║  QWEN-IMAGE REJECTS "TAG SOUP"!                                                ║
║                                                                                ║
║  ❌ BAD:  "masterpiece, best quality, 4k, detailed, woman, blue dress"         ║
║  ✅ GOOD: "A wide-angle photograph of a woman wearing a flowing blue dress,   ║
║           cinematic lighting with a focus on natural skin texture"             ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

**Chain-of-Thought (CoT) Prompting Works:**

Qwen-Image responds to "reasoning" inside the prompt:

```
Create a portrait. The lighting should be dark to represent mystery,
but illuminate the eyes to show hope. The background should be blurred
to draw attention to the subject's expression.
```

### Portrait Settings (Deep Research Finding)

| Parameter | Recommended Value | Notes |
|-----------|-------------------|-------|
| **Guidance Scale** | 3.5 - 4.5 | High guidance burns skin textures |
| **Sampler** | Euler Ancestral | Most realistic skin pores |
| **Sampler (Stylized)** | DPM++ SDE Karras | Better for anime/stylized |
| **Face Restore** | DO NOT USE | Degrades Qwen's native high-freq details |

### Negative Prompts

| Style | Recommended Negatives |
|-------|----------------------|
| **Photorealistic** | blurry, low quality, distorted, deformed, ugly, cartoon, anime, painting |
| **Portrait** | bad anatomy, extra fingers, missing limbs, disfigured face, asymmetric eyes |
| **Product** | background clutter, shadows on product, reflections, watermarks |
| **Landscape** | people, text, watermarks, unnatural colors |

**Note:** Negative prompting is less effective on Qwen compared to models like Flux. The model is designed to optimize towards the prompt, not away from negatives.

---

## Comparison with Other Models

### Image Generation Comparison

| Feature | Qwen-Image-2512 | Flux.1 Dev | SDXL | SD 3.5 |
|---------|-----------------|------------|------|--------|
| **Face Quality** | Excellent | Good | Good | Good |
| **Text Rendering** | Excellent | Excellent | Poor | Good |
| **VRAM (FP16)** | 8GB | 24GB | 8GB | 12GB |
| **CPU Deployment** | Yes (GGUF) | Limited | Limited | No |
| **Local License** | Apache 2.0 | Non-commercial | Open | Open |
| **Speed** | Fast | Slow | Fast | Medium |

### Quantization Sweet Spot (Deep Research Finding)

| Quantization | Quality vs FP16 | VRAM Savings | Best For |
|--------------|-----------------|--------------|----------|
| **Q4_K_M** | Indistinguishable | 50% | Visual quality |
| **IQ4_XS** (IMat) | Better for OCR | 50%+ | Text extraction |
| Q4_0 | Slight loss | 50% | General use |
| Q8_0 | Identical | 25% | Maximum quality |

**Flash Attention 3 Required:**
Local deployment in 2026 relies on Flash Attention 3. Ensure your backend (llama.cpp/ExLlamaV2) is compiled with FA3 support, or generation speeds drop by 40%.

### Text Rendering Tip (Deep Research Finding)

If text generation fails in an image, wrap the desired text in distinct quotes:

```
A vintage poster with text: "OPEN 24 HOURS" in bold retro typography
```

This triggers the model's specific attention heads for typography.

### When to Use Qwen vs Others

| Scenario | Recommended |
|----------|-------------|
| Photorealistic portraits | **Qwen-Image-2512** |
| Text in images | Qwen-Image-2512 or Flux |
| Limited VRAM (< 8GB) | **Qwen-Image-2512 GGUF** |
| CPU-only deployment | **Qwen-Image-2512 GGUF** |
| Anime/stylized art | SDXL + LoRA |
| Complex compositions | Flux.1 Dev |
| Production API | Flux.1 Pro |

---

## API Reference

### Qwen-Image-2512 (Local)

```python
from qwen_image import QwenImageGenerator

generator = QwenImageGenerator(
    model_path="./qwen-image-2512",
    device="cuda",  # or "cpu"
    dtype="float16"  # or "float32" for CPU
)

result = generator.generate(
    prompt="A serene mountain lake at sunset",
    negative_prompt="blurry, low quality",
    width=1024,
    height=1024,
    steps=25,
    cfg_scale=7.0,
    seed=42  # Optional, for reproducibility
)

result.save("output.png")
```

### Qwen-VL (via Ollama)

```python
import ollama

def analyze_image(image_path: str, question: str) -> str:
    """Analyze an image using Qwen-VL via Ollama."""
    response = ollama.chat(
        model='qwen2.5-vl:7b',
        messages=[{
            'role': 'user',
            'content': question,
            'images': [image_path]
        }]
    )
    return response['message']['content']

# Example usage
description = analyze_image("./photo.jpg", "Describe this image in detail")
```

### Qwen-VL (via vLLM)

```python
from openai import OpenAI
import base64

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="token"
)

response = client.chat.completions.create(
    model="Qwen/Qwen2.5-VL-7B-Instruct",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What objects are in this image?"},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{encode_image('image.jpg')}"
                }
            }
        ]
    }],
    max_tokens=500
)
```

---

## Troubleshooting

### Decision Tree: Common Issues

```
Issue: Out of Memory (OOM)
│
├─► Reduce resolution
│   └─► 1024x1024 → 768x768 → 512x512
│
├─► Use quantized model
│   └─► FP16 → FP8 → GGUF Q8 → GGUF Q4
│
├─► Enable CPU offloading
│   └─► --lowvram flag or device_map="auto"
│
└─► Use CPU-only mode
    └─► GGUF model + CPU inference
```

```
Issue: Blurry/Low Quality Output
│
├─► Increase steps
│   └─► 25 → 35 → 50
│
├─► Adjust CFG scale
│   └─► Try 6.0 - 8.0 range
│
├─► Check model precision
│   └─► Q4 may have quality loss, try Q8 or FP16
│
└─► Add quality tags
    └─► "8k, highly detailed, sharp focus"
```

```
Issue: Ollama model not loading
│
├─► Check available space
│   └─► Models need GB of disk space
│
├─► Pull correct model name
│   └─► ollama pull qwen2.5-vl:7b
│
└─► Check Ollama is running
    └─► ollama serve (in background)
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `CUDA out of memory` | VRAM exceeded | Use smaller batch, lower res, or GGUF |
| `Model not found` | Wrong path/name | Verify model path or Ollama model name |
| `RuntimeError: Expected FP16` | Dtype mismatch | Match model dtype with input dtype |
| `Connection refused` | Server not running | Start Ollama/vLLM server first |

---

## LLM Agent Helper Functions

### Model Selector

```javascript
/**
 * Select optimal Qwen model based on requirements
 * @param {Object} requirements - Task requirements
 * @returns {Object} - Model configuration
 */
function selectQwenModel(requirements) {
  const {
    task = "generation",  // "generation" or "vision"
    vramGB = 8,
    needsCPU = false,
    needsHighAccuracy = false
  } = requirements;

  if (task === "generation") {
    // Image generation models
    if (needsCPU || vramGB < 4) {
      return {
        model: "qwen-image-2512-Q4_K_M.gguf",
        deployment: "unsloth",
        device: "cpu",
        notes: "Slowest but works on any hardware"
      };
    }
    if (vramGB < 8) {
      return {
        model: "qwen-image-2512-Q8.gguf",
        deployment: "unsloth",
        device: "cuda",
        notes: "Good balance of quality and VRAM"
      };
    }
    return {
      model: "Qwen-Image-2512",
      deployment: "native",
      device: "cuda",
      dtype: "float16",
      notes: "Best quality"
    };
  }

  // Vision-language models
  if (needsCPU || vramGB < 6) {
    return {
      model: "qwen2.5-vl:7b",
      deployment: "ollama",
      notes: "Ollama handles quantization automatically"
    };
  }
  if (needsHighAccuracy && vramGB >= 24) {
    return {
      model: "Qwen/Qwen3-VL-7B-Instruct",
      deployment: "vllm",
      notes: "Use vLLM for best performance"
    };
  }
  return {
    model: "qwen2.5-vl:7b",
    deployment: "ollama",
    notes: "Default recommendation for most use cases"
  };
}
```

### D.E.T.A.I.L. Prompt Builder

```javascript
/**
 * Build a D.E.T.A.I.L. formatted prompt for Qwen-Image
 * @param {Object} components - Prompt components
 * @returns {string} - Formatted prompt
 */
function buildDETAILPrompt(components) {
  const {
    description,    // D - Core subject
    environment,    // E - Setting
    texture,        // T - Material details
    atmosphere,     // A - Mood/lighting
    intent,         // I - Purpose/style
    level           // L - Quality tags
  } = components;

  const parts = [];

  if (description) parts.push(description);
  if (environment) parts.push(environment);
  if (texture) parts.push(texture);
  if (atmosphere) parts.push(atmosphere);
  if (intent) parts.push(intent);
  if (level) parts.push(level);

  return parts.join(", ");
}

// Example usage
const prompt = buildDETAILPrompt({
  description: "A young woman with auburn hair and green eyes",
  environment: "standing in a sunlit meadow",
  texture: "wearing a flowing white linen dress",
  atmosphere: "golden hour lighting, soft bokeh background",
  intent: "portrait photography, Canon EOS R5, 85mm f/1.4",
  level: "8k, highly detailed, photorealistic, sharp focus"
});
```

### Image Generator (Unified Interface)

```javascript
/**
 * Generate image using Qwen-Image with automatic configuration
 * @param {Object} config - Generation configuration
 * @returns {Promise<Object>} - Generation result
 */
async function generateQwenImage(config) {
  const {
    prompt,
    negativePrompt = "blurry, low quality, distorted, deformed",
    width = 1024,
    height = 1024,
    steps = 25,
    cfgScale = 7.0,
    seed = null,
    modelConfig = null
  } = config;

  // Auto-select model if not specified
  const model = modelConfig || selectQwenModel({
    task: "generation",
    vramGB: detectVRAM()  // Implement based on environment
  });

  // Build generation request based on deployment type
  if (model.deployment === "unsloth") {
    return await generateWithUnsloth({
      model: model.model,
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfgScale,
      seed,
      device: model.device
    });
  }

  if (model.deployment === "native") {
    return await generateWithNative({
      model: model.model,
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfgScale,
      seed,
      dtype: model.dtype
    });
  }

  throw new Error(`Unknown deployment type: ${model.deployment}`);
}
```

### Vision Analyzer

```python
"""
Unified Qwen-VL analyzer supporting Ollama and vLLM backends.
"""

class QwenVisionAnalyzer:
    def __init__(self, backend="ollama", model="qwen2.5-vl:7b"):
        self.backend = backend
        self.model = model

        if backend == "ollama":
            import ollama
            self.client = ollama
        elif backend == "vllm":
            from openai import OpenAI
            self.client = OpenAI(
                base_url="http://localhost:8000/v1",
                api_key="token"
            )

    def analyze(self, image_path: str, question: str) -> str:
        """Analyze an image with a question."""
        if self.backend == "ollama":
            response = self.client.chat(
                model=self.model,
                messages=[{
                    'role': 'user',
                    'content': question,
                    'images': [image_path]
                }]
            )
            return response['message']['content']

        elif self.backend == "vllm":
            import base64
            with open(image_path, "rb") as f:
                image_b64 = base64.b64encode(f.read()).decode()

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                        }
                    ]
                }]
            )
            return response.choices[0].message.content

# Example usage
analyzer = QwenVisionAnalyzer(backend="ollama")
result = analyzer.analyze("photo.jpg", "What objects are in this image?")
```

---

## Quick Reference Card

### Model Quick Reference

| Model | Task | VRAM | Deployment |
|-------|------|------|------------|
| Qwen-Image-2512 | Image Gen | 8GB | Native/Unsloth |
| Qwen-Image-2512-GGUF | Image Gen | 2-4GB | Unsloth (CPU OK) |
| Qwen2.5-VL-7B | Vision | 6GB | Ollama |
| Qwen3-VL | Vision | 8GB+ | vLLM |

### Generation Defaults

| Parameter | Default | Range |
|-----------|---------|-------|
| Width/Height | 1024 | 512-2512 |
| Steps | 25 | 15-50 |
| CFG Scale | 7.0 | 5.0-12.0 |
| Sampler | DPM++ 2M | Various |

### Ollama Commands

```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull qwen2.5-vl:7b

# Run interactively
ollama run qwen2.5-vl:7b

# List models
ollama list

# Remove model
ollama rm qwen2.5-vl:7b
```

---

*Document Version: 2.0 | Last Updated: January 2026 | Optimized for LLM Agent Consumption*
