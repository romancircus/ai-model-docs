# Remotion Documentation

React-based framework for programmatic video creation.

## Files

| File | Content |
|------|---------|
| `Get_Started_Remotion.md` | Comprehensive video creation guide |
| `REMOTION_AI_INTEGRATION.md` | AI content patterns (coming soon) |

## Quick Reference

### Core Hooks

```tsx
const frame = useCurrentFrame();           // Current frame number
const { fps, width, height } = useVideoConfig();  // Video config
```

### Animation

```tsx
// Fade in over 30 frames
const opacity = interpolate(frame, [0, 30], [0, 1]);

// Spring animation
const scale = spring({ frame, fps });
```

### Time-Based Mounting

```tsx
<Sequence from={30} durationInFrames={90}>
  <MyComponent />
</Sequence>
```

## Code Quick Start

```tsx
import { useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <h1 style={{ color: 'white', opacity }}>
        Hello World
      </h1>
    </AbsoluteFill>
  );
};
```

## AI Integration Patterns

1. **Static AI Images** - Ken Burns effect on AI images
2. **AI Video Overlays** - Text/graphics on AI videos
3. **Dynamic Fetching** - Generate during render
4. **Multi-Scene** - Sequence AI video clips

## Commands

```bash
# Start dev server
npm start

# Render video
npx remotion render src/index.tsx MyVideo out/video.mp4

# Cloud render (Lambda)
npx remotion lambda render
```

## Key Concepts

- **Frame-based** - Every frame is a React snapshot
- **Deterministic** - Same code = same video
- **Stateless** - Components must be pure
- **Async** - Use delayRender/continueRender
