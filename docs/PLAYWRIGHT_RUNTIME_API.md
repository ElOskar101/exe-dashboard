# Playwright Runtime Management API

## Overview

The Playwright Runtime Management API provides endpoints to create, manage, and share runtime environments for executing Playwright automation projects. This API supports role-based access control with `public` and `private` scopes for both runtimes and applications.

**Base URL:** `/api/v2`

---

## Authentication

All endpoints require an `x-access-token` header with a valid JWT token.

```javascript
headers: {
  'x-access-token': '<JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

The token contains the user ID (`req.userId`), which is automatically used for `createdBy` fields.

---

## Data Models

### Runtime Schema

```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "description": "string (optional)",
  "accessInfo": {
    "createdBy": "ObjectId (auto-set from token)",
    "sharedWith": ["ObjectId (user IDs)"],
    "type": "enum ['public', 'private']"
  },
  "applications": [
    {
      "name": "string (required)",
      "active": "boolean (default: true)",
      "nonProduction": "boolean (default: false)",
      "description": "string (optional)",
      "apiUrl": "string (optional)",
      "config": {
        "maxWorkers": "number (default: 10)",
        "maxRetries": "number (default: 3)"
      },
      "accessInfo": {
        "createdBy": "ObjectId (auto-set from token)",
        "sharedWith": ["ObjectId (user IDs)"],
        "type": "enum ['public', 'private']"
      }
    }
  ],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Access Control Rules

- **Private Runtime:** Only the owner can see it. Applications inherit privacy unless explicitly shared.
- **Public Runtime:** Anyone can see it, but only the owner can view/access applications unless they are explicitly shared.
- **Public Application in Private Runtime:** ❌ **NOT ALLOWED** — if runtime is private, all applications must be private.
- **Private Application in Public Runtime:** ✅ **ALLOWED** — only shared users can access it.

---

## Endpoints

### 1. List All Runtimes

**GET** `/playwright-runtimes/`

Returns all public runtimes, your private runtimes, and runtimes shared with you.

#### Request

```http
GET /api/v2/playwright-runtimes/
x-access-token: <TOKEN>
Content-Type: application/json
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "_id": "6a204341982ce6c83b5ccbde",
      "name": "VPS~1",
      "description": "Testing runtime",
      "accessInfo": {
        "type": "public",
        "sharedWith": []
      },
      "applications": [
        {
          "name": "Bare",
          "active": true,
          "nonProduction": true,
          "config": {
            "maxWorkers": 10,
            "maxRetries": 3
          },
          "apiUrl": "api.controlcentralcarrier.com",
          "description": "Uses bare implementation..."
        }
      ],
      "createdAt": "2026-06-10T10:00:00Z"
    }
  ],
  "message": "success",
  "success": true
}
```

#### Behavior

- **Public runtimes:** Returned with applications you have access to.
- **Your private runtimes:** Returned with all applications.
- **Runtimes shared with you:** Returned with only the applications shared with you.

---

### 2. Get Single Runtime

**GET** `/playwright-runtimes/:id`

Fetch a specific runtime by ID. You must have access to view it.

#### Request

```http
GET /api/v2/playwright-runtimes/6a204341982ce6c83b5ccbde
x-access-token: <TOKEN>
Content-Type: application/json
```

#### Response (200 OK)

```json
{
  "data": {
    "_id": "6a204341982ce6c83b5ccbde",
    "name": "VPS~1",
    "description": "Testing runtime",
    "accessInfo": {
      "type": "private",
      "createdBy": "622f79263ccdc854030a3999",
      "sharedWith": ["622f79263ccdc854030a3998"]
    },
    "applications": [
      {
        "name": "Bare",
        "active": true,
        "nonProduction": true,
        "config": {
          "maxWorkers": 10,
          "maxRetries": 3
        },
        "accessInfo": {
          "type": "private",
          "sharedWith": []
        }
      }
    ],
    "createdAt": "2026-06-10T10:00:00Z",
    "updatedAt": "2026-06-10T12:00:00Z"
  },
  "message": "success",
  "success": true
}
```

#### Error Responses

- **404 Not Found** — Runtime doesn't exist or you don't have access.
- **401 Unauthorized** — Invalid or missing token.

---

### 3. Create Runtime

**POST** `/playwright-runtimes/`

Create a new runtime with one or multiple applications.

#### Request

