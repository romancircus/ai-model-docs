# ComfyUI LLM Reference Documentation Design
**Date**: 2026-01-28T02:25:53.610Z
**Duration**: 43.9s
**Model**: gemini-3-pro-preview
**Thinking Level**: high
**Search Grounding**: true

## Token Usage
- Prompt tokens: 17,555
- Thoughts tokens: 1,292
- Output tokens: 2,052
- Total tokens: 20,899

---

## GEMINI'S THINKING PROCESS

**LLM Reference Documentation Design: My Thinking Process**

Alright, let's break this down. My goal here is to create reference documentation that allows Large Language Models (LLMs) to construct valid ComfyUI workflow JSONs, and also assist other repos and enable programmatic generation. I need a robust, yet flexible, solution that doesn't replace existing implementations. Here's how I see it:

First, I assessed the situation. I've gathered official ComfyUI workflow patterns, like LTX-Video, FLUX, Wan 2.1, and Qwen, as my source material. The task is to give LLMs the knowledge to build workflows, and to create documentation for other people or programs to generate workflows too. I have to design a documentation system, and a method of generating new workflows. I will also build a roadmap for how I'll create this documentation.

Next, I got into the mind of an LLM. What information does an LLM *need*? Node names, input parameter types, connection logic, model-specific constraints... things that will cause the LLM to fail. Currently, LLMs stumble because they hallucinate node names, connect incompatible types, or use deprecated patterns.

The solution is an architecture. I'm thinking of splitting the documentation into high-level human-readable Markdown for context, and low-level JSON for precise specification. The `docs/reference/`, `patterns/`, and `schema/` directory structure helps organize it. The core files would be `WORKFLOW_PATTERNS.md` for human understanding, `NODE_LIBRARY.json` for a compact node definition, and `templates/*.json` for working examples. The `NODE_LIBRARY.json` is crucial for RAG performance!

How should these templates be formatted? Simply markdown is too fuzzy, while JSON alone lacks context. I'll use a hybrid "Annotated JSON" or a Markdown file containing a JSON code block with extensive commentary *outside* the code block. This has metadata, a visual flow (maybe ASCII art or Mermaid diagrams—LLMs are good with those), the core nodes and connections, and tables defining parameter rules.

Of course, the LLM will need prompting. The system prompt will enforce "Strict Node Adherence" (no invention of nodes). A Chain of Thought: "Plan the DAG -> Select Nodes -> Define Parameters -> Output JSON." I will use Few-Shot learning, and show a prompt and then a reason and the proper JSON snippet.

Then, there's the MassMediaFactory (MCP) integration. The MCP server is the bridge and needs to expose templates as resources. I will make sure the tools have `list_templates()`, `get_node_schema(node_name)`, and `validate_workflow(json)`.

The implementation roadmap is in three phases. Phase 1: Clean the JSONs, write the Markdown reference. Phase 2: Expose them via tools. Phase 3: Build a script to validate the LLM output.

During drafting, I critiqued the approach and refined the content. I realized just dumping official JSONs is bad because they are huge, and have a lot of UI data. The "Reference" JSONs must be stripped of UI data. I also need a "Node Dictionary" concept. The LLM shouldn't guess input names; it should look them up.

Finally, the output should have an introduction that acknowledges the move from copy-paste to generative understanding. I will section the output with architecture, format, prompting, MCP, and the roadmap.

Crucially, I need to make the distinction between the *Official Patterns* (the source of truth) and the *Constructed Workflows* (the output) clear. I will emphasize the difference between `SamplerCustom` and `KSampler` as a prime example of the need for this documentation.




---

## GEMINI'S RESPONSE

This design document outlines a strategy to transform raw ComfyUI workflow files into a structured, LLM-optimized knowledge base. The goal is to move from "copying files" to "understanding patterns," enabling agents to dynamically construct valid workflows.

---

# ComfyUI LLM Reference Documentation Architecture

## 1. Recommended Documentation Architecture

We will separate **Concepts (Markdown)** from **Specifications (JSON)** to optimize for RAG (Retrieval-Augmented Generation) context windows.

### File Structure
```text
docs/
├── reference/
│   ├── 01_MODEL_PATTERNS.md       # High-level architecture (Concept)
│   ├── 02_NODE_LIBRARY.md         # Compact API reference for nodes (Spec)
│   └── 03_PARAMETER_RULES.md      # Constraints (Resolution, Steps, CFG)
├── library/
│   ├── skeletons/                 # Token-optimized JSON structure blocks
│   │   ├── ltx_video_skeleton.json
│   │   ├── flux_dev_skeleton.json
│   │   └── wan_i2v_skeleton.json
│   └── full_examples/             # Complete, validating JSONs (for few-shot)
└── prompt_guides/
    └── SYSTEM_PROMPT.md           # The instruction set for the agent
```

### Format Choices
*   **Concepts:** Markdown tables (LLMs parse markdown tables very accurately).
*   **Skeletons:** Minified JSON (Stripped of UI data like `pos`, `size`, `groups` to save tokens).
*   **Node Definitions:** Pseudo-code or simplified JSON Schema.

---

## 2. Pattern Template Format

To avoid token bloat, we don't provide massive JSON files as the primary reference. Instead, we use a **"Skeleton + component"** approach.

### A. The Skeleton (JSON)
This represents the *topology* of the graph without specific values.

```json
// library/skeletons/ltx_video_skeleton.json
{
  "type": "topology",
  "model": "LTX-Video",
  "nodes": [
    {"id": "1", "type": "CheckpointLoaderSimple"},
    {"id": "2", "type": "LTXVScheduler"},
    {"id": "3", "type": "SamplerCustom"}
  ],
  "connections": [
    ["1.0", "3.model"],     // MODEL -> SamplerCustom
    ["2.0", "3.sigmas"],    // SIGMAS -> SamplerCustom
    ["3.0", "VAEDecode.samples"]
  ]
}
```

