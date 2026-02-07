---
description: Perform a high-confidence Elite Audit (Lighthouse + Visual + Compliance)
---

# Elite Audit Workflow

This workflow executes a multi-agent architectural and security audit of the repository.

1. **Initialize Audit Team**
    - Leader: `elite-core`
    - Members: `sentinel-auditor`, `astro-oracle`, `vulnerability-scanner`, `google-developer-knowledge`

2. **External Knowledge Gathering**
    - Search Google Developer Knowledge for "Agentic Design Patterns 2026".
    - Query Astro Docs via MCP for "Astro 6 Performance & Security".

3. **Codebase Inspection**
    - Run `sentinel-auditor` on `/src` and `/.agent`.
    - Run `vulnerability-scanner` on `package.json` and `.env` (sanitized).

4. **Graph Validation**
    - Run `validate-skills.ts --graph` to ensuring system integrity.

// turbo
5. **Generate Report**
    - Run `npx tsx .agent/scripts/generate-audit-report.ts`

6. **Review Findings**
    - `elite-core` reviews the generated report and suggests fixes in `task.md`.
