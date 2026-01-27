# Get Started with Kling AI Video Generation

Comprehensive prompting guide and API reference for Kling AI video generation via FAL.ai.

**Provider:** FAL.ai (not direct Kling API)
**Last Updated:** 2026-01-26
**Version:** 2.0 (Enriched for LLM Agent Consumption)

---

## Table of Contents

1. [Overview](#overview)
2. [Model Versions](#model-versions)
3. [The S.C.A.M. Prompting Framework](#the-scam-prompting-framework)
4. [Text-to-Video Generation](#text-to-video-generation)
5. [Image-to-Video Generation](#image-to-video-generation)
6. [Motion Control (v2.6)](#motion-control-v26)
7. [Video Editing (O1)](#video-editing-o1)
8. [Camera Control Deep Dive](#camera-control-deep-dive)
9. [Negative Prompt Master Lists](#negative-prompt-master-lists)
10. [Creative Video Recipes](#creative-video-recipes)
11. [Iterative Workflow Examples](#iterative-workflow-examples)
12. [Aspect Ratio Composition Guide](#aspect-ratio-composition-guide)
13. [API Reference](#api-reference)
14. [Troubleshooting Decision Tree](#troubleshooting-decision-tree)
15. [Complete Code Examples](#complete-code-examples)

---

## Overview

Kling AI is developed by Kuaishou Technology and provides:
- **@Kolors** - Image generation technology
- **@Kling** - Video generation technology

We access Kling through **FAL.ai** which provides:
- No Kling account needed
- All supported features
- Competitive pricing
- JavaScript/Python SDKs

### Capabilities Matrix

| Feature | Kling v2.1 | Kling v2.5 | Kling v2.6 | Kling O1 |
|---------|------------|------------|------------|----------|
| Text-to-Video | Yes | Yes (Turbo) | Yes | Yes |
| Image-to-Video | Yes (Pro) | Yes | Yes | Yes |
| Motion Control | No | No | **Yes** | No |
| Video Editing | No | No | No | **Yes** |
| Multi-Image Input | 4 images | 4 images | Via reference | 4 images |
| Max Duration | 10s | 10s | 30s | 10s |

### Critical Knowledge for LLM Agents

**Parameter Priority (What Overrides What):**
1. **Input Image** strongly overrides text prompt in v2.1/v2.6 (image defines appearance)
2. **Reference Video** overrides motion descriptions in Motion Control
3. **Negative Prompt** overrides conflicting positive prompt elements
4. **cfg_scale** controls balance: low (0.3) = more creative, high (0.7+) = strict adherence

**Duration Quality Degradation:**
- Quality degrades significantly after 5 seconds in autoregressive generation
- **Best Practice:** Generate 5s clips and stitch, rather than forcing 10s
- Exception: v2.6 Motion Control handles 30s well due to reference guidance

---

## Model Versions

### Available via FAL.ai

| Version | Endpoint | Best For | Quality | Speed |
|---------|----------|----------|---------|-------|
| **v2.6 Pro** | `fal-ai/kling-video/v2.6/pro` | Motion control, choreography | Highest | Slow |
| **v2.6 Standard** | `fal-ai/kling-video/v2.6/standard` | Motion control (budget) | High | Medium |
| **v2.5 Turbo Pro** | `fal-ai/kling-video/v2.5-turbo/pro` | Fast text-to-video | Good | Fast |
| **v2.1 Pro** | `fal-ai/kling-video/v2.1/pro` | Image-to-video | High | Medium |
| **v2.1 Master** | `fal-ai/kling-video/v2.1/master` | Highest quality I2V | Highest | Slow |
| **O1 Edit** | `fal-ai/kling-video/o1/video-to-video/edit` | Video editing/style transfer | High | Medium |

### Model Selection Decision Tree

```
START: What do you have?
│
├─► Only text description
│   └─► Use v2.5 Turbo Pro (fast) or v2.6 Pro (quality)
│
├─► Single image to animate
│   ├─► Need highest quality? → v2.1 Master
│   └─► Standard quality OK? → v2.1 Pro
│
├─► Image + reference motion video
│   ├─► Dance/full body motion? → v2.6 Pro, orientation="video"
│   └─► Portrait/subtle motion? → v2.6 Pro, orientation="image"
│
└─► Existing video to edit
    └─► Use O1 Edit
```

### Pricing

| Mode | Cost | Max Duration | Cost for 5s | Cost for 10s |
|------|------|--------------|-------------|--------------|
| v2.6 Standard | $0.07/sec | 30s | $0.35 | $0.70 |
| v2.6 Pro | $0.112/sec | 30s | $0.56 | $1.12 |
| v2.5 Turbo Pro | $0.07/sec | 10s | $0.35 | $0.70 |
| v2.1 Pro | $0.07/sec | 10s | $0.35 | $0.70 |
| v2.1 Master | $0.112/sec | 10s | $0.56 | $1.12 |
| O1 Edit | $0.168/sec | 10s | $0.84 | $1.68 |

---

## The S.C.A.M. Prompting Framework

**The universal framework for constructing effective video prompts.** This order helps the model prioritize spatial composition before rendering motion.

### Framework Structure

```
S - Subject    (WHO/WHAT is the focus)
C - Camera     (HOW we see it - movement, angle, lens)
A - Action     (WHAT is happening - verbs, direction, velocity)
M - Mood       (ATMOSPHERE - lighting, style, emotion)
```

### Why This Order Matters

1. **Subject first** = Model locks onto the main element
2. **Camera second** = Establishes spatial framing before motion
3. **Action third** = Motion applied to established subject/framing
4. **Mood last** = Stylistic treatment applied to complete scene

### S.C.A.M. Examples by Use Case

#### Cinematic Action Scene
```
(S) A cybernetic samurai with glowing neon armor and a scarred face
(C) Low angle shot, camera dolly in fast, 35mm anamorphic lens, shallow depth of field
(A) draws a katana in one fluid motion while rain falls in slow motion around him
(M) cyberpunk aesthetic, wet pavement reflections, volumetric blue and pink lighting, film grain
```

**Complete prompt:**
```
A cybernetic samurai with glowing neon armor and a scarred face. Low angle shot, camera dolly in fast, 35mm anamorphic lens, shallow depth of field. Draws a katana in one fluid motion while rain falls in slow motion around him. Cyberpunk aesthetic, wet pavement reflections, volumetric blue and pink lighting, film grain.
```

#### Nature Documentary
```
(S) A red fox with thick winter coat, alert ears, bright amber eyes
(C) Telephoto lens 200mm, shallow depth of field, camera tracks right smoothly
(A) leaps gracefully through deep powder snow, ears twitching, paws kicking up snow crystals
(M) golden hour sunlight, 8K resolution, National Geographic style, natural colors
```

**Complete prompt:**
```
A red fox with thick winter coat, alert ears, bright amber eyes. Telephoto lens 200mm, shallow depth of field, camera tracks right smoothly. Leaps gracefully through deep powder snow, ears twitching, paws kicking up snow crystals. Golden hour sunlight, 8K resolution, National Geographic style, natural colors.
```

#### Product Commercial
```
(S) A matte black premium wireless headphone with rose gold accents
(C) Macro lens, extreme close-up, slow 360-degree rotation, rack focus from logo to ear cup
(A) rotates smoothly on invisible axis, light catches the metallic accents progressively
(M) pure white cyclorama background, soft studio lighting, luxury brand aesthetic, clean minimal
```

**Complete prompt:**
```
A matte black premium wireless headphone with rose gold accents. Macro lens, extreme close-up, slow 360-degree rotation, rack focus from logo to ear cup. Rotates smoothly on invisible axis, light catches the metallic accents progressively. Pure white cyclorama background, soft studio lighting, luxury brand aesthetic, clean minimal.
```

#### Horror/Thriller
```
(S) A Victorian porcelain doll with cracked face, one glass eye missing, dusty lace dress
(C) Dutch angle, slow push in, handheld slight shake, wide angle lens distortion
(A) head turns imperceptibly toward camera, shadows shift across face
(M) single flickering candle light, deep shadows, desaturated colors, 1970s horror film grain
```

**Complete prompt:**
```
A Victorian porcelain doll with cracked face, one glass eye missing, dusty lace dress. Dutch angle, slow push in, handheld slight shake, wide angle lens distortion. Head turns imperceptibly toward camera, shadows shift across face. Single flickering candle light, deep shadows, desaturated colors, 1970s horror film grain.
```

#### Romantic Scene
```
(S) A young couple in elegant evening wear, him in black tuxedo, her in flowing red gown
(C) Medium two-shot, camera slowly orbits around them, 85mm portrait lens, dreamy soft focus
(A) they begin to waltz, her dress flowing, his hand on her waist, eyes locked
(M) warm golden chandelier light, bokeh sparkles, romantic comedy aesthetic, warm color grade
```

**Complete prompt:**
```
A young couple in elegant evening wear, him in black tuxedo, her in flowing red gown. Medium two-shot, camera slowly orbits around them, 85mm portrait lens, dreamy soft focus. They begin to waltz, her dress flowing, his hand on her waist, eyes locked. Warm golden chandelier light, bokeh sparkles, romantic comedy aesthetic, warm color grade.
```

### Quick Reference: S.C.A.M. Components

**Subject Keywords:**
- Physical attributes: age, build, clothing, distinguishing features
- Materials: metallic, matte, glossy, textured, weathered
- State: pristine, damaged, ancient, futuristic

**Camera Keywords:**
- Angles: low angle, high angle, eye level, bird's eye, worm's eye, Dutch angle
- Movement: pan, tilt, dolly, truck, crane, steadicam, handheld
- Lenses: wide angle (24mm), normal (50mm), telephoto (85mm+), macro, anamorphic
- Focus: shallow DOF, deep focus, rack focus, soft focus

**Action Keywords:**
- Velocity: slowly, rapidly, gracefully, abruptly, smoothly
- Direction: left to right, toward camera, receding, circling
- Verbs: walks, runs, turns, reaches, falls, rises, transforms

**Mood Keywords:**
- Lighting: golden hour, blue hour, neon, candlelight, overcast, harsh sunlight
- Style: cinematic, documentary, commercial, indie film, music video
- Emotion: tense, peaceful, chaotic, intimate, epic, melancholic

---

## Text-to-Video Generation

### The First Frame Mental Model

When Kling generates video from text, it first creates a mental "first frame" then animates from there. Your prompt should:
1. Describe what the FIRST FRAME looks like
2. Then describe how it CHANGES over time

**Good structure:**
```
[Initial state description]. [Motion/change description].
```

**Example:**
```
A woman in a red dress stands at the edge of a cliff overlooking the ocean at sunset. She slowly raises her arms, her dress and hair billowing in the wind as she breathes deeply.
```

### API Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text description using S.C.A.M. framework |
| `duration` | enum | No | "5" | `"5"` or `"10"` seconds |
| `aspect_ratio` | enum | No | "16:9" | `"16:9"`, `"9:16"`, `"1:1"` |
| `negative_prompt` | string | No | - | Elements to avoid (see master list) |
| `cfg_scale` | float | No | 0.5 | 0.0-1.0, higher = stricter prompt adherence |
| `camera_control` | enum | No | - | Preset camera movement |
| `advanced_camera_control` | object | No | - | Precise camera parameters |

### Camera Control Presets

| Preset | Movement | Best For |
|--------|----------|----------|
| `down_back` | Camera moves down and backward | Reveals, establishing shots |
| `forward_up` | Camera moves forward and upward | Dramatic approaches, hero shots |
| `right_turn_forward` | Camera turns right while advancing | Dynamic following shots |
| `left_turn_forward` | Camera turns left while advancing | Dynamic following shots |

**Pro Tip:** Align API preset with prompt description for strongest results:
```javascript
{
  camera_control: "forward_up",
  prompt: "Camera flies forward and upward over the mountain peak..."
}
```

### Complete Text-to-Video Examples

#### Example 1: Cinematic Landscape
```javascript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "An ancient temple ruins covered in moss and vines, shafts of golden sunlight pierce through gaps in the stone ceiling. Camera slowly dollies forward through the entrance, dust particles float in the light beams. Epic adventure film aesthetic, rich saturated colors, volumetric god rays, 4K cinematic quality.",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "blur, distortion, text, watermark, low quality, oversaturated, cartoon",
    cfg_scale: 0.6,
    camera_control: "forward_up"
  }
});

console.log(result.data.video.url);
```

#### Example 2: Product Shot
```javascript
const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "A luxury perfume bottle with amber liquid, gold cap, sitting on black marble surface. Soft key light from upper left creates elegant highlights on glass. Camera slowly orbits 45 degrees while maintaining focus. Premium advertising aesthetic, clean reflections, subtle caustics through liquid.",
    duration: "5",
    aspect_ratio: "1:1",
    negative_prompt: "blur, fingerprints, dust, scratches, harsh shadows, amateur lighting",
    cfg_scale: 0.7
  }
});
```

#### Example 3: Character Animation
```javascript
const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "A weathered sea captain with grey beard, worn peacoat, and captain's hat stands at ship's wheel. Medium shot, gentle rocking motion of boat, his eyes scan the horizon left to right. Overcast nautical lighting, muted blue-grey color palette, cinematic shallow depth of field, ocean spray in background.",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "morphing, distortion, extra limbs, blurry face, unnatural movement",
    cfg_scale: 0.5
  }
});
```

---

## Image-to-Video Generation

### The First Frame Rule (Critical)

**In Image-to-Video, your input image IS the first frame.** Your prompt must:
1. **Describe the input image first** (what IS there)
2. **Then describe the motion** (what CHANGES)

If your prompt contradicts the image, Kling creates "morphing" artifacts.

#### Correct Approach
```
Input image: Woman in blue dress standing in garden
Prompt: "A woman in a blue dress standing in a garden. She slowly turns her head to look at a butterfly, her dress swaying gently in the breeze."
```

#### Wrong Approach (Causes Morphing)
```
Input image: Woman in blue dress standing in garden
Prompt: "A woman in a red dress sitting on a bench..."
// WRONG! Contradicts image - will cause grotesque morphing
```

### Image Requirements

| Requirement | Details | Why It Matters |
|-------------|---------|----------------|
| Resolution | 1080p+ recommended | Higher res = more detail preserved |
| Composition | Subject well-framed | Model needs clear subject identification |
| Lighting | Even, well-lit | Shadows confuse motion prediction |
| Format | JPG, PNG, WEBP, GIF, AVIF | PNG best for quality |
| Subject Size | >5% of frame area | Too small = identity loss |
| Pose | Natural, unoccluded | Hidden limbs can't animate properly |

### API Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Describe image THEN motion |
| `image_url` | string | Yes | - | Source image URL |
| `duration` | enum | No | "5" | `"5"` or `"10"` seconds |
| `aspect_ratio` | enum | No | "16:9" | Match input image ratio |
| `negative_prompt` | string | No | - | See master list |
| `cfg_scale` | float | No | 0.5 | Lower = more motion freedom |
| `tail_image_url` | string | No | - | End frame (for transitions) |
| `static_mask_url` | string | No | - | Areas that should NOT move |
| `dynamic_mask_url` | string | No | - | Areas that SHOULD move |
| `special_fx` | enum | No | - | Preset effects |
| `input_image_urls` | array | No | - | Up to 4 images for multi-subject |

### Special Effects

| Effect | Description | Best For |
|--------|-------------|----------|
| `hug` | Two subjects embrace | Greeting cards, emotional moments |
| `kiss` | Romantic kiss motion | Valentine's content |
| `heart_gesture` | Hands form heart shape | Social media, K-pop style |
| `squish` | Playful compression | Cute/kawaii content |
| `expansion` | Subject grows/expands | Dramatic reveals |

### Complete Image-to-Video Examples

#### Example 1: Portrait Animation (Living Photo)
```javascript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

// Living portrait - subtle, realistic motion
const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    prompt: "A young woman with long dark hair in a white blouse, soft natural lighting. She blinks slowly, takes a gentle breath, a slight smile forms at the corner of her lips, hair moves subtly as if in a light breeze. Photorealistic, intimate portrait, shallow depth of field.",
    image_url: "https://your-storage.com/portrait.jpg",
    duration: "5",
    aspect_ratio: "9:16",
    negative_prompt: "exaggerated motion, morphing, distortion, unnatural blinking, robotic movement",
    cfg_scale: 0.4  // Lower for more natural, subtle motion
  }
});

console.log(result.data.video.url);
```

#### Example 2: Action Shot
```javascript
// More dynamic motion from still
const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    prompt: "A martial artist in white gi in fighting stance in a dojo. He executes a powerful front kick, his gi snapping with the motion, then returns to stance. Dynamic action cinematography, motion blur on limbs, sharp focus on face.",
    image_url: "https://your-storage.com/martial-artist.jpg",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "slow motion, frozen, static, morphing limbs, extra arms",
    cfg_scale: 0.6
  }
});
```

#### Example 3: Product Animation
```javascript
// Product coming to life
const result = await fal.subscribe("fal-ai/kling-video/v2.1/master/image-to-video", {
  input: {
    prompt: "A sleek smartwatch on a white display stand. The screen illuminates, displaying time and notifications, subtle light reflections play across the glass surface, the band material catches light as stand rotates slowly. Premium product photography, clean studio lighting.",
    image_url: "https://your-storage.com/smartwatch.jpg",
    duration: "5",
    aspect_ratio: "1:1",
    negative_prompt: "blur, screen glitch, distorted text, cheap look, fingerprints",
    cfg_scale: 0.7  // Higher for precise product details
  }
});
```

#### Example 4: Scene with End Frame (Transition)
```javascript
// Controlled start-to-end transition
const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    prompt: "A caterpillar on a green leaf transforms gradually, subtle morphing of body shape, wings beginning to emerge.",
    image_url: "https://your-storage.com/caterpillar.jpg",
    tail_image_url: "https://your-storage.com/butterfly.jpg",  // End frame
    duration: "10",
    aspect_ratio: "16:9",
    negative_prompt: "abrupt change, glitch, unnatural transformation",
    cfg_scale: 0.5
  }
});
```

---

## Motion Control (v2.6)

Motion Control transfers choreography from a reference video to your character image. This is Kling's most powerful feature for character animation.

### Core Concept

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Character Image │ + │ Reference Video │ + │  Context Prompt │
│ (visual identity)│   │ (choreography)  │   │ (scene/style)   │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    ┌─────────────────┐
                    │  Output Video   │
                    │ (identity+motion)│
                    └─────────────────┘
```

### Orientation Modes Explained

| Mode | `character_orientation` | Max Duration | Use When |
|------|------------------------|--------------|----------|
| **Image Orientation** | `"image"` | 10 seconds | Subject should maintain reference image's general pose/framing |
| **Video Orientation** | `"video"` | 30 seconds | Subject should match reference video's body positioning exactly |

**Image Orientation** (`"image"`):
- Best for: Talking heads, subtle expressions, camera movements
- Behavior: Takes motion cues but keeps character in image's original pose
- Example: Make a portrait "come alive" with blinking, head turns

**Video Orientation** (`"video"`):
- Best for: Dance, sports, full-body choreography
- Behavior: Character matches reference video pose-for-pose
- Example: Transfer a dance routine to your character

### API Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image_url` | string | Yes | - | Character reference image |
| `video_url` | string | Yes | - | Motion source video |
| `character_orientation` | enum | Yes | - | `"image"` or `"video"` |
| `prompt` | string | No | - | Scene context only (NOT motion) |
| `keep_original_sound` | boolean | No | true | Preserve reference audio |

### Input Requirements

**Character Image:**
| Requirement | Why |
|-------------|-----|
| Subject >5% of frame | Model needs clear subject detection |
| Clear body proportions | Hidden parts can't animate |
| High resolution (1080p+) | Detail preservation |
| Good lighting | Even lighting = better extraction |
| Visible limbs | Can't animate what's hidden |

**Reference Video:**
| Requirement | Why |
|-------------|-----|
| Realistic human motion | Model trained on human movement |
| Visible head + upper/full body | Needs pose landmarks |
| 2-30 seconds (video mode) | Longer = more motion data |
| 2-10 seconds (image mode) | Shorter for subtle motion |
| Stable, clear footage | Blur/shake confuses pose detection |
| MP4, MOV, WEBM, M4V, GIF | Supported formats |

**Avoid in Reference Video:**
- Blurry or shaky footage
- Rapid camera movement
- Complex hand gestures (fingers often fail)
- Multiple people (confuses subject detection)
- Non-humanoid motion

### Prompting for Motion Control

**CRITICAL: Do NOT describe motion in the prompt!**

The reference video defines all motion. Your prompt should only describe:
1. Character identity reinforcement
2. Environment/scene setting
3. Lighting and atmosphere
4. Visual style

#### Good Motion Control Prompts

```
# Character identity + environment + style
"Rumi, a K-pop idol with vivid purple braided hair reaching her waist, wearing a cropped yellow racing jacket with sponsor patches, black cargo pants. Performing on a concert stage with massive LED screens, neon lights in pink and blue, concert fog, cinematic lighting, consistent character appearance throughout."
```

```
# Detailed character + location + atmosphere
"A graceful ballet dancer in a white tutu with silver embroidery, pale skin, hair in a tight bun with crystal pins. Grand theater stage, soft pink spotlight from above, rows of empty red velvet seats visible in darkness beyond, dust particles floating in light beams, classical elegance."
```

```
# Character + setting for style transfer
"The same person rendered in Studio Ghibli anime style, soft cel shading, pastel color palette, whimsical forest background with oversized mushrooms and floating particles, magical atmosphere, consistent anime character design throughout."
```

#### Bad Motion Control Prompts (Don't Do This)

```
# WRONG: Describing motion (video already defines this!)
"Dancing energetically with spinning and jumping movements"
"Character waves their arms and spins around"
"Walking forward then turning to face camera"
```

```
# WRONG: Contradicting the reference video
"Standing perfectly still" (when reference shows dancing)
"Moving in slow motion" (when reference is normal speed)
```

### Temporal Consistency Keywords

Include these phrases to maintain visual coherence:

```
- "consistent character appearance throughout"
- "maintains exact facial features"
- "stable lighting conditions"
- "smooth continuous motion"
- "no morphing or distortion"
- "preserves costume details throughout"
```

### Style Transfer via Prompt

You can change visual style while preserving motion:

| Style | Prompt Addition |
|-------|-----------------|
| Anime | "rendered in anime style, cel shading, vibrant colors" |
| Photorealistic | "photorealistic, 8K detail, natural skin texture, film grain" |
| Vintage Film | "shot on 35mm film, warm color grade, subtle grain, 1970s aesthetic" |
| Cyberpunk | "cyberpunk aesthetic, neon lighting, rain-slicked streets, holographic elements" |
| Watercolor | "watercolor painting style, soft edges, visible brushstrokes, artistic" |

### Complete Motion Control Examples

#### Example 1: Dance Choreography Transfer
```javascript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: "https://your-storage.com/kpop-character.png",
    video_url: "https://your-storage.com/dance-reference.mp4",
    character_orientation: "video",  // Full body dance = video mode
    prompt: "Mina, a K-pop idol with long straight black hair with purple highlights, wearing a sparkly silver crop top and high-waisted black leather pants, platform boots. Performing on a concert stage, massive LED wall behind showing abstract patterns, dramatic concert lighting with moving spotlights, fog machines, stadium atmosphere, consistent character appearance throughout, smooth motion."
  }
});

console.log(result.data.video.url);
```

#### Example 2: Talking Head / Portrait Animation
```javascript
const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: "https://your-storage.com/ceo-portrait.png",
    video_url: "https://your-storage.com/talking-head-reference.mp4",
    character_orientation: "image",  // Subtle motion = image mode
    prompt: "A distinguished CEO in his 50s, silver hair, wearing a navy blue suit with subtle pinstripes, silk tie, professional headshot framing. Modern office background with floor-to-ceiling windows, city skyline visible, warm afternoon lighting, corporate professional aesthetic, consistent facial features throughout."
  }
});
```

#### Example 3: Style Transfer - Anime
```javascript
const result = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: "https://your-storage.com/anime-character.png",
    video_url: "https://your-storage.com/action-reference.mp4",
    character_orientation: "video",
    prompt: "An anime hero with spiky blue hair and determined expression, wearing a tattered red cloak over black armor, glowing sword in hand. Epic fantasy battlefield with dramatic clouds, anime style cel shading, vibrant saturated colors, dynamic action lines during movement, consistent anime character design throughout, Studio Trigger aesthetic."
  }
});
```

### Motion Control Iterative Workflow

**Step 1: Verify Motion Transfer (Minimal Prompt)**
```javascript
// First, test with minimal prompt to ensure motion works
const test = await fal.subscribe("fal-ai/kling-video/v2.6/standard/motion-control", {
  input: {
    image_url: characterUrl,
    video_url: motionUrl,
    character_orientation: "video",
    prompt: "A person performing, consistent appearance."  // Minimal
  }
});
// Review: Does motion transfer correctly?
```

**Step 2: Add Character Identity**
```javascript
// If motion works, add character details
const v2 = await fal.subscribe("fal-ai/kling-video/v2.6/standard/motion-control", {
  input: {
    image_url: characterUrl,
    video_url: motionUrl,
    character_orientation: "video",
    prompt: "Sakura, a young woman with pink twin-tails, wearing a sailor-style school uniform with red ribbon, consistent appearance throughout."
  }
});
// Review: Is character identity preserved?
```

**Step 3: Add Environment**
```javascript
// Add scene context
const v3 = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: characterUrl,
    video_url: motionUrl,
    character_orientation: "video",
    prompt: "Sakura, a young woman with pink twin-tails, wearing a sailor-style school uniform with red ribbon. Cherry blossom festival at a traditional Japanese shrine, pink petals floating in air, paper lanterns, soft golden hour lighting, consistent appearance throughout."
  }
});
// Review: Does environment enhance without breaking character?
```

**Step 4: Add Style Polish**
```javascript
// Final style refinements
const final = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
  input: {
    image_url: characterUrl,
    video_url: motionUrl,
    character_orientation: "video",
    prompt: "Sakura, a young woman with pink twin-tails, wearing a sailor-style school uniform with red ribbon. Cherry blossom festival at a traditional Japanese shrine, pink petals floating in air, paper lanterns, soft golden hour lighting. Anime style, soft cel shading, Makoto Shinkai inspired color palette, dreamy atmosphere, consistent character appearance throughout, smooth fluid motion."
  }
});
```

---

## Video Editing (O1)

Kling O1 provides surgical video editing capabilities. The key to O1 is the **"What, Not How"** rule.

### The "What, Not How" Rule

**CRITICAL: Describe the TARGET RESULT, not the editing process.**

O1 responds to descriptions of what you want to SEE, not instructions on what to CHANGE.

| Bad Prompt (Process) | Good Prompt (Result) |
|---------------------|---------------------|
| "Remove the dog from the scene" | "A peaceful empty park with green grass, no animals present" |
| "Change her dress to red" | "A woman wearing a flowing bright red satin evening gown" |
| "Make it look like a cartoon" | "Animation style, cel-shaded, 2D anime aesthetic, flat bold colors, black outlines" |
| "Add snow to the scene" | "A winter wonderland with thick snow covering the ground, snowflakes falling gently" |
| "Make him younger" | "A young man in his twenties with smooth skin, full dark hair, youthful energy" |

### Four Generation Modes

| Mode | Input | Output | Use Case |
|------|-------|--------|----------|
| **Image-to-Video** | Single image | Animated video | Bring still to life |
| **Video-to-Video Reference** | Video + style ref | Styled video | Style transfer |
| **Reference-to-Video** | Up to 4 images | Combined video | Multi-element composition |
| **Video-to-Video Edit** | Existing video | Modified video | Surgical edits |

### Region-Specific Editing with Anchor Descriptions

To edit specific parts without masks, use **explicit anchoring**:

```
"The BACKGROUND transforms into a snowy mountain range at sunset,
while the MAN IN THE BLACK SUIT continues walking unchanged,
maintaining his exact appearance and motion."
```

Key anchoring phrases:
- "...while [element] remains unchanged"
- "...maintaining [element]'s exact appearance"
- "...preserving [element] completely"
- "[element] continues [action] unchanged"

### Complete O1 Examples

#### Example 1: Background Replacement
```javascript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://your-storage.com/person-walking.mp4",
    prompt: "A person walking through a futuristic cyberpunk city at night, neon signs in Japanese and English, holographic advertisements floating in air, rain-slicked streets reflecting colorful lights, flying cars in distant sky. The walking person maintains their exact appearance, clothing, and walking motion unchanged. Blade Runner aesthetic, moody atmospheric lighting.",
    cfg_scale: 0.6
  }
});

console.log(result.data.video.url);
```

#### Example 2: Style Transfer to Animation
```javascript
const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://your-storage.com/dance-video.mp4",
    prompt: "A dancer performing in vibrant 2D anime style, cel-shaded with bold black outlines, flat colors with subtle gradients, expressive exaggerated motion lines during fast movements, sparkle effects, colorful abstract background with geometric shapes, Japanese animation aesthetic, consistent anime character design throughout.",
    cfg_scale: 0.7
  }
});
```

#### Example 3: Claymation Style Transfer
```javascript
const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://your-storage.com/character-acting.mp4",
    prompt: "A claymation character with visible fingerprint textures in the clay, slightly jerky stop-motion movement style at 12fps, plasticine material with subtle imperfections, warm studio lighting casting soft shadows, miniature detailed set design, Aardman Animations quality, Wallace and Gromit aesthetic.",
    cfg_scale: 0.8  // Higher for stronger style application
  }
});
```

#### Example 4: Outfit Change
```javascript
const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://your-storage.com/fashion-model.mp4",
    prompt: "A fashion model wearing an elegant floor-length emerald green velvet gown with a dramatic thigh-high slit, matching emerald jewelry, the dress flows and moves naturally with her walking motion. Her face, hair, and walking style remain exactly the same. Luxury fashion photography lighting, editorial style.",
    cfg_scale: 0.6
  }
});
```

#### Example 5: Weather/Atmosphere Change
```javascript
const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://your-storage.com/outdoor-scene.mp4",
    prompt: "The same scene during a dramatic thunderstorm, dark ominous clouds, heavy rain falling, lightning flashes illuminating the scene momentarily, puddles forming on ground, wet reflective surfaces everywhere. All people and objects in the scene maintain their positions and actions, only the weather and lighting change.",
    cfg_scale: 0.5
  }
});
```

#### Example 6: Reference-to-Video with Multiple Elements
```javascript
const result = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: "https://your-storage.com/base-scene.mp4",
    prompt: "The character from reference image 1 walks through the marketplace, wearing the medieval costume from reference image 2, carrying the magical staff from reference image 3. The marketplace maintains the lighting and atmosphere from reference image 4. Fantasy adventure film aesthetic, golden hour lighting.",
    input_image_urls: [
      "https://your-storage.com/character-face.jpg",
      "https://your-storage.com/costume-reference.jpg",
      "https://your-storage.com/staff-prop.jpg",
      "https://your-storage.com/marketplace-lighting.jpg"
    ],
    cfg_scale: 0.6
  }
});
```

---

## Camera Control Deep Dive

### Camera Keywords Dictionary

Use these keywords in your prompts to describe camera movement without relying solely on API presets.

| Keyword | Movement Description | Visual Effect | Best For |
|---------|---------------------|---------------|----------|
| **"Truck Left/Right"** | Camera moves sideways parallel to subject | Subject stays same size, background shifts | Following walking subjects |
| **"Dolly In/Out"** | Camera physically moves closer/further | Perspective changes, depth compression | Dramatic reveals, intimacy |
| **"Pan Left/Right"** | Camera rotates on fixed point (swivel) | Scene sweeps across frame | Surveying environments |
| **"Tilt Up/Down"** | Camera pivots up or down on fixed point | Vertical reveal | Tall subjects, establishing scale |
| **"Crane Up/Down"** | Camera raises/lowers vertically | Bird's eye transitions | Reveals, establishing shots |
| **"Steadicam/Gimbal"** | Smooth floating movement | Professional, stable motion | Following subjects |
| **"Handheld"** | Slight natural shake | Documentary, intimate feel | Tension, realism |
| **"FPV Drone"** | Fast flying with banking | Exciting, immersive | Action, chase scenes |
| **"Zoom In/Out"** | Focal length changes (no camera move) | Subject grows/shrinks, flat compression | Quick emphasis |
| **"Dolly Zoom"** (Vertigo) | Dolly + opposite zoom | Background warps, disorienting | Psychological tension |
| **"Rack Focus"** | Focus shifts between planes | Attention redirect | Revealing new elements |
| **"Orbit/Arc"** | Camera circles around subject | 360° view, dynamic | Products, heroes |

### Camera Angle Keywords

| Angle | Description | Psychological Effect |
|-------|-------------|---------------------|
| **"Eye level"** | Camera at subject's eye height | Neutral, relatable |
| **"Low angle"** | Camera below subject, looking up | Power, heroism, intimidation |
| **"High angle"** | Camera above subject, looking down | Vulnerability, insignificance |
| **"Bird's eye"** | Directly above, looking straight down | God-like perspective, patterns |
| **"Worm's eye"** | Ground level, extreme low | Dramatic, imposing |
| **"Dutch angle"** | Camera tilted on axis | Unease, chaos, tension |
| **"Over the shoulder"** | Behind one subject, seeing another | Conversation, confrontation |

### Lens Keywords

| Lens | Focal Length | Visual Characteristics | Best For |
|------|--------------|----------------------|----------|
| **"Wide angle"** | 14-35mm | Expansive, distorted edges, deep focus | Landscapes, architecture |
| **"Normal"** | 50mm | Natural perspective, minimal distortion | General purpose |
| **"Portrait lens"** | 85mm | Flattering compression, creamy bokeh | Faces, products |
| **"Telephoto"** | 100-200mm | Compressed depth, isolated subjects | Wildlife, sports |
| **"Macro"** | Macro | Extreme close-up, shallow DOF | Small objects, details |
| **"Anamorphic"** | Various | Oval bokeh, lens flares, cinematic | Film look |
| **"Fisheye"** | 8-16mm | Extreme distortion, 180° view | Skateboarding, VR |

### Combining Camera Keywords with API Presets

For maximum control, align your prompt with the API preset:

```javascript
// Strongest signal: API + prompt match
{
  camera_control: "forward_up",
  prompt: "Camera starts low, then dollies forward while craning upward to reveal the massive castle, wide angle lens emphasizing scale..."
}

// Also valid: Detailed prompt without API preset
{
  prompt: "Starting from a low angle worm's eye view, camera smoothly dollies forward and cranes up simultaneously, using a 24mm wide angle lens. The movement reveals the towering castle against dramatic clouds..."
}
```

---

## Negative Prompt Master Lists

Negative prompts tell Kling what to avoid. Use these curated lists by style.

### Universal Negative Prompts (Use Always)

```
blur, blurry, out of focus, low quality, low resolution, pixelated,
compression artifacts, watermark, text overlay, logo, signature,
cropped, cut off, bad framing
```

### By Style Category

#### Photorealistic/Cinematic
```
blur, distortion, morphing, unnatural movement, robotic motion,
extra limbs, missing limbs, deformed hands, deformed face,
uncanny valley, plastic skin, overprocessed, HDR overblown,
amateur lighting, flat lighting, harsh shadows,
text, watermark, logo, timestamp
```

#### Anime/Animation
```
bad anatomy, wrong proportions, extra fingers, missing fingers,
inconsistent style, mixed styles, 3D render, photorealistic,
western cartoon style, cheap flash animation, tweening artifacts,
off-model, inconsistent character design, blurry lines
```

#### Product Photography
```
blur, fingerprints, dust, scratches, reflections of photographer,
uneven lighting, harsh shadows, color cast, background clutter,
low angle amateur shot, busy background, poor composition,
oversaturated, undersaturated
```

#### Portrait/Fashion
```
blur, unflattering angle, harsh shadows under eyes, double chin,
blemishes, skin imperfections (if unwanted), bad hair day,
awkward pose, stiff posture, dead eyes, forced smile,
busy background, distracting elements
```

#### Horror/Dark
```
cartoon, bright colors, cheerful, comedy, slapstick,
bad creature design, cheap Halloween costume look,
over-the-top gore (if unwanted), unintentionally funny,
poor prosthetics look, visible wires/strings
```

#### Nature/Documentary
```
human interference, man-made objects, pollution,
color grading (for authentic look), slow motion (if real-time wanted),
zoo/captive animals (for wild footage), staged behavior,
blur, camera shake
```

### Motion-Specific Negative Prompts

```
# For smooth motion
jerky, stuttering, frame drops, uneven motion, teleporting,
rubber band effect, elastic movement, moonwalking

# For realistic physics
floating, gravity defying (if unwanted), phasing through objects,
unnatural weight, no impact, massless movement

# For character consistency
morphing, shapeshifting, face changing, outfit changing,
identity drift, aging/de-aging (if unwanted)
```

### Using Negative Prompts Effectively

1. **Be specific** - "blur" works better than "bad quality"
2. **Match the style** - Use anime negatives for anime, not photorealistic
3. **Don't contradict** - If prompt says "dramatic shadows," don't negate "shadows"
4. **Prioritize** - List most important negatives first

```javascript
// Example: Cinematic scene with motion
{
  prompt: "...",
  negative_prompt: "blur, morphing, extra limbs, jerky motion, inconsistent lighting, amateur quality, watermark"
}
```

---

## Creative Video Recipes

Ready-to-use prompt templates for common video types.

### Recipe 1: The Living Portrait
Create subtle, realistic animation from a still portrait.

```javascript
const livingPortrait = {
  endpoint: "fal-ai/kling-video/v2.1/pro/image-to-video",
  input: {
    image_url: "YOUR_PORTRAIT_URL",
    prompt: "[Describe person from image]. Eyes blink naturally twice, a subtle breath raises the chest slightly, the hint of a smile forms at the corner of the lips, a strand of hair shifts as if touched by a gentle breeze. Photorealistic, shallow depth of field, soft natural lighting, intimate portrait.",
    duration: "5",
    aspect_ratio: "9:16",
    negative_prompt: "exaggerated motion, talking, large movements, morphing, distortion, robotic, uncanny",
    cfg_scale: 0.4
  }
};
```

### Recipe 2: Product Hero Shot
Dramatic product reveal with rotating motion.

```javascript
const productHero = {
  endpoint: "fal-ai/kling-video/v2.1/master/image-to-video",
  input: {
    image_url: "YOUR_PRODUCT_URL",
    prompt: "[Describe product from image]. Product rotates slowly 180 degrees on invisible axis, studio lighting creates moving highlights and reflections, subtle particle dust floats in light beams. Pure white or black cyclorama background, premium advertising aesthetic, shallow depth of field on product details.",
    duration: "5",
    aspect_ratio: "1:1",
    negative_prompt: "blur, fingerprints, dust, scratches, cheap look, harsh shadows, uneven rotation",
    cfg_scale: 0.7
  }
};
```

### Recipe 3: Drone FPV Flight
Exciting flying camera perspective through environment.

```javascript
const droneFPV = {
  endpoint: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
  input: {
    prompt: "FPV drone racing through [environment], camera banks hard around corners, flies under obstacles, accelerates through narrow gaps. First person perspective, slight motion blur on fast movements, fish-eye lens distortion at edges, adrenaline-pumping motion, GoPro mounted on racing drone aesthetic.",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "slow motion, static, stable camera, flat movement, bird's eye view",
    cfg_scale: 0.5,
    camera_control: "forward_up"
  }
};
```

### Recipe 4: Anime Opening Sequence
Dynamic anime-style character introduction.

```javascript
const animeOpening = {
  endpoint: "fal-ai/kling-video/v2.6/pro/motion-control",
  input: {
    image_url: "YOUR_ANIME_CHARACTER_URL",
    video_url: "YOUR_DYNAMIC_MOTION_REFERENCE_URL",
    character_orientation: "video",
    prompt: "[Describe anime character]. Vibrant anime style with cel shading, bold black outlines, speed lines during fast motion, sparkle and particle effects, dramatic hair and clothing movement, saturated color palette, J-pop music video aesthetic, consistent character design throughout."
  }
};
```

### Recipe 5: Food Commercial
Appetizing food footage with sensory appeal.

```javascript
const foodCommercial = {
  endpoint: "fal-ai/kling-video/v2.1/master/image-to-video",
  input: {
    image_url: "YOUR_FOOD_URL",
    prompt: "[Describe food from image]. Steam rises gently from hot food, sauce glistens as it's drizzled slowly, garnish falls into place in slow motion, cheese pulls stretch tantalizingly. Extreme close-up macro details, warm appetizing lighting, food photography with shallow depth of field, premium restaurant commercial quality.",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "unappetizing, cold, stale, messy, amateur plating, harsh lighting, fast motion",
    cfg_scale: 0.6
  }
};
```

### Recipe 6: Vintage Film Look
Nostalgic footage with period-accurate imperfections.

```javascript
const vintageFilm = {
  endpoint: "fal-ai/kling-video/o1/video-to-video/edit",
  input: {
    video_url: "YOUR_SOURCE_VIDEO_URL",
    prompt: "The same scene shot on Super 8mm film from the 1970s, heavy film grain, slight color fading with warm yellow-orange tint, occasional light leaks at edges, minor dust particles and scratches, slightly soft focus, vintage lens vignetting, authentic archival footage aesthetic.",
    cfg_scale: 0.7
  }
};
```

### Recipe 7: Luxury Car Commercial
High-end automotive reveal.

```javascript
const luxuryCar = {
  endpoint: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
  input: {
    prompt: "A sleek black [car brand/type] emerges from shadow into dramatic side lighting, reflections sliding across flawless paint, camera trucks alongside revealing sculpted body lines, chrome details catch light precisely, rotating low angle reveals wheels and stance. Premium automotive commercial, Matthew McConaughey Lincoln aesthetic, moody studio with wet floor reflections.",
    duration: "5",
    aspect_ratio: "16:9",
    negative_prompt: "cheap car, damage, dirty, busy background, daylight, casual, amateur",
    cfg_scale: 0.6
  }
};
```

### Recipe 8: Social Media Reaction
Expressive character reaction for short-form content.

```javascript
const socialReaction = {
  endpoint: "fal-ai/kling-video/v2.1/pro/image-to-video",
  input: {
    image_url: "YOUR_CHARACTER_URL",
    prompt: "[Describe character]. Character's expression shifts from neutral to [surprised/excited/shocked/delighted], eyebrows raise, eyes widen, mouth opens into [gasp/laugh/smile], head tilts back slightly. Exaggerated Gen-Z reaction energy, TikTok style, bright colorful background, engaging social media content.",
    duration: "5",
    aspect_ratio: "9:16",
    negative_prompt: "subtle, understated, boring, slow, minimal expression, stiff",
    cfg_scale: 0.5
  }
};
```

---

## Iterative Workflow Examples

### Workflow 1: Character Consistency Series (6 Turns)

This demonstrates how to maintain character identity across multiple generations, similar to Nano Banana's figurine example.

**Turn 1: Establish Character**
```javascript
const turn1 = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    image_url: "https://storage.com/robot-character.png",
    prompt: "A friendly robot companion with a round blue head, single glowing yellow eye, chrome body with visible joints, small antenna on top. Robot stands in a workshop, eye blinks curiously, head tilts slightly. Pixar animation style, warm lighting.",
    duration: "5",
    negative_prompt: "scary, damaged, rusty, dark, horror"
  }
});
// SAVE: robot-workshop.mp4
// EVALUATE: Is character identity clear? Eye distinctive? Body proportions consistent?
```

**Turn 2: New Environment**
```javascript
const turn2 = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    image_url: "https://storage.com/robot-character.png",  // SAME image
    prompt: "A friendly robot companion with a round blue head, single glowing yellow eye, chrome body with visible joints, small antenna on top. Robot explores a lush garden, eye widens with wonder, reaches toward a butterfly. Pixar animation style, golden hour sunlight, consistent character design.",
    duration: "5",
    negative_prompt: "scary, damaged, rusty, dark, different robot design"
  }
});
// EVALUATE: Does robot look the SAME as Turn 1? Only environment changed?
```

**Turn 3: Action Sequence**
```javascript
const turn3 = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    image_url: "https://storage.com/robot-character.png",  // SAME image
    prompt: "A friendly robot companion with a round blue head, single glowing yellow eye, chrome body with visible joints, small antenna on top. Robot runs playfully through autumn leaves, kicking them up joyfully, antenna bouncing with movement. Pixar animation style, warm fall colors, consistent character design throughout.",
    duration: "5",
    negative_prompt: "scary, damaged, rusty, walking slowly, different robot"
  }
});
// EVALUATE: Character consistency maintained through dynamic motion?
```

**Turn 4: Emotional Beat**
```javascript
const turn4 = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    image_url: "https://storage.com/robot-character.png",  // SAME image
    prompt: "A friendly robot companion with a round blue head, single glowing yellow eye, chrome body with visible joints, small antenna on top. Robot sits alone in the rain, eye dims sadly, water droplets roll down chrome body, antenna droops. Pixar animation style, melancholy blue lighting, consistent character design.",
    duration: "5",
    negative_prompt: "happy, sunny, cheerful, dancing, different robot design"
  }
});
// EVALUATE: Emotional range while maintaining physical identity?
```

**Turn 5: Style Variation**
```javascript
const turn5 = await fal.subscribe("fal-ai/kling-video/o1/video-to-video/edit", {
  input: {
    video_url: turn1.data.video.url,  // Use Turn 1 video
    prompt: "The same friendly robot with round blue head and yellow eye, but rendered in hand-drawn 2D animation style, visible pencil lines, watercolor background, Studio Ghibli aesthetic. Robot's personality and movements unchanged, only visual style transformed.",
    cfg_scale: 0.7
  }
});
// EVALUATE: Same character recognizable in different art style?
```

**Turn 6: Return to Origin**
```javascript
const turn6 = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
  input: {
    image_url: "https://storage.com/robot-character.png",  // SAME image
    prompt: "A friendly robot companion with a round blue head, single glowing yellow eye, chrome body with visible joints, small antenna on top. Robot back in the workshop where it started, eye glows brightly with happiness, does a little victory spin, antenna perks up. Pixar animation style, warm familiar lighting, consistent character design, full circle moment.",
    duration: "5",
    negative_prompt: "sad, damaged, different robot, unfamiliar location"
  }
});
// EVALUATE: Complete consistency from Turn 1 to Turn 6?
```

### Workflow 2: Prompt Refinement Loop

Systematically improving a video through iteration.

**Iteration 1: Baseline**
```javascript
const v1 = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "A coffee cup on a table with steam rising",
    duration: "5"
  }
});
// RESULT: Generic, flat lighting, boring composition
// DIAGNOSIS: Too vague, no S.C.A.M. structure
```

**Iteration 2: Add S.C.A.M. Structure**
```javascript
const v2 = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "(S) A handcrafted ceramic coffee cup with cream-colored glaze and imperfect edges, filled with dark espresso (C) Close-up macro shot, shallow depth of field (A) Steam rises gently, swirling in morning light (M) Cozy cafe atmosphere, warm window light from the left",
    duration: "5"
  }
});
// RESULT: Better composition, but steam not visible enough
// DIAGNOSIS: Need more specific steam description
```

**Iteration 3: Enhance Weak Element**
```javascript
const v3 = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "(S) A handcrafted ceramic coffee cup with cream-colored glaze and imperfect edges, filled with dark espresso, visible heat shimmer above liquid (C) Close-up macro shot, shallow depth of field, slight slow motion (A) Thick aromatic steam rises in lazy spirals, catching golden light beams, dissipating gracefully (M) Cozy cafe atmosphere, warm morning window light from left creating god rays through steam",
    duration: "5",
    negative_prompt: "no steam, invisible steam, cold coffee, harsh lighting"
  }
});
// RESULT: Beautiful steam, but cup details lost
// DIAGNOSIS: Need to balance focus
```

**Iteration 4: Balance Composition**
```javascript
const v4 = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/text-to-video", {
  input: {
    prompt: "(S) A handcrafted ceramic coffee cup with cream-colored glaze, hand-painted blue floral pattern, slight chip on rim showing character, filled with dark espresso, visible heat shimmer (C) Medium close-up, 50mm lens, deep enough focus to see cup details and steam, subtle rack focus from cup to steam (A) Thick aromatic steam rises in lazy spirals, catching golden light, a hand enters frame and wraps around cup warmly (M) Cozy Scandinavian cafe, soft morning window light, hygge atmosphere, film grain",
    duration: "5",
    aspect_ratio: "1:1",
    negative_prompt: "harsh lighting, cold, sterile, generic mug, no steam, invisible steam",
    cfg_scale: 0.6
  }
});
// RESULT: Final version - balanced, detailed, atmospheric
```

---

## Aspect Ratio Composition Guide

Different aspect ratios create different compositional expectations.

### 16:9 Landscape (Default)

**Composition Behavior:**
- Favors horizontal framing
- Natural for medium shots, wide shots
- Close-ups require explicit instruction

**Best For:**
- Cinematic scenes
- Landscapes/environments
- Action sequences
- Two-person conversations

**Prompt Considerations:**
```
# 16:9 wants to show environment
"Wide shot of a lone figure walking across desert dunes, vast empty sky"

# Force close-up in 16:9
"Extreme close-up of eyes only, filling the frame horizontally, shallow DOF"
```

### 9:16 Portrait/Vertical

**Composition Behavior:**
- Defaults to full-body or tall framing
- Natural for single-subject focus
- Tends toward centered composition

**Best For:**
- Social media (TikTok, Reels, Shorts)
- Full-body fashion/dance
- Tall subjects (buildings, trees, people standing)
- Mobile-first content

**Prompt Considerations:**
```
# 9:16 naturally frames full body
"A model in elegant gown, head to toe visible, walking toward camera"

# Force close-up in 9:16
"Tight portrait framing, face fills vertical frame, shallow depth of field"
```

### 1:1 Square

**Composition Behavior:**
- Balanced, centered tendency
- Equal vertical and horizontal weight
- Classic, formal feeling

**Best For:**
- Product shots
- Instagram feed posts
- Portraits (headshots)
- Symmetrical compositions

**Prompt Considerations:**
```
# Square loves centered subjects
"Product centered in frame, equal space on all sides, clean background"

# Dynamic square composition
"Subject in lower third, dramatic sky above, rule of thirds within square"
```

### Aspect Ratio Decision Guide

```
What's your primary subject?
│
├─► Single person, full body → 9:16
├─► Single person, portrait/face → 1:1 or 9:16
├─► Multiple people → 16:9
├─► Product → 1:1
├─► Landscape/environment → 16:9
├─► Architecture (tall) → 9:16
├─► Action/movement → 16:9
│
What's your platform?
│
├─► YouTube → 16:9
├─► TikTok/Reels/Shorts → 9:16
├─► Instagram Feed → 1:1 or 4:5 (use 9:16 and crop)
├─► Twitter/X → 16:9 or 1:1
├─► Cinema → 16:9 (or ultrawide via composition)
```

---

## API Reference

### All Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `fal-ai/kling-video/v2.6/pro/motion-control` | POST | Motion transfer (Pro quality) |
| `fal-ai/kling-video/v2.6/standard/motion-control` | POST | Motion transfer (Standard quality) |
| `fal-ai/kling-video/v2.5-turbo/pro/text-to-video` | POST | Fast text-to-video |
| `fal-ai/kling-video/v2.1/pro/image-to-video` | POST | Image-to-video (Pro) |
| `fal-ai/kling-video/v2.1/master/image-to-video` | POST | Image-to-video (Master quality) |
| `fal-ai/kling-video/o1/video-to-video/edit` | POST | Video editing |

### Complete Parameter Reference

#### Text-to-Video Parameters
```typescript
interface TextToVideoInput {
  prompt: string;              // Required: S.C.A.M. formatted description
  duration?: "5" | "10";       // Default: "5"
  aspect_ratio?: "16:9" | "9:16" | "1:1";  // Default: "16:9"
  negative_prompt?: string;    // Elements to avoid
  cfg_scale?: number;          // 0.0-1.0, Default: 0.5
  camera_control?: "down_back" | "forward_up" | "right_turn_forward" | "left_turn_forward";
  advanced_camera_control?: {
    // Precise camera control object
  };
}
```

#### Image-to-Video Parameters
```typescript
interface ImageToVideoInput {
  prompt: string;              // Required: Describe image THEN motion
  image_url: string;           // Required: Source image URL
  duration?: "5" | "10";       // Default: "5"
  aspect_ratio?: "16:9" | "9:16" | "1:1";  // Default: "16:9"
  negative_prompt?: string;
  cfg_scale?: number;          // Default: 0.5, lower = more motion freedom
  tail_image_url?: string;     // End frame for transitions
  static_mask_url?: string;    // Areas that should NOT move
  dynamic_mask_url?: string;   // Areas that SHOULD move
  special_fx?: "hug" | "kiss" | "heart_gesture" | "squish" | "expansion";
  input_image_urls?: string[]; // Up to 4 images for multi-subject
}
```

#### Motion Control Parameters
```typescript
interface MotionControlInput {
  image_url: string;           // Required: Character image
  video_url: string;           // Required: Motion reference video
  character_orientation: "image" | "video";  // Required
  prompt?: string;             // Scene context only, NOT motion
  keep_original_sound?: boolean;  // Default: true
}
```

#### O1 Edit Parameters
```typescript
interface O1EditInput {
  video_url: string;           // Required: Source video
  prompt: string;              // Required: TARGET result description
  input_image_urls?: string[]; // Up to 4 reference images
  duration?: "5" | "10";       // Default: "5"
  cfg_scale?: number;          // Default: 0.5
}
```

### Response Format

All endpoints return:
```typescript
interface KlingResponse {
  video: {
    url: string;           // Direct video URL
    file_name: string;     // e.g., "output.mp4"
    file_size: number;     // Bytes
    content_type: string;  // "video/mp4"
  };
}
```

### Supported Formats

**Images:** JPG, JPEG, PNG, WEBP, GIF, AVIF
**Videos:** MP4, MOV, WEBM, M4V, GIF

---

## Troubleshooting Decision Tree

### Problem: Motion Looks Unnatural

```
Motion looks unnatural
│
├─► Jerky/stuttering
│   ├─► Reduce prompt complexity
│   ├─► Add "smooth continuous motion" to prompt
│   ├─► Try 5s instead of 10s duration
│   └─► Lower cfg_scale (0.3-0.4)
│
├─► Too slow/fast
│   ├─► Specify velocity: "walks slowly" vs "runs quickly"
│   ├─► Add "normal speed" or "real-time" if unnaturally slow
│   └─► For slow-mo, explicitly state "slow motion, 50% speed"
│
└─► Robotic/mechanical
    ├─► Add "natural organic movement"
    ├─► Add "human weight and momentum"
    └─► Remove contradicting technical specs
```

### Problem: Subject Morphing/Changing

```
Subject morphs or changes during video
│
├─► Face changing
│   ├─► Add "maintains exact facial features throughout"
│   ├─► Use higher quality model (Master vs Pro)
│   ├─► Ensure input image is high resolution
│   └─► Add face description to prompt redundantly
│
├─► Outfit/clothing changing
│   ├─► Describe outfit in detail in prompt
│   ├─► Add "consistent costume throughout"
│   └─► Negative prompt: "outfit change, wardrobe change"
│
├─► Body proportions shifting
│   ├─► Reduce motion complexity
│   ├─► Use 5s duration instead of 10s
│   └─► Add "maintains body proportions"
│
└─► Colors shifting
    ├─► Add "consistent color palette"
    ├─► Specify exact colors: "bright red dress" vs "red dress"
    └─► Add "stable lighting, no color drift"
```

### Problem: Image-to-Video Artifacts

```
Image-to-video has artifacts
│
├─► Morphing at start
│   └─► CRITICAL: Prompt contradicts image
│       ├─► Describe what IS in image first
│       └─► Then describe motion changes
│
├─► Background going crazy
│   ├─► Add "static background, only subject moves"
│   ├─► Use static_mask_url for background
│   └─► Lower cfg_scale for more stability
│
└─► Subject distortion
    ├─► Input image resolution too low
    ├─► Subject too small in frame (<5%)
    └─► Try v2.1 Master instead of Pro
```

### Problem: Motion Control Not Working

```
Motion Control issues
│
├─► Motion not transferring
│   ├─► Check orientation mode (video for dance, image for subtle)
│   ├─► Reference video too shaky/blurry
│   ├─► Reference video has multiple people (confuses detection)
│   └─► Reference person not humanoid enough
│
├─► Character identity lost
│   ├─► Character image too low resolution
│   ├─► Subject too small in character image
│   ├─► Add detailed character description to prompt
│   └─► Add "consistent character appearance throughout"
│
└─► Style not applying
    ├─► Move style keywords to END of prompt
    ├─► Be more specific: "anime cel shading" not just "anime"
    └─► May need O1 for stronger style transfer
```

### Problem: O1 Edit Not Working

```
O1 Edit issues
│
├─► Edit not applying
│   ├─► Using "How" instead of "What" - describe TARGET result
│   ├─► cfg_scale too low - try 0.7+
│   └─► Be more specific about desired outcome
│
├─► Wrong elements changing
│   ├─► Add anchor descriptions: "...while X remains unchanged"
│   ├─► Be explicit about what to preserve
│   └─► Use input_image_urls for reference
│
└─► Quality degradation
    ├─► Source video quality issue
    ├─► Too aggressive style change
    └─► Try lower cfg_scale for subtler edit
```

---

## Complete Code Examples

### JavaScript Setup

```javascript
import { fal } from "@fal-ai/client";

// Configure once at app initialization
fal.config({
  credentials: process.env.FAL_KEY
});
```

### Python Setup

```python
import fal_client
import os

# Configure once at app initialization
fal_client.api_key = os.environ["FAL_KEY"]
```

### Complete Workflow: Character Video Production Pipeline

```javascript
import { fal } from "@fal-ai/client";
import fs from "fs/promises";

/**
 * Complete production pipeline: Generate character image with Flux,
 * then animate with Kling Motion Control.
 *
 * This demonstrates the full FAL.ai ecosystem workflow.
 */
async function produceCharacterVideo({
  characterDescription,
  motionVideoPath,
  outputPath,
  options = {}
}) {
  const {
    style = "photorealistic",
    duration = "5",
    orientation = "video"
  } = options;

  console.log("Step 1: Generating character image with Flux...");

  // Step 1: Generate character image using Flux
  const imageResult = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt: `${characterDescription}, full body visible, clear lighting, neutral pose, high resolution, suitable for animation, ${style}`,
      image_size: "portrait_16_9",
      num_images: 1
    }
  });

  const characterImageUrl = imageResult.data.images[0].url;
  console.log(`Character image generated: ${characterImageUrl}`);

  console.log("Step 2: Uploading motion reference...");

  // Step 2: Upload motion reference video
  const motionVideoBuffer = await fs.readFile(motionVideoPath);
  const motionVideoUrl = await fal.storage.upload(motionVideoBuffer);
  console.log(`Motion video uploaded: ${motionVideoUrl}`);

  console.log("Step 3: Generating video with Kling Motion Control...");

  // Step 3: Generate video with Motion Control
  const videoResult = await fal.subscribe("fal-ai/kling-video/v2.6/pro/motion-control", {
    input: {
      image_url: characterImageUrl,
      video_url: motionVideoUrl,
      character_orientation: orientation,
      prompt: `${characterDescription}, consistent character appearance throughout, smooth motion, cinematic quality, ${style} style`
    }
  });

  const outputVideoUrl = videoResult.data.video.url;
  console.log(`Video generated: ${outputVideoUrl}`);

  console.log("Step 4: Downloading final video...");

  // Step 4: Download final video
  const response = await fetch(outputVideoUrl);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));

  console.log(`Video saved to: ${outputPath}`);

  return {
    characterImageUrl,
    motionVideoUrl,
    outputVideoUrl,
    outputPath
  };
}

// Usage example
const result = await produceCharacterVideo({
  characterDescription: "A young woman with vibrant purple hair in twin braids, wearing a futuristic silver jacket with neon blue trim, confident expression",
  motionVideoPath: "./reference-dance.mp4",
  outputPath: "./output/character-dance.mp4",
  options: {
    style: "anime",
    orientation: "video"
  }
});
```

### Python Complete Workflow

```python
import fal_client
import os
import requests
from pathlib import Path

# Configure
fal_client.api_key = os.environ["FAL_KEY"]

async def produce_character_video(
    character_description: str,
    motion_video_path: str,
    output_path: str,
    style: str = "photorealistic",
    orientation: str = "video"
) -> dict:
    """
    Complete production pipeline: Generate character image with Flux,
    then animate with Kling Motion Control.
    """

    print("Step 1: Generating character image with Flux...")

    # Step 1: Generate character image
    image_result = fal_client.subscribe(
        "fal-ai/flux/dev",
        arguments={
            "prompt": f"{character_description}, full body visible, clear lighting, neutral pose, high resolution, suitable for animation, {style}",
            "image_size": "portrait_16_9",
            "num_images": 1
        }
    )

    character_image_url = image_result["images"][0]["url"]
    print(f"Character image generated: {character_image_url}")

    print("Step 2: Uploading motion reference...")

    # Step 2: Upload motion video
    motion_video_url = fal_client.upload_file(motion_video_path)
    print(f"Motion video uploaded: {motion_video_url}")

    print("Step 3: Generating video with Kling Motion Control...")

    # Step 3: Generate with Motion Control
    video_result = fal_client.subscribe(
        "fal-ai/kling-video/v2.6/pro/motion-control",
        arguments={
            "image_url": character_image_url,
            "video_url": motion_video_url,
            "character_orientation": orientation,
            "prompt": f"{character_description}, consistent character appearance throughout, smooth motion, cinematic quality, {style} style"
        }
    )

    output_video_url = video_result["video"]["url"]
    print(f"Video generated: {output_video_url}")

    print("Step 4: Downloading final video...")

    # Step 4: Download
    response = requests.get(output_video_url)
    Path(output_path).write_bytes(response.content)

    print(f"Video saved to: {output_path}")

    return {
        "character_image_url": character_image_url,
        "motion_video_url": motion_video_url,
        "output_video_url": output_video_url,
        "output_path": output_path
    }

# Usage
if __name__ == "__main__":
    import asyncio

    result = asyncio.run(produce_character_video(
        character_description="A young woman with vibrant purple hair in twin braids, wearing a futuristic silver jacket with neon blue trim, confident expression",
        motion_video_path="./reference-dance.mp4",
        output_path="./output/character-dance.mp4",
        style="anime",
        orientation="video"
    ))
```

### LLM Agent Helper Functions

```javascript
/**
 * Helper functions designed for LLM agents to generate Kling prompts.
 * These functions enforce the S.C.A.M. framework and best practices.
 */

/**
 * Build a S.C.A.M. formatted prompt from components
 */
function buildSCAMPrompt({ subject, camera, action, mood }) {
  const parts = [];

  if (subject) parts.push(subject);
  if (camera) parts.push(camera);
  if (action) parts.push(action);
  if (mood) parts.push(mood);

  return parts.join(". ") + ".";
}

/**
 * Build Image-to-Video prompt that follows First Frame Rule
 */
function buildImageToVideoPrompt({ imageDescription, motion, style }) {
  // First Frame Rule: Describe image first, then motion
  return `${imageDescription}. ${motion}. ${style || "Cinematic quality, smooth motion."}`;
}

/**
 * Get appropriate negative prompt for style
 */
function getNegativePromptForStyle(style) {
  const negativePrompts = {
    photorealistic: "blur, distortion, morphing, unnatural movement, extra limbs, deformed, uncanny valley, plastic skin, watermark, text",
    anime: "photorealistic, 3D render, bad anatomy, off-model, inconsistent style, blurry lines, western cartoon",
    product: "blur, fingerprints, dust, scratches, harsh shadows, amateur lighting, busy background",
    portrait: "blur, unflattering angle, harsh shadows, blemishes, busy background, awkward pose",
    cinematic: "amateur, home video, harsh lighting, centered composition, static camera, low budget"
  };

  return negativePrompts[style] || negativePrompts.photorealistic;
}

/**
 * Select appropriate model based on use case
 */
function selectModel({ hasImage, hasMotionVideo, needsEdit, quality = "pro" }) {
  if (needsEdit) {
    return "fal-ai/kling-video/o1/video-to-video/edit";
  }

  if (hasMotionVideo && hasImage) {
    return quality === "master"
      ? "fal-ai/kling-video/v2.6/pro/motion-control"
      : "fal-ai/kling-video/v2.6/standard/motion-control";
  }

  if (hasImage) {
    return quality === "master"
      ? "fal-ai/kling-video/v2.1/master/image-to-video"
      : "fal-ai/kling-video/v2.1/pro/image-to-video";
  }

  return "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";
}

/**
 * Validate prompt for common mistakes
 */
function validatePrompt(prompt, mode) {
  const issues = [];

  // Check for motion in motion-control prompts
  if (mode === "motion-control") {
    const motionWords = ["dancing", "walking", "running", "jumping", "spinning"];
    for (const word of motionWords) {
      if (prompt.toLowerCase().includes(word)) {
        issues.push(`Warning: "${word}" in motion-control prompt. Motion comes from reference video.`);
      }
    }
  }

  // Check for contradictions
  if (prompt.includes("bright") && prompt.includes("dark")) {
    issues.push("Warning: Contradicting lighting terms (bright/dark).");
  }

  // Check prompt length
  if (prompt.length < 50) {
    issues.push("Warning: Prompt may be too short. Consider adding more detail.");
  }
  if (prompt.length > 500) {
    issues.push("Warning: Prompt may be too long. Consider trimming to essentials.");
  }

  return issues;
}

// Export for use in other modules
export {
  buildSCAMPrompt,
  buildImageToVideoPrompt,
  getNegativePromptForStyle,
  selectModel,
  validatePrompt
};
```

---

## Sources

- [FAL.ai Kling Models](https://fal.ai/models/fal-ai/kling-video)
- [FAL.ai Motion Control Guide](https://fal.ai/learn/devs/kling-video-2-6-motion-control-prompt-guide)
- [FAL.ai Kling 2.6 Pro Guide](https://fal.ai/learn/devs/kling-2-6-pro-prompt-guide)
- [FAL.ai Kling O1 Guide](https://fal.ai/learn/devs/kling-o1-prompt-guide)
- [Official Kling AI API](https://app.klingai.com/global/dev/document-api)
- [GitHub: TechWithTy/kling](https://github.com/TechWithTy/kling) - Python SDK
- [GitHub: 199-mcp/mcp-kling](https://github.com/199-mcp/mcp-kling) - MCP Server

---

## Document Metadata

**Version:** 2.0
**Created:** 2026-01-26
**Last Updated:** 2026-01-26
**Purpose:** Comprehensive prompting guide for LLM agents and human users
**Maintainer:** ai-model-docs repository

### Changelog

- **v2.0** (2026-01-26): Major enrichment
  - Added S.C.A.M. prompting framework with 5+ detailed examples
  - Added Camera Control Deep Dive with keywords dictionary
  - Added Negative Prompt Master Lists by style
  - Added 8 Creative Video Recipes
  - Added Iterative Workflow Examples (6-turn character consistency)
  - Added Aspect Ratio Composition Guide
  - Added Troubleshooting Decision Trees
  - Added LLM Agent Helper Functions
  - Added Complete Production Pipeline examples (JS + Python)
  - Expanded all sections with more concrete examples
  - Added parameter priority documentation for LLM understanding

- **v1.0** (2026-01-26): Initial documentation
