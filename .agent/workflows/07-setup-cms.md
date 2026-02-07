# Setup CMS Workflow (Keystatic)

> **Risk Level**: 🟠 MEDIUM
> **Estimated Time**: 20-30 minutes
> **Tokens**: ~1000

## What This Does

Sets up Keystatic CMS for content management:
- Visual content editor
- Git-based storage (no database)
- Type-safe content schemas
- Local + cloud editing
- Content collections

## Trigger Phrases

- "Set up CMS"
- "Add content management"
- "I need a blog"
- "Add Keystatic"
- "Let me edit content easily"
- "Set up content collections"

## Why Keystatic?

| Feature | Keystatic | Other CMS |
|---------|-----------|-----------|
| Pricing | Free | Often paid |
| Database | None (Git) | Required |
| Type Safety | Yes | Varies |
| Local Dev | Yes | Sometimes |
| Astro Integration | Excellent | Varies |

## Steps

### Step 1: Install Keystatic

```bash
npm install @keystatic/core @keystatic/astro
```

### Step 2: Create Keystatic Config

Create `keystatic.config.ts`:
```typescript
import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local', // Change to 'github' for production
  },

  singletons: {
    // Site Settings
    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings',
      schema: {
        siteName: fields.text({ label: 'Site Name' }),
        tagline: fields.text({ label: 'Tagline' }),
        logo: fields.image({
          label: 'Logo',
          directory: 'public/images',
          publicPath: '/images',
        }),
        socialLinks: fields.array(
          fields.object({
            platform: fields.select({
              label: 'Platform',
              options: [
                { label: 'Twitter', value: 'twitter' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'GitHub', value: 'github' },
              ],
              defaultValue: 'twitter',
            }),
            url: fields.url({ label: 'URL' }),
          }),
          { label: 'Social Links', itemLabel: props => props.fields.platform.value }
        ),
      },
    }),
  },

  collections: {
    // Blog Posts
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({
          label: 'Description',
          multiline: true,
        }),
        publishedDate: fields.date({ label: 'Published Date' }),
        author: fields.text({ label: 'Author' }),
        image: fields.image({
          label: 'Cover Image',
          directory: 'public/images/posts',
          publicPath: '/images/posts',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Tags', itemLabel: props => props.value }
        ),
        draft: fields.checkbox({
          label: 'Draft',
          description: 'Draft posts are not published',
        }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),

    // Team Members
    team: collection({
      label: 'Team Members',
      slugField: 'name',
      path: 'src/content/team/*',
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role' }),
        bio: fields.text({ label: 'Bio', multiline: true }),
        avatar: fields.image({
          label: 'Avatar',
          directory: 'public/images/team',
          publicPath: '/images/team',
        }),
        social: fields.object({
          twitter: fields.url({ label: 'Twitter' }),
          linkedin: fields.url({ label: 'LinkedIn' }),
        }),
      },
    }),

    // Pages (for custom pages)
    pages: collection({
      label: 'Pages',
      slugField: 'title',
      path: 'src/content/pages/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description' }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});
```

### Step 3: Add Keystatic Route

Create `src/pages/keystatic/[...params].astro`:
```astro
---
import { Keystatic } from '@keystatic/astro/internal';
---

<Keystatic client:only="react" />
```

### Step 4: Configure Astro

Update `astro.config.mjs`:
```javascript
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    react(),
    keystatic(),
  ],
  output: 'hybrid', // Required for Keystatic
});
```

### Step 5: Create Content Schema Types

Create `src/content/config.ts`:
```typescript
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.date(),
    author: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const team = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
    social: z.object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    }).optional(),
  }),
});

export const collections = { posts, team };
```

### Step 6: Create Blog List Page

Create `src/pages/blog/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Base.astro';

const posts = await getCollection('posts', ({ data }) => !data.draft);
const sortedPosts = posts.sort((a, b) =>
  b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
);
---

<Layout title="Blog">
  <h1>Blog</h1>
  <ul class="space-y-8">
    {sortedPosts.map((post) => (
      <li>
        <a href={`/blog/${post.slug}`} class="group">
          <h2 class="text-xl font-bold group-hover:text-primary">
            {post.data.title}
          </h2>
          <p class="text-base-content/70">{post.data.description}</p>
          <time class="text-sm text-base-content/50">
            {post.data.publishedDate.toLocaleDateString()}
          </time>
        </a>
      </li>
    ))}
  </ul>
</Layout>
```

### Step 7: Create Blog Post Page

Create `src/pages/blog/[slug].astro`:
```astro
---
import { getCollection, type CollectionEntry } from 'astro:content';
import Layout from '../../layouts/Base.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

interface Props {
  post: CollectionEntry<'posts'>;
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<Layout title={post.data.title} description={post.data.description}>
  <article class="prose lg:prose-xl mx-auto">
    <h1>{post.data.title}</h1>
    <time>{post.data.publishedDate.toLocaleDateString()}</time>
    <Content />
  </article>
</Layout>
```

## Access Keystatic Admin

Start dev server and visit:
```
http://localhost:4321/keystatic
```

## Production Setup (GitHub)

Update `keystatic.config.ts`:
```typescript
storage: {
  kind: 'github',
  repo: 'owner/repo-name',
},
```

## What You'll Get

- Visual content editor at `/keystatic`
- Type-safe content
- Git-based version control
- Blog with posts collection
- Team members collection
- Site settings singleton

## Content Structure

```
src/content/
├── config.ts          # Schema definitions
├── settings/          # Site settings
├── posts/             # Blog posts
├── team/              # Team members
└── pages/             # Custom pages
```

---

**Next**: Create your first blog post at `/keystatic`
