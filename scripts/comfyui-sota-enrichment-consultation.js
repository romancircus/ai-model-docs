#!/usr/bin/env node
/**
 * ComfyUI SOTA Enrichment Consultation
 *
 * PURPOSE: Identify gaps in ComfyUI orchestration documentation for LLM agents
 * specifically around SOTA open-source image/video generation methodologies.
 *
 * TARGET: RTX 5090 32GB VRAM - maximize model capability utilization
 *
 * CONTEXT FED:
 * - MassMediaFactory MCP server codebase (our orchestration layer)
 * - Existing ComfyUI orchestration documentation
 * - SOTA model configurations and settings
 * - Workflow templates for current best models
 *
 * GOAL: Enable Claude Code Opus 4.5 to orchestrate ComfyUI with deep understanding of:
 * 1. SOTA model selection (January 2026 landscape)
 * 2. Optimal configurations for each model
 * 3. Multi-stage pipeline design patterns
 * 4. VRAM optimization strategies for RTX 5090
 * 5. Quality assurance iteration loops
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GeminiConsultation, MODELS, THINKING_LEVELS } from './core/GeminiConsultation.js';

// Load API key from NanoBanana-CLI .env.local
async function loadApiKey() {
  const envPath = '/Users/jigyoung/Dropbox/RomanCircus_Apps/NanoBanana-CLI/.env.local';
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (match) {
      process.env.GEMINI_API_KEY = match[1].trim();
      console.log('  API key loaded from NanoBanana-CLI/.env.local');
    }
  } catch (e) {
    console.error('Could not load API key from .env.local:', e.message);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// MCP server codebase location
const MCP_CODEBASE = '/Users/jigyoung/Dropbox/RomanCircus_Apps/comfyui-massmediafactory-mcp';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  COMFYUI SOTA ENRICHMENT CONSULTATION');
  console.log('  Target: RTX 5090 32GB VRAM | Claude Code Opus 4.5 Orchestration');
  console.log('='.repeat(80) + '\n');

  // Load API key
  await loadApiKey();

  const consultation = new GeminiConsultation({
    title: 'ComfyUI SOTA Enrichment for LLM Agent Orchestration',
    model: MODELS.GEMINI_3_PRO,
    thinkingLevel: THINKING_LEVELS.HIGH,
    outputDir: path.join(rootDir, 'output/consultations')
  });

  // Enable web search for latest SOTA information
  consultation.enableSearchGrounding();

  await consultation.initialize();

  console.log('Loading context...\n');

  // ========================================================================
  // SECTION 1: MassMediaFactory MCP Server Codebase
  // ========================================================================
  console.log('SECTION 1: MassMediaFactory MCP Server Codebase');

  // Core server - tool definitions and architecture
  await consultation.addCodeFile(
    'MCP Server (Tool Definitions)',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/server.py')
  );

  // SOTA model tracking - current best models
  await consultation.addCodeFile(
    'SOTA Model Tracker',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/sota.py')
  );

  // VRAM estimation - memory management
  await consultation.addCodeFile(
    'VRAM Estimation Module',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/vram.py')
  );

  // Workflow validation - pre-flight checks
  await consultation.addCodeFile(
    'Workflow Validation',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/validation.py')
  );

  // Pipeline orchestration - multi-stage workflows
  await consultation.addCodeFile(
    'Pipeline Orchestration',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/pipeline.py')
  );

  // ========================================================================
  // SECTION 2: Workflow Templates (JSON)
  // ========================================================================
  console.log('\nSECTION 2: Workflow Templates');

  await consultation.addJSONFile(
    'Qwen-Image Template',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/templates/qwen_txt2img.json')
  );

  await consultation.addJSONFile(
    'LTX-2 Video Template',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/templates/ltx2_txt2vid.json')
  );

  await consultation.addJSONFile(
    'Flux-2 Image Template',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/templates/flux2_txt2img.json')
  );

  await consultation.addJSONFile(
    'Wan 2.6 I2V Template',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/templates/wan26_img2vid.json')
  );

  // ========================================================================
  // SECTION 3: Existing Documentation
  // ========================================================================
  console.log('\nSECTION 3: Existing Documentation');

  await consultation.addTextFile(
    'ComfyUI Orchestration Guide (Current)',
    path.join(rootDir, 'comfyui/COMFYUI_ORCHESTRATION.md')
  );

  await consultation.addTextFile(
    'MassMediaFactory MCP Documentation',
    path.join(rootDir, 'comfyui/MASSMEDIAFACTORY_MCP.md')
  );

  await consultation.addTextFile(
    'ComfyUI README',
    path.join(rootDir, 'comfyui/README.md')
  );

  // ========================================================================
  // SECTION 4: Reference Documentation Pattern
  // ========================================================================
  console.log('\nSECTION 4: Reference Pattern (Kling Guide)');

  await consultation.addTextFile(
    'Kling Guide (Quality Benchmark)',
    path.join(rootDir, 'kling/Get_Started_Kling.md')
  );

  // ========================================================================
  // CONSULTATION PROMPT
  // ========================================================================

  const consultationPrompt = `
# OBJECTIVE

You are reviewing documentation and code for an LLM agent (Claude Code Opus 4.5) that orchestrates ComfyUI for local image and video generation. The target hardware is an RTX 5090 with 32GB VRAM.

## PROBLEM STATEMENT

Claude Code Opus 4.5 lacks native understanding of:
1. **SOTA model landscape** (January 2026) - which models are best for which tasks
2. **Optimal configurations** - CFG, steps, samplers, schedulers per model
3. **Node-specific patterns** - how to wire workflows for Flux, Qwen, LTX-2, etc.
4. **VRAM optimization** - how to maximize 32GB for best quality/speed tradeoff
5. **Multi-stage pipeline design** - chaining image → video, style transfer → animate
6. **Quality iteration loops** - when to regenerate vs tweak parameters

## YOUR TASK

Analyze the provided codebase and documentation, then:

### 1. GAP ANALYSIS
Identify specific gaps in the documentation that would cause an LLM agent to:
- Select wrong models for tasks
- Use suboptimal configurations
- Build invalid workflows
- Waste VRAM or fail with OOM
- Miss iteration opportunities

### 2. SOTA MODEL DEEP DIVE (January 2026)
Using your search capabilities, provide authoritative information on:

**Image Generation:**
- Qwen-Image-2512: Strengths, weaknesses, optimal settings
- FLUX.2-dev: Strengths, weaknesses, optimal settings
- Any newer models that have emerged

**Video Generation:**
- LTX-2 19B: Capabilities, audio sync, optimal settings
- Wan 2.6: Motion quality, I2V strength
- HunyuanVideo 1.5: Quality vs speed tradeoffs
- Any newer video models

**ControlNet & Conditioning:**
- Qwen ControlNet variants (Canny, Depth)
- IP-Adapter for style consistency
- Best practices for combining with base models

### 3. RTX 5090 32GB OPTIMIZATION GUIDE
Provide specific recommendations for:
- Model precision selection (fp8 vs fp16 vs bf16)
- Batch size optimization
- Tiled VAE necessity thresholds
- Model loading/unloading strategies
- Multi-model pipeline memory management

### 4. WORKFLOW PATTERN LIBRARY
Identify workflow patterns that should be documented:
- Text-to-Image → Upscale → Video pipeline
- Reference image → Style Transfer → Animation
- Multi-subject consistency (batch generation)
- Quality iteration loops (regenerate, tweak, publish)

### 5. DECISION TREES FOR AGENTS
Design decision trees an LLM agent should use for:
- Model selection given task description
- Resolution selection given model + VRAM
- Sampler/scheduler selection given model
- CFG selection given model + desired adherence
- When to regenerate vs when to tweak

### 6. PROMPTING METHODOLOGY
Current gap: LLMs don't know model-specific prompting. Document:
- Qwen vs Flux prompt style differences
- Video motion prompts (describe change, not state)
- Negative prompt templates per model
- Text rendering prompts (Flux excels)

### 7. SPECIFIC DOCUMENTATION IMPROVEMENTS
For each gap, provide:
- **Section**: Where in docs this belongs
- **Content**: Actual text/tables/code to add
- **Priority**: High/Medium/Low
- **Rationale**: Why this helps agent orchestration

## OUTPUT FORMAT

Structure your response as:

\`\`\`markdown
# ComfyUI SOTA Orchestration Enrichment

## 1. Gap Analysis Summary
[Table of identified gaps]

## 2. SOTA Model Reference (January 2026)
### 2.1 Image Generation Models
[Details per model]
### 2.2 Video Generation Models
[Details per model]
### 2.3 Auxiliary Models (ControlNet, IP-Adapter)
[Details]

## 3. RTX 5090 32GB Optimization
[Specific recommendations]

## 4. Workflow Pattern Library
[Pattern definitions with code]

## 5. Agent Decision Trees
[ASCII flowcharts or structured trees]

## 6. Prompting Methodology
[Model-specific guidance]

## 7. Documentation Improvements
[Prioritized list of additions]
\`\`\`

## CONSTRAINTS

- Be specific - vague suggestions are not actionable
- Include actual code/JSON snippets where helpful
- Reference specific nodes and their parameters
- Ground recommendations in current SOTA (search for latest)
- Consider that the agent has NO prior ComfyUI knowledge
- Assume RTX 5090 32GB is always available (no need for low-VRAM fallbacks)

## QUALITY BENCHMARK

The Kling documentation provided shows our target quality level:
- Comprehensive model coverage
- Decision trees for task selection
- Concrete code examples
- Parameter reference tables
- Prompting frameworks (S.C.A.M.)

Aim to match or exceed this quality for ComfyUI local generation.
`;

  consultation.setPrompt(consultationPrompt);

  // Run consultation
  console.log('\n' + '='.repeat(80));
  console.log('  Running Gemini consultation...');
  console.log('='.repeat(80) + '\n');

  try {
    const result = await consultation.runWithRetry(3, 10000);

    console.log('\n' + '='.repeat(80));
    console.log('  CONSULTATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n  Duration: ${result.duration}s`);
    console.log(`  Total Tokens: ${result.usage.totalTokenCount?.toLocaleString() || 'N/A'}`);
    console.log(`  Thoughts Tokens: ${result.usage.thoughtsTokenCount?.toLocaleString() || '0'}`);
    console.log(`\n  Output saved to: ${result.outputPath}`);
    console.log('\n' + '='.repeat(80) + '\n');

    return result;
  } catch (error) {
    console.error('\nConsultation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
