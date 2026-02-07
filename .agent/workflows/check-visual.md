---
description: Perform visual regression check on baseline vs current build
---

# Visual Regression Check (/check-visual)

This workflow is triggered on global style changes to ensure UI consistency.

1. Start the local dev server
// turbo
2. Run `npm run build` to ensure static assets are hashed correctly
3. Agent opens `localhost:4321` via the browser subagent
4. Capture screenshots of key viewports (Mobile, Tablet, Desktop)
5. Diff current screenshots against the `master` branch baseline in `.agent/baselines/`
6. Report discrepancies to the user as 🔴 BLOCKING or 🟡 SUGGESTIONS
7. If no changes, mark as 🟢 PASSED
