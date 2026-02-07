# STATE MANAGEMENT PROTOCOLS

## 1. SERVER-FIRST STATE (CONTENT LAYER)
- **Source of Truth**: All permanent data must live in `src/content/` (JSON/Markdown).
- **Access**: Use `getCollection` and `getEntry` in `.astro` files.
- **Modification**: Use Keystatic or direct fs-based mutations with Zod validation.

## 2. INTER-ISLAND COMMUNICATION (NANOSTORES)
- **Pattern**: Use `nanostores` for reactive state sharing between different framework islands (React/Svelte/Vanilla).
- **Rule**: Avoid standard React context or global Redux; keep islands isolated.
- **Implementation**:
  ```typescript
  import { atom } from 'nanostores';
  export const $isBookingOpen = atom(false);
  ```

## 3. PESISTENT CLIENT STATE
- **Preference**: Use `localStorage` for UI preferences (Dark mode, Sidebar state).
- **Critical Data**: Use `astro:actions` for server-side state mutations (HIPAA compliant).
- **Security**: Never store PHI (Protected Health Information) in `nanostores` or `localStorage`. Use session-only memory for sensitive inputs.

## 4. SERVER ISLAND DATA PASSING
- **Pattern**: Use `props` to pass data from static Layouts to Server Islands.
- **Cache**: Ensure `server:refresh` is used correctly for real-time medical availability checks.
