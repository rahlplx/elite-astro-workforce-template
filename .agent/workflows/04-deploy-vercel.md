# Deploy to Vercel

> **Risk Level**: 🟠 MEDIUM
> **Estimated Time**: 5-10 minutes
> **Tokens**: ~500

## What This Does

Prepares and deploys your Astro site to Vercel with optimal settings:
- Installs Vercel adapter
- Configures astro.config for Vercel
- Sets up environment variables
- Deploys preview or production

## Trigger Phrases

- "Deploy to Vercel"
- "Push to production"
- "Set up Vercel deployment"
- "Connect to Vercel"
- "Deploy my site"

## Prerequisites

1. Vercel account (free tier available)
2. Vercel CLI installed (`npm i -g vercel`)
3. Project builds successfully (`npm run build`)

## Steps

### Step 1: Install Adapter
```bash
npx astro add vercel
```

### Step 2: Configure astro.config
```typescript
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server', // or 'static' for pure static
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
});
```

### Step 3: Environment Variables
Create `.env.production`:
```
PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Step 4: Deploy Preview
```bash
vercel
```

### Step 5: Deploy Production
```bash
vercel --prod
```

## What You'll Get

- Live preview URL for testing
- Production deployment
- Automatic HTTPS
- Edge network delivery
- Analytics dashboard

## Rollback

Vercel keeps deployment history. To rollback:
```bash
vercel rollback [deployment-url]
```

Or use the Vercel dashboard to promote any previous deployment.

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run build` locally first |
| 404 errors | Check `output` mode matches your needs |
| Env vars missing | Add in Vercel dashboard Settings > Environment Variables |
| Functions timeout | Increase `maxDuration` in vercel.json |

## Vercel-Specific Features

### Edge Functions
```typescript
// src/pages/api/fast.ts
export const config = { runtime: 'edge' };
```

### Image Optimization
```astro
<Image src={image} width={800} format="webp" />
```

### Analytics
Enabled automatically with `webAnalytics: { enabled: true }`

---

**Next**: Set up a custom domain in Vercel dashboard