### B. The Pattern Reference (Markdown)
This explains *how* to configure the skeleton.

**File:** `01_MODEL_PATTERNS.md`

#### Pattern: LTX-Video (Text-to-Video)
**Topology Strategy:** `Separate Scheduler/Sampler` (Do not use KSampler)

**Node Configuration Table:**
| Node Class | Input Name | Required Value/Type | Reason |
|:---|:---|:---|:---|
| `LTXVScheduler` | `max_shift` | `2.05` | Model requirement |
| `LTXVScheduler` | `base_shift` | `0.95` | Model requirement |
| `EmptyLTXVLatent` | `length` | `(n * 8) + 1` | e.g., 97, 121 |
| `SamplerCustom` | `sampler` | `KSamplerSelect` (euler) | Required for video consistency |

**Critical Connection Logic:**
> ⚠️ **Warning:** Do not connect `CLIPTextEncode` directly to the Sampler. You must pass it through `LTXVConditioning` first to apply frame-rate encoding.

---

## 3. LLM Prompt Engineering Guide

To get high-quality workflows, we treat the LLM as a "ComfyUI Compiler."

### System Prompt Strategy
The prompt must enforce strict adherence to the **Input/Output Types**.

```markdown
# Role
You are an expert ComfyUI Workflow Architect. You construct JSON workflows based on official reference patterns.

# Constraints
1. **Topology Strictness**: You must use `SamplerCustom` for Video models (LTX, Wan). Never use basic `KSampler` for these.
2. **Type Safety**: Verify every connection. Do not connect `MODEL` output to `LATENT` input.
3. **Token Efficiency**: Output valid API JSON only. Do not include UI metadata (`pos`, `size`).

# Reference Lookup
1. Identify the core model requested (e.g., FLUX, LTX).
2. Retrieve the specific "Node Pattern" for that model.
3. Apply "Parameter Rules" (e.g., divide resolution by 16 for FLUX).
```

### Few-Shot Example (Mental Chain of Thought)
When prompting the LLM, force it to output a plan before the JSON:

**User:** "Create a workflow for Wan 2.1 720p video."

**Agent Thought Process:**
1.  **Select Model Pattern:** Wan 2.1 requires `WanVideoModelLoader`.
2.  **Determine Resolution:** 720p = 1280x720.
3.  **Check Divisibility:** 1280/16 = 80 (Valid), 720/16 = 45 (Valid).
4.  **Select Scheduler:** Wan uses `UniPC` via `WanSampler`.
5.  **Construct JSON:** [Generates Code]

---

## 4. MCP Tool Design

The MCP server acts as the "Standard Library" interface for the coding agent.

### New Resources
Expose the documentation files as readable resources so the LLM can "read the manual" on demand.

*   `comfy://docs/patterns/ltx` -> Returns the LTX Markdown guide.
*   `comfy://docs/patterns/flux` -> Returns the FLUX Markdown guide.

### New Tools

#### 1. `get_node_spec(node_class_name: str)`
Returns the exact inputs and output slots for a node. Solves the hallucination problem.

**Output:**
```json
{
  "class": "LTXVConditioning",
  "inputs": {
    "positive": "CONDITIONING",
    "negative": "CONDITIONING",
    "frame_rate": "FLOAT (default: 24)"
  },
  "outputs": ["CONDITIONING (positive)", "CONDITIONING (negative)"]
}
```

#### 2. `search_patterns(query: str)`
Semantic search over the `01_MODEL_PATTERNS.md` file.
*   *Query:* "How to do image to video with LTX"
*   *Result:* Returns the `Image-to-Video` section of the LTX docs.

#### 3. `validate_topology(workflow_json: str)`
A static analysis tool that checks against rules defined in `03_PARAMETER_RULES.md`.
*   *Check:* Is `EmptyLTXVLatentVideo.length` == `8n+1`?
*   *Check:* Is `CLIPTextEncode` connected to `LTXVConditioning`?
*   *Output:* `PASS` or `FAIL: Frame count 100 is invalid. Use 97 or 105.`

---

## 5. Implementation Roadmap

### Phase 1: Knowledge Base Extraction (Immediate)
1.  Convert the `TEXT FILES` provided in the prompt into `docs/reference/01_MODEL_PATTERNS.md`.
2.  Create `docs/reference/03_PARAMETER_RULES.md` extracting the tables (Resolution Rules, Frame Count Rules).
3.  Create the `library/skeletons/` directory and populate it with "clean" versions of the workflows (no UI data).

### Phase 2: MCP "Read" Access (Short Term)
1.  Update `massmedia_server.py` to expose the `docs/` folder as MCP resources.
2.  Implement `get_node_spec` tool (can be backed by a static `nodes.json` dictionary initially).

### Phase 3: Validation Logic (Medium Term)
1.  Write a Python script that parses a generated JSON and checks specific keys against `PARAMETER_RULES.md`.
2.  Expose this script as the `validate_topology` MCP tool.

### Phase 4: Dynamic Generation (Long Term)
1.  Create a "Meta-Template" system where the MCP can accept high-level params (Prompt, Resolution) and inject them into the skeletons server-side, ensuring perfect JSON syntax.

## Why This Design?
*   **Decoupling:** If ComfyUI updates a node, we update `NODE_LIBRARY.md`. The LLM logic remains the same.
*   **Safety:** The `validate_topology` tool acts as a unit test for the LLM's output.
*   **Efficiency:** We don't feed the LLM 500kb of JSON files; we feed it concise rules and skeletons.
