# SEO Optimization Workflow

> **Risk Level**: 🟡 LOW
> **Estimated Time**: 15-30 minutes
> **Tokens**: ~800

## What This Does

Comprehensive SEO setup for your Astro site:
- Meta tags (title, description)
- Open Graph for social sharing
- Twitter Cards
- Schema.org structured data
- Sitemap.xml generation
- Robots.txt configuration
- Canonical URLs

## Trigger Phrases

- "Optimize for SEO"
- "Add meta tags"
- "Set up Open Graph"
- "Make my site Google-friendly"
- "Add social sharing images"
- "Create sitemap"

## Steps

### Step 1: Install Sitemap Integration
```bash
npx astro add sitemap
```

### Step 2: Create SEO Component

Create `src/components/SEO.astro`:
```astro
---
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  publishedDate?: string;
  canonical?: string;
}

const {
  title,
  description,
  image = '/og-default.png',
  type = 'website',
  publishedDate,
  canonical = Astro.url.href,
} = Astro.props;

const siteUrl = import.meta.env.PUBLIC_SITE_URL || Astro.site || '';
const fullImageUrl = new URL(image, siteUrl).toString();
---

<!-- Primary Meta -->
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<!-- Open Graph / Facebook -->
<meta property="og:type" content={type} />
<meta property="og:url" content={canonical} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={fullImageUrl} />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={canonical} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
<meta property="twitter:image" content={fullImageUrl} />

{publishedDate && (
  <meta property="article:published_time" content={publishedDate} />
)}
```

### Step 3: Create Schema Component

Create `src/components/Schema.astro`:
```astro
---
interface Props {
  type: 'Organization' | 'WebSite' | 'Article' | 'Product' | 'LocalBusiness';
  data: Record<string, unknown>;
}

const { type, data } = Astro.props;

const schema = {
  '@context': 'https://schema.org',
  '@type': type,
  ...data,
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Step 4: Add to Layout

In `src/layouts/Base.astro`:
```astro
---
import SEO from '../components/SEO.astro';
import Schema from '../components/Schema.astro';

const { title, description, image } = Astro.props;
---
<html>
<head>
  <SEO title={title} description={description} image={image} />
  <Schema type="WebSite" data={{
    name: "Your Site Name",
    url: import.meta.env.PUBLIC_SITE_URL,
  }} />
</head>
...
```

### Step 5: Configure Sitemap

In `astro.config.mjs`:
```javascript
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://your-domain.com',
  integrations: [sitemap()],
});
```

### Step 6: Create robots.txt

Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap-index.xml
```

### Step 7: Create OG Image

Create `public/og-default.png`:
- Dimensions: 1200x630 pixels
- Include: Logo, site name, tagline
- Use brand colors from ATLAS_TOKENS

## Checklist

- [ ] Every page has unique title (50-60 chars)
- [ ] Every page has meta description (150-160 chars)
- [ ] OG image exists (1200x630)
- [ ] Sitemap generates correctly
- [ ] robots.txt is configured
- [ ] Canonical URLs are set
- [ ] Schema.org data is valid (test at schema.org/validator)

## Testing Tools

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **Schema Validator**: https://validator.schema.org/

## What You'll Get

- Professional social sharing previews
- Better Google search appearance
- Rich snippets eligibility
- Improved click-through rates

---

**Next**: Run SEO audit to verify everything is set up correctly
