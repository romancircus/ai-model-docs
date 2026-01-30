# Diffusion Concepts for ComfyUI

A beginner-friendly guide to understanding diffusion models and ComfyUI parameters.

---

## What is Diffusion?

Imagine you have a clear photo. Now imagine slowly adding TV static/noise until it's 100% random noise - unrecognizable.

**Diffusion models learn to do this BACKWARDS.** They start with pure noise and gradually remove it to create an image.

```
Pure Noise → Less Noisy → Even Less → Almost Clear → Final Image
   🎲           🌫️           🌁           🖼️           ✨
```

The AI learned from millions of images what "removing noise" should look like. When you give it a text prompt like "playground", it removes noise in a way that reveals a playground.

---

## Key Parameters

### CFG (Classifier-Free Guidance)

**What it does**: Controls how strictly the model follows your prompt.

| CFG Range | Behavior |
|-----------|----------|
| 1-2 | Relaxed. "Here's my suggestion, but do what feels natural" |
| 3-5 | Balanced. "Follow my prompt pretty closely" |
| 7+ | Strict. "DO EXACTLY WHAT I SAID" |

**The catch**: High CFG doesn't mean "better quality". It often means:
- Oversaturated colors
- Burnt skin textures
- Unnatural contrast
- Distorted features

**Rule of thumb**: Start low (2-4) and increase only if prompt adherence is too weak.

### Denoise

**What it does**: Controls how much of the original image to change (for img2img/editing).

| Denoise | Behavior |
|---------|----------|
| 0.0 | Keep original 100% (no change) |
| 0.3-0.5 | Subtle refinement, preserve most of original |
| 0.7-0.8 | Significant changes, keep general structure |
| 1.0 | Complete regeneration from scratch |

**For background replacement**: Use denoise 1.0. Lower values preserve the original background you're trying to replace.

### Steps

**What it does**: Number of noise removal iterations.

| Steps | Quality vs Speed |
|-------|------------------|
| 10-15 | Fast, lower quality |
| 20-30 | Balanced (most common) |
| 40-50 | High quality, slow |
| 100+ | Diminishing returns |

**Rule of thumb**: 20-30 steps is the sweet spot for most models.

---

## Latent Space

Images are big (e.g., 1024×1024 = 1 million pixels). Processing them directly is slow.

So diffusion models compress images into a smaller "latent space":

```
Real Image (1024×1024) → VAE Encode → Latent (~128×128) → AI works here → VAE Decode → Real Image
        📷                  🗜️            🧠                              🗜️           📷
```

**VAE** = Variational AutoEncoder. The compressor/decompressor.

**Important**: VAE compression is slightly lossy. Colors may shift during encode/decode cycles.

---

## Workflow Types

### txt2img (Text-to-Image)
- Start with **empty latent** (pure noise)
- Text prompt guides what to generate
- No reference image

```
Empty Latent + "a cat" → Diffusion → Cat Image
```

### img2img (Image-to-Image)
- Start with **encoded existing image**
- Text prompt guides modifications
- Denoise controls how much changes

```
Existing Image + "make it nighttime" + denoise=0.7 → Modified Image
```

### Edit (Image Editing)
- Provide original image as **reference**
- Start with empty latent (NOT encoded image)
- Model regenerates while matching reference

```
Reference Image + "change background to beach" + EmptyLatent → New Image
```

**Key difference from img2img**: Edit mode uses the reference as visual guidance, not as the starting latent. This allows bigger changes while preserving subject identity.

---

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| High CFG (7+) | Colors burnt, oversaturated | Lower to 2-4 |
| Low denoise for edits | Original preserved, edits ignored | Use denoise 1.0 |
| VAEEncode for edit mode | Background not changing | Use EmptyLatent |
| Too many steps | Slow with no quality gain | Use 20-30 |

---

## Model-Specific Notes

Different models have different optimal settings:

| Model | CFG Range | Notes |
|-------|-----------|-------|
| FLUX | 2.5-5.0 | Uses FluxGuidance node instead of cfg param |
| Qwen Edit | 2.0-2.5 | Very sensitive to high CFG |
| SDXL | 5-8 | Tolerates higher CFG |
| LTX Video | 2.5-4.0 | Low CFG preferred |

Always check model-specific documentation before using.

---

## Glossary

| Term | Definition |
|------|------------|
| **Latent** | Compressed representation of an image |
| **VAE** | Encoder/decoder for latent space |
| **CFG** | How strictly to follow the prompt |
| **Denoise** | How much to change (0=nothing, 1=everything) |
| **Sampler** | Algorithm for removing noise (euler, dpm++, etc.) |
| **Scheduler** | How noise is distributed across steps |
| **Steps** | Number of denoising iterations |
| **Seed** | Random number that determines the specific noise pattern |

---

*Last updated: January 30, 2026*