```http
POST /api/v2/playwright-runtimes/
x-access-token: <TOKEN>
Content-Type: application/json

{
  "name": "VPS~1",
  "description": "Testing runtime",
  "accessInfo": {
    "type": "private"
  },
  "applications": [
    {
      "name": "Bare",
      "active": true,
      "nonProduction": true,
      "description": "Uses bare implementation of executor and core",
      "apiUrl": "api.controlcentralcarrier.com",
      "config": {
        "maxWorkers": 10,
        "maxRetries": 3
      },
      "accessInfo": {
        "type": "private"
      }
    },
    {
      "name": "Docker",
      "active": true,
      "nonProduction": true,
      "description": "Uses Docker containers",
      "apiUrl": "api.controlcentralcarrier.com",
      "config": {
        "maxWorkers": 15,
        "maxRetries": 5
      },
      "accessInfo": {
        "type": "private"
      }
    }
  ]
}
```

#### Response (201 Created)

```json
{
  "data": {
    "_id": "6a204341982ce6c83b5ccbde",
    "name": "VPS~1",
    "description": "Testing runtime",
    "createdBy": "622f79263ccdc854030a3999",
    "accessInfo": {
      "type": "private",
      "createdBy": "622f79263ccdc854030a3999",
      "sharedWith": []
    },
    "applications": [
      {
        "name": "Bare",
        "active": true,
        "nonProduction": true,
        "accessInfo": {
          "type": "private",
          "createdBy": "622f79263ccdc854030a3999",
          "sharedWith": []
        },
        "config": {
          "maxWorkers": 10,
          "maxRetries": 3
        },
        "apiUrl": "api.controlcentralcarrier.com",
        "description": "Uses bare implementation..."
      },
      {
        "name": "Docker",
        "active": true,
        "nonProduction": true,
        "accessInfo": {
          "type": "private",
          "createdBy": "622f79263ccdc854030a3999",
          "sharedWith": []
        },
        "config": {
          "maxWorkers": 15,
          "maxRetries": 5
        },
        "apiUrl": "api.controlcentralcarrier.com",
        "description": "Uses Docker containers"
      }
    ],
    "createdAt": "2026-06-10T10:00:00Z",
    "updatedAt": "2026-06-10T10:00:00Z"
  },
  "message": "Runtime created successfully",
  "success": true
}
```

#### Validation Rules

- `name` is required.
- At least one application is required.
- If runtime is `private`, all applications **must** be `private`.
- `createdBy` is auto-set from `req.userId`; do not send it in request body.

#### Error Responses

- **400 Bad Request** — Missing required fields or validation failed.
- **401 Unauthorized** — Invalid token.

---

### 4. Update Runtime

**PUT** `/playwright-runtimes/:id`

Update runtime details and/or applications. Only the owner can update.

#### Request

```http
PUT /api/v2/playwright-runtimes/6a204341982ce6c83b5ccbde
x-access-token: <TOKEN>
Content-Type: application/json

{
  "name": "VPS~1 Updated",
  "description": "Updated testing runtime",
  "accessInfo": {
    "type": "public"
  },
  "applications": [
    {
      "name": "Bare",
      "active": true,
      "nonProduction": true,
      "description": "Updated description",
      "apiUrl": "api.controlcentralcarrier.com",
      "config": {
        "maxWorkers": 20,
        "maxRetries": 3
      },
      "accessInfo": {
        "type": "public"
      }
    }
  ]
}
```

#### Response (200 OK)

```json
{
  "data": {
    "_id": "6a204341982ce6c83b5ccbde",
    "name": "VPS~1 Updated",
    "description": "Updated testing runtime",
    "accessInfo": {
      "type": "public",
      "createdBy": "622f79263ccdc854030a3999",
      "sharedWith": []
    },
    "applications": [
      {
        "name": "Bare",
        "active": true,
        "config": {
          "maxWorkers": 20,
          "maxRetries": 3
        },
        "accessInfo": {
          "type": "public"
        }
      }
    ],
    "updatedAt": "2026-06-10T12:00:00Z"
  },
  "message": "Runtime updated successfully",
  "success": true
}
```

#### Important Notes

- **Full replacement:** The `applications` array you send replaces the entire applications list. Include all apps you want to keep.
- **Runtime share unchanged:** Updating runtime does not change `sharedWith` members (use share endpoints for that).
- **Access control:** If runtime becomes `public`, you cannot have `public` applications (they must stay `private`).

#### Error Responses

- **403 Forbidden** — You are not the owner.
- **404 Not Found** — Runtime doesn't exist.
- **400 Bad Request** — Validation failed (e.g., public app in private runtime).

---

### 5. Delete Runtime

**DELETE** `/playwright-runtimes/:id`

Delete a runtime by ID. Only the owner can delete.

#### Request

```http
DELETE /api/v2/playwright-runtimes/6a204341982ce6c83b5ccbde
x-access-token: <TOKEN>
```

#### Response (200 OK)

```json
{
  "message": "Runtime deleted successfully",
  "success": true
}
```

#### Error Responses

- **403 Forbidden** — You are not the owner.
- **404 Not Found** — Runtime doesn't exist.

---

### 6. Add Share Members

**POST** `/playwright-runtimes/:id/share`

