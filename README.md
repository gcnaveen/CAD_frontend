# CAD Frontend

React frontend for the CAD (Computer-Aided Design) platform. Supports multiple roles: Surveyor/User, CAD Center, and Super Admin, with landing page, auth, and dashboard flows.

## Tech Stack

- **React 19** with **Vite**
- **React Router v7**
- **Redux Toolkit** + **Redux Persist** (auth state)
- **Ant Design** + **Tailwind CSS v4**
- **Axios** (API client, single instance in `src/config/axiosInstance.js`)
- **lucide-react**, **xlsx**, **react-jwt**

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your backend base URL (no trailing slash)
npm run dev
```

- **Build:** `npm run build`
- **Preview build:** `npm run preview`
- **Lint:** `npm run lint`

## Environment Variables

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `VITE_API_BASE_URL`   | Backend API base URL (no trailing slash) |

See `.env.example`. Do not commit `.env` or secrets.

## Folder Structure

```
src/
├── app/                 # Redux store setup
├── assets/              # Static assets (fonts, images)
├── components/         # Reusable UI (Header, Footer, FileUploader, UserFormDrawer)
├── config/             # Axios instance and app config
├── constants/          # App constants (e.g. roles)
├── dashboard/           # Role-specific dashboards
│   ├── cad/            # CAD center (orders, wallet, layout)
│   ├── superadmin/     # Super admin (masters, projects, users, layout)
│   └── user/           # Surveyor/User (upload, track, order history)
├── features/           # Redux slices (auth)
├── hooks/              # Custom hooks (e.g. useFileUpload)
├── pages/              # Top-level pages (Homepage, Login, Register)
├── routes/             # Route definitions (AppRoutes)
├── sections/           # Landing page sections (Hero, About, HowItWorks, etc.)
├── services/           # API layer
│   ├── auth/           # Auth (login, register, OTP, surveyor flow)
│   ├── masters/        # Districts, talukas, hoblis, villages, CAD centers
│   ├── surveyor/       # Sketch uploads
│   ├── upload/         # Presigned URLs, upload helpers
│   └── user/           # User CRUD, profile, login
├── utils/              # Helpers (e.g. userListUtils)
├── index.css           # Global styles
├── main.jsx
└── App.jsx
```

- **Layouts:** `dashboard/cad/layout/CADLayout.jsx`, `dashboard/superadmin/layout/SuperAdminLayout.jsx`
- **API:** All HTTP calls go through `config/axiosInstance.js`; components use functions from `services/*`.

## Features

- **Public:** Landing page, login (phone/email + password), registration (surveyor OTP flow).
- **Surveyor/User:** Dashboard, upload survey (sketch uploads, presigned S3), track current order, order history.
- **CAD Center:** Dashboard, current orders, order history, wallet.
- **Super Admin:** Home, admin users, CAD centers, CAD users, master data (districts, talukas, hoblis, villages), projects, project history, user/surveyor details.

## API Integration

Backend base URL is set via `VITE_API_BASE_URL`. Main endpoint groups (paths relative to base URL):

- **Auth:** `POST /auth/login`, `GET /auth/profile`, `PATCH /auth/profile`, surveyor signup (request-otp, verify-otp, complete), superadmin register.
- **Users:** `GET /users`, `GET /users?role=...`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`.
- **Masters:** Districts, talukas, hoblis, villages, CAD centers (CRUD-style endpoints under respective paths).
- **Surveyor:** `POST /surveyor/sketch-uploads`, `GET /surveyor/sketch-uploads`, `GET /surveyor/sketch-uploads/:id`.
- **Upload:** `POST /upload/image`, `POST /upload/audio`, `POST /upload/delete` (presigned URLs and delete).

No API keys or secrets are stored in the repo; use `.env` for environment-specific configuration.

## Backup / Unused Code

Unused or deprecated files moved during cleanup are under `src/_backup_unused/` with a short README. They are not referenced by the app.

## Lint

Run `npm run lint`. Some React Compiler / strict hook rules (e.g. setState in effect, component declared inside render) may still report; these can be addressed in a follow-up refactor without changing behavior.

## License

Private. All rights reserved.
