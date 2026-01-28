/**
 * ComfyUI Documentation Improvement Analysis
 *
 * Consults Gemini 3.0 Pro to analyze our ComfyUI documentation and MCP templates
 * against official ComfyUI workflow patterns, identifying gaps and improvements.
 *
 * Usage: node scripts/consultations/comfyui_docs_improvement_analysis.js
 */

import { GeminiConsultation, MODELS, THINKING_LEVELS } from '../core/GeminiConsultation.js';
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = '/Users/jigyoung/Dropbox/RomanCircus_Apps';
const AI_MODEL_DOCS = `${PROJECT_ROOT}/ai-model-docs`;
const MCP_ROOT = `${PROJECT_ROOT}/comfyui-massmediafactory-mcp`;

async function main() {
  console.log('='.repeat(70));
  console.log('ComfyUI Documentation Improvement Analysis');
  console.log('Consulting Gemini 3.0 Pro with Deep Research');
  console.log('='.repeat(70));
  console.log();

  // Initialize consultation
  const consultation = new GeminiConsultation({
    title: 'ComfyUI Documentation Gap Analysis & Improvement Recommendations',
    model: MODELS.GEMINI_3_PRO,
    thinkingLevel: THINKING_LEVELS.HIGH,
    outputDir: `${AI_MODEL_DOCS}/output/consultations`,
  });

  // Enable search grounding for latest ComfyUI information
  consultation.enableSearchGrounding();

  console.log('Loading documentation files...\n');

  // 1. Load Official ComfyUI Workflow Patterns
  console.log('  [1/6] Loading Official ComfyUI Workflows...');
  await consultation.addTextFile(
    'Official ComfyUI Workflow Patterns',
    `${MCP_ROOT}/docs/COMFYUI_OFFICIAL_WORKFLOWS.md`
  );

  // 2. Load Workflow Node Reference
  console.log('  [2/6] Loading Workflow Node Reference...');
  await consultation.addTextFile(
    'Complete Node Reference (for agents)',
    `${MCP_ROOT}/docs/WORKFLOW_NODE_REFERENCE.md`
  );

  // 3. Load Our Documentation - Get Started Guide
  console.log('  [3/6] Loading Our Get_Started_ComfyUI.md...');
  await consultation.addTextFile(
    'Our Documentation: Get_Started_ComfyUI.md',
    `${AI_MODEL_DOCS}/comfyui/Get_Started_ComfyUI.md`
  );

  // 4. Load Our Documentation - Orchestration Guide (partial due to size)
  console.log('  [4/6] Loading Our COMFYUI_ORCHESTRATION.md (first 1500 lines)...');
  const orchestrationContent = await fs.readFile(
    `${AI_MODEL_DOCS}/comfyui/COMFYUI_ORCHESTRATION.md`,
    'utf-8'
  );
  const orchestrationLines = orchestrationContent.split('\n').slice(0, 1500).join('\n');
  // Add partial content directly to textParts
  consultation.textParts.push({
    label: 'Our Documentation: COMFYUI_ORCHESTRATION.md (partial)',
    content: orchestrationLines,
    size: orchestrationLines.length
  });
  console.log(`  + Our Documentation: COMFYUI_ORCHESTRATION.md (partial): ${orchestrationLines.length.toLocaleString()} chars`);

  // 5. Load Template JSON files
  console.log('  [5/6] Loading MCP Template JSON files...');
  const templatesDir = `${MCP_ROOT}/src/comfyui_massmediafactory_mcp/templates`;
  const templateFiles = await fs.readdir(templatesDir);
  const jsonTemplates = templateFiles.filter(f => f.endsWith('.json'));

  let templatesContent = '# MCP Workflow Templates\n\n';
  for (const templateFile of jsonTemplates) {
    const content = await fs.readFile(path.join(templatesDir, templateFile), 'utf-8');
    templatesContent += `## ${templateFile}\n\`\`\`json\n${content}\n\`\`\`\n\n`;
  }
  consultation.textParts.push({
    label: 'Our MCP Templates (JSON)',
    content: templatesContent,
    size: templatesContent.length
  });
  console.log(`  + Our MCP Templates (JSON): ${templatesContent.length.toLocaleString()} chars`);

  // 6. Load MCP Server code (key sections)
  console.log('  [6/6] Loading MCP Server Implementation...');
  const serverContent = await fs.readFile(
    `${MCP_ROOT}/src/comfyui_massmediafactory_mcp/server.py`,
    'utf-8'
  );
  // Get first 800 lines
  const serverLines = serverContent.split('\n').slice(0, 800).join('\n');
  consultation.textParts.push({
    label: 'MCP Server Implementation (server.py, partial)',
    content: serverLines,
    size: serverLines.length
  });
  console.log(`  + MCP Server Implementation: ${serverLines.length.toLocaleString()} chars`);

  // Also add the new MCP utilities
  await consultation.addTextFile(
    'MCP Utils (compliance utilities)',
    `${MCP_ROOT}/src/comfyui_massmediafactory_mcp/mcp_utils.py`
  );
  await consultation.addTextFile(
    'MCP Schemas (JSON Schema definitions)',
    `${MCP_ROOT}/src/comfyui_massmediafactory_mcp/schemas.py`
  );

  console.log('\nAll files loaded. Preparing consultation prompt...\n');

  // Set the comprehensive analysis prompt
  consultation.setPrompt(`
# Task: ComfyUI Documentation Improvement Analysis

You are an expert in ComfyUI workflow systems, diffusion models, and technical documentation for LLM agents.

## Context

I've provided you with:

1. **Official ComfyUI Workflow Patterns** - Canonical patterns from comfyanonymous.github.io and Lightricks
2. **Complete Node Reference** - JSON structures for agent recreation
3. **Our Get_Started_ComfyUI.md** - User-facing ComfyUI guide
4. **Our COMFYUI_ORCHESTRATION.md** - Agent-facing programmatic guide
5. **Our MCP Templates** - JSON workflow templates for various generation types
6. **Our MCP Server** - Tool implementations for workflow execution

## Analysis Required

Please analyze our documentation and templates against the official ComfyUI patterns and provide:

### 1. Template Accuracy Review

For each of our templates (ltx2_txt2vid, ltx2_img2vid, flux2_txt2img, wan26_img2vid, etc.):
- Does it match the official ComfyUI pattern for that model?
- Are we using the correct nodes (e.g., SamplerCustom vs KSampler)?
- Are we using model-specific conditioning wrappers (LTXVConditioning, FluxGuidance)?
- Are scheduler parameters correct (LTXVScheduler max_shift/base_shift)?

### 2. Missing Workflow Patterns

Based on official ComfyUI examples, what important workflow patterns are we missing?
- Any official workflows not represented in our templates?
- Advanced patterns (IP-Adapter, regional prompting, depth control)?
- Video editing workflows (retake, segment editing)?

### 3. Documentation Gaps

Compare our Get_Started_ComfyUI.md and COMFYUI_ORCHESTRATION.md against official patterns:
- Are there node patterns we document incorrectly?
- Missing critical information about model-specific requirements?
- Outdated parameter recommendations?

### 4. MCP Server Improvements

Review the MCP server implementation:
- Are there missing tools that would help with official workflow patterns?
- Are our validation rules aligned with official constraints?
- Missing model-specific utility functions?

### 5. Prioritized Recommendations

Provide a prioritized list of improvements:

**High Priority (Critical for Accuracy):**
- List items that would cause workflow failures if not fixed

**Medium Priority (Enhancement):**
- Items that improve quality or add important features

**Low Priority (Nice to Have):**
- Future enhancements, polish items

## Output Format

Structure your response as:

\`\`\`markdown
# ComfyUI Documentation Improvement Report

## Executive Summary
[2-3 sentences summarizing findings]

## 1. Template Accuracy Review
### Templates Correctly Aligned
- [template_name]: [status]

### Templates Requiring Fixes
- [template_name]: [issue] → [fix]

## 2. Missing Workflow Patterns
[List with priority]

## 3. Documentation Gaps
[Specific sections to update]

## 4. MCP Server Improvements
[Tool or validation additions]

## 5. Prioritized Action Items
### High Priority
1. [item]
2. [item]

### Medium Priority
1. [item]

### Low Priority
1. [item]

## Appendix: Specific Code/Template Fixes
[Provide exact corrections for any incorrect templates]
\`\`\`

Please be specific and actionable. Where you identify issues, provide the exact fix.
`);

  // Run the consultation
  console.log('Starting Gemini consultation (this may take 2-5 minutes)...\n');
  console.log('-'.repeat(70));

  try {
    const result = await consultation.run();

    console.log('-'.repeat(70));
    console.log('\nConsultation complete!');
    console.log(`\nOutput saved to: ${result.outputPath}`);
    console.log(`Thinking saved to: ${result.thinkingPath || 'N/A'}`);

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('CONSULTATION RESULT PREVIEW');
    console.log('='.repeat(70));
    console.log(result.response.substring(0, 2000) + '...\n');
    console.log(`\nFull response: ${result.response.length} characters`);
    console.log(`See full output at: ${result.outputPath}`);

  } catch (error) {
    console.error('Consultation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
