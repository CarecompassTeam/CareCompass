# CareCompass — AI Healthcare Companion

## Overview

CareCompass is a graduation project focused on building an AI-powered healthcare companion. The application is organized into frontend, backend, and AI modules to separate responsibilities and simplify development.

Our goal is to build a maintainable, well-documented application that addresses real user needs.

**Project status:** Initial setup and architecture planning. Features, API contracts, database design, and deployment configuration are still being finalized.

## Project Structure

```text
CareCompass/
├── frontend/       # User interface
├── backend/        # Server-side logic and APIs
├── ai/             # AI services and retrieval
├── docs/           # Technical documentation
├── .github/        # Repository templates and workflows
├── .env.example    # Example environment variables
├── .gitignore
├── package.json
└── README.md
```

## Team Responsibilities

| Team Member | Primary Responsibility |
|---|---|
| Ammar Tarek | Backend development, security testing, vulnerability analysis, and automation scripts |
| Abdelrahman Hany | React frontend development |
| Mohamed Sameh | Networking, security, cloud infrastructure, and infrastructure support |
| Yousab | Node.js backend development |
| Dina | React frontend and AI integration |
| Lisa | Node.js backend, AI integration, and machine learning |

Team members may collaborate across modules when integration or testing requires it. Final task assignments should be agreed upon by the team.

## Development Workflow

We use two main branches:

- `main`: Stable, tested project version.
- `staging`: Shared branch for daily development and integration testing.

### Before starting work

```bash
git switch staging
git pull origin staging
```

### After completing a task

Stage only the files related to your task:

```bash
git add <your-files>
git commit -m "feat: describe your task"
git pull --rebase origin staging
git push origin staging
```

If a conflict occurs, resolve it before pushing. Never use `git push --force` on shared branches.

The team tests the integrated application on `staging`. Once a version is stable, the project lead updates `main`.

## Commit Conventions

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `test:` — Tests
- `refactor:` — Code restructuring
- `chore:` — Configuration and maintenance

## Security Guidelines

- Never commit passwords, API keys, access tokens, or real `.env` files.
- Keep `.env.example` free of real secrets.
- Validate input on the backend.
- Test only systems and environments authorized for this project.
- Document vulnerabilities and fixes clearly.

## Documentation

- [Setup Guide](docs/setup.md)
- [Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database-schema.md)
- [Testing Guide](docs/testing.md)

## Technology Decisions

The repository is planned around a React frontend, Node.js backend, and separate AI module.

The database, AI provider, exact framework versions, and deployment platform will be documented after the team agrees on them.

## Getting Started

Read `docs/setup.md` before configuring your local environment. Setup instructions will be finalized when the technology choices and dependencies are confirmed.
