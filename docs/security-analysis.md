# Backend Security Analysis

Review scope: `backend/` only. This report is read-only and does not certify runtime configuration or deployed infrastructure.

## Summary of Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🔴 CRITICAL | `backend/src/modules/auth/authentication.validation.js`, `backend/src/common/enum/user.enum.js`, `backend/src/modules/auth/authentication.service.js` | 34, 5-8, 169-185 | Public signup accepts and persists an attacker-selected admin role | 10/10 |
| 2 | 🔴 CRITICAL | `backend/.env.development` | 4-25 | Development environment contains live database, Redis, mail, encryption, and JWT credentials | 10/10 |
| 3 | 🟠 HIGH | `backend/src/middleware/validation.middleware.js`, `backend/src/middleware/authentication.middleware.js`, `backend/src/modules/user/user.controller.js`, `backend/src/common/security/token.security.js` | 16, 13, 24, 90-92, 163 | Tokens, signing secrets, passwords, OTP requests, and bearer tokens are written to logs | 10/10 |
| 4 | 🟠 HIGH | `backend/src/modules/user/user.controller.js`, `backend/src/modules/user/user.service.js`, `backend/src/modules/auth/authentication.controller.js`, `backend/src/modules/auth/authentication.service.js`, `backend/src/DB/model/user.model.js` | 12-20, 22-27, 24-31, 169-185, 22-54 | Full Mongoose user documents and password hashes can be returned; profile update has mass-assignment risk | 9/10 |
| 5 | 🟠 HIGH | `backend/src/modules/user/user.controller.js`, `backend/src/common/enum/user.enum.js` | 18, 5-8 | The profile-update role allowlist references undefined `RoleEnum.USER`, blocking intended non-admin users | 10/10 |
| 6 | 🟠 HIGH | `backend/src/main.js`, `backend/.env.development` | 19, 35, 14-18, 21 | Access and refresh secrets overlap in the reviewed environment, removing token-type separation; refresh validity is one year | 9/10 |
| 7 | 🟠 HIGH | `backend/src/modules/auth/authentication.controller.js`, `backend/src/modules/auth/authentication.service.js`, `backend/src/common/utils/limiter.js` | 72-78, 270-289, 142-146 | Forgot-password OTP verification has no failed-attempt counter and is not covered by the login brute-force limiter | 9/10 |
| 8 | 🟡 MEDIUM | `backend/src/middleware/error.middleware.js` | 4-8 | Development/non-production responses return the complete error object and stack trace | 9/10 |
| 9 | 🟡 MEDIUM | `backend/src/main.js`, `backend/src/common/utils/limiter.js`, `backend/.env.development` | 19, 35, 54-57, 19-21 | CORS is permissive and `trust proxy` is globally enabled; the configured origin list is unused and IP rate limits may be bypassed | 8/10 |
| 10 | 🟡 MEDIUM | `backend/src/modules/auth/authentication.service.js`, `backend/src/modules/auth/authentication.controller.js` | 310-324 | Login query contains a misspelled `confrimEmail` field, preventing normal password login when the query is evaluated | 10/10 |
| 11 | ⚪ LOW | `backend/package.json`, `backend/package-lock.json` | 30-52, 787-888, 1158-1245 | Dependency advisories cannot be confirmed without a current advisory scan; exact versions are pinned for future audit | 5/10 |

## Confirmed Code Findings

### 1. Public privilege escalation through signup

**Severity: Critical**  
**Files/lines:** `backend/src/modules/auth/authentication.validation.js:34`; `backend/src/common/enum/user.enum.js:5-8`; `backend/src/modules/auth/authentication.service.js:169-185`

The signup schema accepts an optional `role`, defaults it to `PATIENT`, and still permits `ADMIN` because `RoleEnum` includes value `2`. `signup` writes that caller-selected value into the user document. The login/token code then derives the signing key and JWT audience from the stored role.

**Impact:** An unauthenticated caller can create an account as an administrator and receive the role's admin credentials. This finding is independent of whether a higher-level endpoint is present in the current route inventory.

**Manual test:**
- Submit signup with `role: 2`.
- Verify that the created account is persisted with admin role.
- Log in and inspect only the decoded role/audience; do not disclose or persist the raw token.
- Verify production also rejects privileged public signup.

### 2. Committed environment credentials

