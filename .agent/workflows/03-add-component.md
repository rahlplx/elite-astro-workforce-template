# Add Component Workflow

> **Risk Level**: 🟡 LOW
> **Estimated Time**: 1-2 minutes
> **Tokens**: ~600

## What This Does
Creates reusable Astro components with:
- TypeScript props interface
- Responsive styling
- Accessibility features
- Slot support where needed

## How to Use

### Quick Start
```
Create a Button component
```

### With Props
```
Create a Card component with title, description, and image props
```

### With Variants
```
Create a Button component with primary, secondary, and outline variants
```

## Example Prompts

### UI Components
```
Create a hero section component
```
```
Make a testimonial card component
```
```
Build a pricing card component
```

### Navigation
```
Create a navbar component with mobile menu
```
```
Build a footer component with links and social icons
```
```
Make a breadcrumb component
```

### Forms
```
Create a contact form component
```
```
Build a newsletter signup component
```
```
Make an input component with label and error state
```

### Layout
```
Create a two-column layout component
```
```
Build a feature grid component
```
```
Make a section wrapper component
```

## Component Structure

```
src/components/
├── ui/           # Basic UI elements
│   ├── Button.astro
│   └── Card.astro
├── layout/       # Layout components
│   ├── Header.astro
│   └── Footer.astro
└── sections/     # Page sections
    ├── Hero.astro
    └── Features.astro
```

## What You'll Get

```astro
---
// src/components/ui/Button.astro
interface Props {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const { variant = 'primary', size = 'md', href } = Astro.props;
---

<button class:list={[...]} {...href ? {href} : {}}>
  <slot />
</button>
```

## Related Workflows
- [02-create-page.md](02-create-page.md) - Use components in pages
- [04-style-section.md](04-style-section.md) - Style components
