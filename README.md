## Environment variables

Create `.env.development` for local app runtime config. Production values can
live in `.env.production`.

```bash
VITE_API_URL=
VITE_EXE_API_URL=
VITE_PICTURES_URL=
VITE_SOCKET_URL=
VITE_URL_LOGIN=
```

- `VITE_API_URL`: Base URL for the main API, used for auth user data and
  customer requests.
- `VITE_EXE_API_URL`: Base URL for execution-related API requests. Use
  `/execution-api` so local development uses the Vite proxy and production uses
  the Vercel rewrite to `https://api.controlcentralcarrier.com/api/v1`.
- `VITE_PICTURES_URL`: Base URL used to load user profile images.
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
