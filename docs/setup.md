# Development Setup

## Prerequisites

Install the following tools as needed for your assigned module:

- Git
- Node.js LTS and npm for the frontend and backend
- Visual Studio Code or another code editor

Python and additional tools may be required for the AI module, depending on the final implementation.

## Clone the Repository

```bash
git clone https://github.com/Amm3r-T3rek/CareCompass.git
cd CareCompass
```

## Start from the Shared Development Branch

```bash
git switch staging
git pull origin staging
```

## Environment Variables

Create local `.env` files only when your module requires them.

Use `.env.example` as a reference for the variable names. Never commit real credentials or secret values.

## Install Dependencies

Install dependencies inside a module after its `package.json` has been configured:

```bash
cd frontend
npm install
```

For the backend:

```bash
cd backend
npm install
```

These commands will be usable once the relevant dependencies and scripts have been defined.

## Running the Application

Start commands, database configuration, AI service setup, and required environment variables will be added after the team finalizes the technology stack.

## Troubleshooting

- Run `git status` before committing.
- Run `git pull origin staging` before starting new work.
- Resolve merge conflicts before pushing.
- Never commit `.env` files, credentials, or personal configuration files.
