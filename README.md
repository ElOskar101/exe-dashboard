## Environment variables

Create `.env.development` for local app runtime config. Production values can
live in `.env.production`.

```bash
VITE_SOCKET_URL=
VITE_URL_LOGIN=
```

- `VITE_SOCKET_URL`: Socket.IO server URL.
- `VITE_URL_LOGIN`: External login app URL used when a protected route has no
  token.

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
