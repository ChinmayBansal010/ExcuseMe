# Release checklist

## Before a release

- [ ] Pull the latest branch and inspect the diff.
- [ ] Run backend tests from the backend directory.
- [ ] Run npm ci and npm run typecheck from mobile.
- [ ] Launch the API and verify /health, /api/v1/tools, and /docs.
- [ ] Run a short analysis for each changed operation.
- [ ] Test blank input, maximum input size, API offline state, and server errors.
- [ ] Check light and dark themes, narrow mobile widths, and desktop web layout.
- [ ] Confirm the frontend API URL for web, emulator, or physical device.
- [ ] Review dependency and model licence changes.
- [ ] Verify documentation and environment examples match the implementation.

## Release notes

Summarize user-visible changes, API changes, migrations, model changes, known limitations, and test results. Never claim a check passed unless it was executed successfully.
