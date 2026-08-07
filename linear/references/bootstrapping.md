# Linear Self-Bootstrapping Guide

Use this guide when the `linear` skill is invoked in a repository that does not yet have a `.linear/team.json` or a mapping in `~/.agents/linear/profiles.json`.

## Bootstrapping Workflow

### Step 1: Identify Repository Remote

Derive the GitHub `owner/repository` string from the repository's Git remote:

```bash
git remote get-url origin
```

Example: `jjsizemore/moshpit`

### Step 2: Resolve Credential

Check `fnox` or environment for an active Linear API token:

```bash
fnox exec -- sh -c 'test -n "$LINEAR_API_TOKEN" && echo "Token present"'
```

If no token is available, stop and inform the user that `LINEAR_API_TOKEN` must be configured in `fnox` or the environment.

### Step 3: Query Accessible Teams

Run a GraphQL query against `https://api.linear.app/graphql` to discover available Linear teams:

```graphql
query DiscoverTeams {
  teams {
    nodes {
      id
      name
      key
    }
  }
}
```

### Step 4: Match Team and Persist Configuration

1. If a team key matches the repository name, product name, or configured team key, select it.
2. If only one team is returned from the query, auto-select it.
3. If multiple teams are returned and none clearly match, ask the user to choose the correct team key.
4. Write `<repo>/.linear/team.json`:

```json
{
  "teamKey": "<RESOLVED_TEAM_KEY>",
  "teamId": "<RESOLVED_TEAM_UUID>",
  "teamUrl": "https://linear.app/<workspace>/team/<RESOLVED_TEAM_KEY>/overview",
  "credentialEnv": "LINEAR_API_TOKEN"
}
```

5. Update `~/.agents/linear/profiles.json` to include the new repository mapping:

```json
{
  "repositories": {
    "<OWNER/REPO>": {
      "profile": "<REPO_NAME>",
      "teamKey": "<RESOLVED_TEAM_KEY>",
      "teamId": "<RESOLVED_TEAM_UUID>",
      "credentialEnv": "LINEAR_API_TOKEN",
      "auth": "personal-key",
      "endpoint": "https://api.linear.app/graphql"
    }
  }
}
```

### Step 5: Verification

Verify the bootstrap setup by executing a read-only query for the team's issues or details. Once verified, proceed with the user's requested Linear operation.
