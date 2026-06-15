# Executions Agent
This is a web scrapping robot execution manager app.

## Instructions for testing changes
After finished an entire coding task run unit and e2e tests.

Assume this project's dev server is already started with `pnpm run dev`.

On new features, don't create tests for them and instead use the most reliable end-user browser skill, plugin or MCP to make sure the feature works as expected (only on frontend changes which user will see).

To authenticate to this app use the credentials and login endpoint in .env.e2e.local to get a valid token and set it in local storage as 'token'. Do this only if the browser tool you chose redirect you to the login page automatically.

## Package manager
Use `pnpm` as the package manager and scripts runner.

## Code quality and checks
Run the following check commands after any code changes:
- `pnpm run format`
- `pnpm run lint`
- `pnpm run typecheck`

Always try to fix lint issues and don't disable linter rules only if completely necessary.
Trust the changes made by the linter, do not revert them.

Trust typescript types and interfaces, don't write runtime type checks like `if (typeof value === 'string') { ... }`. Always use type inference and let compiler catch type errors.

## Project structure
`/src/features`: Here you can find this app's core modules. Only read the interfaces (`index.ts`) when exploring, investigating a module's capabilities, needing a module reference, or adding a new feature module.

If a feature uses deep modules, follow this order before opening implementation files:
- `/src/features/<feature>/index.ts`
- `/src/features/<feature>/<deep-module>/index.ts`

Only dig into a deep module's implementation details when you are actively working in that deep module.

## Agent skills

### Domain docs

Single-context docs rooted at `CONTEXT.md` with ADRs under `docs/adr/`. See `docs/agents/domain.md`.
