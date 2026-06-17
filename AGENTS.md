# Executions Agent
This is a web scrapping robot execution manager app.

## Testing and checking new features
These are all the things to do after finishing a coding task, don't do anything else after that.

- Run all unit and e2e tests.
- On new features, don't create tests new tests. Only create tests automatically when fixing bugs with TDD.
- Don't use browser automation libraries, mcps or skills to test changes.

## Package manager
Use `pnpm` as the package manager and scripts runner.

## Code quality and checks
Run the following check commands after any code changes:
- `pnpm run format`
- `pnpm run lint`
- `pnpm run typecheck`

Code quality you MUST follow:

- Always fix lint issues and don't disable linter rules only if completely necessary. Trust the changes made by the linter, do not revert them.
- Write simple and scalable code, don't overload components with business logic and extract it into separate lib, hooks, or services.
- Always use one source of truth for data types. If you need other data types derive them from the one source of truth. Trust the typescript types and interfaces, don't write runtime type checks like `if (typeof value === 'string') { ... }`. Always prefer type inference and let compiler catch type errors.
- Don't use magic strings or numbers, use named constants instead, and if it's going to be reused, extract it into a config file. E.g. query keys must be extracted into a separated config file based on the entity they are querying.
- Don't create big files, and if you find out modifying big files, split them into smaller ones with single responsability.
- Don't write small utility functions or methods that only contain a single expression or only a few lines of code. Instead write the functionality right where it's needed.


## Project structure
`/src/features`: Here you can find this app's core modules. Only read the interfaces (`index.ts`) when exploring, investigating a module's capabilities, needing a module reference, or adding a new feature module.

If a feature uses deep modules, follow this order before opening implementation files:
- `/src/features/<feature>/index.ts`
- `/src/features/<feature>/<deep-module>/index.ts`

Only dig into a deep module's implementation details when you are actively working in that deep module.

## Agent skills

### Important Project Domain docs

Single-context docs rooted at `CONTEXT.md` with ADRs under `docs/adr/`. See `docs/agents/domain.md`.
