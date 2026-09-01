# Quick API test flow

1. `POST /api/auth/login`
```json
{ "email": "demo@tailoredtofit.app", "password": "Password123!" }
```
2. Copy `token` from the response.
3. Add `Authorization: Bearer <token>` to protected requests.
4. `GET /api/clients`
5. `POST /api/clients/:id/measurements`
6. `GET /api/clients/:id/recommendations`
7. `POST /api/styles` to save a design.
