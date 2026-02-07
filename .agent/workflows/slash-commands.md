# Slash Command Workflows

> **Source:** Antigravity Kit pattern - procedural templates triggered by slash commands
>
> These workflows guide multi-step development tasks with zero-configuration usage.

---

## Available Commands

| Command | Description | Agents Invoked |
| ------- | ----------- | -------------- |
| `/brainstorm` | Explore design options and generate ideas | brainstorming, architecture |
| `/create` | Build new features with full scaffolding | app-builder, frontend, backend |
| `/debug` | Systematic troubleshooting workflow | systematic-debugging, sentinel |
| `/plan` | Task decomposition and planning | plan-writing, architecture |
| `/test` | Generate and run tests | tdd-workflow, testing-patterns |
| `/enhance` | Improve existing code quality | clean-code, performance |
| `/deploy` | Production deployment workflow | deployment-procedures, cicd |
| `/orchestrate` | Multi-agent coordination | intelligent-routing, all specialists |
| `/audit` | Full project audit | sentinel-auditor, security, seo |
| `/status` | Project health check | all relevant |

---

## /brainstorm

**Purpose:** Explore design options before implementation

**Workflow:**
1. Analyze request with multi-domain BM25 search
2. Generate 3-5 design options with trade-offs
3. Present anti-patterns to avoid
4. Ask clarifying questions (Socratic Gate)
5. Output: Decision matrix with recommendations

**Agents:** `brainstorming`, `architecture`, `design-expert`

**Example:**
```
User: /brainstorm authentication system
Agent: [Performs multi-domain analysis...]
       [Presents OAuth vs JWT vs Session options...]
       [Shows security anti-patterns...]
```

---

## /create

**Purpose:** Build new features with proper scaffolding

**Workflow:**
1. Trigger Socratic Gate if requirements unclear
2. Detect project type and stack
3. Generate scaffolding using templates
4. Create implementation with tests
5. Verify with lint/build
6. Record in lessons.md if corrections needed

**Agents:** `app-builder`, `frontend-specialist`, `backend-specialist`, `test-engineer`

**Example:**
```
User: /create user profile page
Agent: [Asks 3 clarifying questions...]
       [Detects Next.js + Tailwind stack...]
       [Generates component with tests...]
```

---

## /debug

**Purpose:** Systematic troubleshooting

**Workflow:**
1. Reproduce the issue
2. Isolate to specific component/function
3. Identify root cause
4. Implement fix
5. Verify fix works
6. Add regression test
7. Record lesson learned

**Agents:** `systematic-debugging`, `sentinel-auditor`, `test-engineer`

**Example:**
```
User: /debug login not working, 401 error
Agent: [Reproduces issue...]
       [Traces auth flow...]
       [Identifies token expiry issue...]
       [Fixes and adds test...]
```

---

## /plan

**Purpose:** Decompose complex tasks into actionable steps

**Workflow:**
1. Analyze request complexity
2. Break into subtasks (max 5 per level)
3. Identify dependencies between tasks
4. Estimate effort (T-shirt sizing)
5. Create todo.md entries
6. Output: Structured plan with milestones

**Agents:** `plan-writing`, `architecture`, `brainstorming`

**Output Format:**
```markdown
## Implementation Plan

### Phase 1: Foundation
- [ ] Task 1.1 (S) - Description
- [ ] Task 1.2 (M) - Description

### Phase 2: Core Features
- [ ] Task 2.1 (L) - Description
...
```

---

## /test

**Purpose:** Generate and execute tests

**Workflow:**
1. Analyze code to test
2. Determine test type (unit/integration/e2e)
3. Generate test cases
4. Run tests
5. Report coverage
6. Suggest improvements

**Agents:** `tdd-workflow`, `testing-patterns`, `webapp-testing`

**Example:**
```
User: /test src/components/UserCard.tsx
Agent: [Analyzes component...]
       [Generates unit tests...]
       [Runs vitest...]
       [Reports 85% coverage...]
```

---

## /enhance

**Purpose:** Improve existing code quality

**Workflow:**
1. Analyze current code
2. Identify improvement areas:
   - Performance bottlenecks
   - Code smells
   - Missing error handling
   - Accessibility gaps
3. Propose specific improvements
4. Implement after approval
5. Verify no regressions

**Agents:** `clean-code`, `performance-profiling`, `code-review-checklist`

---

## /deploy

**Purpose:** Production deployment with safety checks

**Workflow:**
1. Pre-flight checks:
   - All tests pass
   - No linting errors
   - Build succeeds
2. Environment verification
3. Deploy to staging (if available)
4. Production deployment
5. Post-deploy verification
6. Rollback plan ready

**Agents:** `deployment-procedures`, `cicd-automation`, `production-monitoring`

---

## /orchestrate

**Purpose:** Coordinate multiple agents for complex tasks

**Workflow:**
1. Analyze request with intelligent-routing
2. Select appropriate agents
3. Execute in sequence or parallel
4. Aggregate results
5. Present unified output
6. Track in todo.md

**Agents:** `intelligent-routing` + all relevant specialists

**Modes:**
- `single`: One agent handles everything
- `sequential`: Agents work in order (A → B → C)
- `swarm`: Agents work in parallel, results merged

---

## /audit

**Purpose:** Comprehensive project audit

**Workflow:**
1. Security audit (vulnerabilities, secrets)
2. Performance audit (bundle size, loading)
3. SEO audit (meta tags, accessibility)
4. Code quality audit (patterns, duplication)
5. Generate report with priorities
6. Create action items in todo.md

**Agents:** `sentinel-auditor`, `security`, `seo-fundamentals`, `performance-profiling`

**Output:** Audit report with severity ratings (Critical/High/Medium/Low)

---

## /status

**Purpose:** Quick project health check

**Workflow:**
1. Git status and recent commits
2. Test status
3. Build status
4. Dependency check
5. Open issues/todos
6. Memory signals summary

**Output:**
```
📊 Project Status

Git: ✅ Clean (3 commits ahead of main)
Tests: ✅ 47/47 passing
Build: ✅ Success (2.3s)
Deps: ⚠️ 2 outdated packages
Todos: 5 pending tasks
Memory: 12 captured signals
```

---

## Command Detection

Commands are detected automatically when message starts with `/`:

```typescript
function detectSlashCommand(message: string): string | null {
    const match = message.match(/^\/(\w+)/);
    return match ? match[1] : null;
}
```

## Integration with Intelligent Routing

Slash commands override automatic routing:
- Explicit command → Use specified workflow
- No command → Use intelligent-routing for auto-detection

---

## Adding New Commands

1. Create workflow file in `.agent/workflows/`
2. Add entry to this document
3. Update command detection in router
4. Test with example usage
