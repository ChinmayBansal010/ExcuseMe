# Contributing

## Change scope

Prefer focused changes that solve a user-visible problem or strengthen a testable contract. Avoid unrelated formatting churn and do not split one trivial change into multiple commits merely to inflate history.

## Before opening a pull request

1. Describe the problem and expected behavior.
2. Add or update tests for behavior changes.
3. Run relevant backend tests and frontend typecheck.
4. Update user-facing documentation if commands, configuration, limitations, or API responses change.
5. Review the complete diff for accidental secrets, local paths, generated model files, and unrelated edits.

## Model changes

State the model identifier, intended task, limitations, and evaluation evidence. Do not describe raw zero-shot scores as calibrated probabilities. Avoid claims that linguistic analysis can determine honesty or intent.

## Commit messages

Use concise imperative messages such as test: cover blank search queries or docs: clarify local API configuration. Each commit should represent a coherent change that can be reviewed independently.
