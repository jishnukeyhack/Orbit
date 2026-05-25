#!/usr/bin/env python3
"""
Orbit Agent Python Sidecar
FastAPI server that powers heavy compute: code execution, data analysis, web search
Run with: python agents/agent_server.py
Listens on port 8000
"""
import subprocess
import tempfile
import os
import sys
import json
import time
import traceback
from pathlib import Path
from typing import Optional

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("Installing dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn", "openai", "requests", "pydantic"], check=True)
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn

app = FastAPI(title="Orbit Agent Sidecar", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_ROOT = Path(__file__).parent.parent / "project-orbit-app" / "orbit-workspace"
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)

# ── Load OpenAI key from .env.local ──────────────────────────────────────────
def load_env():
    env_path = Path(__file__).parent.parent / "project-orbit-app" / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

load_env()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ── Models ───────────────────────────────────────────────────────────────────

class CodeExecRequest(BaseModel):
    code: str
    language: str = "python"
    timeout: int = 30
    working_dir: Optional[str] = None

class AgentRequest(BaseModel):
    task: str
    system_prompt: str = ""
    agent_id: str = "python-agent"
    tools: list = []

class WebSearchRequest(BaseModel):
    query: str
    num_results: int = 5

class AnalyzeRequest(BaseModel):
    content: str
    question: str
    model: str = "gpt-4o"

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "running",
        "openai_configured": bool(OPENAI_API_KEY),
        "workspace": str(WORKSPACE_ROOT),
        "python_version": sys.version,
    }


@app.post("/run-code")
def run_code(req: CodeExecRequest):
    """Execute Python or shell code safely in a subprocess."""
    start = time.time()
    
    work_dir = str(WORKSPACE_ROOT / "code-exec")
    Path(work_dir).mkdir(parents=True, exist_ok=True)
    
    if req.language in ("python", "py"):
        with tempfile.NamedTemporaryFile(suffix=".py", dir=work_dir, mode="w", delete=False) as f:
            f.write(req.code)
            tmp_path = f.name
        try:
            result = subprocess.run(
                [sys.executable, tmp_path],
                capture_output=True, text=True,
                timeout=req.timeout,
                cwd=work_dir,
                env={**os.environ, "PYTHONPATH": work_dir},
            )
            return {
                "stdout": result.stdout[:8000],
                "stderr": result.stderr[:2000],
                "returncode": result.returncode,
                "duration_ms": int((time.time() - start) * 1000),
                "success": result.returncode == 0,
            }
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": f"Timeout after {req.timeout}s", "returncode": -1, "success": False}
        except Exception as e:
            return {"stdout": "", "stderr": str(e), "returncode": -1, "success": False}
        finally:
            try: os.unlink(tmp_path)
            except: pass
    
    elif req.language in ("bash", "sh", "shell", "cmd", "powershell"):
        try:
            shell_cmd = req.code
            result = subprocess.run(
                shell_cmd,
                capture_output=True, text=True,
                timeout=req.timeout,
                cwd=work_dir,
                shell=True,
            )
            return {
                "stdout": result.stdout[:8000],
                "stderr": result.stderr[:2000],
                "returncode": result.returncode,
                "duration_ms": int((time.time() - start) * 1000),
                "success": result.returncode == 0,
            }
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": f"Timeout after {req.timeout}s", "returncode": -1, "success": False}
        except Exception as e:
            return {"stdout": "", "stderr": str(e), "returncode": -1, "success": False}
    
    else:
        raise HTTPException(400, f"Unsupported language: {req.language}")


