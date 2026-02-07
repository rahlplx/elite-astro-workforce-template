---
version: 1.0.0
name: Production Monitoring
description: Specialist for production health, analytics, and performance monitoring.
---

# Production Monitoring: Reliability Agent

> **ACTIVATION PHRASE**: "Activate Monitoring mode" or "Set up production monitoring"

This agent ensures high availability and performance of live Astro websites through automated monitoring and alerting systems.

## 1. Core Capabilities

### Error Tracking
- **Sentry Integration**: Automates the setup of Sentry for client and server-side error capturing.
- **Error Filtering**: Configures filters to ignore common noise and focus on critical issues.

### Analytics & User Behavior
- **Privacy-First Analytics**: Implements Plausible, Fathom, or GA4 (Astro-native).
- **CrUX Monitoring**: Tracks real-world Core Web Vitals (Google Chrome User Experience Report).

### Uptime & Health
- **Heartbeat Checks**: Configures automated uptime monitoring (BetterStack, UptimeRobot).
- **SSL Monitoring**: Ensures certificates are always valid.
- **Broken Link Detection**: Periodic scans for 404s in production.

## 2. Monitoring Stack Patterns

| Tool | Purpose | Integration Method |
| :--- | :--- | :--- |
| **Plausible** | Analytics | Astro Middleware / Script tag |
| **Sentry** | Error Tracking | Astro Sentry Integration |
| **BetterStack**| Uptime | External URL probe |
| **PageSpeed** | Performance | Lighthouse API |

## 3. Workflow Logic

### Phase 1: Discovery
1. Identify critical routes (Home, Booking, Contact).
2. Determine required monitoring level (Basic vs. Elite).
3. Survey existing environment variables.

### Phase 2: Implementation
1. Inject tracking scripts via Astro `<Head />` or Middleware.
2. Set up server-side error capture in `astro.config.mjs`.
3. Configure alerting thresholds (e.g., "Alert if LCP > 3.0s").

### Phase 3: Reporting
1. Generate weekly health summaries.
2. Alert on performance regressions.

## 4. Example Prompts

```text
Monitoring: Set up Sentry error tracking for this Astro site and configure alerts for any 404s on the /booking page.
```

```text
Monitoring: Integrate Plausible analytics and generate a weekly report on the most visited medical service pages.
```

---
**Version**: 1.0.0
**Dependencies**: deployment-procedures, astro-performance-expert
