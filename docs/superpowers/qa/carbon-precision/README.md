# Carbon Precision browser QA evidence

This directory contains the final rendered evidence for the Carbon Precision
redesign.

## Runtime

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Browser: isolated headless Google Chrome `150.0.7871.187`
- Automation: the Codex bundled Playwright runtime
- Locale: `zh-CN`
- Authentication: the visible login form with `admin / 123456`
- Credential inspection: no cookie, local storage value, session storage
  value, or token was read

## Controlled data

The dashboard used the running local backend. Read-only browser interception
supplied deterministic list and form options for:

- `GET /api/products`
- `GET /api/purchase-orders`
- `GET /api/suppliers`

Every fixture used the same API envelope consumed by `apiRequest`:
`{ "success": true, "data": ... }`. No create, approve, cancel, or delete
request was confirmed during this evidence run.

## Evidence contract

`browser-qa-log.json` is the machine-readable route matrix. Each case records:

- route and exact viewport;
- document and API response statuses;
- page-level horizontal containment;
- route-specific rendered DOM assertions;
- browser console warnings and errors;
- page errors, request failures, and HTTP responses at or above 400.

The final run contains 11 passing cases. It reports zero console issues, zero
page errors, zero request failures, and zero HTTP errors.

`products-mobile.jpg` is the required 390x844 rendered product table. The log
records a 1120px table inside a 356px Carbon scrolling container while the
390px page itself remains horizontally contained.

## Replay outline

1. Start the backend from `server` with `.\mvnw.cmd spring-boot:run`.
2. Start the frontend from the repository root with
   `npm run dev --workspace client`.
3. Launch a fresh isolated Chrome context at each viewport in
   `browser-qa-log.json`.
4. Authenticate through `/login`.
5. Apply the three read-only fixture routes above with the documented success
   envelope.
6. Navigate to each recorded route, wait for its named heading or fixture row,
   then collect DOM containment, console, page-error, request-failure, and
   response-status results.
