---
name: obsidian
description: Obsidian wiki-link conventions for OpenSpec artifacts
applies_to: openspec
---

## Link format

All OpenSpec references use wiki-link format:
- Specs: `[[openspec/specs/<domain>/spec]]`
- Changes: `[[openspec/changes/<name>/proposal]]`
- With label: `[[openspec/specs/auth/spec|Auth Spec]]`

Never use `[text](path.md)` for OpenSpec files. No `.md` extensions.

## File naming

- Specs: `openspec/specs/<domain>/spec.md` (lowercase kebab-case)
- Changes: `openspec/changes/<name>/` with `proposal.md`, `design.md`, `tasks.md`

## Frontmatter

All OpenSpec documents need tags:
```yaml
---
tags: [openspec, specs, domain/<name>]
---
```

## Validation

Before archiving: all references use `[[path]]`, no markdown links to OpenSpec files, frontmatter tags present.
