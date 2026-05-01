# brain-tree-os Integrations

> "Write once, host anywhere."

This directory contains host-specific adapters that extend the `brain-tree-os` ecosystem to various AI environments. While the core CLI provides the logic, these integrations provide the native "skin" and instruction sets required by different hosts.

## Core Philosophy

All integrations in this folder follow a shared architectural pattern:
1. **Host-Specific Entry Points**: Whether it's a `.md` command file, a `SKILL.md` file, or a JSON-based plugin manifest, the host-facing layer is kept minimal.
2. **Standardized Instruction Set**: Every integration provides the same set of 9 commands (`init`, `resume`, `wrap-up`, etc.), ensuring a consistent experience across hosts.
3. **CLI-Powered Logic**: All complex filesystem operations and logic are delegated to the `brain-tree-os` CLI. This prevents logic duplication and ensures that a "brain" created in one host is fully compatible with any other.

## Supported Hosts

| Host | Integration Type | Location |
|---|---|---|
| **Claude Code** | Markdown Commands | `packages/cli/claude/` |
| **OpenCode** | Markdown Commands | `packages/cli/opencode/` |
| **OpenClaude** | Local Plugin | `integrations/openclaude/` |
| **Codex** | Local Plugin | `integrations/codex/` |
| **Gemini CLI** | Gemini Skills | `integrations/gemini/` |

## Navigation

- [OpenClaude Plugin](./openclaude/README.md) - Documentation for the Windows-validated OpenClaude plugin.
- [Codex Plugin](./codex/README.md) - Local plugin source and manual install notes for Codex.
- [Gemini Skills](./gemini/README.md) - Native Gemini skill implementations.

## Usage in a Multi-Host Environment

Because all hosts use the same `brain-tree-os` CLI under the hood, you can seamlessly switch between them:
- Start a brain with `/brain-tree-os:init-braintree` in **Gemini**.
- Update the execution plan in **Claude Code**.
- Perform a weekly sprint review in **OpenClaude**.
- Wrap up the session in **Codex**.

The brain remains the single source of truth; the hosts are just different windows into the same intelligence.

## Note on Distribution

These integrations are maintained as part of a personal fork focused on cross-platform utility and multi-host flexibility. They are intended for local use and manual installation rather than marketplace publication.
