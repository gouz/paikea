## Project Creation — Mandatory Rule

When creating any new project, you MUST always generate a devcontainer before anything else:

1. Create a `.devcontainer/devcontainer.json` file adapted to the detected stack.
2. Create a `.devcontainer/Dockerfile` file.
3. Create a `.devcontainer/compose.yml` file.
4. Define the `appPort` in `.devcontainer/devcontainer.json`
5. Confirm the creation of the devcontainer before continuing.

### Docker creation

A devcontainer must be generated with a Dockerfile and a docker compose

### Minimum Expected Structure
```json
{
  "name": "<project-name>",
  "dockerComposeFile": "compose.yml",
}``

Never initialize a project without this file. If the project type is ambiguous, request the runtime before starting.
