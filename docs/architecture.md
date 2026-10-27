# System Architecture

## Overview

CareCompass is organized into three main modules:

1. **Frontend** — User interface and client-side interactions.
2. **Backend** — Application logic, API endpoints, validation, and coordination.
3. **AI** — AI-related services, prompts, and retrieval functionality.

## High-Level Interaction

```text
User
 |
 v
Frontend
 |
 v
Backend API
 |          \
 v           v
Database    AI Services
```

This diagram represents the planned architecture. The exact request flows, authentication mechanism, database, and AI provider have not been finalized.

## Frontend

The frontend is responsible for:

- Displaying pages and reusable components.
- Collecting and validating user input before submission.
- Calling backend APIs through a dedicated services layer.
- Handling loading states and errors.

## Backend

The backend is responsible for:

- Exposing API endpoints.
- Validating requests and enforcing authorization where required.
- Coordinating application services.
- Accessing the database through the selected data-access approach.
- Integrating with AI services when required.

## AI Module

The AI module is responsible for AI-related functionality, which may include:

- Prompt management.
- Retrieval and context preparation.
- AI service integration.
- Evaluation and tests for AI outputs.

The final AI provider and retrieval strategy are pending team decisions.

## Cross-Module Rules

- The frontend must not contain server-side secrets.
- The backend is responsible for enforcing access control and validating requests.
- API request and response formats should be documented in `api.md`.
- Database entities and relationships should be documented in `database-schema.md`.
- Changes affecting multiple modules should be communicated to the relevant teammates.
