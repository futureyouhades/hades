# HADES AI ARCHITECTURE

Version: 1.0

Status: Active

---

# Vision

Hades AI is not a chatbot.

Hades is a modular Personal AI Operating System designed to evolve for many years.

Every component must be replaceable, scalable and independent.

The system must always choose the best available AI model, tool and workflow automatically.

---

# Core Principles

- Modular architecture
- AI-first design
- Long-term memory
- Multi-agent system
- Best model selection
- Automation first
- Security by design
- Continuous evolution

---

# High Level Architecture

User

↓

Open WebUI

↓

Hades Commander

↓

Model Router

↓

Memory Engine

↓

Agent Manager

↓

Executors

↓

External Services

---

# Main Modules

## Commander

Main brain of Hades.

Responsibilities:

- Understand user intent
- Plan tasks
- Decide which AI to use
- Decide when to save memory
- Decide when to recall memory
- Coordinate all agents
- Build execution plans

Commander never performs specialized work directly.

Commander delegates.

---

## Memory Engine

Responsibilities:

- Long-term memory
- Semantic search
- Embeddings
- Memory ranking
- Knowledge retrieval
- Memory updates

Backend:

- Qdrant
- Ollama Embeddings

---
## Model Router

Responsibilities:

- Select the best AI model for every task
- Optimize cost and performance
- Route requests automatically
- Support local and cloud models
- Allow future model integrations

Supported Models:

- Ollama
- Claude
- OpenAI
- Gemini
- DeepSeek
- Future models

---

## Agent Manager

Responsibilities:

- Register agents
- Start agents
- Stop agents
- Coordinate communication
- Monitor health
- Delegate work

Current Agents:

- Commander
- AI Engineer
- Programmer
- Finance
- Business
- Research
- Social Media
- FutureYou

---

## Design Rules

Every module must be:

- Independent
- Replaceable
- Testable
- Well documented

No module should depend directly on another module unless required.

Commander is always the orchestrator.
