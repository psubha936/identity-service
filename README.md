# identity-service
Authentication, users, JWT, RBAC

## Runtime

- Node.js 20 or newer
- TypeScript in strict mode
- Express 5
- Default local port: `8081`
- Health endpoints: `GET /health` and `GET /ready`
- Role administration endpoint: `POST /roles` (normally called through the proxy)

The shared workspace port registry is stored at
`implementation/SERVICE_PORTS.md` from the FoodPulse workspace root.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm test
npm start
```

Copy `.env.example` to the ignored `.env` file only when overriding local
configuration. The committed default already uses port `8081`.

## Environment

| Key | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | Defaults to `development` |
| `HOST` | No | Defaults to `0.0.0.0` |
| `PORT` | No | Defaults to `8081` |
| `MONGODB_URI` | Yes | Identity database connection string |
| `MONGODB_DATABASE` | Yes | Identity database name |
| `REDIS_URL` | Yes | Session, rate-limit, and authorization-cache connection |
| `KAFKA_BROKERS` | Yes | Comma-separated Kafka bootstrap servers |
| `KAFKA_CLIENT_ID` | No | Defaults to `identity-service` |
| `AWS_PROFILE` | Local only | Named AWS CLI profile; deployed workloads should use an IAM role |
| `AWS_REGION` | Yes | Region shared by Cognito and S3 |
| `COGNITO_USER_POOL_ID` | Yes | Cognito user pool |
| `COGNITO_APP_CLIENT_ID` | Yes | Server-side Cognito app client |
| `COGNITO_APP_CLIENT_SECRET` | Only when configured | Secret for a Cognito app client that has one |
| `AWS_S3_DEFAULT_BUCKET` | Yes | Identity-owned profile/avatar bucket |
| `AWS_ACCESS_KEY_ID` | No | Optional local AWS credential-chain input |
| `AWS_SECRET_ACCESS_KEY` | No | Required only with an explicit access-key ID |
| `AWS_SESSION_TOKEN` | No | Required only for temporary explicit credentials |

Prefer a short-lived AWS CLI/Identity Center profile during local development and
an IAM role in deployed environments. The AWS SDK reads those through its standard
credential provider chain, so long-lived AWS keys do not need to be stored in
`.env`. Never commit the real `.env` file or log these values.

## Source layout

```text
src/
├── config/       # validated service configuration
├── enums/        # HTTP statuses and stable application error codes
├── errors/       # typed operational errors
├── middleware/   # request IDs, 404 handling, and centralized errors
├── routes/       # health/readiness and future service routes
├── utils/        # request parsing and validation helpers
├── types/        # API response contracts
├── app.ts        # Express composition without opening a port
├── bootstrap.ts  # HTTP server startup and graceful shutdown
└── index.ts      # executable entry point and .env loading
```

Build output is written to `dist/`. Error responses have one common shape and
include the `x-request-id` value for tracing. Domain routes and external client
connections use the shared `@subhaprakash/foodpulse-clients` package.

Create a custom role through the public proxy:

```bash
curl -X POST http://127.0.0.1:8080/api/v1/identity/roles \
  -H 'content-type: application/json' \
  -d '{"code":"restaurant_support","name":"Restaurant support","description":"Supports restaurant accounts","permissions":["restaurant.read","identity.user.read"]}'
```