**Severity: Critical**  
**File/lines:** `backend/.env.development:4-25`

The development environment file contains concrete MongoDB, Redis, email-app-password, encryption, and JWT credential values. It appears to be repository material rather than an example-only environment file.

**Impact:** Exposure of the repository or deployed host can expose database, cache, mailbox, encryption, and signing credentials.

**Manual test:**
- Confirm whether `.env.development` is tracked and present in deployment artifacts.
- Rotate every credential found in the file.
- Verify that production secrets are injected at runtime and that no secret is committed to Git history.
- Revoke/deploy new database, Redis, mailbox, encryption, and signing credentials.

### 3. Sensitive values written to logs

**Severity: High**  
**Files/lines:** `backend/src/middleware/validation.middleware.js:16`; `backend/src/middleware/authentication.middleware.js:13`; `backend/src/modules/user/user.controller.js:24`; `backend/src/common/security/token.security.js:90-92,163`

Validation logs parsed request bodies, authentication logs bearer tokens, logout logs request bodies, and token generation logs signing secrets. Request bodies can include passwords and OTPs. Morgan also logs HTTP traffic.

**Impact:** Anyone with log access can obtain passwords submitted during a request, OTP values, active bearer tokens, or signing-key material.

**Manual test:**
- Exercise signup, login, OTP, logout, and authenticated requests and inspect application logs.
- Verify passwords, OTPs, authorization headers, refresh/access tokens, and signing secrets are absent.
- Confirm log retention and access controls, then rotate exposed tokens/secrets.

### 4. Excessive user-object exposure and mass assignment

**Severity: High**  
**Files/lines:** `backend/src/modules/user/user.controller.js:12-20,47-57`; `backend/src/modules/user/user.service.js:22-27`; `backend/src/modules/auth/authentication.controller.js:24-31`; `backend/src/modules/auth/authentication.service.js:169-185`; `backend/src/DB/model/user.model.js:22-54`

`getProfile` returns `req.user` directly. Signup also returns the created Mongoose document. The profile `PATCH /user/` sends `req.body` directly to `findByIdAndUpdate`, with no route-level validation or field allowlist. The user schema has `strict: false`, and the repository operation does not reject Mongo update operators or restricted fields.

Potentially returned documents include fields such as `password`, `changeCredentialsTime`, `role`, `provider`, and internal Mongoose fields.

**Impact:** An admin account can modify sensitive fields on the self-owned account, and API responses can disclose password hashes or more fields than clients need.

**Manual test:**
- Call `GET /user/`, signup, and profile update while authenticated.
- Check whether `password`, role, provider, credentials-change time, Mongoose internals, and other unexpected fields appear.
- Send a restricted-field update using an admin account, including `role`, `password`, `provider`, `isActive`, and Mongo operator-shaped values.
- Confirm the endpoint is deny-by-default and accepts only explicitly allowed profile fields.

### 5. Broken profile-update authorization

**Severity: High**  
**Files/lines:** `backend/src/modules/user/user.controller.js:18`; `backend/src/common/enum/user.enum.js:5-8`

The allowlist is `[RoleEnum.ADMIN, RoleEnum.USER]`, but `RoleEnum.USER` does not exist. Its value is `undefined`, so normal patients and doctors are denied while the role check's behavior for the admin role is the only one likely to succeed.

**Impact:** The endpoint does not implement the apparent intended authorization behavior and can prevent legitimate profile updates.

**Manual test:**
- Test `PATCH /user/` as PATIENT, DOCTOR, and ADMIN.
- Verify that only intended roles can reach the action.
- Confirm an unauthenticated caller cannot reach it.

### 6. JWT secrets and refresh-token lifetime

**Severity: High**  
**Files/lines:** `backend/.env.development:14-18,21`; `backend/src/common/security/token.security.js:51-68,136-160`

The access and refresh signing values for users are identical in the reviewed development environment. The refresh token lifetime is 365 days. Signing values are short/development-specific strings rather than strong secrets, and secret rotation is not visible.

**Impact:** If an access/refresh secret is shared with a different token type or the secret is weak, an attacker may forge or reuse tokens. A compromised refresh token remains valid for one year.

**Manual test:**
- Compare production access and refresh secrets and verify they are strong, independent, and externally injected.
- Verify that an access token cannot be accepted by the refresh-token middleware and vice versa.
- Confirm deployed refresh expiry is appropriate and short enough for policy.
- Test refresh revoke and logout-all behavior.

