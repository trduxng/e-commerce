# Implementation Plan: Settings UI (No Database)

## Background & Motivation
The user has chosen to implement the "Settings UI" feature (Group 4) but requested an approach that **does not require creating new database tables**. To accommodate this, we will store the global configurations (Store Name, Logo, Contact Info) in a local JSON file (settings.json) managed by the Backend API. This keeps the database clean while still allowing administrators to dynamically update settings via the Admin UI.

## Scope & Impact
*   **Database:** NO CHANGES.
*   **Backend (APIService):** Create a new SettingsController that reads and writes to a settings.json file on the server.
*   **Frontend (WebClient):** 
    *   Create an Admin page (Settings.jsx) to manage these configurations.
    *   Update the public layout components (MainLayout.jsx, Topbar.jsx, Footer.jsx) to consume these settings via API.

## Proposed Solution

### Phase 1: Backend API & File Storage
1.  **Model:** Create a StoreSettingsDto class in the APIService to strongly type the settings (e.g., StoreName, ContactEmail, FacebookLink).
2.  **SettingsController:** Create Controllers/SettingsController.cs.
    *   Initialize a default settings.json file if it doesn't exist.
    *   GET /api/settings: Reads and returns the contents of settings.json (Public).
    *   POST /api/settings: Accepts StoreSettingsDto, serializes it, and overwrites settings.json (Admin only).

### Phase 2: Frontend Integration
1.  **API Service:** Add settingApi to src/services/api.js.
2.  **Admin UI:** Build src/pages/Settings.jsx featuring inputs for:
    *   Store Name
    *   Logo URL
    *   Support Email & Phone Number
    *   Facebook Link
3.  **UI Updates:** Refactor the public React components to fetch the settings on mount and display the dynamic values instead of hardcoded strings.

## Verification
*   Verify that settings.json is created successfully when the app runs.
*   Verify that updating settings in the Admin UI successfully overwrites the file.
*   Verify that the public storefront reflects the updated settings upon refresh.