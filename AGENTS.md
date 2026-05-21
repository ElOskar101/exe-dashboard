## Package manager
Use `pnpm` as the package manager and scripts runner.

## Checks
Run the following check commands after any code changes:
- `pnpm run format`
- `pnpm run lint`
- `pnpm run typecheck`

Always try to fix lint issues and don't disable linter rules only if completely necessary.

## Project structure
`/src/features`: Here you can find this app's core modules. Only read the interfaces (index.ts) when exploring, investigating a module capabilities, needing a module reference or adding a new feature module. 
You can dig into a module's implementation details only when you are working on it.
