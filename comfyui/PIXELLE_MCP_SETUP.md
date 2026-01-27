# Pixelle-MCP Setup Guide

**Purpose:** Enable Claude Code to orchestrate ComfyUI as MCP tools for automated media pipelines.

**Last Updated:** January 2026

---

## Overview

Pixelle-MCP is a unified framework that:
- Converts ComfyUI workflows into MCP tools with **zero code**
- Exposes an MCP endpoint for Claude Code/Cursor/Claude Desktop
- Provides a web UI for interactive testing
- Supports multi-LLM orchestration (Claude, Gemini, Qwen, etc.)

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  Pixelle-MCP    │────▶│    ComfyUI      │
│  (MCP Client)   │     │  (Port 9004)    │     │  (Port 8188)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │  Workflow JSON  │
                        │  → MCP Tools    │
                        └─────────────────┘
```

---

## Quick Start (5 minutes)

### Prerequisites

- ComfyUI running at `http://solapsvs.taila4c432.ts.net:8188`
- Python 3.11+ with `uv` installed
- Claude API key (optional, for LLM orchestration in web UI)

### Installation

```bash
# Option 1: pip install (recommended)
pip install -U pixelle

# Option 2: uv (no install, temporary)
uvx pixelle@latest
```

### Configuration

Create `~/.pixelle/.env`:

```bash
# ComfyUI connection
COMFYUI_BASE_URL=http://solapsvs.taila4c432.ts.net:8188
COMFYUI_EXECUTOR_TYPE=http

# Service ports
HOST=localhost
PORT=9004

# Authentication (change these!)
CHAINLIT_AUTH_SECRET="your-secure-secret-here"
CHAINLIT_AUTH_ENABLED=true

# Claude API (for web UI orchestration)
CLAUDE_BASE_URL=https://api.anthropic.com
CLAUDE_API_KEY=your-claude-api-key
CLAUDE_MODELS=claude-sonnet-4-20250514
CHAINLIT_CHAT_DEFAULT_MODEL=claude-sonnet-4-20250514
```

### Start Pixelle

```bash
pixelle
```

**Services available:**
- Web UI: http://localhost:9004
- MCP Endpoint: http://localhost:9004/pixelle/mcp

---

## Claude Code Integration

### Add MCP Server to Claude Code

```bash
claude mcp add --transport http --scope user pixelle http://localhost:9004/pixelle/mcp
```