### 7. Forgot-password OTP lacks failed-attempt controls

**Severity: High**  
**Files/lines:** `backend/src/modules/auth/authentication.controller.js:72-78`; `backend/src/modules/auth/authentication.service.js:270-289`; `backend/src/common/utils/limiter.js:15-42`

OTP generation tracks resend attempts, but OTP verification does not increment or block failed guesses. Wrong verification attempts are handled as a normal bad request and do not consume a trial counter. Forgot-password routes only receive the global 300-requests-per-15-minute limiter, not the five-attempt login limiter.

**Impact:** A six-digit or weak OTP can be brute-forced more readily.

**Manual test:**
- Determine the actual OTP length and character space.
- Repeatedly submit wrong OTP values for verify-reset and confirm-email flows.
- Verify an account or OTP is locked after a small failed-attempt threshold.
- Verify that proxies cannot weaken IP-based limits.

### 8. Development error payloads leak internals

**Severity: Medium**  
**File/lines:** `backend/src/middleware/error.middleware.js:4-8`; `backend/src/config.js:3`

The global handler serializes `error`, `issues`, and a stack trace unless `NODE_ENV` exactly equals `production`. It does not use a default safe production state.

**Impact:** Responses can disclose stack frames, database or library error details, object internals, and implementation structure.

**Manual test:**
- Force validation and server failures with `NODE_ENV=development` and `production`.
- Verify production omits stack traces and all unexpected internal error objects.
- Confirm logs contain enough diagnostics without returning internal details to clients.

### 9. Permissive CORS and trusted proxy configuration

**Severity: Medium**  
**Files/lines:** `backend/src/main.js:19,35`; `backend/src/common/utils/limiter.js:54-57`; `backend/.env.development:19-21`

CORS is applied with default settings, while the intended origin allowlist in `ORIGINS` is commented out and unused. The application trusts all proxies. Rate-limit keys use `req.ip`, so a direct deployment or misconfigured proxy may allow a caller-controlled forwarding header to influence identity/rate-limit accounting.

**Impact:** Cross-origin policy may be broader than intended; IP limits can be bypassed or a shared proxy address can trigger false blocking.

**Manual test:**
- Verify deployed CORS behavior from approved and unapproved origins.
- Confirm the intended origin allowlist is active and forwarded-IP handling is correct.
- Test whether changing `X-Forwarded-For` changes the effective limiter key.

### 10. Login typo prevents normal password login

**Severity: Medium**  
**Files/lines:** `backend/src/modules/auth/authentication.service.js:310-324`

The password-login Mongo filter uses `confrimEmail`, a misspelled field that does not match the `confirmEmail` schema field. This may prevent every normal password account from passing the lookup.

**Impact:** Availability degradation and denial of login for password users.

**Manual test:**
- Confirm a confirmed password account can log in.
- Verify the typo is fixed or the filter is changed to `confirmEmail: { $exists: true }`.

### 11. Dependency audit unresolved

**Severity: Low**  
**Files/lines:** `backend/package.json:30-52`; `backend/package-lock.json:787-888,1158-1245`

The lockfile includes current dependency versions such as Express `5.2.1`, Multer `2.4.0`, Mongoose `9.9.4`, jsonwebtoken `9.0.3`, Helmet `8.3.0`, Zod `4.6.5`, and Google auth library `11.1.0`. No confirmed known vulnerability can be established from manifest versions alone without matching them against a current advisory database.

**Manual test:**
- Run a read-only dependency advisory scan in CI or a trusted local package-audit workflow.
- Review transitive advisories, unsupported package ranges, and patched-version guidance.
- Re-run after dependency updates.

## API Endpoint Inventory

The global middleware in `backend/src/main.js:35` applies Helmet, CORS, Morgan, a 300-request-per-15-minute limiter, and JSON parsing to all routes. It also sets `trust proxy` to `true` at line 19.

