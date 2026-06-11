## Environment variables

Create `.env.development` for local app runtime config. Production values can
live in `.env.production`.

```bash
VITE_URL_LOGIN=
```

- `VITE_URL_LOGIN`: External login app URL used when a protected route has no
  token.

The Carrier auth/user API URL is fixed in `src/app.config.ts`. Execution API
URLs are selected at runtime from the Playwright runtime catalog and persisted
in the page URL.

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
