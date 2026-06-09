# Skyline Airways — Backend Service

Minimal Express backend for the Skyline Airways demo app.

## Prerequisites

- Node.js ≥ 18 (Node 20 recommended)
- npm

## Install

```bash
cd backend
npm install
```

## Run

```bash
npm start
```

The server starts on port **3000** by default. Override with the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Endpoints

### `GET /api/health`

Returns HTTP `200` with a JSON body confirming the service is reachable.

**Response**

```json
{
  "status": "ok",
  "timestamp": "2026-06-09T12:34:56.789Z"
}
```

`timestamp` is an ISO-8601 UTC string generated fresh on each request.

## Notes

- The backend is a self-contained package under `backend/`. It shares no dependencies with the frontend.
- Root `.gitignore` already ignores `node_modules/` at any depth, so `backend/node_modules/` is covered.
- CORS is not configured in this initial version. A future ticket will add `cors` middleware when the frontend begins calling this service.
