# Run state schema notes

See `../assets/ledger.schema.json`.

## Budget seal

- `maxIterations` + `budgetSealedAt` set only at `init`.
- `set-max` always fails after seal.
- Outer loop snapshots max into shell memory at process start.

## Formula

`min(30, max(10, storyCount * 2 + riskBonus))` with riskBonus 0–4 from tags / large boards.