@app.post("/analyze")
def analyze_content(req: AnalyzeRequest):
    """Analyze text content using GPT-4o."""
    if not OPENAI_API_KEY:
        raise HTTPException(500, "OPENAI_API_KEY not configured")
    
    try:
        import urllib.request
        import urllib.error
        
        payload = json.dumps({
            "model": req.model,
            "messages": [
                {"role": "system", "content": "You are an expert analyst. Provide thorough, data-driven analysis with specific numbers, actionable recommendations, and concrete next steps."},
                {"role": "user", "content": f"Content to analyze:\n\n{req.content}\n\nQuestion: {req.question}"}
            ],
            "temperature": 0.3,
            "max_tokens": 4096,
        }).encode()
        
        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        
        with urllib.request.urlopen(request, timeout=60) as resp:
            data = json.loads(resp.read())
        
        return {
            "analysis": data["choices"][0]["message"]["content"],
            "tokens": data.get("usage", {}).get("total_tokens", 0),
            "model": req.model,
        }
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@app.post("/web-search")
def web_search(req: WebSearchRequest):
    """Search the web using DuckDuckGo."""
    try:
        import urllib.request
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(req.query)}&format=json&no_html=1&skip_disambig=1"
        
        import urllib.parse
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(req.query)}&format=json&no_html=1"
        
        request = urllib.request.Request(url, headers={"User-Agent": "Orbit-Agent/2.0"})
        with urllib.request.urlopen(request, timeout=10) as resp:
            data = json.loads(resp.read())
        
        results = []
        if data.get("AbstractText"):
            results.append({"title": data.get("Heading", "Summary"), "snippet": data["AbstractText"], "url": data.get("AbstractURL", "")})
        
        for topic in data.get("RelatedTopics", [])[:req.num_results]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append({
                    "title": topic.get("Text", "")[:80],
                    "snippet": topic.get("Text", ""),
                    "url": topic.get("FirstURL", ""),
                })
        
        return {"query": req.query, "results": results[:req.num_results]}
    except Exception as e:
        return {"query": req.query, "results": [], "error": str(e)}


@app.post("/run-agent")
def run_agent_task(req: AgentRequest):
    """Full ReAct agent loop using GPT-4o with Python tool execution."""
    if not OPENAI_API_KEY:
        raise HTTPException(500, "OPENAI_API_KEY not configured")
    
    start = time.time()
    
    import urllib.request
    
    system_prompt = req.system_prompt or """You are an expert AI agent with access to Python code execution.
You can analyze data, build tools, run calculations, and produce complete deliverables.
Always produce working, tested code with real results."""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.task},
    ]
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "run_python",
                "description": "Execute Python code and return stdout/stderr output",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "description": "Python code to execute"},
                    },
                    "required": ["code"],
                },
            },
        }
    ]
    
    full_output = ""
    tool_calls_made = []
    total_tokens = 0
    
    for turn in range(8):
        payload = json.dumps({
            "model": "gpt-4o",
            "messages": messages,
            "tools": tools,
            "tool_choice": "auto",
            "temperature": 0.2,
            "max_tokens": 4096,
        }).encode()
        
        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        
        try:
            with urllib.request.urlopen(request, timeout=60) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            raise HTTPException(500, f"OpenAI call failed: {str(e)}")
        
        total_tokens += data.get("usage", {}).get("total_tokens", 0)
        choice = data["choices"][0]
        msg = choice["message"]
        messages.append(msg)
        
        if msg.get("tool_calls"):
            for tc in msg["tool_calls"]:
                args = json.loads(tc["function"]["arguments"])
                tool_name = tc["function"]["name"]
                
                if tool_name == "run_python":
                    code = args.get("code", "")
                    result = run_code(CodeExecRequest(code=code, language="python"))
                    tool_result = result.get("stdout", "") + (f"\n[stderr]: {result['stderr']}" if result.get("stderr") else "")
                    if not tool_result:
                        tool_result = "(no output)"
                    
                    tool_calls_made.append({"tool": tool_name, "result_preview": tool_result[:200]})
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": tool_result[:8000],
                    })
        else:
            full_output = msg.get("content", "")
            break
    
    return {
        "output": full_output,
        "tool_calls": tool_calls_made,
        "total_tokens": total_tokens,
        "duration_ms": int((time.time() - start) * 1000),
        "agent_id": req.agent_id,
    }


if __name__ == "__main__":
    print("=" * 60)
    print("  Orbit Agent Python Sidecar v2.0")
    print(f"  Workspace: {WORKSPACE_ROOT}")
    print(f"  OpenAI: {'✓ Configured' if OPENAI_API_KEY else '✗ Missing API Key'}")
    print("  Listening on http://localhost:8000")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
