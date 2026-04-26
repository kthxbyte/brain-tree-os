# brain-tree-os for Codex

This directory contains the Codex plugin source for brain-tree-os.

## Scope

This integration is a local Codex plugin, not a CLI-installed command set. It exists alongside the OpenClaude plugin as a host-specific adapter over the core `brain-tree-os` CLI behavior.

## Layout

```
brain-tree-os-plugin/
  .agents/
    plugins/
      marketplace.json
  plugins/
    .codex-plugin/
      plugin.json
    skills/
      recover-braintree/
      init-braintree/
      resume-braintree/
      wrap-up-braintree/
      status-braintree/
      plan-braintree/
      sprint-braintree/
      sync-braintree/
      feature-braintree/
```

## Source of Truth

The live installed Codex plugin on this machine is the current source of truth:

- Plugin payload: `/home/salvador/plugins/brain-tree-os`
- Plugin registry: `/home/salvador/.agents/plugins/marketplace.json`

The files under `integrations/codex/brain-tree-os-plugin/` are the source-controlled copy of that local install.

## Notes

- This setup was installed manually.
- There is intentionally no installer script here yet.
- If the live local Codex plugin changes, this source-controlled copy should be updated to match it verbatim.
- The Codex plugin uses `.codex-plugin/`, while the OpenClaude plugin uses `.claude-plugin/`; that difference is host-specific and expected.
