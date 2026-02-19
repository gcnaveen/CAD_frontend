# Serverless Lambda Backend Setup

## Configuration

Since you're using **serverless Lambda** (not a local server), the frontend needs to call your **API Gateway URL** directly.

### Step 1: Get Your API Gateway URL

1. Go to AWS Console → API Gateway
2. Find your API
3. Copy the **Invoke URL** (looks like: `https://abc123.execute-api.us-east-1.amazonaws.com`)

### Step 2: Set Environment Variable

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API Gateway URL:
   ```env
   VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
   ```

   **Important:** 
   - Do NOT include `/api` in the URL
   - Do NOT include trailing slash
   - Example: `https://abc123.execute-api.us-east-1.amazonaws.com` ✅

### Step 3: Restart Dev Server

```bash
npm run dev
```

## How It Works

1. **Frontend calls:** `apiClient.post("/api/auth/login", ...)`
2. **Final URL:** `${VITE_API_BASE_URL}/api/auth/login`
3. **Example:** `https://abc123.execute-api.us-east-1.amazonaws.com/api/auth/login`

## API Gateway Configuration

Make sure your API Gateway:
- ✅ Has `/api` prefix in routes (or configure accordingly)
- ✅ Has CORS enabled for your frontend domain
- ✅ Accepts `Authorization: Bearer <token>` header

## Troubleshooting

### CORS Errors
If you see CORS errors, add CORS headers in your Lambda/API Gateway:
```
Access-Control-Allow-Origin: http://localhost:5173 (dev) or your domain (prod)
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 404 Errors
- Check that your API Gateway routes include `/api` prefix
- Verify the API Gateway URL is correct
- Check API Gateway stage (dev, prod, etc.)

### Connection Refused
- Verify API Gateway is deployed and active
- Check API Gateway stage URL
- Ensure Lambda functions are deployed

## Production Build

For production builds, the same `VITE_API_BASE_URL` will be used. Make sure to:
1. Set it in your CI/CD environment variables
2. Or use a production-specific `.env.production` file
