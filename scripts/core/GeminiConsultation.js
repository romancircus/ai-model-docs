/**
 * GeminiConsultation - Unified consultation framework for Gemini 3.0
 *
 * PATTERN: All consultations follow the same flow:
 * 1. Load context (files, images, code, JSON, notebooks)
 * 2. Build consultation prompt
 * 3. Send to Gemini (text or vision)
 * 4. Save and display response
 *
 * GEMINI 3.0 THINKING MODE:
 * - Default model: gemini-3-pro-preview
 * - Uses thinkingLevel: "low", "medium", "high"
 * - includeThoughts: true to see the model's reasoning process
 *
 * Adapted from KDH-Automation for ai-model-docs repository
 */

import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gemini 3.0 Thinking Levels
 */
export const THINKING_LEVELS = {
  LOW: 'low',      // Quick responses, minimal reasoning
  MEDIUM: 'medium', // Balanced reasoning and speed
  HIGH: 'high'     // Deep reasoning for architecture decisions
};

/**
 * Model presets - Gemini 3.0 is default
 */
export const MODELS = {
  // Gemini 3.0 (DEFAULT)
  GEMINI_3_PRO: 'gemini-3-pro-preview',
  GEMINI_3_PRO_IMAGE: 'gemini-3-pro-image-preview',

  // Fast models (for simple tasks)
  FLASH_2_5: 'gemini-2.5-flash',
  FLASH_2_0: 'gemini-2.0-flash'
};

// Default model for all consultations
export const DEFAULT_MODEL = MODELS.GEMINI_3_PRO;

/**
 * Extract content from Jupyter notebook
 * STANDING ORDER #2: Always extract actual notebook content, never embed summaries
 *
 * @param {string} notebookPath - Path to .ipynb file
 * @returns {string} Extracted markdown + code content
 */
export async function extractNotebookContent(notebookPath) {
  const content = await fs.readFile(notebookPath, 'utf-8');
  const notebook = JSON.parse(content);

  const sections = [];

  for (const cell of notebook.cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

    // Skip empty cells
    if (!source || source.trim().length === 0) continue;

    // Skip license/copyright boilerplate
    if (source.includes('Apache License') || source.includes('Copyright')) continue;

    if (cell.cell_type === 'markdown') {
      sections.push(source);
    } else if (cell.cell_type === 'code') {
      // Include code that demonstrates prompts or API usage
      if (
        source.includes('prompt =') ||
        source.includes('client.models.generate') ||
        source.includes('def ') ||
        source.includes('class ') ||
        source.includes('fal.subscribe') ||
        source.includes('generate_videos')
      ) {
        sections.push('```python\n' + source + '\n```');
      }
    }
  }

  return sections.join('\n\n');
}

/**
 * Consultation builder with fluent interface
 */
export class GeminiConsultation {
  constructor(options = {}) {
    this.title = options.title || 'Gemini Consultation';
    this.model = options.model || DEFAULT_MODEL;
    this.outputDir = options.outputDir || path.resolve(__dirname, '../../output/consultations');

    // Gemini 3.0 Thinking Mode configuration
    this.thinkingLevel = options.thinkingLevel ?? THINKING_LEVELS.HIGH;
    this.includeThoughts = options.includeThoughts ?? true;

    // Enable search grounding
    this.useSearchGrounding = options.useSearchGrounding ?? false;

    this.textParts = [];
    this.imageParts = [];
    this.codeParts = [];
    this.jsonParts = [];
    this.notebookParts = [];

    this.promptTemplate = null;
    this.client = null;
  }

  /**
   * Set thinking level for Gemini 3.0
   * @param {string} level - 'low', 'medium', or 'high'
   * @param {boolean} includeThoughts - Whether to include thinking in response
   */
  setThinkingLevel(level, includeThoughts = null) {
    const validLevels = ['low', 'medium', 'high'];
    if (validLevels.includes(level.toLowerCase())) {
      this.thinkingLevel = level.toLowerCase();
    }
    if (includeThoughts !== null) {
      this.includeThoughts = includeThoughts;
    }
    return this;
  }

  /**
   * Enable search grounding for real-time information
   */
  enableSearchGrounding() {
    this.useSearchGrounding = true;
    return this;
  }

