# Remotion: Programmatic Video Creation Guide

**Provider:** Remotion (Open Source)
**Last Updated:** January 2026
**Version:** 2.0 (LLM-Agent Optimized)
**Purpose:** Complete guide for React-based programmatic video generation

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Setup & Installation](#setup--installation)
4. [The Composition System](#the-composition-system)
5. [Animation Fundamentals](#animation-fundamentals)
6. [Audio Integration](#audio-integration)
7. [AI Content Integration](#ai-content-integration)
8. [Production Deployment](#production-deployment)
9. [Best Practices](#best-practices)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)
12. [LLM Agent Helper Functions](#llm-agent-helper-functions)

---

## Overview

Remotion is a **React-based framework for creating videos programmatically**. Instead of using traditional video editors, you write code (React components) to define every frame of your video.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **React-Based** | Write videos as React components |
| **Frame-Perfect** | Control every frame with precision |
| **Deterministic** | Same code = same video (reproducible) |
| **Dynamic Content** | Fetch data, use APIs during render |
| **Scalable** | Render in cloud with Remotion Lambda |
| **Interactive** | Remotion Player for web embedding |

### Why Remotion for AI Workflows?

1. **Composite AI Content** - Overlay text, graphics on AI videos
2. **Batch Processing** - Generate thousands of variations
3. **Dynamic Templates** - Parameterized video generation
4. **Deterministic Output** - Reproducible results
5. **API Integration** - Fetch AI content during render

---

## Core Concepts

### Frame-Based Rendering

Remotion renders videos **frame by frame**. Each frame is a React component snapshot.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REMOTION RENDER PIPELINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frame 0    Frame 1    Frame 2    ...    Frame N               │
│  ┌─────┐   ┌─────┐    ┌─────┐          ┌─────┐                │
│  │React│   │React│    │React│          │React│                │
│  │ DOM │ → │ DOM │ →  │ DOM │  → ... → │ DOM │                │
│  └─────┘   └─────┘    └─────┘          └─────┘                │
│     │         │          │                │                    │
│     ▼         ▼          ▼                ▼                    │
│  ┌─────────────────────────────────────────────┐               │
│  │            FFmpeg Encoding                   │               │
│  └─────────────────────────────────────────────┘               │
│                         │                                       │
│                         ▼                                       │
│                    output.mp4                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useCurrentFrame()` | Get current frame number | `number` |
| `useVideoConfig()` | Get video dimensions, fps, duration | `VideoConfig` |
| `interpolate()` | Animate values between frames | `number` |
| `spring()` | Physics-based animations | `number` |
| `Sequence` | Time-based component mounting | Component |

### The Composition

A **Composition** defines video properties:

```jsx
<Composition
  id="MyVideo"
  component={MyVideoComponent}
  durationInFrames={150}  // 5 seconds at 30fps
  fps={30}
  width={1920}
  height={1080}
/>
```

---

## Setup & Installation

### Create New Project

```bash
# Create new Remotion project
npx create-video@latest my-video

# Navigate to project
cd my-video

# Install dependencies
npm install

# Start development server
npm start
```

### Project Structure

```
my-video/
├── src/
│   ├── Root.tsx           # Composition definitions
│   ├── Video.tsx          # Main video component
│   ├── Composition.tsx    # Example composition
│   └── components/        # Reusable components
├── public/                # Static assets
├── remotion.config.ts     # Remotion configuration
└── package.json
```

### Required Dependencies

```json
{
  "dependencies": {
    "remotion": "^4.0.0",
    "@remotion/player": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@remotion/cli": "^4.0.0"
  }
}
```

---

## The Composition System

### Schema-First Video Design (Deep Research Finding)

In 2026, defining `zod` schemas for your Composition `defaultProps` is **mandatory** for robustness:

```tsx
import { z } from 'zod';
import { Composition } from 'remotion';
import { MyVideo } from './Video';

// Define schema for type safety and Studio UI generation
const MyVideoSchema = z.object({
  title: z.string(),
  backgroundColor: z.string(),
  aiVideoUrl: z.string().url().optional(),
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={MyVideoSchema}  // Enables auto-generated Studio UI
        defaultProps={{
          title: "Hello World",
          backgroundColor: "#000000"
        }}
      />
    </>
  );
};
```

**Benefits:**
- Remotion Studio auto-generates UI controls from the schema
- Type safety when invoking renders via API
- Validation of props before rendering

### Defining Compositions (Basic)

```tsx
// src/Root.tsx
import { Composition } from 'remotion';
import { MyVideo } from './Video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={300}  // 10 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Hello World",
          backgroundColor: "#000000"
        }}
      />
    </>
  );
};
```

### Video Component

```tsx
// src/Video.tsx
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

interface MyVideoProps {
  title: string;
  backgroundColor: string;
}

export const MyVideo: React.FC<MyVideoProps> = ({ title, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Calculate opacity based on frame (fade in)
  const opacity = Math.min(1, frame / 30);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <h1 style={{
        color: 'white',
        fontSize: 100,
        textAlign: 'center',
        marginTop: height / 2 - 50,
        opacity
      }}>
        {title}
      </h1>
    </AbsoluteFill>
  );
};
```

### Multiple Compositions

```tsx
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro"
        component={IntroVideo}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MainContent"
        component={MainVideo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Outro"
        component={OutroVideo}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

---

## Animation Fundamentals

### interpolate()

Map frame numbers to animated values:

```tsx
import { useCurrentFrame, interpolate } from 'remotion';

const MyComponent = () => {
  const frame = useCurrentFrame();

  // Fade in from frame 0-30
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  // Move from left to center over frames 0-60
  const translateX = interpolate(frame, [0, 60], [-100, 0]);

  // Scale up from frames 30-60, then stay at 1
  const scale = interpolate(frame, [30, 60], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div style={{
      opacity,
      transform: `translateX(${translateX}%) scale(${scale})`
    }}>
      Animated Content
    </div>
  );
};
```

### spring()

Physics-based spring animations:

```tsx
import { useCurrentFrame, spring, useVideoConfig } from 'remotion';

const SpringAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 10,
      stiffness: 100,
      mass: 1
    }
  });

  return (
    <div style={{ transform: `scale(${scale})` }}>
      Bouncy!
    </div>
  );
};
```

### Sequence

Mount components at specific times:

```tsx
import { Sequence, AbsoluteFill } from 'remotion';

const MyVideo = () => {
  return (
    <AbsoluteFill>
      {/* Show title from frame 0-60 */}
      <Sequence from={0} durationInFrames={60}>
        <Title text="Welcome" />
      </Sequence>

      {/* Show content from frame 30-150 */}
      <Sequence from={30} durationInFrames={120}>
        <Content />
      </Sequence>

      {/* Show outro from frame 120 */}
      <Sequence from={120}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## Audio Integration

### Adding Audio

```tsx
import { Audio, useCurrentFrame, interpolate } from 'remotion';

const VideoWithAudio = () => {
  const frame = useCurrentFrame();

  // Fade audio in/out
  const volume = interpolate(
    frame,
    [0, 30, 270, 300],
    [0, 1, 1, 0]
  );

  return (
    <>
      <Audio
        src="https://example.com/music.mp3"
        volume={volume}
        startFrom={0}  // Start from beginning of audio
      />
      {/* Video content */}
    </>
  );
};
```

### Audio with Video Clips

```tsx
import { Video, Audio } from 'remotion';

const VideoComposite = () => {
  return (
    <>
      {/* AI-generated video */}
      <Video
        src="https://example.com/ai-video.mp4"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Override audio with custom track */}
      <Audio
        src="https://example.com/custom-audio.mp3"
        volume={0.8}
      />
    </>
  );
};
```

### Synchronized Text (Subtitles)

```tsx
const Subtitles = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const currentCaption = captions.find(
    c => currentTime >= c.start && currentTime < c.end
  );

  return (
    <div style={{
      position: 'absolute',
      bottom: 50,
      width: '100%',
      textAlign: 'center'
    }}>
      {currentCaption?.text}
    </div>
  );
};
```

---

## AI Content Integration

### Pattern 1: Static AI Images

Use pre-generated AI images as backgrounds or overlays:

```tsx
import { Img, AbsoluteFill } from 'remotion';

const AIBackgroundVideo = ({ aiImageUrl, title }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 300], [1, 1.2]);

  return (
    <AbsoluteFill>
      {/* AI-generated image as background with Ken Burns effect */}
      <Img
        src={aiImageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`
        }}
      />

      {/* Overlay text */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        width: '100%',
        textAlign: 'center',
        color: 'white',
        fontSize: 60,
        textShadow: '2px 2px 10px black'
      }}>
        {title}
      </div>
    </AbsoluteFill>
  );
};
```

### Pattern 2: AI Video with Overlays

Composite overlays on AI-generated videos:

```tsx
import { Video, AbsoluteFill, Sequence } from 'remotion';

const AIVideoWithOverlays = ({ videoUrl, title, logo }) => {
  return (
    <AbsoluteFill>
      {/* AI-generated video (Kling, LTX, Veo) */}
      <Video
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Logo watermark */}
      <Img
        src={logo}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 100,
          opacity: 0.7
        }}
      />

      {/* Animated title */}
      <Sequence from={30} durationInFrames={90}>
        <AnimatedTitle text={title} />
      </Sequence>

      {/* Call to action */}
      <Sequence from={240}>
        <CallToAction />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### Pattern 3: CalculateMetadata for AI Fetching (Deep Research Finding)

**Do NOT** fetch AI data inside the video component using `useEffect`. Instead, use the `calculateMetadata` function to fetch content **before** rendering begins:

```tsx
// Recommended: CalculateMetadata API
import { CalculateMetadataFunction } from 'remotion';

type Props = {
  prompt: string;
  aiImageUrl?: string;
};

export const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props,
  abortSignal,
}) => {
  // Fetch AI content BEFORE rendering starts
  const response = await fetch('https://api.example.com/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt: props.prompt }),
    signal: abortSignal,
  });
  const data = await response.json();

  return {
    props: {
      ...props,
      aiImageUrl: data.imageUrl,
    },
    durationInFrames: 300,
  };
};

// Component receives pre-fetched data
const AIContent: React.FC<Props> = ({ aiImageUrl }) => {
  return (
    <Img src={aiImageUrl} style={{ width: '100%', height: '100%' }} />
  );
};
```

**Why CalculateMetadata is Better:**
- Prevents timeouts and flickering
- Props resolved before frame rendering begins
- Works better with Remotion Lambda

### Pattern 3b: Legacy Dynamic Content Fetching (delayRender)

For simpler use cases, `delayRender` still works:

```tsx
import { delayRender, continueRender } from 'remotion';
import { useEffect, useState } from 'react';

const DynamicAIContent = ({ prompt }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    async function fetchImage() {
      // Call AI image generation API
      const response = await fetch('https://api.example.com/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setImageUrl(data.imageUrl);
      continueRender(handle);
    }
    fetchImage();
  }, [prompt, handle]);

  if (!imageUrl) return null;

  return (
    <Img src={imageUrl} style={{ width: '100%', height: '100%' }} />
  );
};

