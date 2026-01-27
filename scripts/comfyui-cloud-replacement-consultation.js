#!/usr/bin/env node
/**
 * ComfyUI Cloud Replacement Strategy Consultation
 *
 * OBJECTIVE: Identify what additional context Claude Code needs to fully replace
 * expensive cloud-based image/video generation APIs with local ComfyUI pipelines.
 *
 * CONTEXT FED:
 * - MassMediaFactory MCP server (complete codebase)
 * - AI Model Docs (ComfyUI orchestration documentation)
 * - Current capabilities and gaps
 *
 * GOAL: Enable Claude Code to autonomously create, iterate, and maintain
 * production-quality image/video generation pipelines that match or exceed
 * cloud API quality (Midjourney, DALL-E, Runway, Pika, etc.)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GeminiConsultation, MODELS, THINKING_LEVELS } from './core/GeminiConsultation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Repository locations
const MCP_CODEBASE = '/Users/jigyoung/Dropbox/RomanCircus_Apps/comfyui-massmediafactory-mcp';
const AI_MODEL_DOCS = '/Users/jigyoung/Dropbox/RomanCircus_Apps/ai-model-docs';

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

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  COMFYUI CLOUD REPLACEMENT STRATEGY CONSULTATION');
  console.log('  Objective: Replace expensive cloud APIs with local ComfyUI');
  console.log('='.repeat(80) + '\n');

  await loadApiKey();

  const consultation = new GeminiConsultation({
    title: 'ComfyUI Cloud API Replacement Strategy',
    model: MODELS.GEMINI_3_PRO,
    thinkingLevel: THINKING_LEVELS.HIGH,
    outputDir: path.join(rootDir, 'output/consultations')
  });

  consultation.enableSearchGrounding();
  await consultation.initialize();

  console.log('Loading context from both repositories...\n');

  // ========================================================================
  // SECTION 1: MassMediaFactory MCP Server (Complete Codebase)
  // ========================================================================
  console.log('SECTION 1: MassMediaFactory MCP Server Codebase');

  await consultation.addCodeFile(
    'MCP Server - Main',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/server.py')
  );

  await consultation.addCodeFile(
    'MCP Server - SOTA Tracker',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/sota.py')
  );

  await consultation.addCodeFile(
    'MCP Server - VRAM Estimation',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/vram.py')
  );

  await consultation.addCodeFile(
    'MCP Server - Workflow Validation',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/validation.py')
  );

  await consultation.addCodeFile(
    'MCP Server - Pipeline Orchestration',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/pipeline.py')
  );

  await consultation.addCodeFile(
    'MCP Server - Asset Management',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/assets.py')
  );

  await consultation.addCodeFile(
    'MCP Server - Execution',
    path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/execution.py')
  );

  // ========================================================================
  // SECTION 2: Workflow Templates
  // ========================================================================
  console.log('\nSECTION 2: Workflow Templates');

  const templateDir = path.join(MCP_CODEBASE, 'src/comfyui_massmediafactory_mcp/templates');
  const templateFiles = await fs.readdir(templateDir);

  for (const file of templateFiles.filter(f => f.endsWith('.json'))) {
    await consultation.addJSONFile(
      `Template: ${file}`,
      path.join(templateDir, file)
    );
  }

  // ========================================================================
  // SECTION 3: AI Model Docs - ComfyUI Documentation
  // ========================================================================
  console.log('\nSECTION 3: AI Model Docs - ComfyUI Documentation');

  await consultation.addTextFile(
    'ComfyUI Orchestration Guide (v4.0)',
    path.join(AI_MODEL_DOCS, 'comfyui/COMFYUI_ORCHESTRATION.md')
  );

  await consultation.addTextFile(
    'MassMediaFactory MCP Documentation',
    path.join(AI_MODEL_DOCS, 'comfyui/MASSMEDIAFACTORY_MCP.md')
  );

  await consultation.addTextFile(
    'ComfyUI README',
    path.join(AI_MODEL_DOCS, 'comfyui/README.md')
  );

  // ========================================================================
  // SECTION 4: Reference - Kling Guide (Quality Benchmark)
  // ========================================================================
  console.log('\nSECTION 4: Reference Documentation');

  await consultation.addTextFile(
    'Kling Guide (Cloud API Reference)',
    path.join(AI_MODEL_DOCS, 'kling/Get_Started_Kling.md')
  );

  // ========================================================================
  // CONSULTATION PROMPT
  // ========================================================================

  const consultationPrompt = `
# OBJECTIVE

You are consulting on a strategy to **replace expensive cloud-based image and video generation APIs** with local ComfyUI pipelines orchestrated by Claude Code (Opus 4.5).

## CURRENT CLOUD SERVICES TO REPLACE

| Service | Cost | Use Case |
|---------|------|----------|
| Midjourney | $30-120/mo | High-quality artistic images |
| DALL-E 3 | $0.04-0.12/image | Text-to-image, text rendering |
| Runway Gen-3 | $15-95/mo | Video generation, motion |
| Pika Labs | $8-58/mo | Quick video generation |
| Kling (FAL.ai) | Pay-per-use | High-quality video, motion control |
| ElevenLabs | $5-330/mo | Voice/audio (for video) |

**Target Hardware:** RTX 5090 32GB VRAM

## WHAT WE HAVE NOW

1. **MassMediaFactory MCP Server** - Tool layer for ComfyUI orchestration
   - Model discovery, workflow execution, asset management
   - SOTA model tracking, VRAM estimation
   - Quality assurance (VLM-based)

2. **ComfyUI Orchestration Documentation** - Agent reference
   - Workflow JSON schema, node connections
   - Model-specific templates (FLUX.2, Qwen, LTX-2, Wan 2.6)
   - RTX 5090 optimization, decision trees, prompting methodology

## YOUR TASK

Analyze both repositories and identify:

### 1. CAPABILITY GAP ANALYSIS

Compare what cloud APIs offer vs. what our local setup can do:

| Capability | Cloud APIs | Our Local Setup | Gap? |
|------------|------------|-----------------|------|
| Text-to-Image | ✓ | ? | ? |
| Image-to-Image | ✓ | ? | ? |
| Inpainting/Outpainting | ✓ | ? | ? |
| Text-to-Video | ✓ | ? | ? |
| Image-to-Video | ✓ | ? | ? |
| Video-to-Video | ✓ | ? | ? |
| Style Transfer | ✓ | ? | ? |
| Character Consistency | ✓ | ? | ? |
| Upscaling | ✓ | ? | ? |
| Audio Generation | ✓ | ? | ? |
| Lip Sync | ✓ | ? | ? |

### 2. MISSING CONTEXT FOR CLAUDE CODE

What additional information does Claude Code need to autonomously:

1. **Select the right workflow** for any user request
2. **Build custom workflows** from scratch when templates don't exist
3. **Debug failed generations** without human intervention
4. **Iterate on quality** until output matches cloud API quality
5. **Handle edge cases** (unusual aspect ratios, long videos, batch generation)

### 3. MISSING WORKFLOW TEMPLATES

What common use cases lack templates?

- Portrait photography
- Product photography
- Logo/brand generation
- Social media content (Instagram, TikTok, YouTube)
- Animation/cartoon styles
- Architectural visualization
- etc.

### 4. QUALITY PARITY STRATEGIES

How can we ensure local generation quality matches cloud APIs?

- Prompt engineering differences
- Post-processing pipelines
- Quality iteration loops
- Model selection for specific aesthetics

### 5. AUTOMATION GAPS

What manual steps still exist that could be automated?

- Model downloading/installation
- ComfyUI node installation
- Workflow debugging
- Output organization/naming

### 6. DOCUMENTATION ADDITIONS NEEDED

Specific sections to add to enable full cloud replacement:

- [ ] Section name: [description]
- [ ] Section name: [description]
- ...

### 7. MCP SERVER ENHANCEMENTS

Tools or features to add to the MCP server:

- [ ] Tool name: [description]
- [ ] Tool name: [description]
- ...

### 8. COST-BENEFIT ANALYSIS

Provide a realistic assessment:

| Scenario | Cloud Cost/mo | Local Cost | Break-even |
|----------|---------------|------------|------------|
| Light use (50 images, 10 videos) | $? | $? | ? |
| Medium use (500 images, 100 videos) | $? | $? | ? |
| Heavy use (5000 images, 1000 videos) | $? | $? | ? |

### 9. RECOMMENDED ROADMAP

Prioritized list of improvements to achieve full cloud replacement:

**Phase 1 (Critical):**
- [ ] Item 1
- [ ] Item 2

**Phase 2 (Important):**
- [ ] Item 1
- [ ] Item 2

**Phase 3 (Nice to Have):**
- [ ] Item 1
- [ ] Item 2

## OUTPUT FORMAT

Structure your response as actionable recommendations with specific code/documentation snippets where helpful. Focus on:

1. **What's missing** - Concrete gaps
2. **How to fix it** - Specific solutions
3. **Priority** - What to do first

Be thorough but practical. The goal is a working system, not perfection.
`;

  consultation.setPrompt(consultationPrompt);

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
