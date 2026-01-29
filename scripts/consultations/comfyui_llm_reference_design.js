/**
 * ComfyUI LLM Reference Documentation Design
 *
 * Consults Gemini 3.0 Pro on how to best organize official ComfyUI workflow
 * patterns as reference documentation for LLMs and other repos to create
 * their own workflow JSONs.
 *
 * Usage: node scripts/consultations/comfyui_llm_reference_design.js
 */

import { GeminiConsultation, MODELS, THINKING_LEVELS } from '../core/GeminiConsultation.js';
import fs from 'fs/promises';

const PROJECT_ROOT = '/Users/jigyoung/Dropbox/RomanCircus_Apps';
const AI_MODEL_DOCS = `${PROJECT_ROOT}/ai-model-docs`;
const MCP_ROOT = `${PROJECT_ROOT}/comfyui-massmediafactory-mcp`;

async function main() {
  console.log('='.repeat(70));
  console.log('ComfyUI LLM Reference Documentation Design Consultation');
  console.log('='.repeat(70));
  console.log();

  const consultation = new GeminiConsultation({
    title: 'ComfyUI LLM Reference Documentation Design',
    model: MODELS.GEMINI_3_PRO,
    thinkingLevel: THINKING_LEVELS.HIGH,
    outputDir: `${AI_MODEL_DOCS}/output/consultations`,
  });

  consultation.enableSearchGrounding();

  console.log('Loading context files...\n');

  // Load the official workflow patterns
  console.log('  [1/4] Loading Official ComfyUI Workflows...');
  await consultation.addTextFile(
    'Official ComfyUI Workflow Patterns',
    `${MCP_ROOT}/docs/COMFYUI_OFFICIAL_WORKFLOWS.md`
  );

  console.log('  [2/4] Loading Workflow Node Reference...');
  await consultation.addTextFile(
    'Complete Node Reference',
    `${MCP_ROOT}/docs/WORKFLOW_NODE_REFERENCE.md`
  );

  // Load example of our current MCP template structure
  console.log('  [3/4] Loading example MCP template...');
  await consultation.addTextFile(
    'Example MCP Template (ltx2_txt2vid.json)',
    `${MCP_ROOT}/src/comfyui_massmediafactory_mcp/templates/ltx2_txt2vid.json`
  );

  // Load our current orchestration doc
  console.log('  [4/4] Loading orchestration guide (first 800 lines)...');
  const orchestrationContent = await fs.readFile(
    `${AI_MODEL_DOCS}/comfyui/COMFYUI_ORCHESTRATION.md`,
    'utf-8'
  );
  const orchestrationLines = orchestrationContent.split('\n').slice(0, 800).join('\n');
  consultation.textParts.push({
    label: 'COMFYUI_ORCHESTRATION.md (partial)',
    content: orchestrationLines,
    size: orchestrationLines.length
  });
  console.log(`  + COMFYUI_ORCHESTRATION.md: ${orchestrationLines.length.toLocaleString()} chars`);

  console.log('\nPreparing consultation prompt...\n');

  consultation.setPrompt(`
# Task: Design LLM Reference Documentation for ComfyUI Workflow Creation

## Context

We have downloaded official ComfyUI workflow patterns from:
- comfyanonymous.github.io/ComfyUI_examples (official ComfyUI docs)
- Lightricks/ComfyUI-LTXVideo (official LTX-2 workflows)

These patterns show the canonical way to structure workflows for different models (LTX-Video, FLUX, Wan 2.1, Qwen, etc.).

## Our Goal

We want to use these official patterns as **reference documentation** that enables:

1. **LLM agents** (Claude, GPT, etc.) to understand how to construct valid workflow JSONs
2. **Other repositories** to create their own workflow templates
3. **Programmatic workflow generation** via APIs

We do NOT want to:
- Replace working implementations with "official" versions
- Prescribe one correct way to do things
- Lose flexibility for custom node packs

## Key Questions

### 1. Documentation Structure

How should we organize the reference documentation for maximum LLM usability?

Consider:
- Should patterns be in markdown, JSON, or both?
- How to structure for easy retrieval/RAG?
- How to handle model-specific variations?
- How to document node connection formats?

### 2. Pattern Abstraction

How should we abstract patterns so they're useful as templates without being prescriptive?

Consider:
- Showing the "skeleton" vs complete workflows
- Documenting required vs optional nodes
- Explaining WHY certain patterns are used
- Handling alternative approaches (e.g., KSampler vs SamplerCustom)

### 3. LLM Consumption Format

What format makes these patterns most useful for LLMs generating workflows?

Consider:
- JSON Schema definitions for validation
- Natural language descriptions alongside JSON
- Decision trees for choosing patterns
- Parameter tables with valid ranges

### 4. MCP Integration

How should the MCP server expose these patterns?

Consider:
- Query tools for finding relevant patterns
- Template generation from patterns
- Validation against patterns
- Pattern-based suggestions

### 5. Cross-Repository Usage

How can other repos use these patterns effectively?

Consider:
- Submodule inclusion
- Package distribution
- API access
- Documentation linking

## Deliverables Requested

Please provide:

1. **Recommended Documentation Architecture**
   - File structure
   - Format choices (markdown, JSON, YAML)
   - Naming conventions

2. **Pattern Template Format**
   - How to document a single workflow pattern
   - Required sections/fields
   - Example structure

3. **LLM Prompt Engineering Guide**
   - How to prompt LLMs to use these patterns
   - System prompt recommendations
   - Few-shot examples

4. **MCP Tool Design**
   - New tools or resources to expose patterns
   - Query interface design
   - Integration with existing tools

5. **Implementation Roadmap**
   - Priority order for implementation
   - Quick wins vs long-term improvements

## Output Format

Structure your response as an actionable design document with code examples where helpful.
`);

  console.log('Starting Gemini consultation...\n');
  console.log('-'.repeat(70));

  try {
    const result = await consultation.run();

    console.log('-'.repeat(70));
    console.log('\nConsultation complete!');
    console.log(`\nOutput saved to: ${result.outputPath}`);

    // Display preview
    console.log('\n' + '='.repeat(70));
    console.log('RESULT PREVIEW');
    console.log('='.repeat(70));
    console.log(result.response.substring(0, 3000) + '...\n');
    console.log(`\nFull response: ${result.response.length} characters`);
    console.log(`See full output at: ${result.outputPath}`);

  } catch (error) {
    console.error('Consultation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
