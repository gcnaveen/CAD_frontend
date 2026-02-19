# Vite Proxy Fix Report

**Date:** February 19, 2026  
**Issue:** Login API calls were going to `http://localhost:5173/api/auth/login` (404) instead of being proxied to backend

---

## Problem

Frontend was calling `/api/auth/login` which resolved to Vite dev server (`localhost:5173`) instead of backend server. Vite proxy configuration was missing.

---

## Solution

Added Vite proxy configuration to forward `/api/*` requests to backend server.

---

## Files Modified

### 1. `vite.config.js` ✅
**Added:**
- Proxy configuration for `/api` routes
- Proxy forwards to `http://localhost:5000` (or `VITE_API_BASE_URL` if set)
- Keeps `/api` prefix when forwarding

**Configuration:**
```javascript
server: {
  proxy: {
    "/api": {
      target: backendUrl, // http://localhost:5000 or VITE_API_BASE_URL
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path, // Keep /api prefix
    },
  },
}
```

### 2. `.env.example` ✅
**Updated:**
- Commented out `VITE_API_BASE_URL` for development
- Added note that proxy is used in development
- Production should set `VITE_API_BASE_URL`

### 3. `src/services/apiClient.js` ✅
**No changes needed:**
- Already uses empty `baseURL` by default (relative URLs)
- Works with proxy in development
- Can use `VITE_API_BASE_URL` in production

---

## How It Works

### Development (with Proxy):
1. Frontend calls: `apiClient.post("/api/auth/login", ...)`
2. Request goes to: `http://localhost:5173/api/auth/login` (relative URL)
3. Vite proxy intercepts `/api/*` requests
4. Proxy forwards to: `http://localhost:5000/api/auth/login`
5. Backend receives request ✅

### Production (without Proxy):
1. Set `VITE_API_BASE_URL=https://your-backend.com` in `.env`
2. Frontend calls: `apiClient.post("/api/auth/login", ...)`
3. Request goes to: `https://your-backend.com/api/auth/login` ✅

---

## Testing

1. **Restart dev server** (required for vite.config.js changes):
   ```bash
   npm run dev
   ```

2. **Verify proxy is working:**
   - Open browser DevTools → Network tab
   - Try login
   - Request should show: `POST http://localhost:5173/api/auth/login`
   - Status should be 200 (not 404)
   - Backend should receive the request

3. **Check backend logs:**
   - Backend should log incoming request to `/api/auth/login`

---

## Configuration

### Default Backend Port
- Proxy defaults to `http://localhost:5000`
- Change in `vite.config.js` if your backend uses different port

### Custom Backend URL
- Set `VITE_API_BASE_URL=http://localhost:YOUR_PORT` in `.env`
- Proxy will use this value

---

## Notes

- ✅ No changes to axios/service logic
- ✅ No changes to frontend components
- ✅ Only proxy configuration added
- ✅ Works with existing `/api` prefix in all endpoints
- ✅ Backward compatible with production builds

---

**Status:** ✅ Complete - Restart dev server and test login
