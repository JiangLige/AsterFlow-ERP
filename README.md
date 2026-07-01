# Demo ERP

Demo ERP is an interview-ready ERP practice project with a Spring Boot backend and a Next.js frontend.

## Prerequisites

- Node.js 20+
- JDK 21
- MySQL 8+
- Redis 7+ only when `ERP_CACHE_TYPE=redis`

The backend includes Maven Wrapper, so Maven does not need to be installed separately.
If `mvnw.cmd` cannot find Java on Windows, set `JAVA_HOME` to your JDK 21 installation and add `%JAVA_HOME%\bin` to `Path`.

## Configuration

Copy `.env.example` to `.env` for local notes, then export the variables in your shell or IDE run configuration.

Important variables:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `ERP_CACHE_TYPE`
- `BACKEND_API_BASE_URL`
- `SPRINGDOC_API_DOCS_ENABLED`, `SPRINGDOC_SWAGGER_UI_ENABLED`

Local defaults are kept in `server/src/main/resources/application.yml` so the project remains easy to run during learning.

## Database

Initialize MySQL:

```bash
mysql -uroot -proot < server/src/main/resources/db/init.sql
```

Default accounts:

- `admin / admin123`
- `staff / user123`

## Development

Install frontend dependencies:

```bash
npm install
```

Run both apps:

```bash
npm run dev
```

Run frontend build:

```bash
npm run build:client
```

Run backend build:

```bash
npm run build:server
```

Open API documentation after the backend starts:

- Swagger UI: `http://localhost:3001/swagger-ui.html`
- OpenAPI JSON: `http://localhost:3001/v3/api-docs`

For protected endpoints in Swagger UI, click `Authorize` and enter `Bearer <JWT token>`.

On Windows you can also run:

```bash
cd server
mvnw.cmd test
```
