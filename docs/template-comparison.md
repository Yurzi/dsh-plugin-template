# Existing Template Comparison

Audited against DeepSeek Harness `3f1b46a5db011ca1d167f2231c9444dd1d51a66a` (release `0.1.2-alpha.2`).

| Area | bugmaker2 | kun2-5code | sunshine-lang | This template |
| --- | --- | --- | --- | --- |
| Audit commit | `31af7eb` | `0b4fbda` | `6417045` | harness-derived |
| Shape | Dual host/client, Typert, React | Six host shapes, 14 UI surfaces | Minimal host-only tool | Small host/tool plus optional UI/Settings |
| Build | esbuild + tsc | tsdown + loader wrapper | tsc only | tsc declarations + tsdown adapter |
| Tests | Vitest contracts/runtime | One build smoke | Unwired integration file | Vitest + build + tarball gate |
| Publish gate | check, no packed consumer | prepare only | none | prepublish check and pack extraction |
| Scaffolding | Manual rename checklist | Fork/edit | Script with weak exclusions | Validated name, excludes VCS/build state |
| DSH baseline | old rc.6, wildcard peers | rc.5/rc.6, obsolete settings docs | rc.1 tools | 0.1.2-alpha.2 baseline |

## Assessment

### bugmaker2/dsh-plugin-template

The strongest contract-oriented example. Shared Zod/Typert descriptors, lifecycle handling, React, i18n, lint and CI are useful. Its handwritten loader, duplicated manifest, wildcard optional peers, manual ten-point rename, old rc.6 baseline, and missing packed-consumer gate increase drift risk.

### kun2-5code/dsh-plugin-template

The best catalog of extension shapes and UI slots, useful as an API showcase rather than a minimal production baseline. Its README still describes a settings whitelist and internal paths absent from the current settings controller. It lacks lint, Vitest, package verification, compatibility engines, and prepublish checks.

### sunshine-lang/dsh-plugin-template

The clearest host-only starter and only compared repository with a scaffold script. Its exports and tool example are sound, but it lacks client/RPC/UI, package exports, peer separation, typecheck/test/publish gates, and a wired integration test. Its scaffold may copy `lib` and handles arguments weakly.

## Material differences here

- Internal package files are evidence, while nonportable monorepo machinery is called out explicitly.
- One example is kept per important boundary instead of maximizing feature count.
- Standard `ctx.settings.installSection` and `settings.plugin.item` pairing is supported out of the box.
- Client externals derive from peers and the ModuleLoader compatibility adapter is isolated.
- The exact tarball is extracted and checked.
- Host-only deletion and deterministic scaffolding are documented.
