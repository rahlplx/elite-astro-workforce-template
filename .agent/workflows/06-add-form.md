# Add Form Workflow

> **Risk Level**: 🟡 LOW
> **Estimated Time**: 10-20 minutes
> **Tokens**: ~600

## What This Does

Creates accessible, validated forms with multiple backend options:
- Contact forms
- Newsletter signup
- Feedback forms
- Multi-step forms

## Trigger Phrases

- "Add a contact form"
- "Create newsletter signup"
- "Add feedback form"
- "Build a form"
- "I need user input"

## Form Backend Options

| Service | Free Tier | Best For |
|---------|-----------|----------|
| Formspree | 50/month | Simple forms |
| Netlify Forms | 100/month | Netlify hosted |
| Resend | 3000/month | Email + marketing |
| Astro Actions | Unlimited | Self-hosted |

## Steps

### Step 1: Choose Backend

**Option A: Formspree (Easiest)**
```html
<form action="https://formspree.io/f/your-form-id" method="POST">
```

**Option B: Netlify Forms**
```html
<form name="contact" netlify>
```

**Option C: Astro Actions (Full Control)**
```typescript
// src/actions/contact.ts
```

### Step 2: Create Form Component

Create `src/components/ContactForm.astro`:
```astro
---
interface Props {
  formId?: string;
  submitText?: string;
}

const { formId = 'contact', submitText = 'Send Message' } = Astro.props;
---

<form
  id={formId}
  action="https://formspree.io/f/YOUR_FORM_ID"
  method="POST"
  class="space-y-6"
>
  <!-- Name -->
  <div>
    <label for="name" class="block text-sm font-medium">
      Name <span class="text-error">*</span>
    </label>
    <input
      type="text"
      id="name"
      name="name"
      required
      autocomplete="name"
      class="input input-bordered w-full"
      aria-describedby="name-error"
    />
    <p id="name-error" class="text-error text-sm hidden">Please enter your name</p>
  </div>

  <!-- Email -->
  <div>
    <label for="email" class="block text-sm font-medium">
      Email <span class="text-error">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      required
      autocomplete="email"
      class="input input-bordered w-full"
      aria-describedby="email-error"
    />
    <p id="email-error" class="text-error text-sm hidden">Please enter a valid email</p>
  </div>

  <!-- Message -->
  <div>
    <label for="message" class="block text-sm font-medium">
      Message <span class="text-error">*</span>
    </label>
    <textarea
      id="message"
      name="message"
      required
      rows="5"
      class="textarea textarea-bordered w-full"
      aria-describedby="message-error"
    ></textarea>
    <p id="message-error" class="text-error text-sm hidden">Please enter a message</p>
  </div>

  <!-- Honeypot (spam protection) -->
  <input type="text" name="_gotcha" style="display:none" />

  <!-- Submit -->
  <button type="submit" class="btn btn-primary w-full">
    {submitText}
  </button>

  <!-- Success Message -->
  <div id="success-message" class="alert alert-success hidden">
    Thank you! Your message has been sent.
  </div>
</form>

<script>
  const form = document.getElementById('contact') as HTMLFormElement;
  const successMessage = document.getElementById('success-message');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      form.reset();
      successMessage?.classList.remove('hidden');
    }
  });
</script>
```

### Step 3: Create Newsletter Form

Create `src/components/NewsletterForm.astro`:
```astro
---
interface Props {
  heading?: string;
  subheading?: string;
}

const {
  heading = 'Stay Updated',
  subheading = 'Get the latest news delivered to your inbox.',
} = Astro.props;
---

<div class="bg-base-200 p-8 rounded-box">
  <h3 class="text-xl font-bold">{heading}</h3>
  <p class="text-base-content/70 mb-4">{subheading}</p>

  <form
    action="https://formspree.io/f/YOUR_FORM_ID"
    method="POST"
    class="flex gap-2"
  >
    <input
      type="email"
      name="email"
      placeholder="you@example.com"
      required
      class="input input-bordered flex-1"
      aria-label="Email address"
    />
    <button type="submit" class="btn btn-primary">
      Subscribe
    </button>
  </form>

  <p class="text-xs text-base-content/50 mt-2">
    No spam. Unsubscribe anytime.
  </p>
</div>
```

### Step 4: Add to Page

```astro
---
import ContactForm from '../components/ContactForm.astro';
import NewsletterForm from '../components/NewsletterForm.astro';
---

<section class="py-16">
  <h2>Contact Us</h2>
  <ContactForm />
</section>

<section class="py-16">
  <NewsletterForm />
</section>
```

## Accessibility Checklist

- [x] All inputs have labels
- [x] Required fields are marked
- [x] Error messages use aria-describedby
- [x] Submit button is descriptive
- [x] Focus states are visible
- [x] Form can be submitted with keyboard

## Spam Protection

1. **Honeypot field** (hidden field bots fill)
2. **reCAPTCHA** (if needed)
3. **Rate limiting** (server-side)

## Validation Patterns

```javascript
// Email
pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"

// Phone (US)
pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"

// URL
pattern="https?://.+"
```

## What You'll Get

- Accessible, validated form
- Spam protection
- Success/error states
- Mobile-friendly layout
- Email notifications

---

**Next**: Set up email notifications in your form service dashboard
