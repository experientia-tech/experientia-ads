# Authentication Store

Simple API service for authentication with localStorage token management and protected API calls.

## Features

- ✅ Token stored in localStorage
- ✅ Automatic authentication checks
- ✅ Auto-redirect to login if not authenticated
- ✅ Generic wrapper for authenticated API calls
- ✅ Session expiry handling

## Usage

### Import the functions

```typescript
import {
  sendOtp,
  verifyOtp,
  logout,
  isAuthenticated,
  authenticatedFetch,
  getToken,
} from "@/app/experientia/store/Auth";
```

### Send OTP

```typescript
const result = await sendOtp("9972807388");

if (result.success) {
  console.log(result.message); // "OTP sent successfully"
  // Proceed to OTP verification step
} else {
  console.error(result.error); // Error message
}
```

### Verify OTP

```typescript
const result = await verifyOtp("9972807388", "123456");

if (result.success) {
  console.log(result.message); // "Login successful"
  console.log(result.token); // JWT token (also stored in localStorage)
  // Token is automatically stored in localStorage with key 'token'
  // Redirect to dashboard
  router.push("/experientia/dashboard");
} else {
  console.error(result.error); // Error message
}
```

### Check if User is Authenticated

```typescript
if (isAuthenticated()) {
  // User is logged in
  console.log("User is authenticated");
} else {
  // User is not logged in
  router.push("/signin");
}
```

### Get Current Token

```typescript
const token = getToken();
if (token) {
  console.log("Token:", token);
}
```

### Logout

```typescript
logout(); // Clears localStorage token and auth cookie
// Optionally redirect to login
router.push("/signin");
```

### Making Authenticated API Calls

Use the `authenticatedFetch` wrapper for all protected API calls. It automatically:

- Checks if user is authenticated
- Adds Authorization header with token
- Handles 401 responses (auto-logout and redirect)
- Manages session expiry

```typescript
try {
  const response = await authenticatedFetch("/api/campaigns", {
    method: "GET",
  });

  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error.message); // "Session expired. Please login again."
}
```

**POST Example:**

```typescript
try {
  const response = await authenticatedFetch("/api/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: "New Campaign",
      description: "Campaign description",
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Campaign created:", data);
  }
} catch (error) {
  console.error(error.message);
}
```

**PUT/DELETE Example:**

```typescript
try {
  const response = await authenticatedFetch("/api/campaigns/123", {
    method: "DELETE",
  });

  if (response.ok) {
    console.log("Campaign deleted");
  }
} catch (error) {
  console.error(error.message);
}
```

## Protected Component Example

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/app/constants/auth';
import { authenticatedFetch } from '@/app/constants/api';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication on component mount
    if (!isAuthenticated()) {
      router.push('/signin');
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const response = await authenticatedFetch('/api/user/profile');
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
      // User will be auto-redirected to /signin if session expired
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={fetchData}>Load Profile</button>
    </div>
  );
}
```

## API Endpoints

### POST /api/auth/send-otp

**Request Body:**

```json
{
  "phone": "9972807388"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Response (Error):**

```json
{
  "error": "Phone number is required"
}
```

### POST /api/auth/verify-otp

**Request Body:**

```json
{
  "phone": "9972807388",
  "otp": "123456"
}
```

**Response (Success - Status 200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**

```json
{
  "error": "Invalid OTP"
}
```

## How It Works

1. **Login Flow:**
   - User enters phone number → `sendOtp()` called
   - User enters OTP → `verifyOtp()` called
   - On success (status 200), token is automatically stored in localStorage with key `'token'`
   - User redirected to dashboard

2. **Protected API Calls:**
   - Use `authenticatedFetch()` instead of regular `fetch()`
   - Function checks if token exists in localStorage
   - If no token → auto-logout and redirect to `/signin`
   - If token exists → adds `Authorization: Bearer <token>` header
   - If API returns 401 → auto-logout and redirect to `/signin`

3. **Session Management:**
   - Token stored in localStorage persists across page refreshes
   - On logout, token is removed from localStorage and cookies are cleared
   - Any 401 response triggers automatic logout

## Example Implementation

See `/app/signin/page.tsx` for the complete sign-in implementation.
