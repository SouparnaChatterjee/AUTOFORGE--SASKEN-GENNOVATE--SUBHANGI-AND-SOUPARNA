# AutoForge — Gennovate 2026 Demo

> **GenAI-Powered ECU Software Engineering Accelerator**  
> AUTOSAR · UDS/DoIP · ADAS Regulations · ISO 26262 Safety  
> Powered by **Ollama** — fully local, zero data egress, no API key required

---

## ⚡ Quickstart

### Prerequisites (one-time installs)

1. **Python 3.10+** — https://python.org/downloads (check "Add to PATH")
2. **Node.js 18+ LTS** — https://nodejs.org
3. **Ollama** — https://ollama.com/download

### Pull a model (one-time, pick one)

```powershell
ollama pull qwen2.5-coder:7b    # recommended — best for ECU/code tasks (~4GB)
ollama pull llama3.2:3b          # fastest, smallest (~2GB)
ollama pull mistral:7b           # solid all-rounder (~4GB)
```

### Run

```powershell
# Make sure Ollama is running (it starts automatically after install)
# Then just run the single setup+launch script:
.\autoforge_ollama.ps1
```

Browser opens automatically at **http://localhost:3000**

---

## What you get

| Service | URL |
|---------|-----|
| React Dashboard | http://localhost:3000 |
| FastAPI Backend | http://localhost:8000 |
| Swagger API Docs | http://localhost:8000/docs |

---

## Switching models

```powershell
$env:AUTOFORGE_MODEL = "mistral:7b"
.\autoforge_ollama.ps1
```

Or set it permanently in Windows environment variables as `AUTOFORGE_MODEL`.

---

## Demo Script (for judges)

### 1. Diagnostic Agent — UDS Test Generation
```
Generate a Python DoIP test for 0x2E WriteDataByIdentifier with DID 0xF190 and a 500ms timeout for BCM_Variant_A
```

### 2. AUTOSAR Agent — BSW Q&A
```
What ports does the NvM module expose and how does it connect to the Fee driver in our BCM config?
```

### 3. ADAS Agent — Regulation Mapping
```
Extract AEBS highway test scenarios from UN-R152 section 5.2 for front-end collision avoidance
```

### 4. Safety Agent — HARA Draft
```
Draft a HARA table for Automatic Emergency Braking with V2X sensor fusion at highway speeds
```

Then show the **Dashboard tab** — live query counts, agent breakdown, productivity multipliers.

---

## Architecture

```
[React UI :3000]  ←→  [FastAPI :8000]  ←→  [Ollama :11434]
                            │                     │
                   4 Specialized Agents:    Local LLM Model
                   DIAG · AUTOSAR · ADAS · SAFETY
```

All queries route through smart keyword detection → correct domain expert agent → Ollama → structured response.

---

## Requirements

- Python 3.10+
- Node.js 18+ (LTS)
- Ollama with at least one model pulled

---

*AutoForge · Sasken Gennovate 2026 · GenAI for Engineering & Delivery Productivity*
