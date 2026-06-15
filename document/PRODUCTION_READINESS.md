# Production Readiness Audit

## Completed In This Pass

- Checkout totals are server-authoritative. Shipping fees are calculated from the selected shipping method.
- Unvalidated voucher codes are rejected and both order creation paths use database transactions.
- Address book supports create, update, set-default, and delete.
- My Account includes dashboard totals, profile editing, address book, order history, and wishlist links.
- Storefront routes are lazy-loaded. Shared retry, error boundary, dark mode, back-to-top, and skeleton UI are available.
- Home includes promotion, newsletter, and testimonial sections.
- Product Detail includes gallery zoom, description, specifications, review summary, review form UI, and mobile related-product carousel.
- Product ratings and reviews are persisted. Product lists expose real review summaries and delivered orders are marked as verified purchases.

## Remaining Backlog

### P0: Security And Operations

- Replace legacy plain-text password storage with salted password hashing and a planned data migration.
- Remove JWT constants and fallback secrets from source code before deploying outside local development.
- Replace permissive CORS with configured origins.
- Add refresh token rotation, token revocation, rate limiting, and account lockout.
- Upgrade or remove vulnerable `AutoMapper 13.0.1`.
- Add centralized API exception handling, structured logging, health checks, and production secret management.

### P1: Commerce APIs

- Add voucher persistence, validation rules, expiry, usage limits, and campaign administration.
- Integrate a real payment provider with webhook verification and idempotency.
- Add product-review moderation and pagination.
- Persist newsletter subscriptions with consent tracking.
- Wire order status history to `OrderStatusLog`.

### P2: Customer Account

- Add forgot-password, reset-password, and authenticated change-password flows.
- Add avatar upload storage instead of URL-only profile editing.
- Add address editing and deletion controls directly inside checkout.

### P3: Quality And Performance

- Add browser end-to-end tests for login, cart, checkout, account, and admin workflows.
- Add API integration tests against SQL Server.
- Add responsive visual regression checks.
- Move product images to optimized responsive assets or a CDN.
- Continue reducing legacy nullable warnings and duplicate CSS.

## Verification

```powershell
npm.cmd run build
dotnet build BaseCore.APIService/BaseCore.APIService.csproj --no-restore -o artifacts/api-build-check
dotnet build BaseCore.AuthService/BaseCore.AuthService.csproj --no-restore -o artifacts/auth-build-check
dotnet build BaseCore.ApiGateway/BaseCore.ApiGateway.csproj --no-restore -o artifacts/gateway-build-check
dotnet test BaseCore.UnitTest/BaseCore.UnitTest.csproj --no-restore --logger "console;verbosity=minimal"
git diff --check
```
