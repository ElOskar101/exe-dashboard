## Package manager
Use `pnpm` as the package manager and scripts runner.

## Checks
Run the following check commands after any code changes:
- `pnpm run format`
- `pnpm run lint`
- `pnpm run typecheck`

Always try to fix lint issues and don't disable linter rules only if completely necessary.

## Project structure
`/src/features`: Here you can find this app's core modules. Only read the interfaces (`index.ts`) when exploring, investigating a module's capabilities, needing a module reference, or adding a new feature module.

If a feature uses deep modules, follow this order before opening implementation files:
- `/src/features/<feature>/index.ts`
- `/src/features/<feature>/<deep-module>/index.ts`

Only dig into a deep module's implementation details when you are actively working in that deep module.
