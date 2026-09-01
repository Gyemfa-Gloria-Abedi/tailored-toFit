# Tailored toFit API

Backend API for the Tailored toFit React Native mobile application.

## Stack

- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Zod validation

## Database strategy

This project uses **PostgreSQL from the beginning**. Do not use SQLite or Docker for the database.

There are two database environments:

1. **Local PostgreSQL** on your Windows development machine.
2. **Hosted PostgreSQL** for the test deployment (for example, Supabase PostgreSQL).

The Prisma schema is the same in both environments. This means the database structure you test locally is the same structure you deploy.

## 1. Install PostgreSQL on Windows

Download PostgreSQL from the official PostgreSQL Windows installer page:

https://www.postgresql.org/download/windows/

During installation:

- Keep port `5432`.
- Install pgAdmin 4.
- Set a password for the `postgres` user and keep it safe.

Verify from a new PowerShell window:

```powershell
psql --version
```

If PowerShell says `psql` is not recognized, add the PostgreSQL `bin` directory to your Windows PATH, or use SQL Shell (psql) from the Start menu.

## 2. Create the local database

Using pgAdmin:

1. Open pgAdmin.
2. Connect to your local PostgreSQL server.
3. Right-click **Databases**.
4. Select **Create → Database**.
5. Set the database name to:

```text
tailored_tofit
```

Alternatively, from SQL Shell:

```sql
CREATE DATABASE tailored_tofit;
```

## 3. Configure the backend

Copy `.env.example` to `.env`.

```powershell
Copy-Item .env.example .env
```

Then set:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tailored_tofit"
JWT_SECRET="use-a-long-random-secret"
PORT=4000
CORS_ORIGIN="*"
```

Replace `YOUR_PASSWORD` with the password you chose during PostgreSQL installation.

Do not commit `.env` to Git.

## 4. Install and initialize Prisma

From this backend directory:

```powershell
npm install
npm run prisma:generate
npm run db:check
npm run prisma:migrate
npm run seed
```

`npm run db:check` should print:

```text
PostgreSQL connection successful.
```

The migration creates all Tailored toFit tables in PostgreSQL.

## 5. Start the API

```powershell
npm run dev
```

The API runs at:

```text
http://localhost:4000
```

Test it with:

```powershell
Invoke-RestMethod http://localhost:4000/health
```

You should receive a response similar to:

```json
{
  "ok": true,
  "service": "tailored-tofit-api",
  "version": "1.0.0"
}
```

## Demo account

The seed creates:

- Email: `demo@tailoredtofit.app`
- Password: `Password123!`

## Main endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard
- `GET /api/dashboard`

### Clients
- `GET /api/clients?search=`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

### Measurements / fit analysis
- `POST /api/clients/:id/measurements`
- `GET /api/clients/:id/measurements`
- `POST /api/clients/:id/fit-profile/generate`
- `GET /api/clients/:id/recommendations`

### Saved styles
- `GET /api/styles`
- `POST /api/styles`
- `DELETE /api/styles/:id`

### Tailor profile
- `GET /api/profile`
- `PATCH /api/profile`

## React Native connection

The mobile app sends the JWT returned by `/api/auth/login` as:

```text
Authorization: Bearer <token>
```

For a physical phone, do not use `localhost`. Set the mobile API base URL to the LAN IP of the computer running the backend, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000
```

## Hosted testing database

For hosted testing, create a PostgreSQL project with a managed provider such as Supabase. Supabase provides PostgreSQL connection strings through its **Connect** panel.

For a persistent Node/Express server, use a direct connection when the hosting environment supports it, or Supabase's Session Pooler when an IPv4-only environment requires it. For migrations, use the direct database connection where available.

Keep the hosted database password and connection string in the backend host's environment variables. Never put the database URL or password in the React Native app.

Typical hosted environment variables:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=4000
CORS_ORIGIN="https://your-allowed-origin.example"
```

After deploying the backend, run the production migration command from the deployment pipeline or a secure admin environment:

```powershell
npx prisma migrate deploy
```

Then seed only if you intentionally want demo data in the hosted environment:

```powershell
npm run seed
```

## Production checklist

- Use a managed PostgreSQL database.
- Use HTTPS for the API.
- Set a strong, unique `JWT_SECRET`.
- Restrict `CORS_ORIGIN` to the mobile/web clients that should access the API.
- Store uploaded images in object storage rather than PostgreSQL.
- Keep database credentials only in backend environment variables.
- Run `prisma migrate deploy` during deployment.
- Do not use the demo account for real customer data.
