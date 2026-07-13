# Obsidian Link Conventions

## Purpose
This rules file enforces Obsidian markdown link conventions across all OpenSpec artifacts to ensure compatibility with Obsidian vault linking and bidirectional references.

## Link Format Requirements

### Internal Links to Specs
All references to OpenSpec specifications **MUST** use Obsidian wiki-link format:

```markdown
[[openspec/specs/domain-name/spec]]
```

NOT:
- `[link](openspec/specs/domain-name/spec.md)` ❌
- `@/openspec/specs/domain-name/spec.md` ❌

### Internal Links to Changes
References to change proposals and artifacts use the same format:

```markdown
[[openspec/changes/change-name/proposal]]
[[openspec/changes/change-name/design]]
[[openspec/changes/change-name/tasks]]
```

### Links with Display Text
When you need custom display text, use this format:

```markdown
[[openspec/specs/domain-name/spec|Custom Label]]
```

Example:
```markdown
For authentication details, see [[openspec/specs/auth/spec|Auth Specification]].
```

### Cross-Domain References
When one spec references another domain:

```markdown
See related requirements in [[openspec/specs/other-domain/spec]].
```

### Archive References
Links to archived changes:

```markdown
[[openspec/changes/archive/2025-01-24-feature-name/proposal]]
```

## File Naming Conventions

### Spec Files
- Location: `openspec/specs/<domain>/spec.md`
- Format: lowercase, kebab-case for domain names
- Linked as: `[[openspec/specs/<domain>/spec]]` (no .md extension)

### Change Folders
- Location: `openspec/changes/<change-name>/`
- Format: kebab-case (e.g., `add-dark-mode`, `fix-auth-flow`)
- Sub-artifacts:
  - `proposal.md` → `[[openspec/changes/<change-name>/proposal]]`
  - `design.md` → `[[openspec/changes/<change-name>/design]]`
  - `tasks.md` → `[[openspec/changes/<change-name>/tasks]]`
  - `specs/<domain>/spec.md` → `[[openspec/changes/<change-name>/specs/<domain>/spec]]`

## Obsidian-Specific Metadata

### Frontmatter Tags
Add Obsidian tags to all spec and change documents for better linking:

```markdown
---
tags:
  - openspec
  - specs
  - domain/auth
---
```

Example for changes:
```markdown
---
tags:
  - openspec
  - change
  - status/proposed
  - domain/auth
---
```

### Status Tags
Track change status with tags:
- `status/proposed` - Initial proposal created
- `status/exploring` - Under investigation
- `status/designing` - Design phase
- `status/implementing` - Active implementation
- `status/completed` - Ready to archive
- `status/archived` - Merged into main specs

## Linked References Pattern

All artifacts should reference related documents using this pattern:

```markdown
## Related Specifications
- [[openspec/specs/domain-name/spec]]
- [[openspec/specs/another-domain/spec]]

## Related Changes
- [[openspec/changes/related-change-name/proposal]]
```

## Code Sample Integration

When referencing code files from specs, use relative paths but keep wiki-links for OpenSpec docs:

```markdown
### Implementation Files
See `src/auth/provider.ts` for the auth implementation.

### Related Specs
[[openspec/specs/auth/spec|Authentication Specification]]
```

## Rules for AI Agents

When creating or updating OpenSpec artifacts:

1. **Always use wiki-link format** for any OpenSpec internal references
2. **Never use markdown link syntax** `[text](path)` for OpenSpec files
3. **Always include custom labels** when the context needs clarity:
   - `[[openspec/specs/auth/spec|Authentication Requirements]]`
4. **Use frontmatter tags** to enable Obsidian graph and backlink features
5. **Maintain bidirectional links** - if A links to B, consider if B should link to A
6. **No .md extensions** in wiki-links - Obsidian resolves them automatically

## Validation Checklist

Before archiving or submitting a change:
- [ ] All OpenSpec file references use `[[path]]` format
- [ ] No markdown links `[text](file.md)` to OpenSpec files
- [ ] File paths follow `openspec/` directory structure exactly
- [ ] Related documents have backlinks to each other
- [ ] Frontmatter tags are present and accurate
- [ ] Change name uses kebab-case
- [ ] Domain names use lowercase with hyphens

## Example Spec Structure

```markdown
---
tags:
  - openspec
  - specs
  - domain/payments
  - status/active
---

# Payment Processing Specification

## Overview
This spec defines payment handling in our system.

## Related Specifications
- [[openspec/specs/auth/spec|User Authentication]]
- [[openspec/specs/db/spec|Database Schema]]

## Current Changes
- [[openspec/changes/add-payment-retry/specs/payments/spec|Payment Retry Logic]]

## Architecture Decisions
See [[openspec/changes/payment-redesign/design|Payment System Redesign]] for rationale.

## Requirements
- SHALL support multiple payment methods
- SHALL validate payment on submission
- MUST encrypt payment data in transit

## Scenarios

### Successful Payment
GIVEN a user in checkout
WHEN they submit valid payment
THEN the payment is processed and order created
```

## Example Change Structure

```markdown
---
tags:
  - openspec
  - change
  - status/proposed
  - domain/payments
---

# Add Payment Retry Mechanism

## Why
Transient payment gateway failures cause legitimate transactions to fail.

## What Changes
- [[openspec/changes/add-payment-retry/specs/payments/spec|Updated Payment Spec]]
- [[openspec/changes/add-payment-retry/design|Technical Design]]

## Impact
See [[openspec/specs/payments/spec|Payment Processing]] and [[openspec/specs/notifications/spec|Notification System]]
```

## Notes for Obsidian Integration

- These conventions enable Obsidian's **graph view** to visualize spec relationships
- **Backlinks** automatically track which changes affect which specs
- **Tags** allow filtering by domain, status, or type in Obsidian
- **Search** can find all specs linked from a change
- **Unlinked mentions** help identify missing references

## Migration Guide

If converting from old markdown links to wiki-links:

**Before:**
```markdown
See [Auth Spec](../specs/auth/spec.md)
Check [Design Doc](./design.md)
```

**After:**
```markdown
See [[openspec/specs/auth/spec|Auth Spec]]
Check [[openspec/changes/feature-name/design|Design Doc]]
```

Use Obsidian's find-and-replace or a script to bulk convert patterns.