### Caching Strategy (Deep Research Finding)

**Critical for AI APIs:** When developing with paid APIs (OpenAI, ElevenLabs, FAL.ai), implement a local cache:

```tsx
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = './cache/ai-assets';

async function fetchWithCache(prompt: string, apiCall: () => Promise<string>) {
  const hash = crypto.createHash('md5').update(prompt).digest('hex');
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);

  // Check cache first
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8')).url;
  }

  // Fetch from API
  const url = await apiCall();

  // Cache result
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ prompt, url }));

  return url;
}
```

**Why:** Remotion renders frames repeatedly. Without caching, you will drain API credits in seconds.
```

### Pattern 4: Multi-Scene AI Pipeline

Combine multiple AI-generated assets:

```tsx
const MultiSceneVideo = ({ scenes }) => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => {
        const startFrame = currentFrame;
        const duration = scene.duration * fps;
        currentFrame += duration;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={duration}
          >
            <SceneComponent
              videoUrl={scene.aiVideoUrl}
              title={scene.title}
              transition={scene.transition}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Usage
const scenes = [
  {
    aiVideoUrl: "https://fal.media/kling/scene1.mp4",
    title: "Chapter 1",
    duration: 5,
    transition: "fade"
  },
  {
    aiVideoUrl: "https://fal.media/kling/scene2.mp4",
    title: "Chapter 2",
    duration: 8,
    transition: "slide"
  }
];
```

---

## Production Deployment

### Local Rendering

```bash
# Render to MP4
npx remotion render src/index.tsx MyVideo out/video.mp4

# Render specific frames
npx remotion render src/index.tsx MyVideo out/video.mp4 --frames=0-100

# Render with custom props
npx remotion render src/index.tsx MyVideo out/video.mp4 --props='{"title":"Custom Title"}'
```

### Remotion Lambda (Cloud Rendering)

```bash
# Deploy Lambda function
npx remotion lambda functions deploy

# Render in cloud
npx remotion lambda render https://your-site.com MyVideo

# Programmatic rendering
```

```tsx
import { renderMediaOnLambda } from '@remotion/lambda';

const result = await renderMediaOnLambda({
  region: 'us-east-1',
  functionName: 'remotion-render',
  serveUrl: 'https://your-site.com',
  composition: 'MyVideo',
  inputProps: {
    title: 'Dynamic Title',
    aiVideoUrl: 'https://example.com/video.mp4'
  },
  codec: 'h264',
  maxRetries: 3
});

console.log('Video URL:', result.url);
```

### Lambda Concurrency Tuning (Deep Research Finding)

The "sweet spot" for Lambda deployment involves tuning `framesPerLambda`:

| Scene Complexity | framesPerLambda | Reason |
|------------------|-----------------|--------|
| Heavy AI/Three.js | 20 frames | Reduce per-Lambda memory pressure |
| Standard scenes | 100 frames | Default balance |
| Static/simple | 200 frames | Reduce cold-start overhead |

```tsx
const result = await renderMediaOnLambda({
  // ...other options
  framesPerLambda: 20,  // For heavy AI imagery
});
```

**Region Co-location:** Ensure your S3 bucket (assets) and Lambda function are in the **same AWS region** to minimize latency and data transfer costs.

### Remotion Player (Embeddable)

```tsx
import { Player } from '@remotion/player';
import { MyVideo } from './Video';

const EmbeddedPlayer = () => {
  return (
    <Player
      component={MyVideo}
      durationInFrames={300}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      style={{ width: '100%' }}
      controls
      inputProps={{
        title: 'Preview Video'
      }}
    />
  );
};
```

---

## Best Practices

### 1. Stateless Components

Keep components **pure** - same frame should always produce same output:

```tsx
// ✅ Good - deterministic
const GoodComponent = () => {
  const frame = useCurrentFrame();
  const opacity = frame / 30;
  return <div style={{ opacity }}>Content</div>;
};

// ❌ Bad - non-deterministic
const BadComponent = () => {
  const opacity = Math.random(); // Different each render!
  return <div style={{ opacity }}>Content</div>;
};
```

### 2. Use delayRender for Async

Always use `delayRender` / `continueRender` for async operations:

```tsx
const AsyncComponent = () => {
  const [data, setData] = useState(null);
  const [handle] = useState(() => delayRender('Loading data'));

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        continueRender(handle);
      });
  }, [handle]);

  if (!data) return null;
  return <div>{data.content}</div>;
};
```

### 3. Optimize Heavy Operations

```tsx
// ✅ Good - calculate once
const optimizedValue = useMemo(() => {
  return expensiveCalculation(props);
}, [props]);

