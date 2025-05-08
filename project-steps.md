# Implementation Plan

-   [x] **Step 1: Project Setup, Core Database Structure & Auth Foundation**
    *   **Task**: Initialize environment variables (`.env.local`, `.env.example`). Define all Drizzle schemas (`customers`, `estimates`, `estimate_line_items`, `materials`, `labor_rates`, `equipment`, `settings`, update `profiles` with `isAdmin`). Update `db/schema/index.ts` and `db/db.ts`. Define core application types (`estimate-types.ts`, `qbo-types.ts`, `types/index.ts`). Configure Clerk middleware (`middleware.ts`) to protect `/app` and `/admin` routes.
    *   **Files**:
        *   `.env.local` (User created)
        *   `.env.example` (Update)
        *   `db/schema/customers-schema.ts` (Create)
        *   `db/schema/estimates-schema.ts` (Create)
        *   `db/schema/estimate-line-items-schema.ts` (Create)
        *   `db/schema/materials-schema.ts` (Create)
        *   `db/schema/labor-rates-schema.ts` (Create)
        *   `db/schema/equipment-schema.ts` (Create)
        *   `db/schema/settings-schema.ts` (Create)
        *   `db/schema/profiles-schema.ts` (Update)
        *   `db/schema/index.ts` (Update)
        *   `db/db.ts` (Update)
        *   `types/estimate-types.ts` (Create)
        *   `types/qbo-types.ts` (Create)
        *   `types/index.ts` (Update)
        *   `middleware.ts` (Update)
        *   `actions/db/profiles-actions.ts` (Update - Handle `isAdmin`)
    *   **Step Dependencies**: None (based on starter template)
    *   **User Instructions**: Follow User Instructions from original Step 1 & Step 11 (ENV setup, Clerk setup, DB connection).

-   [x] **Step 2: Basic App/Admin Layouts & Placeholders**
    *   **Task**: Create the main layout for authenticated users (`app/(app)/layout.tsx`) including `UserButton`. Create a basic dashboard page (`app/(app)/dashboard/page.tsx`). Create the Admin layout (`app/(admin)/layout.tsx`) with `isAdmin` check and redirect logic. Create a basic Admin placeholder page (`app/(admin)/dashboard/page.tsx`).
    *   **Files**:
        *   `app/(app)/layout.tsx` (Create)
        *   `app/(app)/dashboard/page.tsx` (Create)
        *   `app/(admin)/layout.tsx` (Create)
        *   `app/(admin)/dashboard/page.tsx` (Create)
    *   **Step Dependencies**: Step 1
    *   **User Instructions**: Manually set `isAdmin=true` for a test user in Supabase DB.

-   [x] **Step 3: Reusable Admin Components & Settings Management**
    *   **Task**: Create reusable `AdminDataTable` (`components/admin/admin-data-table.tsx`) and `AdminFormModal` (`components/admin/admin-form-modal.tsx`) client components. Implement Settings CRUD actions (`actions/db/settings-actions.ts`). Build the Admin Settings page (`app/(admin)/settings/page.tsx`) and its form (`_components/settings-form.tsx`) using the actions to manage company info and basic email settings (QBO fields added later).
    *   **Files**:
        *   `components/admin/admin-data-table.tsx` (Create)
        *   `components/admin/admin-form-modal.tsx` (Create)
        *   `actions/db/settings-actions.ts` (Create)
        *   `app/(admin)/settings/page.tsx` (Create)
        *   `app/(admin)/settings/_components/settings-form.tsx` (Create)
    *   **Step Dependencies**: Step 1, Step 2
    *   **User Instructions**: Manually insert a default row into the `settings` table via Supabase SQL editor.

-   [x] **Step 4: Admin Materials Management**
    *   **Task**: Implement Material CRUD server actions (`actions/db/materials-actions.ts`). Build the Admin Materials page (`app/(admin)/materials/page.tsx`) using `AdminDataTable` and `AdminFormModal` for full CRUD operations on materials. Include the specific material form fields (`_components/material-form.tsx`).
    *   **Files**:
        *   `actions/db/materials-actions.ts` (Create)
        *   `app/(admin)/materials/page.tsx` (Create)
        *   `app/(admin)/materials/_components/materials-manager.tsx` (Create)
        *   `app/(admin)/materials/_components/material-form.tsx` (Create)
    *   **Step Dependencies**: Step 1, Step 2, Step 3
    *   **User Instructions**: None

-   [x] **Step 5: Admin Labor Rates Management**
    *   **Task**: Implement Labor Rate CRUD server actions (`actions/db/labor-rates-actions.ts`). Build the Admin Labor Rates page (`app/(admin)/labor-rates/page.tsx`) using `AdminDataTable` and `AdminFormModal` for full CRUD operations. Include the specific labor rate form fields (`_components/labor-rate-form.tsx`).
    *   **Files**:
        *   `actions/db/labor-rates-actions.ts` (Create)
        *   `app/(admin)/labor-rates/page.tsx` (Create)
        *   `app/(admin)/labor-rates/_components/labor-rates-manager.tsx` (Create)
        *   `app/(admin)/labor-rates/_components/labor-rate-form.tsx` (Create)
    *   **Step Dependencies**: Step 1, Step 2, Step 3
    *   **User Instructions**: Use the Admin UI to add sample Materials and Labor Rates needed for calculations.