Or edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "pixelle": {
      "type": "http",
      "url": "http://localhost:9004/pixelle/mcp"
    }
  }
}
```

### Verify Connection

```bash
claude mcp list
# Should show: pixelle (http://localhost:9004/pixelle/mcp)
```

---

## Adding Workflows as MCP Tools

### Method 1: Via Web UI (Easiest)

1. Open http://localhost:9004
2. Login (default: `dev` / `dev`)
3. Paste your workflow JSON in chat
4. Pixelle auto-converts it to an MCP tool

### Method 2: Via Workflow Directory

1. Export workflow from ComfyUI as **API format** (not UI format)
2. Copy to `~/.pixelle/data/custom_workflows/`
3. Restart Pixelle (or it auto-detects)

### Workflow Parameter Syntax

In ComfyUI, set node titles using this DSL:

```
$<param_name>.[~]<field_name>[!][:<description>]
```

| Syntax | Meaning |
|--------|---------|
| `$prompt.text!` | Required param "prompt" mapped to "text" field |
| `$image.~image!:Input URL` | URL upload with description |
| `$steps.steps:Number of steps` | Optional param with description |
| `$output.result` | Mark this node as output |

**Example: Text-to-Image Tool**

In ComfyUI canvas:
1. CLIPTextEncode node → title: `$prompt.text!:Generation prompt`
2. KSampler node → title: `$seed.seed:Random seed`
3. SaveImage node → auto-detected as output

Export as API format → name it `t2i_flux.json` → copy to workflows dir.

Result: MCP tool `t2i_flux(prompt, seed)` is now available.

---

## Pre-Built Workflows

Pixelle includes ready-to-use workflows:

| Workflow | Description | Parameters |
|----------|-------------|------------|
| `t2i_by_local_flux.json` | Text-to-image with Flux | prompt, seed |
| `t2i_qwen_image.json` | Text-to-image with Qwen | prompt, negative, seed |
| `i2v_by_wan2_2.json` | Image-to-video with Wan2.2 | image, prompt, frames |
| `i2v_by_local_wan_fusionx.json` | I2V with FusionX | image, motion_prompt |
| `t2v_by_wan2_2.json` | Text-to-video with Wan2.2 | prompt, frames |
| `i_nano_banana.json` | Gemini Nano Banana | prompt, style |

Copy these to your custom workflows:

```bash
cp /path/to/pixelle/workflows/* ~/.pixelle/data/custom_workflows/
```

---

## Usage in Claude Code

Once connected, Claude can use ComfyUI tools directly:

```
User: Generate an image of a dragon breathing fire

Claude: [Calls pixelle.t2i_by_local_flux(prompt="photorealistic dragon breathing fire, dramatic lighting, 8k")]

[Returns: Generated image path]
```

### Multi-Stage Pipeline Example

```
User: Create a video from this character image

Claude:
1. [Calls pixelle.i2v_by_wan2_2(
     image="character.png",
     prompt="the character turns head slowly, cinematic motion",
     frames=121
   )]
2. [Returns: Generated video path /output/wan_00001.mp4]
```

---

## Systemd Service (Production)

Create `/etc/systemd/system/pixelle.service`:

```ini
[Unit]
Description=Pixelle MCP Server
After=network.target comfyui.service

[Service]
Type=simple
User=romancircus
WorkingDirectory=/home/romancircus
Environment="PATH=/home/romancircus/.local/bin:/usr/bin"
ExecStart=/home/romancircus/.local/bin/pixelle
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pixelle
sudo systemctl start pixelle
```

---

## Troubleshooting

### ComfyUI Connection Failed

```bash
# Test ComfyUI is reachable
curl http://solapsvs.taila4c432.ts.net:8188/system_stats
```

### Workflow Not Appearing as Tool

1. Ensure exported as **API format** (not UI format)
2. Check node titles have correct `$param` syntax
3. Restart Pixelle after adding workflows

### MCP Not Connecting

```bash
# Check Pixelle is running
curl http://localhost:9004/pixelle/mcp

# Check Claude Code MCP config
claude mcp list
```

---

## Architecture Notes

### How Workflow → MCP Tool Conversion Works

1. Pixelle scans `workflows/` directory for `.json` files
2. Parses node titles for `$param` DSL syntax
3. Generates MCP tool schema from parameters
4. On tool call:
   - Injects parameters into workflow JSON
   - POSTs to ComfyUI `/prompt` API
   - Polls `/history` for completion
   - Returns output file paths

### Supported Output Nodes

Auto-detected:
- `SaveImage` → Returns image path
- `SaveVideo` → Returns video path
- `VHS_SaveVideo` → Returns video path
- `SaveAudio` → Returns audio path

Manual: Set node title to `$output.result`

---

## Related Documentation

- [COMFYUI_ORCHESTRATION.md](./COMFYUI_ORCHESTRATION.md) - Direct API orchestration (no MCP)
- [Get_Started_ComfyUI.md](./Get_Started_ComfyUI.md) - ComfyUI basics
- [LTX Video Guide](../ltx/Get_Started_LTX.md) - Video workflows
- [Qwen Image Guide](../qwen/Get_Started_Qwen_Image.md) - Qwen workflows

---

## Links

- **Pixelle-MCP GitHub**: https://github.com/AIDC-AI/Pixelle-MCP
- **MCP Protocol**: https://modelcontextprotocol.io
- **ComfyUI API Docs**: https://docs.comfy.org
