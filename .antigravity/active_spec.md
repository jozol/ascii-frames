---
command: "npm test && npm run typecheck"
---

# Active Specification: Hard Harness Baseline Verification

## Verification Command
```bash
npm test && npm run typecheck
```

## Objective
Verify repository baseline integrity against the Vitest test suite and TypeScript typechecking.

## Architectural Invariants
- `src/core/` maintains zero DOM/UI dependencies.
- All unit tests in `tests/` pass with exact UTF-8 snapshot equality.
- TypeScript compiler produces zero diagnostics (`tsc --noEmit`).

## Implementation Checklist
- [x] Detect repository stack and tooling (Node.js, npm, Vitest, TypeScript).
- [x] Scaffold `scripts/harness_gate.sh` with subshell isolation, 120s timeout, and tail-40 error logging.
- [x] Scaffold `.antigravity/workflow.yaml` defining the 4-stage pipeline.
- [x] Scaffold `.antigravity/rules/planner.md` (read-only inspection, spec & checklist generation).
- [x] Scaffold `.antigravity/rules/coder.md` (forbid completion declaration, direct fix on stderr).
- [x] Scaffold `.antigravity/rules/reviewer.md` (diff-only verification, binary APPROVED/REJECTED output).
- [x] Execute dry-run test of `scripts/harness_gate.sh` on existing test suite.