| Method | Path | Auth required | Input validation | Authorization | Rate limiting |
|---|---|---|---|---|---|
| `GET` | `/` | No | None | None | Global 300/15 min |
| `POST` | `/auth/signup` | No | Zod strict body for credentials, username, phone, confirm fields, role, and gender | None; privilege escalation vulnerability | Global 300/15 min |
| `POST` | `/auth/signup-with-gmail` | No | Google ID token is cryptographically verified in the service; no Zod route schema | None; Google account identity required | Global 300/15 min |
| `POST` | `/auth/login` | No | Zod strict email/password body plus query schema | None | Global plus 5/5 min login limiter |
| `POST` | `/auth/login-with-gmail` | No | Zod strict `idToken` body; Google token verified in service | None; Google account/provider check | Global plus 5/5 min login limiter |
| `PATCH` | `/auth/confirm-email` | No | Zod strict email and OTP body | Email/OTP ownership implied by submitted email and Redis OTP | Global 300/15 min |
| `PATCH` | `/auth/resend-confirm-email` | No | Zod strict email body | Email account/provider state checked; no account-principal auth | Global 300/15 min |
| `POST` | `/auth/verify-forgot-password` | No | Zod strict email and OTP body | Email/OTP check only | Global 300/15 min |
| `PATCH` | `/auth/reset-forgot-password` | No | Zod strict email, OTP, password, and confirm-password body | Email/OTP check only | Global 300/15 min |
| `POST` | `/auth/forget-password` | No | Zod strict email body | Email account/provider state checked; no account-principal auth | Global 300/15 min |
| `GET` | `/user/` | Bearer access token | No Zod schema | Returns authenticated user's own object | Global 300/15 min |
| `PATCH` | `/user/` | Bearer access token | None; raw `req.body` reaches database update | Role allowlist `[ADMIN, undefined]` due undefined `USER` symbol | Global 300/15 min |
| `POST` | `/user/logout` | Bearer access token | No Zod schema; action taken from raw body | Self payload/user only; logout-all changes own credential timestamp | Global 300/15 min |
| `POST` | `/user/rotate-token` | Bearer refresh token | None | Uses authenticated refresh payload and authenticated user | Global 300/15 min |
| `PATCH` | `/user/profile-image` | Bearer access token | Upload required; memory limit 2 MiB; signature/MIME verification | Own authenticated user and own profile image field | Global 300/15 min |
| `ALL` | Unmatched route | N/A | N/A | N/A | Global 300/15 min; returns 404 |

Route sources: `backend/src/modules/auth/authentication.controller.js:24-83`; `backend/src/modules/user/user.controller.js:12-57`; fallback route: `backend/src/main.js:45-47`.

## Injection and Database Access

### Confirmed

- No raw SQL or shell command execution was found.
- Mongoose calls use model methods and filter objects rather than string-built queries.
- No unsafe deserialization or dynamic `eval`/`exec` call was identified.
- OTP and cache keys are constructed from validated emails and enums, and file paths use generated UUID names.
- No object-ID or resource-ID from a route parameter reaches a cross-user lookup in the reviewed routes.

### Needs Manual Testing

- Test `PATCH /user/` with Mongo operator keys and restricted fields because the schema is `strict: false` and the body is passed directly to an update helper.
- Test malformed Google ID tokens and verify audience, issuer, signature, and `email_verified` behavior.
- Test unusual email, Unicode, and special-character values for Redis/Mongoose key behavior.
- Verify file parsing rejects polyglot, disguised, and decompression/bomb-like content even though file buffers are checked by signature.

## Authentication and Sessions

### Confirmed

- Passwords are hashed with bcrypt at cost 12 in `backend/src/common/security/hash.security.js:3-10`.
- JWT access/refresh tokens include subject, audience, issuer, expiry, and JTI in `backend/src/common/security/token.security.js:136-160`.
- Logout and password-reset revoke tokens through Redis in `backend/src/common/security/token.security.js:164-176` and `backend/src/modules/auth/authentication.service.js:294-303`.
- Tokens are checked for revocation and `changeCredentialsTime` in `backend/src/common/security/token.security.js:103-125`.
- Public signup allows a caller-selected role.
- Access/refresh signing values overlap in the reviewed development environment.
- Refresh expiry is 31,536,000 seconds (one year) in the reviewed environment.
- Session cookies are not used in the reviewed code; bearer tokens are used.
- The login service contains a misspelled confirmation field.

### Needs Manual Testing

