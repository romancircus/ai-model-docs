# LoRA Training Documentation

Comprehensive guide for fine-tuning diffusion models with Low-Rank Adaptation.

## Files

| File | Content |
|------|---------|
| `Get_Started_LoRA_Training.md` | Complete training guide for Flux, SDXL, SD1.5 |
| `LORA_HYPERPARAMETERS.md` | Quick reference tables (coming soon) |

## Critical Warning

```
⚠️  DO NOT APPLY SDXL RECIPES TO FLUX!

Flux learning rates are 10-40x HIGHER than SDXL.
Using SDXL settings on Flux = catastrophic failure.
```

## Quick Reference

### Model-Specific Settings

| Setting | Flux | SDXL | SD1.5 |
|---------|------|------|-------|
| Learning Rate | 0.001-0.004 | 0.0001-0.0003 | 0.0001-0.0003 |
| Steps | 500-1500 | 2000-5000 | 1500-3000 |
| Rank | 16-32 | 32-64 | 16-32 |
| Images | 25-30 | 50-100 | 30-50 |

### Training Tools

| Tool | Best For |
|------|----------|
| Kohya SS | Beginners, GUI, SDXL |
| SimpleTuner | Flux |
| AI-Toolkit | Fast iteration |

## Quality > Quantity

25 well-curated, properly captioned images
>>> beats >>>
100 random, poorly captioned images

## Code Quick Start

```javascript
// Select hyperparameters
const params = selectHyperparameters({
  model: "flux",
  imageCount: 30,
  subjectType: "character"
});

// Result:
// {
//   learning_rate: 0.001,
//   max_steps: 1000,
//   network_rank: 32,
//   batch_size: 4
// }
```

## Dataset Structure

```
dataset/
├── img/
│   ├── 001.png
│   ├── 001.txt    # Caption
│   ├── 002.png
│   ├── 002.txt
│   └── ...
└── config.toml
```