// ❌ Bad - recalculate every frame
const value = expensiveCalculation(props);
```

### 4. Use AbsoluteFill for Layers

```tsx
import { AbsoluteFill } from 'remotion';

const LayeredVideo = () => {
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: 'black' }} />
      <AbsoluteFill>
        <Video src="..." />
      </AbsoluteFill>
      <AbsoluteFill>
        <TextOverlay />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

### 5. Preload Assets (Deep Research Finding)

Use `@remotion/preload` for all external assets. Browsers drop frames if assets aren't immediately available during seek:

```tsx
import { preloadVideo, preloadImage, preloadFont } from '@remotion/preload';

// In your component or composition
preloadVideo('https://example.com/ai-video.mp4');
preloadImage('https://example.com/background.jpg');
preloadFont('https://fonts.gstatic.com/...');
```

### 6. Use OffthreadVideo for Heavy Assets

For memory-efficient video decoding, especially with AI-generated videos:

```tsx
import { OffthreadVideo } from 'remotion';

const HeavyVideoScene = ({ videoUrl }) => {
  return (
    <OffthreadVideo
      src={videoUrl}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
```

**Why:** Offloads decoding from the main thread, preventing frame drops with large video assets.

### 7. The Rust Renderer (Deep Research Finding)

By 2026, the Rust-based renderer is the **default**. It provides 2x-5x faster rendering compared to legacy FFmpeg piping. Ensure codecs (H.264, VP9, ProRes) align with Rust engine capabilities.

