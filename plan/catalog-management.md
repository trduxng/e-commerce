# Implementation Plan: Advanced Catalog Management

## Background & Motivation
The user wants to implement the complete suite of advanced catalog management features found in nopCommerce. This includes Manufacturers, Specification Attributes, Checkout Attributes, and Digital/Rental Products. This will significantly elevate the e-commerce capabilities of the BaseCore project.

## Scope & Impact
*   **Database:** Major schema expansion requiring new tables (Manufacturers, SpecificationAttributes, ProductSpecifications, CheckoutAttributes, CheckoutAttributeValues) and modifications to existing tables (Products, OrderDetails).
*   **Backend (APIService):** New API controllers for each new entity and updates to ProductsController and CartController.
*   **Frontend (WebClient):** Administrative interfaces for managing these new entities, plus significant updates to the public-facing Shop, Product Detail, and Checkout pages.

## Proposed Solution
We will implement these features sequentially to manage complexity.

### Phase 1: Database & Entity Framework Updates
1.  **Entities:** Create Manufacturer.cs, SpecificationAttribute.cs, ProductSpecification.cs, CheckoutAttribute.cs, and CheckoutAttributeValue.cs. Update Product.cs to include ManufacturerId, IsDigital, DownloadUrl, IsRental, RentalPriceLength, and RentalPricePeriod.
2.  **DbContext:** Add DbSet properties for the new entities in SQLServerDbContext.cs and configure their relationships (one-to-many, many-to-many) in OnModelCreating.
3.  **Migrations:** Generate and apply EF Core migrations.

### Phase 2: Manufacturers (Brands)
1.  **Backend:** Create ManufacturersController (CRUD operations). Update ProductsController to filter by ManufacturerId.
2.  **Admin UI:** Create Manufacturers.jsx for management. Update Product form to include a Manufacturer dropdown.
3.  **Frontend Shop:** Add a 'Filter by Brand' sidebar section in Shop.jsx.

### Phase 3: Specification Attributes
1.  **Backend:** Create SpecificationAttributesController and endpoints to link attributes to products.
2.  **Admin UI:** Create SpecAttributes.jsx. Add a 'Specifications' tab in the Product edit form.
3.  **Frontend Shop:** Add dynamic filter controls in Shop.jsx based on available specifications.

### Phase 4: Checkout Attributes & Digital/Rental Products
1.  **Backend:** Create CheckoutAttributesController. Update Cart/Order logic to handle extra costs from checkout attributes. Add logic to expose download links for digital products after payment.
2.  **Admin UI:** Create CheckoutAttributes.jsx. Update Product form with toggles for Digital/Rental.
3.  **Frontend Checkout:** Render available checkout attributes during the checkout process and update total price calculations.

## Verification
*   Rigorous testing of database migrations.
*   Verification of cascading deletes and foreign key constraints.
*   End-to-end testing of product filtering and checkout calculation logic.