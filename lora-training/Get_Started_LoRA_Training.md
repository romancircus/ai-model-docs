# LoRA Training: Comprehensive Fine-Tuning Guide

**Last Updated:** January 2026
**Version:** 2.0 (LLM-Agent Optimized)
**Purpose:** Complete guide for training custom LoRA adapters for diffusion models

---

## Table of Contents

1. [Overview](#overview)
2. [Understanding LoRA](#understanding-lora)
3. [Training Tools Comparison](#training-tools-comparison)
4. [Model-Specific Hyperparameters](#model-specific-hyperparameters)
5. [Dataset Preparation](#dataset-preparation)
6. [Training Configuration](#training-configuration)
7. [Flux LoRA Training](#flux-lora-training)
8. [SDXL LoRA Training](#sdxl-lora-training)
9. [SD1.5 LoRA Training](#sd15-lora-training)
10. [Quality Assessment](#quality-assessment)
11. [Troubleshooting](#troubleshooting)
12. [LLM Agent Helper Functions](#llm-agent-helper-functions)

---

## Overview

LoRA (Low-Rank Adaptation) allows you to **fine-tune large diffusion models** on custom styles, characters, or concepts using a **fraction of the memory** required for full fine-tuning. The resulting adapter files are small (typically 4-200MB) and can be combined with base models.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Memory Efficiency** | Train on consumer GPUs (8-24GB VRAM) |
| **Small File Size** | Adapters are 4-200MB vs multi-GB checkpoints |
| **Stackable** | Combine multiple LoRAs for complex styles |
| **Fast Training** | Minutes to hours vs days for full fine-tuning |
| **Easy Sharing** | Upload to Civitai, Hugging Face |

### Critical Warning for LLM Agents

```
╔════════════════════════════════════════════════════════════════════╗
║  ⚠️  DO NOT APPLY SDXL TRAINING RECIPES TO FLUX!                   ║
║                                                                    ║
║  Flux uses fundamentally different training dynamics:              ║
║  - Learning rates are 10-40x HIGHER than SDXL                      ║
║  - Steps are 3-10x LOWER                                           ║
║  - Using SDXL settings on Flux = catastrophic failure              ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Understanding LoRA

### What is LoRA?

LoRA injects trainable low-rank matrices into attention layers while keeping original weights frozen:

```
Original Layer:  W (frozen)
LoRA Addition:   W + BA (trainable)

Where:
- B is a [rank x hidden] matrix
- A is a [hidden x rank] matrix
- rank << hidden (e.g., 32 << 4096)
```

### LoRA Variants

| Variant | Description | Best For |
|---------|-------------|----------|
| **LoRA** | Standard low-rank adaptation | General purpose |
| **DoRA** | Weight-Decomposed Low-Rank | **SDXL (2025/2026 standard)** |
| **LoHA** | Hadamard product adaptation | Complex styles |
| **LoCon** | Convolution layer adaptation | Detailed textures |
| **LoKr** | Kronecker product | Experimental |

### DoRA: The New Standard for SDXL (Deep Research Finding)

```
╔════════════════════════════════════════════════════════════════════════════════╗
║  DoRA (Weight-Decomposed Low-Rank Adaptation) has largely replaced standard    ║
║  LoRA for SDXL training as of 2025/2026.                                       ║
║                                                                                ║
║  Benefits:                                                                     ║
║  - Separates magnitude and direction of weight updates                         ║
║  - Better learning capacity at the same file size                              ║
║  - Improved stability during training                                          ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### SDXL vs Flux: Why Different LoRA Approaches?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE DETERMINES LORA TYPE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SDXL (UNet Architecture):              Flux (DiT Architecture):               │
│  ┌───────────────────────┐              ┌───────────────────────┐              │
│  │   Use DoRA            │              │   Use Standard LoRA   │              │
│  │   (Weight-Decomposed) │              │   (Low-Rank)          │              │
│  └───────────────────────┘              └───────────────────────┘              │
│                                                                                 │
│  WHY DoRA for SDXL:                     WHY LoRA for Flux:                      │
│  • UNet has dense convolutions          • DiT uses pure transformers           │
│  • DoRA's magnitude/direction split     • Different training dynamics          │
│  • Works with existing tooling          • DoRA support not yet mature          │
│  • Better quality at same file size     • Converges fast with standard LoRA    │
│                                                                                 │
│  VRAM IMPACT:                                                                   │
│  • DoRA uses ~10-15% more VRAM          • Standard LoRA is most efficient      │
│  • Your RTX 5090 32GB: No problem       • Your RTX 5090 32GB: Handles easily   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Summary:**
- **SDXL → DoRA** (SOTA for UNet-based models)
- **Flux → Standard LoRA** (DiT architecture, DoRA not widely supported)
- **LTX-Video → Standard LoRA** (DiT architecture like Flux)
- **SD1.5 → LoRA or LoCon** (Older, standard LoRA works well)

### What About Qwen Image?

```
╔════════════════════════════════════════════════════════════════════════════════╗
║  QWEN IMAGE: No Established LoRA/DoRA Tooling (Yet)                            ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  Qwen-Image-2512 (image generation):                                           ║
║  • Released recently (late 2025)                                               ║
║  • No community LoRA training scripts yet                                      ║
║  • Different from Stable Diffusion ecosystem                                   ║
║  • Wait for tooling to mature or use PEFT library                              ║
║                                                                                ║
║  Qwen-VL (vision-language, image analysis):                                    ║
║  • Uses LLM-style LoRA (like LLaMA adapters)                                   ║
║  • NOT the same as diffusion model LoRAs                                       ║
║  • Can fine-tune with Unsloth, PEFT, or standard LLM tools                     ║
║                                                                                ║
║  RECOMMENDATION:                                                                ║
║  For custom image styles, use Flux + LoRA instead of Qwen-Image for now        ║
║  (better tooling, more community support)                                      ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### Rank Explained

| Rank | Parameters | Effect |
|------|------------|--------|
| 4-8 | Very few | Simple styles, subtle changes |
| 16-32 | Moderate | Balanced, most common |
| 64-128 | Many | Complex concepts, characters |
| 256+ | Many | Risk of overfitting |

**Rule of Thumb:** Start with rank 32, adjust based on results.

---

## Training Tools Comparison

### Tool Selection Decision Tree

```
START: Which tool should I use?
│
├─► Need GUI (beginner-friendly)?
│   │
│   └─► Kohya SS ────────────────► Best for beginners, mature ecosystem
│
├─► Training Flux primarily?
│   │
│   ├─► Need best Flux support? ──► SimpleTuner
│   │
│   └─► Need fastest iteration? ──► AI-Toolkit (Ostris)
│
├─► Training SDXL/SD1.5?
│   │
│   ├─► Production quality? ──────► Kohya SS
│   │
│   └─► Rapid experiments? ───────► AI-Toolkit
│
└─► Training video LoRAs?
    │
    └─► FAL.ai Video Trainer ─────► LTX, Kling video LoRAs
```

### Tool Comparison Matrix

| Feature | Kohya SS | SimpleTuner | AI-Toolkit |
|---------|----------|-------------|------------|
| **GUI** | Yes | No | No |
| **Flux Support** | Basic | Excellent | Excellent |
| **SDXL Support** | Excellent | Good | Good |
| **SD1.5 Support** | Excellent | Good | Good |
| **Speed** | Standard | Standard | 20-30% faster |
| **Ease of Use** | High | Medium | Medium |
| **Documentation** | Extensive | Good | Good |

### Installation

#### Kohya SS

```bash
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
./setup.sh  # Linux/Mac
# or setup.bat for Windows
```

#### SimpleTuner

```bash
git clone https://github.com/bghira/SimpleTuner.git
cd SimpleTuner
pip install -r requirements.txt
```

#### AI-Toolkit

```bash
git clone https://github.com/ostris/ai-toolkit.git
cd ai-toolkit
pip install -r requirements.txt
```

---

## Model-Specific Hyperparameters

### Master Hyperparameter Table

| Parameter | Flux | SDXL | SD1.5 |
|-----------|------|------|-------|
| **Learning Rate** | 0.001 - 0.004 | 0.0001 - 0.0003 | 0.0001 - 0.0003 |
| **Training Steps** | 500 - 1500 | 2000 - 5000 | 1500 - 3000 |
| **Batch Size** | 4-8 | 4-8 | 4-8 |
| **Network Rank** | 16-32 | 32-64 | 16-32 |
| **Network Alpha** | 16-32 | 16-32 | 16-32 |
| **Optimizer** | AdamW | AdamW | AdamW |
| **LR Scheduler** | cosine | cosine | cosine |
| **Min Images** | 25-30 | 50-100 | 30-50 |

### Why Flux is Different

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX vs SDXL/SD1.5                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SDXL/SD1.5 (UNet):           Flux (DiT):                      │
│  ┌─────────────┐              ┌─────────────┐                  │
│  │  Learning   │              │  Learning   │                  │
│  │   slowly    │              │  VERY FAST  │                  │
│  │             │              │             │                  │
│  │ LR: 0.0001  │              │ LR: 0.001+  │                  │
│  │ Steps: 3000 │              │ Steps: 800  │                  │
│  └─────────────┘              └─────────────┘                  │
│                                                                 │
│  Key Differences:                                               │
│  - Flux uses Flow Matching (not noise prediction)               │
│  - Flux has no negative conditioning during training            │
│  - Flux converges much faster                                   │
│  - Flux overtrains easily with too many steps                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dataset Preparation

### Image Requirements

| Requirement | Specification |
|-------------|---------------|
| **Minimum Images** | 15 (25-100 recommended) |
| **Resolution** | 1024x1024 preferred (512x512 minimum) |
| **Format** | PNG or high-quality JPEG |
| **Quality** | Sharp, well-lit, consistent style |
| **Diversity** | Varied poses, angles, backgrounds |

### Quality vs Quantity

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUALITY > QUANTITY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ 25 well-curated, properly captioned images                  │
│     >>> beats >>>                                               │
│  ❌ 100 random, poorly captioned images                         │
│                                                                 │
│  For Flux specifically:                                         │
│  - 25-30 images is often SUFFICIENT for focused subjects        │
│  - More efficient training than SDXL                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Captioning Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **JoyCaption** | LLM-based natural language | **Flux (Required!)** |
| **Florence-2** | Advanced auto-captioning | Flux, high quality |
| **BLIP/BLIP-2** | Auto-generated captions | Quick start |
| **WD Tagger** | Tag-based (Danbooru style) | SDXL anime/character |
| **Manual** | Hand-written descriptions | Maximum quality |
| **Template** | `[trigger], [description]` | Consistent training |

### Critical: Natural Language vs Tags (Deep Research Finding)

```
╔════════════════════════════════════════════════════════════════════════════════╗
║  FLUX REQUIRES NATURAL LANGUAGE CAPTIONS!                                      ║
║                                                                                ║
║  Flux relies on the T5 LLM - it expects natural language sentences,            ║
║  NOT comma-separated tags. Using "Danbooru tags" severely degrades Flux        ║
║  prompt adherence.                                                             ║
║                                                                                ║
║  ❌ BAD (Flux):  "1girl, red hair, outdoors, smiling, masterpiece"             ║
║  ✅ GOOD (Flux): "A photo of a woman with red hair standing in a garden,       ║
║                  smiling warmly at the camera, soft natural lighting"          ║
║                                                                                ║
║  For SDXL: Tag-style captions still work well                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### Caption Format Examples

#### Character LoRA
```
ohwx_character, a woman with long red hair, wearing a blue dress, standing in a forest
ohwx_character, close-up portrait, woman with red hair, smiling, studio lighting
ohwx_character, full body shot, woman in casual clothes, walking on beach
```

#### Style LoRA
```
in the style of mystyle, abstract painting with vibrant colors and bold brushstrokes
mystyle style, surreal landscape with floating objects
painting by mystyle, portrait with exaggerated features and bright palette
```

### Dataset Structure

```
dataset/
├── img/
│   ├── 001.png
│   ├── 001.txt          # Caption file
│   ├── 002.png
│   ├── 002.txt
│   └── ...
└── config.toml          # Training config
```

### Data Augmentation

Kohya SS supports augmentation to expand small datasets:

| Augmentation | Effect | When to Use |
|--------------|--------|-------------|
| Flip | Horizontal mirror | Symmetric subjects |
| Color Jitter | Vary brightness/contrast | Diverse lighting |
| Random Crop | Different framings | Character training |

**Critical:** When using augmentation, **cache_latents must be OFF**.

---

## Training Configuration

### Kohya SS Config Template (Flux)

```toml
[model]
pretrained_model_name_or_path = "black-forest-labs/FLUX.1-dev"
v2 = false
v_parameterization = false

[network]
network_module = "networks.lora_flux"
network_dim = 32
network_alpha = 32

[optimizer]
optimizer_type = "AdamW"
learning_rate = 0.001
lr_scheduler = "cosine"
lr_warmup_steps = 100

[training]
train_batch_size = 4
max_train_steps = 1000
mixed_precision = "bf16"
gradient_checkpointing = true
gradient_accumulation_steps = 1

[dataset]
train_data_dir = "./dataset/img"
resolution = 1024
caption_extension = ".txt"
```

### Kohya SS Config Template (SDXL)

```toml
[model]
pretrained_model_name_or_path = "stabilityai/stable-diffusion-xl-base-1.0"

[network]
network_module = "networks.lora"
network_dim = 64
network_alpha = 32

[optimizer]
optimizer_type = "AdamW"
learning_rate = 0.0001
lr_scheduler = "cosine"
lr_warmup_steps = 200

[training]
train_batch_size = 4
max_train_steps = 3000
mixed_precision = "fp16"
gradient_checkpointing = true

[dataset]
train_data_dir = "./dataset/img"
resolution = 1024
caption_extension = ".txt"
```

---

## Flux LoRA Training

### Recommended Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Learning Rate | 0.001-0.004 | Much higher than SDXL! |
| Steps | 500-1500 | Overtrains quickly |
| Batch Size | 4-8 | Higher = more stable |
| Network Rank | 16-32 | Lower than SDXL often works |
| Network Alpha | = Rank | Keep alpha = rank |
| Optimizer | AdamW / Prodigy | AdamW8bit saves VRAM |
| Precision | bf16 | Flux prefers bf16 |

### Prodigy Optimizer (Deep Research Finding)

The **Prodigy optimizer** is the community favorite for "lazy" training - it adapts the learning rate automatically:

```toml
[optimizer]
optimizer_type = "Prodigy"
learning_rate = 1.0  # Prodigy manages the actual rate internally
d_coef = 1.0
```

Benefits:
- No need to guess the learning rate
- Almost guarantees a working result
- Converges well without manual tuning

Trade-off: Uses more VRAM than AdamW8bit

### Flux Training Command (SimpleTuner)

```bash
python train.py \
    --model_name_or_path "black-forest-labs/FLUX.1-dev" \
    --train_data_dir "./dataset" \
    --output_dir "./output" \
    --resolution 1024 \
    --train_batch_size 4 \
    --learning_rate 0.001 \
    --max_train_steps 1000 \
    --network_dim 32 \
    --network_alpha 32 \
    --optimizer "AdamW" \
    --lr_scheduler "cosine" \
    --mixed_precision "bf16"
```

### Flux Training Checklist

- [ ] Learning rate is 0.001+ (NOT 0.0001)
- [ ] Steps are 1500 or less
- [ ] Using bf16 precision
- [ ] Caption files include trigger word
- [ ] Batch size is at least 4
- [ ] NOT using negative prompts during training

---

## SDXL LoRA Training

### Updated Rank/Alpha Standard (Deep Research Finding)

The "old" advice of `Network Dim 128 / Alpha 1` is **obsolete**. The 2025/2026 standard:

| Use Case | Network Dim | Alpha | Notes |
|----------|-------------|-------|-------|
| **Style LoRA** | 32 | 16 | Keep Alpha at half of Dim |
| **Character LoRA** | 16-32 | 8-16 | Prevents overfitting |
| **DoRA (Recommended)** | 32 | 16 | Better than standard LoRA |

### Masked Training (Deep Research Finding)

Tools now auto-mask backgrounds. For character/object training, masking the background (training only the subject pixels) is now a **standard toggle** in Kohya:

```toml
[dataset]
# Enable masked training
enable_masked_loss = true
mask_target_background = true
```

This prevents "background bleed" - where the LoRA learns background elements instead of just the subject.

### Recommended Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Learning Rate | 0.0001-0.0003 | Standard for SDXL |
| Steps | 2000-5000 | More steps than Flux |
| Batch Size | 4-8 | Recommended minimum |
| Network Rank | 32 (DoRA) | Updated standard |
| Network Alpha | 16 | Half of Dim |
| Optimizer | AdamW / Prodigy | Prodigy recommended |
| Precision | fp16 | Standard for SDXL |
| Network Type | **DoRA** | Replaces standard LoRA |

### SDXL Training Command (Kohya)

```bash
accelerate launch train_network.py \
    --pretrained_model_name_or_path "stabilityai/stable-diffusion-xl-base-1.0" \
    --train_data_dir "./dataset" \
    --output_dir "./output" \
    --output_name "my_lora" \
    --resolution 1024 \
    --train_batch_size 4 \
    --learning_rate 0.0001 \
    --max_train_steps 3000 \
    --network_module "networks.lora" \
    --network_dim 64 \
    --network_alpha 32 \
    --optimizer_type "AdamW" \
    --lr_scheduler "cosine" \
    --mixed_precision "fp16" \
    --caption_extension ".txt"
```

### SDXL Training Checklist

- [ ] Learning rate is 0.0001-0.0003 (NOT 0.001+)
- [ ] Steps are 2000+ for quality
- [ ] Using fp16 precision
- [ ] Network rank is 32-64
- [ ] Dataset has 50+ images (ideally)
- [ ] Caption files include trigger word

---

## SD1.5 LoRA Training

### Recommended Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Learning Rate | 0.0001-0.0003 | Similar to SDXL |
| Steps | 1500-3000 | Less than SDXL |
| Batch Size | 4-8 | Standard |
| Network Rank | 16-32 | Often lower than SDXL |
| Network Alpha | 16-32 | Standard |
| Optimizer | AdamW | Prodigy also works |
| Precision | fp16 | Standard |

### SD1.5 Training Checklist

- [ ] Resolution is 512x512 (native)
- [ ] Learning rate is 0.0001-0.0003
- [ ] Steps are 1500-3000
- [ ] Network rank is 16-32
- [ ] Dataset has 30+ images

---

## Quality Assessment

### Overtrained LoRA Signs

| Sign | Description | Fix |
|------|-------------|-----|
| **Loss artifacts** | Blotchy colors, noise patterns | Reduce steps |
| **Style bleeding** | LoRA affects unrelated subjects | Lower rank |
| **Face distortion** | Faces look wrong | Reduce steps, lower strength |
| **Background corruption** | Backgrounds look trained | More diverse backgrounds |

### Undertrained LoRA Signs

| Sign | Description | Fix |
|------|-------------|-----|
| **Weak effect** | Need strength > 1.0 | More steps |
| **Inconsistent** | Style appears randomly | More images |
| **Missing features** | Key details not learned | Better captions |

### Testing Protocol

1. **Generate at strength 0.5-0.8** - Should show clear effect
2. **Test with/without trigger word** - Should require trigger
3. **Test different prompts** - Should work across scenarios
4. **Test stacking** - Should combine with other LoRAs

---

## Troubleshooting

### Decision Tree: Common Issues

```
Issue: LoRA has no effect
│
├─► Missing trigger word in prompt
│   └─► Add trigger word (e.g., "ohwx_character")
│
├─► Strength too low
│   └─► Increase to 0.8-1.0
│
├─► Wrong model architecture
│   └─► Match LoRA to base model (Flux LoRA for Flux only)
│
└─► Training failed silently
    └─► Check training logs for errors
```

```
Issue: LoRA causes artifacts
│
├─► Overtrained
│   └─► Reduce steps by 30-50%
│
├─► Learning rate too high
│   └─► Lower LR (especially for SDXL)
│
├─► Rank too high
│   └─► Reduce rank to 16-32
│
└─► Bad training data
    └─► Remove low-quality images, improve captions
```

```
Issue: Out of memory during training
│
├─► Reduce batch size
│   └─► Try batch_size=1 with gradient_accumulation=4
│
├─► Enable gradient checkpointing
│   └─► Trades compute for memory
│
├─► Use 8-bit optimizer
│   └─► AdamW8bit instead of AdamW
│
└─► Lower resolution
    └─► 768x768 instead of 1024x1024
```

### Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `CUDA OOM` | Not enough VRAM | Lower batch size, use 8-bit optimizer |
| `NaN loss` | Learning rate too high | Reduce LR by 50% |
| `No module named` | Missing dependency | `pip install` the module |
| `Checkpoint not found` | Wrong model path | Verify path/model name |

---

## LLM Agent Helper Functions

### Hyperparameter Selector

```javascript
/**
 * Select optimal hyperparameters based on model and dataset
 * @param {Object} config - Training configuration
 * @returns {Object} - Recommended hyperparameters
 */
function selectHyperparameters(config) {
  const {
    model = "flux",  // "flux", "sdxl", "sd15"
    imageCount = 30,
    subjectType = "character",  // "character", "style", "object"
    vramGB = 24
  } = config;

  const baseParams = {
    flux: {
      learning_rate: 0.001,
      max_steps: 1000,
      network_rank: 32,
      network_alpha: 32,
      batch_size: 4,
      precision: "bf16"
    },
    sdxl: {
      learning_rate: 0.0001,
      max_steps: 3000,
      network_rank: 64,
      network_alpha: 32,
      batch_size: 4,
      precision: "fp16"
    },
    sd15: {
      learning_rate: 0.0001,
      max_steps: 2000,
      network_rank: 32,
      network_alpha: 32,
      batch_size: 4,
      precision: "fp16"
    }
  };

  const params = { ...baseParams[model] };

  // Adjust for dataset size
  if (imageCount < 30) {
    params.max_steps = Math.floor(params.max_steps * 0.7);
    params.network_rank = Math.floor(params.network_rank * 0.75);
  } else if (imageCount > 100) {
    params.max_steps = Math.floor(params.max_steps * 1.3);
  }

  // Adjust for subject type
  if (subjectType === "style") {
    params.network_rank = Math.min(params.network_rank, 32);
  } else if (subjectType === "character") {
    params.network_rank = Math.max(params.network_rank, 32);
  }

  // Adjust for VRAM
  if (vramGB < 12) {
    params.batch_size = 1;
    params.gradient_accumulation = 4;
    params.optimizer = "AdamW8bit";
  }

  return params;
}
```

### Training Config Generator

```javascript
/**
 * Generate Kohya SS training config
 * @param {Object} options - Training options
 * @returns {string} - TOML config string
 */
function generateKohyaConfig(options) {
  const {
    model = "flux",
    modelPath,
    datasetPath,
    outputPath,
    triggerWord,
    ...hyperparams
  } = options;

  const params = { ...selectHyperparameters({ model }), ...hyperparams };

  const config = {
    flux: `
[model]
pretrained_model_name_or_path = "${modelPath || 'black-forest-labs/FLUX.1-dev'}"

[network]
network_module = "networks.lora_flux"
network_dim = ${params.network_rank}
network_alpha = ${params.network_alpha}

[optimizer]
optimizer_type = "${params.optimizer || 'AdamW'}"
learning_rate = ${params.learning_rate}
lr_scheduler = "cosine"
lr_warmup_steps = 100

[training]
train_batch_size = ${params.batch_size}
max_train_steps = ${params.max_steps}
mixed_precision = "${params.precision}"
gradient_checkpointing = true
${params.gradient_accumulation ? `gradient_accumulation_steps = ${params.gradient_accumulation}` : ''}

[dataset]
train_data_dir = "${datasetPath}"
resolution = 1024
caption_extension = ".txt"

[output]
output_dir = "${outputPath}"
output_name = "${triggerWord}_lora"
`,
    sdxl: `
[model]
pretrained_model_name_or_path = "${modelPath || 'stabilityai/stable-diffusion-xl-base-1.0'}"

[network]
network_module = "networks.lora"
network_dim = ${params.network_rank}
network_alpha = ${params.network_alpha}

[optimizer]
optimizer_type = "${params.optimizer || 'AdamW'}"
learning_rate = ${params.learning_rate}
lr_scheduler = "cosine"
lr_warmup_steps = 200

[training]
train_batch_size = ${params.batch_size}
max_train_steps = ${params.max_steps}
mixed_precision = "${params.precision}"
gradient_checkpointing = true

[dataset]
train_data_dir = "${datasetPath}"
resolution = 1024
caption_extension = ".txt"

[output]
output_dir = "${outputPath}"
output_name = "${triggerWord}_lora"
`
  };

  return config[model] || config.sdxl;
}
```

### Caption Generator Template

```javascript
/**
 * Generate caption for training image
 * @param {Object} details - Image details
 * @returns {string} - Caption string
 */
function generateCaption(details) {
  const {
    triggerWord,
    subjectType = "character",
    description,
    action = null,
    setting = null,
    style = null
  } = details;

  const parts = [triggerWord];

  if (subjectType === "character") {
    parts.push(description);
    if (action) parts.push(action);
    if (setting) parts.push(setting);
  } else if (subjectType === "style") {
    parts.push(`in the style of ${triggerWord}`);
    parts.push(description);
  } else {
    parts.push(description);
  }

  if (style) parts.push(style);

  return parts.join(", ");
}

// Example
const caption = generateCaption({
  triggerWord: "ohwx_character",
  subjectType: "character",
  description: "a woman with long red hair and green eyes",
  action: "smiling at the camera",
  setting: "in a sunlit garden"
});
// Output: "ohwx_character, a woman with long red hair and green eyes, smiling at the camera, in a sunlit garden"
```

### Quality Checker

```javascript
/**
 * Check if training parameters are valid for the target model
 * @param {string} model - Target model type
 * @param {Object} params - Training parameters
 * @returns {Object} - Validation result with warnings
 */
function validateTrainingParams(model, params) {
  const warnings = [];
  const errors = [];

  if (model === "flux") {
    if (params.learning_rate < 0.0005) {
      warnings.push("Learning rate may be too low for Flux. Recommended: 0.001-0.004");
    }
    if (params.max_steps > 2000) {
      warnings.push("Steps may be too high for Flux. Risk of overtraining. Recommended: 500-1500");
    }
    if (params.precision === "fp16") {
      warnings.push("Flux prefers bf16 precision");
    }
  }

  if (model === "sdxl" || model === "sd15") {
    if (params.learning_rate > 0.0005) {
      errors.push(`Learning rate ${params.learning_rate} is too high for ${model}! Use 0.0001-0.0003`);
    }
    if (params.max_steps < 1500) {
      warnings.push("Steps may be too low for quality. Recommended: 2000+");
    }
  }

  if (params.batch_size < 1) {
    errors.push("Batch size must be at least 1");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## Quick Reference Card

### Model-Specific Settings

| Setting | Flux | SDXL | SD1.5 |
|---------|------|------|-------|
| LR | 0.001-0.004 | 0.0001-0.0003 | 0.0001-0.0003 |
| Steps | 500-1500 | 2000-5000 | 1500-3000 |
| Rank | 16-32 | 32-64 | 16-32 |
| Alpha | = Rank | 16-32 | 16-32 |
| Precision | bf16 | fp16 | fp16 |
| Images | 25-30 | 50-100 | 30-50 |

### Common Trigger Word Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Character | `[name]_[type]` | `ohwx_character` |
| Style | `[name]_style` | `mystyle_style` |
| Object | `[name]_[object]` | `myproduct_shoe` |

### Training Time Estimates

| Model | Steps | Images | ~Time (RTX 3090) |
|-------|-------|--------|------------------|
| Flux | 1000 | 30 | 30-45 min |
| SDXL | 3000 | 50 | 2-3 hours |
| SD1.5 | 2000 | 40 | 1-2 hours |

### VRAM Tier List (Deep Research Finding)

| VRAM | Capabilities |
|------|--------------|
| **12GB** | SDXL LoRA, Flux (heavily quantized/slow) |
| **16GB** | SDXL Full, Flux FP8 LoRA |
| **24GB** | Flux comfortable LoRA training |
| **40GB+** | Multiple experiments, larger ranks |

---

*Document Version: 2.0 | Last Updated: January 2026 | Optimized for LLM Agent Consumption*
