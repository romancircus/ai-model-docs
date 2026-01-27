#!/usr/bin/env node
/**
 * ComfyUI Deep Research Consultation
 *
 * Purpose: Generate comprehensive documentation that enables Claude Code to:
 * 1. Generate ComfyUI workflow JSON programmatically
 * 2. Execute workflows via API
 * 3. Iterate on results with feedback loops
 * 4. Orchestrate complex multi-stage pipelines (image → style transfer → 4K video)
 *
 * Uses Gemini 3.0 Pro with:
 * - HIGH thinking level for architecture decisions
 * - Search grounding for latest ComfyUI patterns
 */

import { GeminiConsultation, MODELS, THINKING_LEVELS } from './core/GeminiConsultation.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runDeepResearchConsultation() {
  console.log('\n' + '='.repeat(80));
  console.log('  COMFYUI DEEP RESEARCH CONSULTATION');
  console.log('  Goal: Documentation for LLM Agent Orchestration of ComfyUI');
  console.log('='.repeat(80) + '\n');

  // Create consultation with search grounding enabled
  const consultation = new GeminiConsultation({
    title: 'ComfyUI Agent Orchestration Deep Research',
    model: MODELS.GEMINI_3_PRO,
    thinkingLevel: THINKING_LEVELS.HIGH,
    outputDir: path.join(rootDir, 'output/consultations')
  });

  // Enable search grounding for latest ComfyUI info
  consultation.enableSearchGrounding();

  await consultation.initialize();

  console.log('Loading context files...\n');

  // Add current ComfyUI documentation
  await consultation.addTextFile(
    'Current ComfyUI Documentation',
    path.join(rootDir, 'comfyui/Get_Started_ComfyUI.md')
  );

  // Add production ComfyUI client implementation
  await consultation.addCodeFile(
    'Production ComfyUI Client (Python)',
    '/Users/jigyoung/Dropbox/RomanCircus_Apps/pokedex-generator/src/adapters/comfyui_client.py'
  );

  // Add workflow templates
  await consultation.addJSONFile(
    'Qwen Bio Workflow Template',
    '/Users/jigyoung/Dropbox/RomanCircus_Apps/pokedex-generator/workflows/qwen_bio_txt2img_controlnet.json'
  );

  await consultation.addJSONFile(
    'LTX-2 Video Workflow Template',
    '/Users/jigyoung/Dropbox/RomanCircus_Apps/pokedex-generator/workflows/ltx_i2v_video.json'
  );

  // Add LTX documentation for video integration patterns
  await consultation.addTextFile(
    'LTX Video Documentation',
    path.join(rootDir, 'ltx/Get_Started_LTX.md')
  );

  // Set the comprehensive research prompt
  consultation.setPrompt(`
# MISSION: ComfyUI Agent Orchestration Documentation

You are helping create documentation that enables coding agents like Claude Code to **perfectly orchestrate ComfyUI workflows** with near-perfect accuracy. The goal is that when a user says:

> "Make a viral video by transforming a reference image into a new art style and generate a 4K video in a certain style"

The agent can:
1. Generate the correct workflow JSON
2. Submit it to ComfyUI API
3. Monitor execution progress
4. Handle errors intelligently
5. Chain multiple stages (image gen → style transfer → video gen → upscaling)

## RESEARCH QUESTIONS

### 1. Workflow Generation Patterns
Search for and document:
- How to programmatically build ComfyUI workflow JSON for different tasks
- Node connection patterns (what outputs connect to what inputs)
- Required vs optional parameters for common nodes
- How to handle dynamic node IDs

### 2. API Orchestration Best Practices
Search for and document:
- ComfyUI API endpoints and their exact behavior
- WebSocket message types and event handling patterns
- Error recovery strategies (what errors are retryable?)
- Queue management for multi-stage pipelines

### 3. Multi-Stage Pipeline Patterns
Search for and document:
- How to chain: txt2img → img2img refinement → video generation
- How to pass outputs between stages without re-uploading
- Optimal batching strategies
- Memory management between stages

### 4. Model-Specific Workflow Patterns
Document the exact node configurations for:
- **Flux**: DualCLIPLoader, guidance, scheduler settings
- **SDXL**: Checkpoint + Refiner patterns
- **Qwen-Image**: UNETLoader + CLIPLoader + VAELoader patterns
- **LTX-Video**: Video-specific nodes, audio integration
- **ControlNet**: Different preprocessors and their use cases
- **IP-Adapter**: Style transfer configurations

### 5. Node Type Reference
For LLM agents, document:
- Complete list of essential node class_types
- Input/output slot types and what they can connect to
- Default values and valid ranges for all parameters
- Required dependencies between nodes

### 6. Error Handling & Recovery
Document:
- Common execution errors and their causes
- How to parse error messages from WebSocket
- Recovery strategies (retry? modify workflow? fallback?)
- VRAM management patterns

### 7. Prompt Engineering for ComfyUI
Document:
- How to structure prompts for different models
- Negative prompt patterns that work
- Quality tags and their effects
- Style mixing techniques

## OUTPUT FORMAT

Please provide your response as a structured document with:

1. **Executive Summary**: Key insights for agent orchestration
2. **Workflow JSON Schema**: Formal structure that agents must follow
3. **Node Connection Rules**: What can connect to what
4. **Pipeline Templates**: Copy-paste-ready multi-stage pipeline patterns
5. **API Integration Patterns**: Exact code patterns for orchestration
6. **Error Handling Decision Tree**: How agents should handle each error type
7. **Model-Specific Quick Reference**: Tables of settings per model
8. **Prompt Engineering Guidelines**: How to generate good prompts

Focus on making this IMMEDIATELY ACTIONABLE for an LLM coding agent. Include:
- Exact JSON structures
- Exact API payloads
- Exact parameter values
- Decision trees for choosing options

## CONTEXT PROVIDED

I've included:
1. Our current ComfyUI documentation (Get_Started_ComfyUI.md)
2. Our production ComfyUI Python client (comfyui_client.py) - ~2000 lines
3. Working workflow templates for Qwen-Image and LTX-2 video
4. Our LTX video documentation

Use these as references for the patterns we already use, and enhance them with your research.
`);

  // Run the consultation
  const result = await consultation.run();

  console.log('\n' + '='.repeat(80));
  console.log('  Deep Research Complete!');
  console.log('='.repeat(80));
  console.log(`\n  Output saved to: ${result.outputPath}`);
  console.log(`  Duration: ${result.duration}s`);
  console.log(`  Thinking tokens: ${result.usage.thoughtsTokenCount?.toLocaleString() || 'N/A'}`);
  console.log(`  Total tokens: ${result.usage.totalTokenCount?.toLocaleString() || 'N/A'}\n`);

  return result;
}

// Run the consultation
runDeepResearchConsultation().catch(console.error);