---

## API Reference

### Core Hooks

| Hook | Signature | Returns |
|------|-----------|---------|
| `useCurrentFrame` | `() => number` | Current frame number |
| `useVideoConfig` | `() => VideoConfig` | `{ fps, durationInFrames, width, height }` |

### Animation Functions

```typescript
// interpolate
interpolate(
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options?: {
    extrapolateLeft?: 'clamp' | 'extend';
    extrapolateRight?: 'clamp' | 'extend';
    easing?: (t: number) => number;
  }
): number

// spring
spring({
  frame: number;
  fps: number;
  config?: {
    damping?: number;    // default: 10
    stiffness?: number;  // default: 100
    mass?: number;       // default: 1
  };
  from?: number;         // default: 0
  to?: number;           // default: 1
}): number
```

### Components

| Component | Purpose |
|-----------|---------|
| `<Composition>` | Define video composition |
| `<Sequence>` | Time-based component mounting |
| `<AbsoluteFill>` | Full-size positioned container |
| `<Video>` | Embed video files |
| `<Audio>` | Embed audio files |
| `<Img>` | Optimized image loading |
| `<OffthreadVideo>` | Memory-efficient video |

### Render Functions

```typescript
// Local render
import { renderMedia } from '@remotion/renderer';

await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: 'out/video.mp4'
});

// Lambda render
import { renderMediaOnLambda } from '@remotion/lambda';

await renderMediaOnLambda({
  region: 'us-east-1',
  functionName: 'remotion-render',
  serveUrl,
  composition: 'MyVideo',
  codec: 'h264'
});
```

