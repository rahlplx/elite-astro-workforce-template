# Astro Actions

> Native server-side logic and form handling for Astro 6+.

## 1. Core Principles

- **Type Safety**: Automatic end-to-end type safety between server and client.
- **Form Integration**: Seamless handling of HTML for submissions.
- **Security**: Built-in CSRF protection and server-side validation.
- **Standard Fetch**: Based on standard Request/Response objects.

## 2. Implementation Pattern

### Defining Actions

Define actions in `src/actions/index.ts`:

```typescript
import { defineAction, z } from 'astro:actions';

export const server = {
  contact: defineAction({
    input: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      message: z.string().min(10),
    }),
    handler: async (input, context) => {
      // Logic: Send email, save to DB, etc.
      return { success: true, message: 'Message sent!' };
    },
  }),
};
```

### Calling Actions (Client-side)

```typescript
import { actions } from 'astro:actions';

const { data, error } = await actions.contact({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello from Astro!',
});
```

### Calling Actions (Forms)

```astro
---
import { actions } from 'astro:actions';
---

<form method="POST" action={actions.contact}>
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Submit</button>
</form>
```

## 3. Best Practices

- **Validate with Zod**: Always define an `input` schema.
- **Context Access**: Use the `context` argument for info (e.g., `context.locals`, `context.request`).
- **Error Handling**: Throw `ActionError` for specific status codes.
- **Redirects**: Use `context.redirect` for post-submission navigation.

## 4. When to Use

| Need | Pattern |
|------|---------|
| Form submissions | **Astro Actions** |
| Dynamic data mutation | **Astro Actions** |
| Headless API (Mobile/3rd party) | **REST API Routes** |
| Pure read-only data | **Content Layer / Components** |
