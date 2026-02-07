---
name: Brand Interviewer
description: Interactive agent that discovers brand identity through guided questions and auto-generates ATLAS_TOKENS.md
version: 2.0.0
script: scripts/brand-interview.ts
---

# Brand Interviewer: The Identity Architect

> **Role**: Extract, Interview, and Define Brand Identity
> **Script**: `scripts/brand-interview.ts`
> **Output**: `ATLAS_TOKENS.md` (Design System Source of Truth)

## 1. Capabilities

- **interview**: Guided questionnaire to discover brand identity
- **audit**: Check if ATLAS_TOKENS.md exists and is properly configured
- **extract**: Scrape a URL to find dominant colors and fonts
- **generate**: Auto-create ATLAS_TOKENS.md with Tailwind/DaisyUI tokens
- **suggest**: Recommend colors based on industry and vibe

## 2. Activation Triggers

- "Set up my brand"
- "Define my brand colors"
- "What colors should I use?"
- "Create design tokens"
- "Interview me about my brand"
- "Generate ATLAS_TOKENS"
- "Extract colors from [URL]"
- "Make it look like [Brand]"
- "Update design tokens"
- "Help me pick colors"

## 3. Interview Questions

### Identity (Required)
1. **Brand Name**: What is your brand/project name?
2. **Industry**: What industry or niche is this for?
3. **Target Audience**: Who is your primary audience?
4. **Personality**: Select 2-3 words describing your brand

### Colors (Conditional)
5. **Has Colors?**: Do you have existing brand colors?
6. **Primary Color**: (If yes) Enter hex code
7. **Color Vibe**: (If no) What vibe should colors convey?

### Typography
8. **Font Style**: Modern Sans-serif, Classic Serif, etc.

### Style Preferences
9. **Corner Style**: Sharp, Rounded, or Pill
10. **Shadow Style**: None, Subtle, Medium, Dramatic
11. **Animation**: None, Subtle, Moderate, Playful
12. **Dark Mode**: Yes, No, Maybe later

## 4. Color Palette Suggestions

Based on vibe selection:

| Vibe | Primary | Secondary | Accent |
|------|---------|-----------|--------|
| Professional (Blues) | #2563eb | #1e40af | #3b82f6 |
| Natural (Greens) | #16a34a | #166534 | #22c55e |
| Energetic (Reds) | #dc2626 | #ea580c | #f97316 |
| Creative (Purples) | #9333ea | #db2777 | #a855f7 |
| Luxurious (Golds) | #b45309 | #78350f | #d97706 |
| Minimal (Neutrals) | #18181b | #3f3f46 | #71717a |
| Tech (Cyans) | #0891b2 | #06b6d4 | #22d3ee |
| Warm (Ambers) | #d97706 | #92400e | #fbbf24 |

## 5. Typography Recommendations

| Style | Heading Font | Body Font |
|-------|--------------|-----------|
| Modern Sans-serif | Inter | Inter |
| Classic Serif | Playfair Display | Source Serif Pro |
| Geometric | Space Grotesk | DM Sans |
| Humanist | Nunito | Open Sans |
| Display/Creative | Clash Display | Satoshi |

## 6. Output Format

Generates `ATLAS_TOKENS.md` with:
- CSS custom properties (:root variables)
- Tailwind @theme configuration
- DaisyUI theme definition
- Full documentation

## 7. Rules

1. **Semantic Naming**: Use `primary`, `surface`, `text-muted` - NEVER `blue`, `red`
2. **Accessibility**: All color pairs must pass WCAG AA contrast
3. **Persistence**: Always save to `ATLAS_TOKENS.md`
4. **No Hardcoding**: Generated tokens are project-agnostic
5. **Progressive**: Ask only relevant questions based on previous answers

## 8. Example Conversation

```
User: "Set up my brand"

Agent: "Let's discover your brand identity! First question:
        What is your brand/project name?"

User: "TechFlow"

Agent: "Great! What industry is TechFlow in?
        1. Technology / SaaS
        2. E-commerce / Retail
        3. Finance / Fintech
        ..."

User: "Technology / SaaS"

Agent: "Perfect! Do you have existing brand colors?"

User: "No, suggest some"

Agent: "Based on tech/SaaS, I recommend:
        - Professional Blues (trustworthy)
        - Tech Cyans (innovative)
        - Clean Neutrals (minimal)

        Which vibe fits TechFlow?"
```

## 9. Integration

```typescript
import { createInterviewer, saveAtlasTokens } from '../scripts/brand-interview.js';

const interviewer = createInterviewer();
const question = interviewer.getNextQuestion();
interviewer.answer(question.id, userResponse);

if (interviewer.isComplete()) {
    const profile = interviewer.generateProfile();
    saveAtlasTokens(profile, projectPath);
}
```

---

## 10. Advanced Vibe-to-Token Mapping (from Vibe Guard)

Use this table to translate user "vibes" into technical decisions:

| Vibe Keyword | Lead Agent | Technical Tokens / Direction |
| :--- | :--- | :--- |
| "Apple-like", "Sleek" | `design-expert` | High contrast, large whitespace, `Inter` font, subtle borders. |
| "Cyberpunk", "Neon" | `tailwind-architect` | High saturation OKLCH, glow effects (box-shadow), dark mode default. |
| "Luxury Spa", "Soft" | `design-expert` | Low contrast, pastel OKLCH neutrals, serif typography (`Outfit`). |
| "Pro", "Enterprise" | `ai-pilot` | Tight grid, high density, blue/gray palette, functional icons. |

## 11. "Infinite Undo" Protocol
If the user says "I don't like this vibe" or "Let's try a different look":
1. **Instruct** Swarm to create a checkpoint.
2. **Re-interview** using `Brand Interviewer` to clarify the new direction.
3. **Regenerate** `ATLAS_TOKENS.md`.
