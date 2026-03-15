# Claude Code — Project Instructions

## Git Branching SOP (Standard Operating Procedure)

Every new feature, fix, or task **must** follow this workflow:

```
1. Switch to develop and pull latest
   git checkout develop
   git pull origin develop

2. Create a new branch from develop
   git checkout -b feature/<short-description>
   # Examples:
   #   feature/payment-retry
   #   fix/cart-session-bug
   #   chore/update-dependencies

3. Do your work, commit often with clear messages

4. When done, push the feature branch
   git push origin feature/<short-description>

5. Open a PR into develop (NOT main)

6. After PR is merged, delete the feature branch

7. Releases to production are merged from develop → main
```

### Branch naming conventions

| Prefix | When to use |
|--------|-------------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `security/` | Security patches |
| `chore/` | Maintenance, deps, config |
| `docs/` | Documentation only |

### Rules

- **Never commit directly to `develop` or `main`**
- **Never branch from `main`** — always branch from `develop`
- Always `git pull origin develop` before creating a new branch
- PRs require at least one review before merging into `develop`
- `main` is production — only merge via release PR from `develop`
