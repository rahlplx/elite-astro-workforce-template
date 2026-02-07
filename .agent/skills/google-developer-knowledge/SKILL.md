---
version: 1.0.0
name: Google Developer Knowledge
description: Access official Google Developer Documentation via API
---

# Google Developer Knowledge

This skill allows the agent to search and retrieve official documentation from Google Developer sources (Firebase, Android, Cloud, etc.) using the Google Developer Knowledge API.

## Usage

Use this skill when you need to find specific implementation details, API references, or guides from Google's official documentation.

```markdown
Search Google Developer Knowledge for "Firebase Authentication implementation"
```

## Capabilities

- **Search Documentation**: Find relevant guides and API references.
- **Retrieve Content**: Get full markdown content of documentation pages.

## Requirements

- Google Cloud Project with Knowledge API enabled.
- OAuth 2.0 Credentials configured in `.env`.

## Implementation

This skill uses:
- `utils/google-auth.ts`: Handles OAuth 2.0 flow.
- `services/google-knowledge.ts`: Interacts with the API.

## Rules

1. **Always cite sources**: When providing information from this API, mention the source URL.
2. **Handle Auth Flow**: If authentication is required, guide the user to the auth URL.
