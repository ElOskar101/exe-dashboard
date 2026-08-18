## App configuration

The production app runtime does not require custom environment variables.
(CI/E2E may still set `VITE_*`/`E2E_*` variables.)

The auth login URL and fixed CCC API URLs are defined in `src/app.config.ts`.
Execution API URLs are still selected at runtime from the Playwright runtime catalog and persisted in the page URL.

## Docker

Build and start the production-like container with Docker Compose:

```bash
docker compose up --build
```

The app will be available at `http://localhost:8080`.

To stop it:

```bash
docker compose down
```

To rebuild after code changes:

```bash
docker compose up --build
```

## E2E tests

Create `.env.e2e.local` with the test login credentials and auth endpoint:

```bash
E2E_AUTH_LOGIN_URL=.../api/v2/auth/login
E2E_TEST_USERNAME=
E2E_TEST_PASSWORD=
```

Then run:

```bash
pnpm run test:e2e
```

If Playwright cannot install its browser on your machine, use an installed Chromium binary instead:

```bash
PW_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium pnpm run test:e2e
```

This fallback runs with one worker for better stability with system-installed browsers. When
`PW_CHROMIUM_EXECUTABLE_PATH` is not set, Playwright uses its default managed browser and worker settings.
