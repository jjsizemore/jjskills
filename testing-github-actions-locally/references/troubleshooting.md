# Troubleshooting

## Unsupported platform skipped

If act logs `Skipping unsupported platform`, map custom runner labels with `-P`, for example:

```bash
-P ubicloud-standard-2=node:20-bullseye
```

## Reusable workflow did not run directly

When the target workflow uses `workflow_call`, run the caller workflow/job that invokes it.

## Permission or token differences

Local `act` token context may differ from GitHub-hosted runs. Validate behavior-level outputs and policy logs locally, then verify final CI behavior in GitHub.

## Docker failures

If Docker is unavailable or socket permissions fail, local act validation cannot proceed.
