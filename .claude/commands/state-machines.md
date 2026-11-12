---
description: Document the app's state machines, find reachable invalid states/transitions, fix them with regression tests
---

Find the app's explicit and implicit state machines and document their states, invariants, and transition tables in one file: `docs/STATE_MACHINES.md`.

Identify invalid states or transitions the code can actually reach, with evidence (`path:line`, call sequence), including through retries and concurrency.

Prioritize confirmed bugs by impact, group related fixes into issues, then fix them with regression tests and keep the document updated.

Workflow: `explorer` maps the machines, the main session plans and groups the issues, `fixer` patches one issue at a time, `checker` reviews each patch. $ARGUMENTS
