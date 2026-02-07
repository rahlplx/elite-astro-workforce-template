# ELITE WORKFORCE PROTOCOL (v1.0)

This protocol defines the mandatory architecture and behavioral rules for all components within the `.agent` system. Failure to adhere to these standards results in system "Ghosting" (ignored modules) or routing failure.

## 1. Directory Structure Standards

### 📂 skills/ (Capabilities)
- **MUST**: Contain a `SKILL.md` file with YAML frontmatter.
- **MUST**: Include a `# Behavioral Rules` section.
- **MUST**: Be referenced in `.agent/graph/agents.graph.json`.
- **DONT**: Include project-specific business logic (brand-agnostic only).

### 📂 rules/ (Constraints)
- **MUST**: Be formatted as Markdown.
- **MUST**: Contain a clear `### MUST` and `### NEVER` section.
- **DONT**: Define styling rules that conflict with Tailwind 4 / OKLCH standards.

### 📂 workflows/ (Execution Paths)
- **MUST**: Contain numbered steps.
- **MUST**: Include a `// turbo` annotation for safe automation.
- **MUST**: End with a `# Verification Checklist` section.

### 📂 scripts/ (Automation)
- **MUST**: Be written in TypeScript (`.ts`).
- **MUST**: Include JSDoc comments for core functions.
- **DONT**: Use hardcoded absolute paths (use `process.cwd()` or `import.meta.url`).

---

## 2. Orchestration Best Practices

### Agentic Swarm Mode
- **High Confidence**: Every complex task MUST be audited by a second agent.
- **Socratic Gate**: Complex requests MUST trigger the `brainstorming` skill before execution.
- **Self-Healing**: If a script fails, the `systematic-debugging` skill MUST be engaged automatically.

### Memory & Learning
- **Persistence**: Every outcome MUST be recorded in `.agent/memory/learning.json`.
- **Insight Capture**: Lessons learned MUST be cross-referenced in `LEARNING_DB.md`.

---

## 3. The "Elite" Commandants

### MUST DO
- **Check Manifest**: Always read `.agent/MANIFEST.md` before starting a new session.
- **Atomic Commits**: Run `bootstrap.ts` before every commit.
- **A11y First**: Verify contrast and touch targets on all UI components.
- **Zod Boundaries**: Use runtime validation for all API/Data boundaries.

### NEVER DO
- **Legacy Stack**: Never suggest React Class Components, old Tailwind configs, or manual Webpack setups.
- **Public Pollution**: Never store agent-specific files in the `public/` directory.
- **Token Waste**: Never view the same 800-line file twice without cause (use `view_file_outline`).
- **Silent Fail**: Never ignore a terminal error; analyze and resolve.
