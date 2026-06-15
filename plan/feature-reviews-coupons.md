# Implementation Plan: Product Reviews & Discount Coupons

## Background & Motivation
The user wants to bring enterprise-level e-commerce features from nopCommerce into the BaseCore framework. The initial phase focuses on two critical features: **Product Reviews** (allowing customers to rate products and admins to moderate them) and **Discount Coupons** (promotional codes that reduce order totals). 

## Scope & Impact
*   **Database:** `BaseCore.Repository` (Adding `Coupon` to `SQLServerDbContext` and generating an EF Migration).
*   **Backend (APIService):** New API endpoints for `ReviewsController` and `CouponsController`.
*   **Frontend (WebClient):** New pages in the Admin Dashboard (`Reviews.jsx`, `Coupons.jsx`), integration into the sidebar, and API service updates.

## Proposed Solution (Decoupled Architecture)
As chosen by the user, we will implement a decoupled approach:
1.  **Independent Controllers:** Create `ReviewsController.cs` and `CouponsController.cs` to handle RESTful operations independently from Products and Orders.
2.  **Dedicated Admin UI:** Build standalone pages in the React Admin Dashboard for moderating reviews and managing coupon campaigns.

## Alternatives Considered
*   *Integrated Architecture:* Merging Review endpoints into `ProductsController` and Coupon endpoints into `OrdersController`. This was rejected because it violates the Single Responsibility Principle and makes future extensions (like Coupon usage tracking) much harder.

## Phased Implementation Plan

### Phase 1: Database & EF Core Preparation
1.  Verify `Review` and `Coupon` entity structures in `BaseCore.Entities.BusinessEntities.cs`.
2.  Update `SQLServerDbContext.cs` to include `public DbSet<Coupon> Coupons { get; set; }`.
3.  Add model configuration mapping for `Coupon` in `OnModelCreating` to ensure proper table naming and constraints.
4.  Generate and apply Entity Framework Core migrations.

### Phase 2: API Layer (Backend)
1.  **Reviews API:** Create `ReviewsController` with endpoints:
    *   `GET /api/reviews` (Admin list)
    *   `PATCH /api/reviews/{id}/status` (Approve/Reject)
2.  **Coupons API:** Create `CouponsController` with endpoints:
    *   `GET /api/coupons` (List all)
    *   `POST /api/coupons` (Create new code)
    *   `PUT /api/coupons/{id}` (Update code/limits)
    *   `DELETE /api/coupons/{id}` (Deactivate)
    *   `POST /api/coupons/apply` (Customer cart logic)

### Phase 3: Admin UI (Frontend)
1.  **API Services:** Add `reviewApi` and `couponApi` to `src/services/api.js`.
2.  **Coupons Page:** Create `src/pages/Coupons.jsx` for CRUD operations on discount codes (Code, Type, Value, Start/End Dates).
3.  **Reviews Page:** Create `src/pages/Reviews.jsx` to list customer reviews, showing Product, Rating, Content, and Action buttons (Approve/Delete).
4.  **Navigation:** Update `MainLayout.jsx` and `App.jsx` to include `/coupons` and `/reviews` routes for admins.

## Verification
*   **Backend:** Ensure API endpoints return 200 OK and handle validation errors (e.g., duplicate coupon codes) gracefully.
*   **Frontend:** Verify that the new pages render correctly, data is fetched via TanStack Query/Axios, and mutations successfully update the UI.

## Migration & Rollback
*   If DB migration fails, use `dotnet ef database update <PreviousMigration>` to rollback the schema.
*   Frontend changes are isolated to new routes; if issues occur, the links can be temporarily removed from `MainLayout.jsx`.