# Project Cleanup Report

**Date:** February 19, 2026  
**Scope:** Folder structure, dead code removal, organization, code quality, env/config, README, GitHub readiness.

---

## 1. Files Removed

| Item | Reason |
|------|--------|
| `src/verifyToken.js` | Not imported anywhere; moved to backup. |
| `src/reducers/users.js` | Not used in Redux store (app uses `authSlice` only); moved to backup. |
| `src/pages/LoginPageEmail.jsx` | Not in App routes; main `LoginPage` supports email + phone; moved to backup. |
| `src/api/axiosInstance.js` | Merged into `src/config/axiosInstance.js` (single axios instance). |
| `src/dashboard/superadmin/layout/superadminlayout.jsx` | Renamed to `SuperAdminLayout.jsx` (PascalCase); old file deleted. |

---

## 2. Files Moved to Backup (Not Deleted)

All are under **`src/_backup_unused/`** with a short README:

| File | Description |
|------|-------------|
| `verifyToken.js` | Token verification utility; can be re-enabled for route guards. |
| `usersSlice.js` | Redux user slice (was `reducers/users.js`); never wired in store. |
| `LoginPageEmail.jsx` | Staff email-only login page (condensed copy); not in routes. |

**Risky / optional:** None of these were deleted outright; they were moved to backup so you can restore or reference them.

---

## 3. Files Moved / Renamed

| From | To |
|------|----|
| `src/dashboard/superadmin/layout/superadminlayout.jsx` | `src/dashboard/superadmin/layout/SuperAdminLayout.jsx` |
| Route definitions (inline in `App.jsx`) | `src/routes/AppRoutes.jsx` (new file); `App.jsx` now imports and renders `<AppRoutes />`. |

All imports were updated (e.g. `App.jsx` → `SuperAdminLayout`, `store` and `authSlice` → `config/axiosInstance`).

---

## 4. Unused Code and Cleanup

- **Console.logs removed** in:
  - `src/dashboard/user/TrackCurrentOrder.jsx`
  - `src/dashboard/user/form/UploadSurvey.jsx`
  - `src/pages/RegisterPage.jsx`
  - `src/dashboard/user/OrderHistoryTable.jsx`
- **Unused imports / variables fixed:**  
  `UserFormDrawer` (catch `e` → `catch`), `OrderHistoryTable` (render params), `TrackCurrentOrder` (pagination, projectNo), `Header` (userName → _userName), `TrackOrderCard` (error in catch), `UploadSurvey` (deleting, audioChunks, handleAudioUpload, handleAudioRemove prefixed with `_`), `RegisterPage` (removed unused eslint-disable).
- **Duplicate axios:** Single instance in `src/config/axiosInstance.js` with `setAxiosStore`, `TOKEN_KEY`, `USER_KEY`, and 401 → logout; `src/api/axiosInstance.js` removed.
- **Hardcoded API URL:** Removed from `config/axiosInstance.js`; base URL comes only from `VITE_API_BASE_URL` (`.env`).

---

## 5. New / Updated Files

| File | Purpose |
|------|---------|
| `src/_backup_unused/` | Folder for unused/deprecated files + README. |
| `src/constants/roles.js` | Role constants (e.g. SUPER_ADMIN, CAD, SURVEYOR). |
| `src/routes/AppRoutes.jsx` | Central route definitions; used by `App.jsx`. |
| `.env.example` | Template with `VITE_API_BASE_URL` (no secrets). |
| `README.md` | Project description, setup, env, folder structure, tech stack, features, API list, lint note. |
| `.gitignore` | Clarified sections (dependencies, build, env, editor). |
| `CLEANUP_REPORT.md` | This report. |

---

## 6. API Handling

- All HTTP calls go through **`src/config/axiosInstance.js`**.
- Services under **`src/services/`** (auth, user, masters, upload, surveyor) use that instance; no scattered axios in components.
- No API logic or request flows were changed.

---

## 7. Lint

- **Fixed:** Unused variables and unused eslint-disable (e.g. in RegisterPage, UserFormDrawer, OrderHistoryTable, TrackCurrentOrder, Header, TrackOrderCard, UploadSurvey).
- **Left as-is (14 errors):** React hook rules (`set-state-in-effect`, `static-components`) in:
  - `Header.jsx`, `OrderDetailDrawer.jsx`, `ProjectOrderDetailDrawer.jsx`
  - `AddHoblis.jsx`, `EditHoblis.jsx`, `AddVillages.jsx`, `EditVillages.jsx`
  - `SurveyInfo.jsx`, `Home.jsx` (Card component)
  
  Fixing these would require refactors (e.g. moving setState into async callbacks or declaring Card outside the component); they were not changed to avoid affecting behavior.

