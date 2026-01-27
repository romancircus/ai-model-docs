#!/usr/bin/env python3
"""
ComfyUI Dynamic MCP Server

Exposes low-level ComfyUI primitives so Claude can:
1. Discover available models and nodes
2. Build workflows dynamically
3. Execute and retrieve outputs

Usage:
    claude mcp add --transport stdio --scope user comfyui-dynamic \
        -- python ~/Applications/ai-model-docs/comfyui/comfyui_dynamic_mcp.py
"""

import json
import os
import time
import urllib.request
import urllib.error
from typing import Any

# MCP SDK
try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("Install: pip install mcp")
    exit(1)

# Configuration
COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://solapsvs.taila4c432.ts.net:8188")

mcp = FastMCP("comfyui-dynamic")


def _request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    """Make request to ComfyUI API."""
    url = f"{COMFYUI_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)

    if data:
        req.data = json.dumps(data).encode()
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.URLError as e:
        return {"error": str(e)}


@mcp.tool()
def list_checkpoints() -> dict:
    """
    List all available checkpoint models in ComfyUI.
    Returns model filenames that can be used with CheckpointLoaderSimple or UNETLoader.
    """
    result = _request("/object_info/CheckpointLoaderSimple")
    if "error" in result:
        return result

    try:
        models = result["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
        return {"checkpoints": models}
    except (KeyError, IndexError):
        return {"checkpoints": [], "note": "Could not parse checkpoint list"}


@mcp.tool()
def list_loras() -> dict:
    """
    List all available LoRA models in ComfyUI.
    Returns LoRA filenames for use with LoraLoader node.
    """
    result = _request("/object_info/LoraLoader")
    if "error" in result:
        return result

    try:
        loras = result["LoraLoader"]["input"]["required"]["lora_name"][0]
        return {"loras": loras}
    except (KeyError, IndexError):
        return {"loras": [], "note": "Could not parse LoRA list"}


@mcp.tool()
def list_vaes() -> dict:
    """
    List all available VAE models in ComfyUI.
    """
    result = _request("/object_info/VAELoader")
    if "error" in result:
        return result

    try:
        vaes = result["VAELoader"]["input"]["required"]["vae_name"][0]
        return {"vaes": vaes}
    except (KeyError, IndexError):
        return {"vaes": [], "note": "Could not parse VAE list"}


@mcp.tool()
def get_node_info(node_type: str) -> dict:
    """
    Get detailed information about a specific ComfyUI node type.

    Args:
        node_type: The node class name (e.g., "KSampler", "CLIPTextEncode", "UNETLoader")

    Returns:
        Node schema including inputs, outputs, and their types.
    """
    result = _request(f"/object_info/{node_type}")
    if "error" in result:
        return result

    if node_type not in result:
        return {"error": f"Node type '{node_type}' not found"}

    node = result[node_type]
    return {
        "name": node_type,
        "category": node.get("category", "unknown"),
        "description": node.get("description", ""),
        "inputs": node.get("input", {}),
        "outputs": node.get("output", []),
        "output_names": node.get("output_name", [])
    }


@mcp.tool()
def search_nodes(query: str) -> dict:
    """
    Search for ComfyUI nodes by name or category.

    Args:
        query: Search term (e.g., "sampler", "image", "video", "flux")

    Returns:
        List of matching node types.
    """
    result = _request("/object_info")
    if "error" in result:
        return result

    query_lower = query.lower()
    matches = []

    for node_name, node_info in result.items():
        if query_lower in node_name.lower():
            matches.append({
                "name": node_name,
                "category": node_info.get("category", "unknown")
            })
        elif query_lower in node_info.get("category", "").lower():
            matches.append({
                "name": node_name,
                "category": node_info.get("category", "unknown")
            })

    return {"matches": matches[:50], "total": len(matches)}


@mcp.tool()
def execute_workflow(workflow: dict, client_id: str = "claude-agent") -> dict:
    """
    Execute a ComfyUI workflow and return the prompt_id.

    Args:
        workflow: The workflow JSON object with node definitions.
                  Each key is a node ID, value is {"class_type": "...", "inputs": {...}}
        client_id: Optional client identifier for tracking.

    Returns:
        prompt_id for polling results, or error message.

    Example workflow:
        {
            "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "model.safetensors"}},
            "2": {"class_type": "CLIPTextEncode", "inputs": {"text": "a cat", "clip": ["1", 1]}},
            ...
        }
    """
    payload = {"prompt": workflow, "client_id": client_id}
    result = _request("/prompt", method="POST", data=payload)

    if "error" in result:
        return result

    return {
        "prompt_id": result.get("prompt_id"),
        "queue_position": result.get("number"),
        "status": "queued"
    }


@mcp.tool()
def get_workflow_status(prompt_id: str) -> dict:
    """
    Check the status of a queued/running workflow.

    Args:
        prompt_id: The prompt_id returned from execute_workflow.

    Returns:
        Status (queued/running/completed/error) and outputs if completed.
    """
    result = _request(f"/history/{prompt_id}")

    if "error" in result:
        return result

    if prompt_id not in result:
        # Check if still in queue
        queue = _request("/queue")
        running = queue.get("queue_running", [])
        pending = queue.get("queue_pending", [])

        for item in running:
            if item[1] == prompt_id:
                return {"status": "running", "prompt_id": prompt_id}

        for item in pending:
            if item[1] == prompt_id:
                return {"status": "queued", "prompt_id": prompt_id}

        return {"status": "unknown", "prompt_id": prompt_id}

    entry = result[prompt_id]

    # Check for error
    if entry.get("status", {}).get("status_str") == "error":
        return {
            "status": "error",
            "prompt_id": prompt_id,
            "error": entry["status"].get("messages", [])
        }

    # Check for outputs
    if "outputs" in entry:
        outputs = []
        for node_id, output in entry["outputs"].items():
            for key in ["images", "video", "videos", "gifs", "audio"]:
                if key in output:
                    for item in output[key]:
                        outputs.append({
                            "type": key,
                            "filename": item.get("filename"),
                            "subfolder": item.get("subfolder", ""),
                            "node_id": node_id
                        })

        return {
            "status": "completed",
            "prompt_id": prompt_id,
            "outputs": outputs
        }

    return {"status": "running", "prompt_id": prompt_id}


@mcp.tool()
def wait_for_completion(prompt_id: str, timeout_seconds: int = 300) -> dict:
    """
    Wait for a workflow to complete and return outputs.

    Args:
        prompt_id: The prompt_id to wait for.
        timeout_seconds: Maximum time to wait (default 300s / 5 minutes).

    Returns:
        Final status and output files.
    """
    start = time.time()

    while time.time() - start < timeout_seconds:
        status = get_workflow_status(prompt_id)

        if status["status"] in ["completed", "error"]:
            return status

        time.sleep(2)

    return {"status": "timeout", "prompt_id": prompt_id}


@mcp.tool()
def get_system_stats() -> dict:
    """
    Get ComfyUI system statistics including VRAM usage.
    """
    return _request("/system_stats")


@mcp.tool()
def free_memory(unload_models: bool = False) -> dict:
    """
    Free GPU memory in ComfyUI.

    Args:
        unload_models: If True, also unload all loaded models.
    """
    return _request("/free", method="POST", data={
        "free_memory": True,
        "unload_models": unload_models
    })


@mcp.tool()
def interrupt() -> dict:
    """
    Interrupt the currently running workflow.
    """
    return _request("/interrupt", method="POST")


# Provide workflow templates as resources
@mcp.resource("template://flux-txt2img")
def flux_txt2img_template() -> str:
    """Flux text-to-image workflow template."""
    template = {
        "1": {
            "class_type": "UNETLoader",
            "inputs": {"unet_name": "{{MODEL}}", "weight_dtype": "default"}
        },
        "2": {
            "class_type": "DualCLIPLoader",
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5xxl_fp16.safetensors",
                "type": "flux"
            }
        },
        "3": {
            "class_type": "VAELoader",
            "inputs": {"vae_name": "ae.safetensors"}
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["2", 0], "text": "{{PROMPT}}"}
        },
        "5": {
            "class_type": "FluxGuidance",
            "inputs": {"conditioning": ["4", 0], "guidance": 3.5}
        },
        "6": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
        },
        "7": {
            "class_type": "KSamplerSelect",
            "inputs": {"sampler_name": "euler"}
        },
        "8": {
            "class_type": "BasicScheduler",
            "inputs": {"model": ["1", 0], "scheduler": "simple", "steps": 20, "denoise": 1.0}
        },
        "9": {
            "class_type": "RandomNoise",
            "inputs": {"noise_seed": "{{SEED}}"}
        },
        "10": {
            "class_type": "BasicGuider",
            "inputs": {"model": ["1", 0], "conditioning": ["5", 0]}
        },
        "11": {
            "class_type": "SamplerCustomAdvanced",
            "inputs": {
                "noise": ["9", 0],
                "guider": ["10", 0],
                "sampler": ["7", 0],
                "sigmas": ["8", 0],
                "latent_image": ["6", 0]
            }
        },
        "12": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["11", 0], "vae": ["3", 0]}
        },
        "13": {
            "class_type": "SaveImage",
            "inputs": {"images": ["12", 0], "filename_prefix": "flux_output"}
        }
    }
    return json.dumps(template, indent=2)


if __name__ == "__main__":
    mcp.run()
