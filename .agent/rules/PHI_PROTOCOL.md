# HIPAA & PHI PROTECTION PROTOCOL

## 1. PHI DEFINITION
Protected Health Information (PHI) includes:
- Names, Addresses, Dates (Birth, Service).
- Phone numbers, Email addresses, SSNs.
- Clinical notes, appointment reasons, specific diagnoses.

## 2. LOGGING RULES (NON-NEGOTIABLE)
- **Rule**: Never print PHI to the terminal or standard logs.
- **Rule**: If a tool returns PHI, the agent must redact it before further processing or reporting.
- **Rule**: `console.log` of object payloads containing user data is BLOCKED.

## 3. DATA PERSISTENCE
- **Rule**: No PHI in `.agent/memory/` or `PROJECT_MEMORY.md`.
- **Rule**: Use Keystatic's encrypted fields (if supported) or reference records by internal UUID only.
- **Rule**: Temporary files containing PHI must be deleted immediately after the task using `rm`.

## 4. AGENT-USER COMMUNICATION
- **Rule**: Mask sensitive data in responses (e.g., `J*** D**`).
- **Rule**: Confirm appointment details via secure session IDs rather than cleartext.

## 5. AUDIT TRIGGER
- Any task involving the "Patient Booking" or "Medical Records" routes MUST trigger a **Security Audit** via `vulnerability-scanner`.
