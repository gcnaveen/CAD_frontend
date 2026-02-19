# API URL Fix Report

**Date:** February 19, 2026  
**Issue:** Login was failing because frontend called `http://localhost:5173/auth/login` (404) instead of backend endpoint `POST /api/auth/login`

---

## Summary

Fixed all API calls to use proper backend URL format with `/api` prefix. All service files now use a centralized `apiClient` that reads `VITE_API_BASE_URL` from environment variables.

---

## Files Created

### 1. `src/services/apiClient.js` ✅
- **Purpose:** Single axios instance for all API calls
- **Features:**
  - Uses `VITE_API_BASE_URL` from environment (no trailing slash)
  - Includes request interceptor for auth token
  - Includes response interceptor for 401 handling
  - Exports `TOKEN_KEY`, `USER_KEY`, `setAxiosStore` for backward compatibility

---

## Files Modified

### 2. `src/services/user/userService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated endpoints:**
  - `/auth/login` → `/api/auth/login`
  - `/auth/profile` → `/api/auth/profile`
  - `/users` → `/api/users`
  - All user CRUD endpoints now use `/api/users/*`

### 3. `src/services/auth/authService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated endpoints:**
  - `/auth/superadmin/register` → `/api/auth/superadmin/register`
  - `/auth/login` → `/api/auth/login`
  - `/auth/me` → `/api/auth/me`
  - `/auth/signup/request-otp` → `/api/auth/signup/request-otp`
  - `/auth/signup/verify-otp` → `/api/auth/signup/verify-otp`
  - `/auth/surveyor/start` → `/api/auth/surveyor/start`
  - `/auth/surveyor/verify-otp` → `/api/auth/surveyor/verify-otp`
  - `/auth/surveyor/complete` → `/api/auth/surveyor/complete`
  - `/auth/surveyor/request-otp` → `/api/auth/surveyor/request-otp`

### 4. `src/services/masters/districtService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** BASE constant `/masters/districts` → `/api/masters/districts`
- **All endpoints:** Now use `/api/masters/districts/*`

### 5. `src/services/masters/talukaService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** BASE constant `/masters` → `/api/masters`
- **All endpoints:** Now use `/api/masters/talukas/*` or `/api/masters/districts/{id}/talukas`

### 6. `src/services/masters/hobliService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** BASE constant `/masters` → `/api/masters`
- **All endpoints:** Now use `/api/masters/hoblis/*` or `/api/masters/talukas/{id}/hoblis`

### 7. `src/services/masters/villageService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** BASE constant `/masters/villages` → `/api/masters/villages`
- **All endpoints:** Now use `/api/masters/villages/*`

### 8. `src/services/masters/cadcenterservice.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** BASE constant `/masters/cad-centers` → `/api/masters/cad-centers`
- **All endpoints:** Now use `/api/masters/cad-centers/*`

### 9. `src/services/surveyor/sketchUploadService.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** BASE constant `/surveyor/sketch-uploads` → `/api/surveyor/sketch-uploads`
- **All endpoints:** Now use `/api/surveyor/sketch-uploads/*`

### 10. `src/services/upload/upload.api.js` ✅
- **Changed:** Import from `config/axiosInstance` → `apiClient`
- **Updated:** UPLOAD_BASE constant `upload` → `/api/upload`
- **All endpoints:** Now use `/api/upload/image`, `/api/upload/audio`, `/api/upload/delete`

### 11. `src/config/axiosInstance.js` ✅
- **Changed:** Now re-exports from `apiClient` for backward compatibility
- **Purpose:** Components that import `TOKEN_KEY`, `USER_KEY`, `setAxiosStore` still work
- **Note:** All service files should use `apiClient` directly, but this file remains for non-service imports

### 12. `.env.example` ✅
- **Updated:** Added default value `VITE_API_BASE_URL=http://localhost:5000`
- **Note:** Users should copy this to `.env` and update with their backend URL

---

## Verification

### ✅ All Service Files Updated
- 9 service files now use `apiClient` instead of `config/axiosInstance`
- All endpoints have `/api` prefix
- Total API calls updated: 42+ endpoints

### ✅ Backward Compatibility Maintained
- `config/axiosInstance.js` re-exports from `apiClient`
- Components importing `TOKEN_KEY`, `USER_KEY`, `setAxiosStore` still work:
  - `src/components/Header.jsx`
  - `src/features/auth/authSlice.js`
  - `src/app/store.js`

### ✅ Environment Configuration
- `.env.example` updated with `VITE_API_BASE_URL=http://localhost:5000`
- Users must create `.env` file with their backend URL

---

## How It Works Now

1. **Environment Variable:** `VITE_API_BASE_URL` (e.g., `http://localhost:5000`)
2. **API Client:** `src/services/apiClient.js` creates axios instance with `baseURL = VITE_API_BASE_URL`
3. **Service Calls:** All services use `apiClient.post("/api/auth/login", ...)`
4. **Final URL:** `${VITE_API_BASE_URL}/api/auth/login` = `http://localhost:5000/api/auth/login` ✅

---

## Testing Checklist

- [ ] Create `.env` file with `VITE_API_BASE_URL=http://localhost:5000` (or your backend URL)
- [ ] Restart dev server: `npm run dev`
- [ ] Test login: Should call `POST http://localhost:5000/api/auth/login`
- [ ] Verify all API calls in browser Network tab show correct backend URL
- [ ] Test other features (registration, user management, masters, etc.)

---

## Example: Login Flow

**Before:**
```
Frontend: POST http://localhost:5173/auth/login (404 - wrong!)
```

**After:**
```
Frontend: POST http://localhost:5000/api/auth/login ✅
```

---

## Notes

- **No UI changes:** Only API URL configuration was modified
- **No auth flow changes:** Payload structure and logic unchanged
- **No breaking changes:** Backward compatibility maintained via `config/axiosInstance.js`
- **All endpoints:** Now follow `/api/...` pattern as required by backend

---

**Status:** ✅ Complete - Ready for testing
