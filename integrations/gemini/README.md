# brain-tree-os for Gemini

This folder contains the Gemini skills that bring the full `brain-tree-os` command suite to the Gemini CLI.

## Background

Gemini uses a skill-based extension system. Each skill is a `SKILL.md` file (optionally with frontmatter) that provides specialized instructions and tool access to the model.

This port converts the 9 original `brain-tree-os` commands into Gemini skills. Like the OpenClaude and Codex ports, these skills rely on the `brain-tree-os` CLI binary for filesystem operations, but provide a native Gemini experience.

## Skill Structure

Each folder contains a `SKILL.md` file:
- `init-braintree/`
- `recover-braintree/`
- `resume-braintree/`
- `wrap-up-braintree/`
- `status-braintree/`
- `plan-braintree/`
- `sprint-braintree/`
- `sync-braintree/`
- `feature-braintree/`

## Prerequisites

1. **Gemini CLI** installed and working.
2. **brain-tree-os CLI** installed globally:
   ```bash
   cd packages/cli
   npm install
   npm run build
   npm install -g .
   ```

## Installation in Gemini

To use these skills in Gemini, you can point your Gemini configuration to this directory or copy the skill folders into your Gemini skills path (typically `~/.gemini/skills/`).

## Usage

Once activated, the skills are available as commands:
- `/brain-tree-os:resume-braintree`
- `/brain-tree-os:status-braintree`
- ... etc.