Add one or more users to the runtime's shared list.

#### Request

```http
POST /api/v2/playwright-runtimes/6a204341982ce6c83b5ccbde/share
x-access-token: <TOKEN>
Content-Type: application/json

{
  "memberIds": [
    "622f79263ccdc854030a3998",
    "622f79263ccdc854030a3997"
  ]
}
```

#### Response (200 OK)

```json
{
  "data": {
    "_id": "6a204341982ce6c83b5ccbde",
    "name": "VPS~1",
    "accessInfo": {
      "type": "private",
      "createdBy": "622f79263ccdc854030a3999",
      "sharedWith": [
        "622f79263ccdc854030a3998",
        "622f79263ccdc854030a3997"
      ]
    },
    "message": "Members added successfully"
  },
  "success": true
}
```

#### Error Responses

- **403 Forbidden** — You are not the owner.
- **404 Not Found** — Runtime doesn't exist.
- **400 Bad Request** — Invalid member IDs or other validation error.

---

### 7. Remove Share Members

**DELETE** `/playwright-runtimes/:id/share`

Remove one or more users from the runtime's shared list.

#### Request

```http
DELETE /api/v2/playwright-runtimes/6a204341982ce6c83b5ccbde/share
x-access-token: <TOKEN>
Content-Type: application/json

{
  "memberIds": [
    "622f79263ccdc854030a3998"
  ]
}
```

#### Response (200 OK)

```json
{
  "data": {
    "_id": "6a204341982ce6c83b5ccbde",
    "name": "VPS~1",
    "accessInfo": {
      "type": "private",
      "createdBy": "622f79263ccdc854030a3999",
      "sharedWith": [
        "622f79263ccdc854030a3997"
      ]
    },
    "message": "Members removed successfully"
  },
  "success": true
}
```

#### Error Responses

- **403 Forbidden** — You are not the owner.
- **404 Not Found** — Runtime doesn't exist or member not in share list.

---

## Frontend Implementation Examples

### React Hook: Fetch Runtimes

```javascript
import { useEffect, useState } from 'react';

function usePlaywrightRuntimes(token) {
  const [runtimes, setRuntimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v2/playwright-runtimes/', {
      headers: {
        'x-access-token': token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRuntimes(data.data);
        } else {
          setError(data.message);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  return { runtimes, loading, error };
}
```

### Create Runtime

```javascript
async function createRuntime(token, runtime) {
  const response = await fetch('/api/v2/playwright-runtimes/', {
    method: 'POST',
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(runtime)
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
}
```

### Update Runtime Applications (Keep Full List)

```javascript
async function updateRuntimeApplications(token, runtimeId, updatedRuntime) {
  // IMPORTANT: Send all applications you want to keep
  // The applications array is fully replaced
  
  const response = await fetch(`/api/v2/playwright-runtimes/${runtimeId}`, {
    method: 'PUT',
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedRuntime)
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
}
```

### Share Runtime with Members

```javascript
async function shareRuntimeWithMembers(token, runtimeId, memberIds) {
  const response = await fetch(`/api/v2/playwright-runtimes/${runtimeId}/share`, {
    method: 'POST',
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ memberIds })
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
}
```

---

## Access Control Summary

| Scenario | Can View | Can Update | Can Delete | Can Share |
|----------|----------|-----------|-----------|-----------|
| I own it (private) | ✅ | ✅ | ✅ | ✅ |
| I own it (public) | ✅ | ✅ | ✅ | ✅ |
| Shared with me | ✅ (limited apps) | ❌ | ❌ | ❌ |
| Public runtime | ✅ (limited apps) | ❌ | ❌ | ❌ |
| Other's private | ❌ | ❌ | ❌ | ❌ |

---

## Error Handling

All error responses follow this format:

```json
{
  "message": "Error description",
  "success": false,
  "error": "ErrorCode"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | You don't have permission (not owner) |
| NOT_FOUND | 404 | Runtime or resource doesn't exist |
| BAD_REQUEST | 400 | Validation failed (missing fields, invalid data) |
| CONFLICT | 409 | Public app cannot be in private runtime |
| SERVER_ERROR | 500 | Internal server error |

---

## Best Practices

1. **Always send full applications array on update** to avoid accidental deletion of apps.
2. **Check access type before rendering** — if app is private and not shared with user, don't display controls.
3. **Cache runtime list** with short TTL (e.g., 5 minutes) to reduce API calls.
4. **Validate on frontend** — check if user is owner before showing delete/update buttons.
5. **Handle 403 gracefully** — show user a message that they don't have permission instead of generic error.
6. **Use the `createdBy` field** to determine if current user is the owner.

---

## Testing with REST Client

See `/src/.http` for example requests you can use in JetBrains HTTP Client or VS Code REST Client.