---

## Troubleshooting

### Decision Tree: Common Issues

```
Issue: Video not rendering
│
├─► Check composition ID matches
│   └─► Verify ID in Root.tsx matches render command
│
├─► Missing dependencies
│   └─► npm install all required packages
│
└─► FFmpeg not found
    └─► Install FFmpeg: brew install ffmpeg (Mac)
```

```
Issue: Async content not loading
│
├─► Missing delayRender
│   └─► Add delayRender() before fetch
│
├─► continueRender not called
│   └─► Call continueRender(handle) after data loads
│
└─► Render timeout
    └─► Increase timeout in render options
```

```
Issue: Animation stuttering
│
├─► Frame calculations inconsistent
│   └─► Ensure pure/deterministic calculations
│
├─► Heavy computation per frame
│   └─► Use useMemo for expensive operations
│
└─► Too many DOM elements
    └─► Reduce complexity, use canvas/SVG
```

---

## LLM Agent Helper Functions

### Composition Generator

```javascript
/**
 * Generate Remotion composition configuration
 * @param {Object} config - Video configuration
 * @returns {Object} - Composition props
 */
function generateComposition(config) {
  const {
    id,
    duration = 10,  // seconds
    fps = 30,
    width = 1920,
    height = 1080,
    aspectRatio = null
  } = config;

  // Calculate dimensions from aspect ratio if provided
  let finalWidth = width;
  let finalHeight = height;

  if (aspectRatio) {
    const ratios = {
      '16:9': [1920, 1080],
      '9:16': [1080, 1920],
      '1:1': [1080, 1080],
      '4:3': [1440, 1080],
      '21:9': [2560, 1080]
    };
    [finalWidth, finalHeight] = ratios[aspectRatio] || [width, height];
  }

  return {
    id,
    durationInFrames: duration * fps,
    fps,
    width: finalWidth,
    height: finalHeight
  };
}
```

### Animation Builder

