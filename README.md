# CryptoPasta

CryptoPasta is a full-stack cryptocurrency portfolio and trading application. It combines a React web interface with a Spring Boot REST API and a MySQL database.

> **Important:** CryptoPasta is a software project, not a financial service or investment recommendation. It has not been presented as production-ready financial software. Do not use real funds or production credentials while evaluating it.

## Features

- Account signup and sign-in, with JWT-based authentication
- Two-factor authentication and password recovery flows
- Cryptocurrency market browsing, search, and individual asset views
- Portfolio, order activity, and watchlist views
- Wallet, transfers, payment details, and withdrawal flows
- Admin withdrawal-management screen
- AI chatbot integration

The availability of individual features depends on the required database and external-service configuration.

## Technology

**Backend**

- Java 21
- Spring Boot 4.1
- Spring Web MVC, Spring Security, and Spring Data JPA
- MySQL
- Maven

**Frontend**

- React 19
- Vite
- Redux
- React Router
- Axios

## Repository layout

```text
CryptoPasta/
├── src/                  # Spring Boot backend
├── pom.xml               # Backend Maven configuration
├── mvnw, mvnw.cmd        # Maven wrapper
└── CryptoPasta-React/    # React + Vite frontend
```

## Prerequisites

- Java 21
- Node.js and npm
- MySQL
- Git

## Run locally

### 1. Configure MySQL and backend services

Create a MySQL database named `CryptoPasta`. Configure the backend's datasource credentials and any required JWT, email, payment-provider, market-data, and Gemini settings using your local environment or an untracked local configuration file.

**Do not commit passwords, API keys, tokens, or real customer data.** The application configuration expects some provider settings to be supplied externally. Check `src/main/resources/application.properties` and the relevant service configuration to determine which values are required for the features you plan to run.

### 2. Start the backend

From the repository root, on Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend is configured to listen on port `5454`.

### 3. Start the frontend

Open a second terminal:

```powershell
cd CryptoPasta-React
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). The frontend API client currently targets `http://localhost:5454`; if you change the backend host or port, update `src/config/app.js` in the frontend and the backend's allowed CORS origins accordingly.

## Useful frontend commands

Run these from `CryptoPasta-React`:

```bash
npm run dev
npm run build
npm run lint
```

## Configuration and security

- Keep local credentials out of Git. Use environment variables or a local, untracked configuration file.
- Rotate any credentials that have accidentally been committed or shared.
- The default local setup uses a MySQL database named `CryptoPasta` and a backend port of `5454`.
- Before deploying, review authentication, CORS, logging, database migration, payment, and secret-management settings for the deployment environment.

## License

No license is currently specified. Unless a license is added, all rights remain with the copyright holder; reuse and redistribution are not automatically granted.