  /**
   * Initialize with API key (from environment variable)
   */
  async initialize() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Try to load from .env.local as fallback
      try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        const envContent = await fs.readFile(envPath, 'utf-8');
        const match = envContent.match(/GEMINI_API_KEY=(.+)/);
        if (match) {
          this.client = new GoogleGenAI({ apiKey: match[1] });
          return this;
        }
      } catch (e) {
        // .env.local not found, continue to error
      }
      throw new Error('GEMINI_API_KEY not found in environment or .env.local');
    }

    this.client = new GoogleGenAI({ apiKey });
    return this;
  }

  /**
   * Add text file to context
   * @param {string} label - Display label
   * @param {string} filePath - Absolute path to text file
   */
  async addTextFile(label, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    this.textParts.push({
      label,
      content,
      size: content.length
    });
    console.log(`  + ${label}: ${content.length.toLocaleString()} chars`);
    return this;
  }

  /**
   * Add Jupyter notebook content (extracted, not raw)
   * STANDING ORDER #2 compliant
   * @param {string} label - Display label
   * @param {string} notebookPath - Path to .ipynb file
   */
  async addNotebook(label, notebookPath) {
    const content = await extractNotebookContent(notebookPath);
    this.notebookParts.push({
      label,
      content,
      path: notebookPath,
      size: content.length
    });
    console.log(`  + ${label}: ${content.length.toLocaleString()} chars (notebook extracted)`);
    return this;
  }

  /**
   * Add image file to context
   * @param {string} label - Display label
   * @param {string} filePath - Absolute path to image file
   */
  async addImageFile(label, filePath) {
    const buffer = await fs.readFile(filePath);
    this.imageParts.push({
      label,
      buffer,
      path: filePath,
      size: buffer.length
    });
    console.log(`  + ${label}: ${(buffer.length / 1024).toFixed(0)}KB`);
    return this;
  }

  /**
   * Add code file to context
   * @param {string} label - Display label
   * @param {string} filePath - Absolute path to code file
   */
  async addCodeFile(label, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const langMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.md': 'markdown',
      '.json': 'json'
    };
    this.codeParts.push({
      label,
      content,
      path: filePath,
      language: langMap[ext] || 'text',
      size: content.length
    });
    console.log(`  + ${label}: ${content.length.toLocaleString()} chars`);
    return this;
  }

  /**
   * Add JSON file to context
   * @param {string} label - Display label
   * @param {string} filePath - Absolute path to JSON file
   */
  async addJSONFile(label, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    this.jsonParts.push({
      label,
      content,
      parsed,
      path: filePath,
      size: content.length
    });
    console.log(`  + ${label}: ${Object.keys(parsed).length} keys`);
    return this;
  }

  /**
   * Add raw text content directly
   * @param {string} label - Display label
   * @param {string} content - Text content
   */
  addText(label, content) {
    this.textParts.push({
      label,
      content,
      size: content.length
    });
    return this;
  }

  /**
   * Set the consultation prompt template
   * @param {string|Function} template - Markdown template or function that returns template
   */
  setPrompt(template) {
    this.promptTemplate = template;
    return this;
  }

  /**
   * Build the full consultation payload
   * @returns {Array} Parts array for Gemini API
   */
  buildPayload() {
    const parts = [];

    // Add images first (highest priority for vision models)
    this.imageParts.forEach((img, idx) => {
      parts.push({
        text: `## IMAGE ${idx + 1} - ${img.label}:`
      });
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: img.buffer.toString('base64')
        }
      });
    });

    // Build prompt text from template
    const context = {
      textFiles: this.textParts,
      codeFiles: this.codeParts,
      jsonFiles: this.jsonParts,
      imageFiles: this.imageParts,
      notebookFiles: this.notebookParts
    };

    const promptText = typeof this.promptTemplate === 'function'
      ? this.promptTemplate(context)
      : this.buildDefaultPrompt(context);

    parts.push({ text: promptText });

    return parts;
  }

  /**
   * Build default prompt from all loaded context
   */
  buildDefaultPrompt(context) {
    let prompt = `# ${this.title}\n\n`;

    // Add notebook files (extracted content)
    if (context.notebookFiles.length > 0) {
      prompt += `## REFERENCE NOTEBOOKS (Extracted Content)\n\n`;
      context.notebookFiles.forEach(file => {
        prompt += `### ${file.label}\n${file.content}\n\n`;
      });
    }

    // Add text files
    if (context.textFiles.length > 0) {
      prompt += `## TEXT FILES\n\n`;
      context.textFiles.forEach(file => {
        prompt += `### ${file.label}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      });
    }

    // Add code files
    if (context.codeFiles.length > 0) {
      prompt += `## CODE FILES\n\n`;
      context.codeFiles.forEach(file => {
        prompt += `### ${file.label}\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
      });
    }

    // Add JSON files
    if (context.jsonFiles.length > 0) {
      prompt += `## JSON FILES\n\n`;
      context.jsonFiles.forEach(file => {
        prompt += `### ${file.label}\n\`\`\`json\n${JSON.stringify(file.parsed, null, 2)}\n\`\`\`\n\n`;
      });
    }

    // Add custom prompt template if provided
    if (typeof this.promptTemplate === 'string') {
      prompt += `\n---\n\n${this.promptTemplate}\n`;
    }

    return prompt;
  }

  /**
   * Build generation config for Gemini 3.0 thinking mode
   */
  buildGenerationConfig() {
    // Flash models don't support thinking_level
    if (this.model.includes('flash')) {
      return this.useSearchGrounding ? { tools: [{ google_search: {} }] } : {};
    }

    const config = {
      thinkingConfig: {
        thinkingLevel: this.thinkingLevel
      }
    };

    if (this.includeThoughts) {
      config.thinkingConfig.includeThoughts = true;
    }

    if (this.useSearchGrounding) {
      config.tools = [{ google_search: {} }];
    }

    return config;
  }

  /**
   * Run the consultation
   * @returns {Object} { response, thoughts, duration, outputPath, usage }
   */
  async run() {
    if (!this.client) {
      await this.initialize();
    }

    console.log('\n' + '='.repeat(80));
    console.log(`  ${this.title.toUpperCase()}`);
    console.log('='.repeat(80) + '\n');

    console.log(`  Model: ${this.model}`);
    console.log(`  Thinking Level: ${this.thinkingLevel.toUpperCase()}`);
    console.log(`  Include Thoughts: ${this.includeThoughts ? 'YES' : 'NO'}`);
    console.log(`  Search Grounding: ${this.useSearchGrounding ? 'YES' : 'NO'}\n`);

    console.log('Building payload...');
    const parts = this.buildPayload();
    const totalChars = this.textParts.reduce((sum, p) => sum + p.size, 0) +
                       this.codeParts.reduce((sum, p) => sum + p.size, 0) +
                       this.notebookParts.reduce((sum, p) => sum + p.size, 0);
    console.log(`  Payload: ${this.imageParts.length} images, ${parts.length} parts, ~${totalChars.toLocaleString()} chars\n`);

    console.log('='.repeat(80));
    console.log(`  Sending to ${this.model}...`);
    console.log('='.repeat(80) + '\n');

    const startTime = Date.now();

    const requestConfig = {
      model: this.model,
      contents: [{ role: 'user', parts }],
      config: this.buildGenerationConfig()
    };

    const response = await this.client.models.generateContent(requestConfig);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Response received in ${duration}s\n`);

    // Extract response text and thoughts
    let responseText = '';
    let thoughtsText = null;

    for (const part of response.candidates[0].content.parts) {
      if (part.thought) {
        thoughtsText = part.text;
      } else if (part.text) {
        responseText = part.text;
      }
    }

    // Extract usage metadata
    const usage = response.usageMetadata || {};

    // Save to output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const outputPath = path.join(this.outputDir, `${slug}-${timestamp}.md`);

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    let fullOutput = `# ${this.title}
**Date**: ${new Date().toISOString()}
**Duration**: ${duration}s
**Model**: ${this.model}
**Thinking Level**: ${this.thinkingLevel}
**Search Grounding**: ${this.useSearchGrounding}

## Token Usage
- Prompt tokens: ${usage.promptTokenCount?.toLocaleString() || 'N/A'}
- Thoughts tokens: ${usage.thoughtsTokenCount?.toLocaleString() || '0'}
- Output tokens: ${usage.candidatesTokenCount?.toLocaleString() || 'N/A'}
- Total tokens: ${usage.totalTokenCount?.toLocaleString() || 'N/A'}

---
`;

    if (thoughtsText) {
      fullOutput += `
## GEMINI'S THINKING PROCESS

${thoughtsText}

---
`;
    }

    fullOutput += `
## GEMINI'S RESPONSE

${responseText}
`;

    await fs.writeFile(outputPath, fullOutput, 'utf-8');

    console.log('='.repeat(80));
    console.log('  GEMINI\'S RESPONSE:');
    console.log('='.repeat(80) + '\n');
    console.log(responseText.slice(0, 3000) + (responseText.length > 3000 ? '\n\n... [truncated]' : ''));

    if (usage.thoughtsTokenCount) {
      console.log('\n' + '-'.repeat(40));
      console.log(`  Thinking tokens used: ${usage.thoughtsTokenCount.toLocaleString()}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`  Saved to: ${outputPath}`);
    console.log('='.repeat(80) + '\n');

    return {
      response: responseText,
      thoughts: thoughtsText,
      duration: parseFloat(duration),
      outputPath,
      usage
    };
  }

  /**
   * Run with retry logic
   */
  async runWithRetry(maxRetries = 3, delayMs = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.run();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`\n Attempt ${attempt} failed: ${error.message}`);
        console.log(`  Retrying in ${delayMs / 1000}s...\n`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
}

/**
 * Quick consultation helper
 */
export async function quickConsult(question, context = {}) {
  const consultation = new GeminiConsultation({
    title: 'Quick Consultation',
    model: context.model || DEFAULT_MODEL,
    thinkingLevel: context.thinkingLevel || THINKING_LEVELS.HIGH
  });

  await consultation.initialize();

  if (context.notebooks) {
    for (const [label, path] of Object.entries(context.notebooks)) {
      await consultation.addNotebook(label, path);
    }
  }

  if (context.text) {
    for (const [label, textPath] of Object.entries(context.text)) {
      await consultation.addTextFile(label, textPath);
    }
  }

  consultation.setPrompt(question);

  return await consultation.run();
}

/**
 * Deep thinking consultation helper - uses HIGH thinking level
 */
export async function deepThink(question, context = {}) {
  return quickConsult(question, {
    ...context,
    thinkingLevel: THINKING_LEVELS.HIGH,
    model: MODELS.GEMINI_3_PRO
  });
}

export default GeminiConsultation;
