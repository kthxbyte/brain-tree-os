# brain-tree-os for OpenClaude

This folder contains an [OpenClaude](https://github.com/OpenClaude-project/openclaude) plugin that brings the full brain-tree-os command suite to OpenClaude's plugin system.

## Background

brain-tree-os was originally designed for Claude Code, where commands are distributed as `.md` files installed into the user's `.claude/commands/` directory. OpenClaude uses a different extension model: plugins, where each skill is a `SKILL.md` file bundled in a plugin directory.

To port brain-tree-os to OpenClaude, each of the 8 brain commands was converted into a `SKILL.md` file following OpenClaude's skill format. The internal logic of each command is identical to the original — they still rely on the `brain-tree-os` CLI binary for filesystem operations (`find-brain`, `uuid`, `now`, `home`, etc.) — but the entry point and namespace follow the OpenClaude plugin convention.

The plugin was validated on Windows using OpenClaude with the DeepSeek provider and the `jan-nano-4b` model, both of which support tool use.

## Plugin Structure

```
brain-tree-os-plugin/
  .claude-plugin/
    plugin.json              # Plugin metadata and namespace
  skills/
    init-braintree/
      SKILL.md               # /brain-tree-os:init-braintree
    resume-braintree/
      SKILL.md               # /brain-tree-os:resume-braintree
    wrap-up-braintree/
      SKILL.md               # /brain-tree-os:wrap-up-braintree
    status-braintree/
      SKILL.md               # /brain-tree-os:status-braintree
    plan-braintree/
      SKILL.md               # /brain-tree-os:plan-braintree
    sprint-braintree/
      SKILL.md               # /brain-tree-os:sprint-braintree
    sync-braintree/
      SKILL.md               # /brain-tree-os:sync-braintree
    feature-braintree/
      SKILL.md               # /brain-tree-os:feature-braintree
```

## Prerequisites

1. **OpenClaude** installed and working.
2. **Node.js** (v18 or later) installed.
3. **brain-tree-os CLI** installed globally:
   ```bash
   # From the repo root
   cd packages/cli
   npm install
   npm run build
   npm install -g .

   # Or from npm (once published)
   npm install -g brain-tree-os
   ```
   Verify the install:
   ```bash
   brain-tree-os uuid
   # Should print a valid UUID
   ```
4. A **provider with tool use support** configured in OpenClaude. DeepSeek works well:
   ```
   /provider deepseek
   ```
   Then set your API key when prompted.

## Running the Plugin

Pass the plugin directory to OpenClaude at startup using the `--plugin-dir` flag:

```bash
# Linux / macOS
openclaude --plugin-dir /path/to/brain-tree-os/openclaude/brain-tree-os-plugin

# Windows CMD
openclaude --plugin-dir C:\path\to\brain-tree-os\openclaude\brain-tree-os-plugin
```

Once loaded, all 8 skills are available under the `/brain-tree-os:` namespace:

| Command | Description |
|---|---|
| `/brain-tree-os:init-braintree` | Create a new brain from scratch |
| `/brain-tree-os:resume-braintree` | Resume from your last session |
| `/brain-tree-os:wrap-up-braintree` | End the session with a handoff note |
| `/brain-tree-os:status-braintree` | View progress dashboard |
| `/brain-tree-os:plan-braintree` | Plan a specific step |
| `/brain-tree-os:sprint-braintree` | Plan the week's work |
| `/brain-tree-os:sync-braintree` | Health check and sync |
| `/brain-tree-os:feature-braintree` | Plan a new feature |

## Recommended Setup (Windows)

Create a batch file so you don't have to type the flag every time:

```bat
@echo off
openclaude --plugin-dir "%~dp0brain-tree-os-plugin" %*
```

Save it as `openclaude-brain.bat` and run it instead of `openclaude`.

## Notes

- Skills call `brain-tree-os <subcommand>` via Bash tool use. Your model must support tool use — not all local models do. DeepSeek API and `jan-nano-4b` are confirmed working.
- The plugin does not modify any OpenClaude configuration files; it is loaded transiently via `--plugin-dir`.
- All brain data is stored locally on your filesystem; nothing is sent to any external service beyond your chosen LLM provider.
