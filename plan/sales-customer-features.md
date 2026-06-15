# Implementation Plan: RMA & Current Carts

## Background & Motivation
The user wants to implement Return Merchandise Authorization (RMA) to handle product returns professionally, and "Current Shopping Carts" monitoring to allow admins to view abandoned carts for potential marketing interventions.

## Scope & Impact
*   **Database:** New table ReturnRequests. Existing Carts table is already suitable but needs an admin-facing API.
*   **Backend (APIService):** New API controllers: ReturnRequestsController and AdminCartsController.
*   **Frontend (WebClient):** ReturnRequests.jsx (Admin), AdminCarts.jsx (Admin), and updating MyOrders.jsx (Customer) to allow initiating returns.

## Proposed Solution

### Phase 1: Return Requests (RMA)
1.  **Entity & DB:** Create ReturnRequest entity (Id, OrderId, ProductVariantId, Quantity, Reason, Action, Status, CustomerComments, AdminComments, CreatedAt, UpdatedAt). Add to SQLServerDbContext and run migration.
2.  **Backend API:** Create ReturnRequestsController.
    *   POST /api/returnRequests: For customers to submit a request.
    *   GET /api/returnRequests: For admins to view all requests.
    *   PATCH /api/returnRequests/{id}/status: For admins to approve/reject/complete.
3.  **Frontend (Customer):** Add a 'Return' button to delivered items in MyOrders.jsx. Create a modal to submit the return reason.
4.  **Frontend (Admin):** Create ReturnRequests.jsx to list and manage RMAs.

### Phase 2: Current Shopping Carts (Admin)
1.  **Backend API:** Create AdminCartsController.
    *   GET /api/adminCarts: Join Carts, CartItems, Users, and Products to return a list of active carts, showing user email, total items, and last updated time.
2.  **Frontend (Admin):** Create CurrentCarts.jsx dashboard to display these active/abandoned carts. Add navigation link to sidebar.

## Verification
*   Verify customers can only return 'Delivered' orders.
*   Verify admins can see cart contents of other users securely.