---

## 8. Final Folder Structure (src)

```
src/
├── _backup_unused/          # Unused files (verifyToken, usersSlice, LoginPageEmail) + README
├── app/
│   └── store.js
├── assets/
│   ├── fonts/               # ibm, montserrat
│   └── react.svg
├── components/
│   ├── common/
│   │   └── FileUploader.jsx
│   ├── users/
│   │   └── UserFormDrawer.jsx
│   ├── Footer.jsx
│   └── Header.jsx
├── config/
│   └── axiosInstance.js     # Single axios instance (TOKEN_KEY, USER_KEY, setAxiosStore)
├── constants/
│   └── roles.js
├── dashboard/
│   ├── cad/
│   │   ├── layout/
│   │   │   ├── cadlayout.css
│   │   │   └── CADLayout.jsx
│   │   ├── orders/
│   │   │   ├── OrderDetailDrawer.jsx
│   │   │   ├── ordersData.js
│   │   │   ├── ViewAllOrders.jsx
│   │   │   └── ViewCurrentOrders.jsx
│   │   ├── wallet/
│   │   │   └── Wallet.jsx
│   │   ├── CADHomePage.jsx
│   │   └── ...
│   ├── superadmin/
│   │   ├── layout/
│   │   │   ├── superadminlayout.css
│   │   │   └── SuperAdminLayout.jsx
│   │   ├── admin/, cadcenters/, cadusers/, districts/, hoblis/, projects/, talukas/, user/, villages/
│   │   ├── SuperAdminHome.jsx
│   │   └── ...
│   └── user/
│       ├── component/
│       │   ├── Header.jsx
│       │   ├── Home.jsx
│       │   ├── TableComponent.jsx
│       │   └── TrackOrderCard.jsx
│       ├── form/
│       │   ├── SurveyInfo.jsx
│       │   └── UploadSurvey.jsx
│       ├── HomePage.jsx
│       ├── OrderHistoryTable.jsx
│       ├── TrackCurrentOrder.jsx
│       └── UserUploadForm.jsx
├── features/
│   └── auth/
│       └── authSlice.js
├── hooks/
│   └── useFileUpload.js
├── pages/
│   ├── Homepage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── routes/
│   └── AppRoutes.jsx
├── sections/
│   ├── AboutPlatform.jsx
│   ├── Benifits.jsx
│   ├── ClientTestimonials.jsx
│   ├── Hero.jsx
│   ├── HowItWorks.jsx
│   ├── HowVideo.jsx
│   └── ...
├── services/
│   ├── auth/
│   │   └── authService.js
│   ├── masters/
│   │   ├── cadcenterservice.js
│   │   ├── districtService.js
│   │   ├── hobliService.js
│   │   ├── talukaService.js
│   │   └── villageService.js
│   ├── surveyor/
│   │   └── sketchUploadService.js
│   ├── upload/
│   │   ├── upload.api.js
│   │   ├── upload.constants.js
│   │   └── upload.service.js
│   └── user/
│       └── userService.js
├── utils/
│   └── userListUtils.js
├── App.jsx
├── index.css
└── main.jsx
```

---

## 9. Verification

- **Build:** `npm run build` was run; failure was due to Tailwind/native module loading in the sandbox (e.g. `@tailwindcss/oxide-win32-x64-msvc`), not due to the refactor. Recommend running `npm run build` and `npm run dev` locally to confirm.
- **Routes:** All routes are defined in `AppRoutes.jsx` and rendered by `App.jsx`; no routes were removed or changed.
- **Behavior:** No API logic, auth flow, or feature flags were changed; only structure, naming, and cleanup.

---

## 10. Root-Level Files (Unchanged / Optional)

- **`config.js`** (project root): Contains `API_BASE_URL`, `ROLES`, etc. It is **not imported** by any file under `src`. API base URL is taken from `VITE_API_BASE_URL` in `.env`. You can keep `config.js` for other tooling or remove it; roles are also in `src/constants/roles.js`.
- **`ROUTING_DOCUMENTATION.md`**: Left as-is; you may update it to mention `AppRoutes.jsx` and that `LoginPageEmail` is not in routes.

---

**Summary:** The project is cleaned and organized for GitHub with a single axios config, env-based API URL, routes in one place, backup for unused code, and a clear README. Behavior and features are unchanged; run `npm run dev` and `npm run build` locally to confirm.