- Verify production signing secrets are high entropy and independently stored.
- Verify access and refresh audience/type separation cannot be bypassed.
- Verify token revocation survives Redis and app restarts according to policy.
- Verify password-reset invalidates all prior credentials/tokens.
- Verify Google OAuth account linking cannot take over an existing SYSTEM account.

## Authorization and IDOR

### Confirmed

- Authenticated profile and profile-image operations derive the target from `req.user`, not a caller-supplied user ID.
- Logout and token rotation derive revocation/session action from the authenticated payload/user.
- The profile-update role allowlist is incorrect.
- Public signup can create an admin account.

### Needs Manual Testing

- Test horizontal and vertical access on `/user/` and `/user/profile-image`.
- Test whether an altered JWT subject or audience can produce a different account.
- Test that revoked, expired, and old-password tokens are rejected.
- Test all role combinations against `/user/` and profile update.

## Security Misconfiguration

### Confirmed

- Helmet is enabled, but CORS is left at defaults.
- Intended origins are loaded by `config.js:30` but unused.
- `NODE_ENV` defaults to `development`, and the error handler exposes development details.
- Secrets and credentials are present in a development environment file.
- Global trust-proxy is enabled.
- Static `/assets` is mounted and profile-image files are written under it.

### Needs Manual Testing

- Verify production deployment sets `NODE_ENV=production`.
- Verify proxy count and forwarded-header trust are explicit.
- Verify TLS, reverse-proxy headers, cache controls, CSP, HSTS, and uploaded asset serving policy.
- Verify uploaded files cannot execute or override application routes.

## Information Leakage

### Confirmed

- Signup and profile responses can serialize full Mongoose user documents.
- Password hashes can be included in returned/serialized user documents unless Mongoose's response selection behavior or a separate runtime transform excludes them.
- Bearer tokens and signing secrets are logged.
- Validation logs include complete parsed request bodies.
- Development errors include the stack and complete error object.

### Needs Manual Testing

- Inspect actual HTTP response bodies for signup, login, Google signup/login, profile get, and profile update.
- Verify password hashes, reset secrets, reset timestamps, provider/admin flags, and Mongoose internals are absent.
- Verify production logs do not retain request bodies or Authorization headers.

## Dependency Review

The backend manifest identifies Express, Mongoose, Multer, JWT, Helmet, bcrypt, Google auth, Redis, Zod, and other packages. The lockfile provides exact transitive versions.

- No known-vulnerable package can be labeled confirmed solely from local manifest inspection.
- A current advisory scan is required for CVE identification and patched-version recommendations.
- Package ranges in `package.json` and exact versions in `package-lock.json` should both be reviewed.

## Manual Verification Checklist

- [ ] Test public signup with role `ADMIN` and confirm privileged signup is denied.
- [ ] Rotate all credentials present in `.env.development` and remove them from Git history/artifacts.
- [ ] Capture logs during auth and profile flows; verify no passwords, OTPs, tokens, or signing secrets appear.
- [ ] Inspect signup, login, Google login, and profile response bodies for password hashes and full user objects.
- [ ] Test mass assignment and Mongo operator-shaped profile updates.
- [ ] Test PATIENT, DOCTOR, and ADMIN access to `PATCH /user/`.
- [ ] Verify access/refresh signing keys are independent and sufficiently strong in production.
- [ ] Verify refresh and access tokens cannot substitute for each other.
- [ ] Brute-force a test OTP in a controlled environment and verify failed-attempt lockout works.
- [ ] Verify login, forgot-password, resend, and reset endpoints have account-aware and IP-aware limits.
- [ ] Test CORS from approved and unapproved origins.
- [ ] Test `X-Forwarded-For` behavior and production proxy trust.
- [ ] Force server errors with development and production settings and inspect response bodies.
- [ ] Confirm `NODE_ENV=production` is enforced in deployed environments.
- [ ] Test normal password login and the `confrimEmail` query typo.
- [ ] Test revoked, expired, refresh, access, and password-reset tokens.
- [ ] Test Google account signup/login with valid, invalid, wrong-audience, and unverified-email tokens.
- [ ] Test file uploads with MIME/type mismatch, oversized files, polyglots, and harmless-looking scripts.
- [ ] Verify uploaded assets cannot execute or be used to overwrite application files.
- [ ] Run a current dependency-advisory and license scan in CI or a trusted environment.
- [ ] Confirm production secrets are unavailable to source control and rotation procedures exist.
