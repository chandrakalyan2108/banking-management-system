# 🏦 Banking Management System

A secure, scalable, microservices-based Banking Management System built with **React**, **Spring Boot**, **PostgreSQL**, **Redis**, **Nginx**, **Docker**, and deployed via **GitHub Actions CI/CD** to **AWS (EC2, ECR, ALB)**.

## Architecture

```
                         USERS
                           │
              APPLICATION LOAD BALANCER ── Target Group (/health)
                           │
                    Nginx (Reverse Proxy)
                           │
     ┌───────────┬─────────────┬──────────────┬──────────────┐
 AUTH SERVICE  CUSTOMER    ACCOUNT       TRANSACTION     NOTIFICATION
  (8081)       SERVICE     SERVICE        SERVICE          SERVICE
               (8082)      (8083)          (8084)           (8085)
     └───────────┴─────────────┴──────────────┴──────────────┘
                           │
                 PostgreSQL  ◄──►  Redis (Cache)
```

## Key Features
- User Registration & Authentication (JWT)
- Customer Management (KYC)
- Account Management (open/close, multiple account types)
- Deposit & Withdrawal
- Fund Transfer (with compensating rollback on failure)
- Transaction History
- Email/SMS Notifications
- Redis caching on account reads
- Health checks for ALB Target Group

## Technology Stack
| Layer | Technology |
|---|---|
| Frontend | React JS |
| Backend | Spring Boot 3 (Java 17) |
| Database | PostgreSQL |
| Cache | Redis |
| Container | Docker |
| Orchestration | Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS (EC2, ECR, ALB) |
| Web Server | Nginx (reverse proxy) |
| Version Control | GitHub |

## Project Structure
```
banking-management-system/
├── frontend/                  # React JS app
├── auth-service/              # Port 8081 - registration, login, JWT
├── customer-service/          # Port 8082 - customer profile, KYC
├── account-service/            # Port 8083 - accounts, balances, Redis cache
├── transaction-service/       # Port 8084 - transfers, transaction history
├── notification-service/      # Port 8085 - email/SMS notifications
├── nginx/                     # Reverse proxy config
├── db/init.sql                # DB bootstrap reference
├── docker-compose.yml
├── .github/workflows/deploy.yml
├── .env.example
└── README.md
```

## Running Locally

1. **Prerequisites**: Docker & Docker Compose installed.
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Start everything:
   ```bash
   docker compose up -d --build
   ```
4. Open the app: **http://localhost** (routed through Nginx)
   - Or hit services directly: `localhost:8081`–`8085`
5. Check health: `http://localhost/health`

To stop: `docker compose down` (add `-v` to also wipe DB/Redis volumes).

## Running Services Individually (development)

Each service is a standalone Maven project:
```bash
cd auth-service
mvn spring-boot:run
```
Make sure PostgreSQL and Redis are running locally (or via `docker compose up postgres redis -d`).

Frontend:
```bash
cd frontend
npm install
npm start
```

## API Overview

**Auth Service** (`/api/auth`)
- `POST /register` – create user, returns JWT
- `POST /login` – authenticate, returns JWT
- `GET /validate?token=` – validate a JWT

**Customer Service** (`/api/customers`)
- `POST /` – create customer profile
- `GET /{id}`, `GET /user/{userId}`, `GET /`
- `PATCH /{id}/kyc` – update KYC status

**Account Service** (`/api/accounts`)
- `POST /` – open account
- `GET /{id}`, `GET /customer/{customerId}`
- `POST /{id}/deposit`, `POST /{id}/withdraw`
- `PATCH /{id}/close`

**Transaction Service** (`/api/transactions`)
- `POST /transfer` – transfer between accounts (with rollback on failure)
- `GET /account/{accountId}` – transaction history

**Notification Service** (`/api/notifications`)
- `POST /send` – send email/SMS notification
- `GET /customer/{customerId}` – notification log

## CI/CD Pipeline

`.github/workflows/deploy.yml` implements:
1. Developer pushes code → GitHub repository
2. GitHub Actions: checkout → run unit tests → build Docker images
3. Push images to Amazon ECR
4. SSH deploy to EC2: `docker compose pull && docker compose up -d`
5. Health check against the ALB Target Group confirms the app is live

Required GitHub Secrets: `AWS_ACCOUNT_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`, `ALB_DNS_NAME`.

## Security
- Spring Security + JWT (stateless) on auth-service
- BCrypt password hashing
- Secrets via environment variables (never committed — see `.env.example`)
- CORS restricted at the Nginx/gateway layer in production (currently `*` for local dev — tighten before going live)

## Notes on This Scaffold
This is a complete, runnable starting codebase matching the architecture diagram — not a finished production system. Before deploying to real users you should add: inter-service auth (mTLS or service tokens instead of open REST calls), request validation hardening, database migrations (Flyway/Liquibase instead of `ddl-auto: update`), and proper IAM/Secrets Manager integration on AWS.
