# SYSTEM ARCHITECTURE

## 1. AGENT SWARM (GRAPH-BASED)
The system operates as a directed graph of specialists centered around the **Elite Master**.

- **Teams**: Research (Oracle-led), Audit (Sentinel-led), SEO/Growth, Development, DevOps.
- **Engine**: `AgentGraphEngine` (engine.ts)
- **Routing**: Decisions are made via `graph/agents.graph.json` relationship mapping.

## 2. MEMORY LAYERS
Agents must synchronize state across three layers:
- **Short-term (Episodic)**: Immediate session history and tool outputs.
- **Long-term (Semantic)**: Factual standards (Astro 6, Tailwind 4).
- **Project Memory**: Persistent state in `.agent/memory/PROJECT_MEMORY.md`.

## 3. AGENT COORDINATION
- **Delegation**: Leaders (e.g., Astro Oracle) manage membership and result aggregation.
- **Context Object**: Every task carries a JSON context for risk allowance and project health.
- **Verification**: Cross-agent auditing (e.g., SEO validates Content Crafter).