```javascript
/**
 * Generate animation keyframe configuration
 * @param {Object} config - Animation configuration
 * @returns {Object} - Interpolation parameters
 */
function buildAnimation(config) {
  const {
    type = 'fadeIn',  // 'fadeIn', 'fadeOut', 'slideIn', 'scale', 'custom'
    startFrame = 0,
    duration = 30,    // frames
    direction = 'left',
    customRange = null
  } = config;

  const endFrame = startFrame + duration;

  const animations = {
    fadeIn: {
      property: 'opacity',
      inputRange: [startFrame, endFrame],
      outputRange: [0, 1]
    },
    fadeOut: {
      property: 'opacity',
      inputRange: [startFrame, endFrame],
      outputRange: [1, 0]
    },
    slideIn: {
      property: 'translateX',
      inputRange: [startFrame, endFrame],
      outputRange: direction === 'left' ? [-100, 0] : [100, 0]
    },
    scale: {
      property: 'scale',
      inputRange: [startFrame, endFrame],
      outputRange: [0, 1]
    },
    custom: {
      property: 'custom',
      inputRange: [startFrame, endFrame],
      outputRange: customRange || [0, 1]
    }
  };

  return animations[type] || animations.fadeIn;
}

// Generate code
function generateAnimationCode(animation) {
  const { property, inputRange, outputRange } = animation;

  return `const ${property} = interpolate(
  frame,
  [${inputRange.join(', ')}],
  [${outputRange.join(', ')}],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);`;
}
```

### Scene Sequencer

```javascript
/**
 * Generate Sequence components for multi-scene videos
 * @param {Array} scenes - Scene configurations
 * @param {number} fps - Frames per second
 * @returns {string} - JSX code for sequences
 */
function generateSceneSequences(scenes, fps = 30) {
  let currentFrame = 0;
  const sequences = [];

  scenes.forEach((scene, index) => {
    const durationInFrames = scene.duration * fps;

    sequences.push(`
      <Sequence from={${currentFrame}} durationInFrames={${durationInFrames}}>
        <SceneComponent
          ${scene.videoUrl ? `videoUrl="${scene.videoUrl}"` : ''}
          ${scene.imageUrl ? `imageUrl="${scene.imageUrl}"` : ''}
          ${scene.title ? `title="${scene.title}"` : ''}
          ${scene.text ? `text="${scene.text}"` : ''}
        />
      </Sequence>`);

    currentFrame += durationInFrames;
  });

  return sequences.join('\n');
}
```

### AI Integration Helper

```javascript
/**
 * Generate component for AI content integration
 * @param {Object} config - Integration configuration
 * @returns {string} - Component code
 */
function generateAIIntegrationComponent(config) {
  const {
    aiType = 'image',  // 'image', 'video'
    source,
    overlays = [],
    animation = 'kenBurns'
  } = config;

  if (aiType === 'video') {
    return `
const AIVideoScene = ({ videoUrl, title }) => {
  return (
    <AbsoluteFill>
      <Video
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      ${overlays.map(o => `
      <div style={{
        position: 'absolute',
        ${o.position}: ${o.offset}px,
        color: 'white',
        fontSize: ${o.fontSize}px
      }}>
        {${o.prop}}
      </div>`).join('')}
    </AbsoluteFill>
  );
};`;
  }

  return `
const AIImageScene = ({ imageUrl, title }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 300], [1, 1.2]);

  return (
    <AbsoluteFill>
      <Img
        src={imageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: \`scale(\${scale})\`
        }}
      />
      ${overlays.map(o => `
      <div style={{
        position: 'absolute',
        ${o.position}: ${o.offset}px,
        color: 'white'
      }}>
        {${o.prop}}
      </div>`).join('')}
    </AbsoluteFill>
  );
};`;
}
```

---

## Quick Reference Card

### Common Aspect Ratios

| Ratio | Dimensions | Use Case |
|-------|------------|----------|
| 16:9 | 1920x1080 | YouTube, general |
| 9:16 | 1080x1920 | TikTok, Reels, Stories |
| 1:1 | 1080x1080 | Instagram feed |
| 4:3 | 1440x1080 | Legacy, presentations |

### Render Commands

```bash
# Render MP4
npx remotion render src/index.tsx CompositionId out/video.mp4

# Render GIF
npx remotion render src/index.tsx CompositionId out/video.gif

# Render with props
npx remotion render ... --props='{"title":"My Title"}'

# Render specific frames
npx remotion render ... --frames=0-90

# Preview in browser
npm start
```

### Animation Cheat Sheet

```tsx
// Fade in (frames 0-30)
const opacity = interpolate(frame, [0, 30], [0, 1]);

// Slide in from left
const x = interpolate(frame, [0, 30], [-100, 0]);

// Scale up with bounce
const scale = spring({ frame, fps, config: { damping: 10 } });

// Rotate 360 degrees
const rotation = interpolate(frame, [0, 60], [0, 360]);
```

---

*Document Version: 2.0 | Last Updated: January 2026 | Optimized for LLM Agent Consumption*
