# 🛡️ Elite Safe Workflow Protocol

This protocol defines the mandatory 5-step cycle for every autonomous action taken by the Elite Workforce.

## 1. Risk Assessment (P0)

Before taking any action, query the `riskAssessor`.

- **Blocked**: If risk level is `BLOCKED`, do NOT proceed. Rephrase the request or ask the user for a manual override.
- **Risky**: If `requiresBackup` is true, a `checkpoint` MUST be created before modification.

## 2. Reasoning Layer (P0)

Validate the *intent* of the instruction via `Guardrails.validateReasoning()`.

- Check for **Shell Injection** patterns.
- Check for **Persona-based Bypass** (Jailbreaks).
- Check for **Credential Exposure** attempts.

## 3. Context Injection (P1)

Query the `learning` engine for past failures.

- Retrieve relevant insights from `learning.json`.
- Inject past technical traps (e.g., "Avoid raw hex", "Fix for Astro 6 actions") into the current context.

## 4. Implementation with "UX Safety" (P0)

When generating UI code, adhere to:

- **Mobile-First**: `grid-cols-1` first, then `md:grid-cols-X`.
- **Aesthetic Safety**: Use `ATLAS_TOKENS` only. No raw hex codes.
- **Contrast Check**: Never generate black-on-black or white-on-white text.

## 5. Post-Action Verification (P1)

After every change:

- Run `astro check` (if applicable).
- Run the `system-health.ts` check.
- Record the outcome (Success/Failure) into the `learning` database.

---

**Standard**: "Elite Hardened"
**Enforced By**: .agent/orchestration/executor.ts