-   [x] **Step 6: Admin Equipment Management**
    *   **Task**: Implement Equipment CRUD server actions (`actions/db/equipment-actions.ts`). Build the Admin Equipment page (`app/(admin)/equipment/page.tsx`) using `AdminDataTable` and `AdminFormModal` for full CRUD operations. Include the specific equipment form fields (`_components/equipment-form.tsx`).
    *   **Files**:
        *   `actions/db/equipment-actions.ts` (Create)
        *   `app/(admin)/equipment/page.tsx` (Create)
        *   `app/(admin)/equipment/_components/equipment-manager.tsx` (Create)
        *   `app/(admin)/equipment/_components/equipment-form.tsx` (Create)
    *   **Step Dependencies**: Step 1, Step 2, Step 3
    *   **User Instructions**: None

-   [x] **Step 7: Core Calculation Logic & Estimate Actions**
    *   **Task**: Implement the core `calculateEstimateLineItems` function in `lib/calculations/estimate-calculator.ts`, including fetching necessary data (materials, labor rates) and performing calculations as per spec. Implement basic Estimate and Line Item CRUD actions (`actions/db/estimates-actions.ts`, `actions/db/estimate-line-items-actions.ts`), ensuring `createEstimateAction` calls the calculator and saves the estimate with its initial line items.
    *   **Files**:
        *   `lib/calculations/estimate-calculator.ts` (Create)
        *   `lib/calculations/index.ts` (Create or Update)
        *   `actions/db/estimates-actions.ts` (Create)
        *   `actions/db/estimate-line-items-actions.ts` (Create)
        *   `actions/db/materials-actions.ts` (Update if helpers needed)
        *   `actions/db/labor-rates-actions.ts` (Update if helpers needed)
        *   `types/estimate-types.ts` (Update if needed)
    *   **Step Dependencies**: Step 1, Step 4, Step 5
    *   **User Instructions**: Ensure the specific calculation formulas from the spec's `<logic>` are implemented. Ensure sample Materials/Labor data exists via Admin UI.

-   [x] **Step 8: Customer Actions & Estimate Creation UI**
    *   **Task**: Implement Customer CRUD actions (`actions/db/customers-actions.ts`). Build the Create Estimate page (`app/(app)/estimates/create/page.tsx`) which fetches customers. Build the `EstimateForm` client component (`_components/estimate-form.tsx` or `components/estimates/estimate-form.tsx`) with all inputs, validation, and logic to call `createEstimateAction` on submit, handle loading/results, and redirect on success.
    *   **Files**:
        *   `actions/db/customers-actions.ts` (Create)
        *   `app/(app)/estimates/create/page.tsx` (Create)
        *   `app/(app)/estimates/create/_components/estimate-form.tsx` (Create)
    *   **Step Dependencies**: Step 1, Step 2, Step 7
    *   **User Instructions**: Ensure `sonner` toast notifications are set up.

-   [x] **Step 9: Estimate Listing, Viewing & Editing UI**
    *   **Task**: Build the List Estimates page (`app/(app)/estimates/page.tsx`) fetching and displaying user's estimates with links. Create the View/Edit Estimate dynamic page (`app/(app)/estimates/[estimateId]/page.tsx`) fetching estimate data. Create the editable `EstimateLineItemTable` component (`components/estimates/estimate-line-item-table.tsx`). Create the `EstimateEditor` client component (`_components/estimate-editor.tsx`) to display data, manage line item state via the table, and handle saving changes via `updateEstimateAction`.
    *   **Files**:
        *   `app/(app)/estimates/page.tsx` (Create)
        *   `app/(app)/estimates/_components/estimates-list-table.tsx` (Create)
        *   `app/(app)/estimates/[estimateId]/page.tsx` (Create)
        *   `components/estimates/estimate-line-item-table.tsx` (Create)
        *   `app/(app)/estimates/[estimateId]/_components/estimate-editor.tsx` (Create)
    *   **Step Dependencies**: Step 1, Step 2, Step 7, Step 8
    *   **User Instructions**: None

