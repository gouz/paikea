---
name: devcontainer
description: Always create a devcontainer when scaffolding a new project
applies_to: "*"
---

When creating a new project, generate a devcontainer first:

1. `.devcontainer/devcontainer.json` — adapted to detected stack
2. `.devcontainer/Dockerfile`
3. `.devcontainer/compose.yml`
4. Set `appPort` in `devcontainer.json`
5. Confirm creation before continuing

Minimum structure:
```json
{ "name": "<project-name>", "dockerComposeFile": "compose.yml" }
```

Never init a project without devcontainer files.
