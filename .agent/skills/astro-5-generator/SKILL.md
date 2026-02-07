---
version: 1.0.0
name: Astro 5 Component Generator
description: Guide for building Astro 5+ components using Content Layer, Actions, and Server Islands.
---

# Astro 5 Component Generator

> **⚠️ CORE DIRECTIVE**: Astro 5 is "Content-Driven" and "Server-First". Use the Content Layer for data and Server Islands for dynamic UI.

## 1. Content Layer (Data Architecture)

Stop using `fs` or `import`. Use the Content Layer for typesafe data.

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/services" }),
  schema: z.object({
    title: z.string(),
    price: z.number().optional(),
  })
});
```

## 2. Server Islands (Performance)

Dynamic content shouldn't block the initial paint. Use `server:defer`.

```astro
<!-- UserStatus.astro -->
<div transition:persist>
  {isLoggedIn ? <Avatar /> : <LoginBtn />}
</div>

<!-- Usage -->
<UserStatus server:defer>
  <div slot="fallback">Loading user...</div>
</UserStatus>
```

## 3. Astro Actions (Backend Logic)

Don't build API routes manually for form handling. Use Actions.

```typescript
// src/actions/index.ts
import { defineAction, z } from 'astro:actions';

export const server = {
  subscribe: defineAction({
    input: z.object({ email: z.string().email() }),
    handler: async (input) => {
      // DB logic here
      return { success: true };
    }
  })
};
```

## 4. Image Optimization

**ALWAYS** use `<Image />` or `<Picture />`.

```astro
import { Image } from 'astro:assets';
import myImage from '../assets/smile.jpg';

<Image src={myImage} alt="Happy patient" width={800} format="avif" />
```

## 5. View Transitions

Enable native-like navigation.

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<head>
  <ClientRouter />
</head>
```
