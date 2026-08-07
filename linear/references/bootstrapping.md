# Linear Self-Bootstrapping Guide

Use this guide when the `linear` skill is invoked in a repository that does not yet have a `.linear/team.json` or a mapping in `~/.agents/linear/profiles.json`.

## Non-Guessing Policy

- **NEVER guess or auto-select a team** based on repository name, directory name, product name, or because only one team was returned by the API.
- **Auto-bootstrap is permitted ONLY** when an explicit, authoritative team URL or explicit team identifier is supplied directly by the user/operator for that repository.
- **Explicit selection is REQUIRED** when no explicit mapping exists: present the organization and available teams to the user and require confirmation before persisting configuration.

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

If no token is available, stop and report that `LINEAR_API_TOKEN` must be configured in `fnox` or the environment.

### Step 3: Query Organization and Teams

Run a GraphQL query against `https://api.linear.app/graphql` to discover the organization workspace slug and available teams:

```graphql
query DiscoverTeamsAndOrganization {
  organization {
    name
    urlKey
  }
  teams {
    nodes {
      id
      name
      key
    }
  }
}
```

### Step 4: Team Selection and Configuration Persistence

1. **If explicit authoritative input was provided** (e.g. `https://linear.app/moshpit/team/MOSH/overview` or `MOSH` team key/ID specified by the user):
   - Match the provided key/ID against the API response `teams.nodes`.
2. **If no explicit input was provided**:
   - Present the workspace name (`organization.name`), workspace slug (`organization.urlKey`), and the list of available teams (key, name, stable UUID).
   - Require explicit selection from the user/operator before proceeding. Never auto-select.
3. **Construct `teamUrl`**:
   - Use the resolved `organization.urlKey` and `teamKey`:
     `https://linear.app/${organization.urlKey}/team/${teamKey}/overview`
4. **Write `<repo>/.linear/team.json`**:

```json
{
  "teamKey": "<SELECTED_TEAM_KEY>",
  "teamId": "<SELECTED_TEAM_UUID>",
  "teamUrl": "https://linear.app/<URL_KEY>/team/<SELECTED_TEAM_KEY>/overview",
  "credentialEnv": "LINEAR_API_TOKEN"
}
```

5. **Update `~/.agents/linear/profiles.json`**:

```json
{
  "repositories": {
    "<OWNER/REPO>": {
      "profile": "<REPO_NAME>",
      "teamKey": "<SELECTED_TEAM_KEY>",
      "teamId": "<SELECTED_TEAM_UUID>",
      "credentialEnv": "LINEAR_API_TOKEN",
      "auth": "personal-key",
      "endpoint": "https://api.linear.app/graphql"
    }
  }
}
```

### Step 5: Verification

Verify the bootstrap setup by executing a read-only query for the selected team's details. Once verified, proceed with the requested Linear operation.