-   [ ] **Step 10: Output Features (PDF, Email, CSV)**
    *   **Task**: Implement all output features. Setup PDF generation (install libs, create template `lib/pdf/estimate-template.tsx`). Implement `generateEstimatePdfAction` (`actions/pdf/pdf-actions.ts`) and add download button (`components/estimates/pdf-download-button.tsx`) to editor. Setup Email (install lib, configure `lib/email`, setup Mailpit). Implement `sendEstimateEmailAction` (`actions/email/email-actions.ts`) and add email modal/button (`components/estimates/email-estimate-modal.tsx`) to editor. Implement CSV export (install lib) via `exportEstimateCsvAction` (in `estimates-actions.ts`) and add button/logic to editor.
    *   **Files**:
        *   `lib/pdf/estimate-template.tsx` (Create/Update)
        *   `lib/pdf/index.ts` (Create/Update)
        *   `actions/pdf/pdf-actions.ts` (Create)
        *   `components/estimates/pdf-download-button.tsx` (Create)
        *   `lib/email/index.ts` (Create)
        *   `.env.local` / `.env.example` (Update for Email)
        *   `db/schema/settings-schema.ts` / `actions/db/settings-actions.ts` / `app/(admin)/settings/_components/settings-form.tsx` (Update for Email From config)
        *   `actions/email/email-actions.ts` (Create)
        *   `components/estimates/email-estimate-modal.tsx` (Create)
        *   `actions/db/estimates-actions.ts` (Update - add `exportEstimateCsvAction`)
        *   `app/(app)/estimates/[estimateId]/_components/estimate-editor.tsx` (Update - add all buttons)
    *   **Step Dependencies**: Step 1, Step 3, Step 7, Step 9
    *   **User Instructions**: Run `npm install @react-pdf/renderer pdf-lib file-saver @types/file-saver resend papaparse @types/papaparse`. Set up Mailpit/MailHog and Email Service (Resend) credentials in `.env.local`. Add Email From details in Admin Settings.

-   [ ] **Step 11: QuickBooks Online Integration (Setup & Execution)**
    *   **Task**: Implement the full QBO integration. Install SDK. Update Settings schema/actions/UI for QBO credentials. Implement QBO client setup and token refresh (`lib/qbo/`). Implement OAuth actions (`getQboAuthUrlAction`, `handleQboCallbackAction` in `actions/qbo/qbo-actions.ts`). Create API callback route (`app/api/qbo/callback/route.ts`). Add Connect button to Admin Settings (`_components/qbo-connect-button.tsx`). Implement customer sync helpers (`lib/qbo/` or `actions/qbo/`). Implement `createQboEstimateAction` handling the full flow (fetch, refresh, sync customer, map items, create QBO estimate, update local status). Add "Approve & Send to QBO" button (`components/estimates/qbo-send-button.tsx`) to the editor.
    *   **Complexity Note**: This is a large step involving multiple interconnected parts (OAuth, API calls, data mapping). It might require careful generation and potentially multiple iterations or manual refinement.
    *   **Files**:
        *   `db/schema/settings-schema.ts` (Update)
        *   `actions/db/settings-actions.ts` (Update)
        *   `app/(admin)/settings/_components/settings-form.tsx` (Update)
        *   `lib/qbo/index.ts` (Create/Update)
        *   `types/qbo-types.ts` (Update)
        *   `actions/qbo/qbo-actions.ts` (Create/Update)
        *   `app/api/qbo/callback/route.ts` (Create)
        *   `app/(admin)/settings/_components/qbo-connect-button.tsx` (Create)
        *   `app/(admin)/settings/page.tsx` (Update)
        *   `actions/db/estimates-actions.ts` (Update)
        *   `components/estimates/qbo-send-button.tsx` (Create)
        *   `app/(app)/estimates/[estimateId]/_components/estimate-editor.tsx` (Update)
        *   `app/(app)/estimates/[estimateId]/page.tsx` (Update)
    *   **Step Dependencies**: Step 1, Step 3, Step 7, Step 9
    *   **User Instructions**: Run `npm install node-quickbooks`. Create QBO Dev account & app, get credentials, set Redirect URI. Add credentials to `.env.local` and configure in Admin Settings. Test OAuth flow and sending estimates.

-   [ ] **Step 12: Testing Implementation**
    *   **Task**: Implement the testing strategy. Write unit tests for calculation logic (`lib/calculations/__tests__/`). Write integration tests for key server actions (estimates, QBO - mocking external calls) (`actions/db/__tests__/`, `actions/qbo/__tests__/`). Write E2E tests for core workflows (estimate creation/edit, admin data management) (`e2e/`).
    *   **Files**:
        *   `lib/calculations/__tests__/estimate-calculator.test.ts` (Create)
        *   `actions/db/__tests__/estimates-actions.test.ts` (Create)
        *   `actions/qbo/__tests__/qbo-actions.test.ts` (Create)
        *   `e2e/estimate-workflow.spec.ts` (Create)
        *   `e2e/admin-materials.spec.ts` (Create)
        *   (Add other test files as needed)
    *   **Step Dependencies**: Step 7, Step 9, Step 11 (or mocks)
    *   **User Instructions**: Run `npm install --save-dev vitest @vitest/ui playwright @playwright/test`. Configure testing in `package.json`. Run `npx playwright install`. Setup test DB/mocking if needed.

-   [ ] **Step 13: Final Review, Cleanup & Deployment Prep**
    *   **Task**: Conduct a final review of the application: check UI consistency, responsiveness, error handling, remove console logs, ensure all requirements are met. Remove unused code/template remnants (e.g., Stripe if unused). Verify `.env.example` is complete. Perform thorough manual testing. Prepare for deployment.
    *   **Files**: Various files across the project.
    *   **Step Dependencies**: All previous steps
    *   **User Instructions**: Set up environment variables on Vercel (or chosen hosting provider). Deploy the application.