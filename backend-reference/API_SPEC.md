# API Specification — Mídias Mafort

Base URL: `https://midias.grupomafort.com`

All protected routes require: `Authorization: Bearer <token>`

---

## 1. Auth

### POST /auth/login
**Body:** `{ "email": "string", "password": "string" }`
**Response 200:** `{ "token": "string", "user": { "id", "email", "full_name", "avatar_url" } }`

### POST /auth/signup
**Body:** `{ "email": "string", "password": "string", "full_name": "string" }`
**Response 201:** `{ "token": "string", "user": { "id", "email", "full_name", "avatar_url" } }`

### GET /auth/me 🔒
**Response 200:** `{ "user": { "id", "email", "full_name", "avatar_url" } }`

---

## 2. Workspaces

### GET /workspaces 🔒
**Response 200:** Array of Workspace
```json
[{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "avatar_url": "string | null",
  "created_at": "ISO8601"
}]
```

### POST /workspaces 🔒
**Body:** `{ "name": "string", "slug": "string" }`
**Response 201:** Workspace object

---

## 3. Accounts (Social)

### GET /accounts?workspace_id=:id 🔒
**Response 200:** Array of SocialAccount
```json
[{
  "id": "uuid",
  "workspace_id": "uuid",
  "platform": "youtube | instagram | tiktok",
  "platform_username": "string",
  "platform_avatar": "string | null",
  "status": "connected | disconnected | expired",
  "connected_at": "ISO8601"
}]
```

### POST /accounts/connect 🔒
**Body:** `{ "workspace_id": "uuid", "platform": "youtube | instagram | tiktok" }`
**Response 200:** `{ "oauth_url": "string" }`

### DELETE /accounts/:id 🔒
**Response 204:** No content

---

## 4. Media

### GET /media?workspace_id=:id 🔒
**Response 200:** Array of MediaItem
```json
[{
  "id": "uuid",
  "workspace_id": "uuid",
  "filename": "string",
  "url": "string",
  "thumbnail_url": "string | null",
  "type": "video | image | carousel",
  "size": 123456,
  "duration": 60,
  "width": 1920,
  "height": 1080,
  "status": "uploading | processing | ready | error",
  "created_at": "ISO8601",
  "tags": ["tag1"]
}]
```

### POST /media/upload 🔒
**Content-Type:** `multipart/form-data`
**Fields:** `file` (binary), `workspace_id` (string)
**Response 201:** MediaItem object

### DELETE /media/:id 🔒
**Response 204:** No content

---

## 5. Schedule (Posts)

### GET /schedule?workspace_id=:id 🔒
**Response 200:** Array of ScheduledPost
```json
[{
  "id": "uuid",
  "workspace_id": "uuid",
  "media_id": "uuid",
  "account_id": "uuid",
  "platform": "youtube | instagram | tiktok",
  "caption": "string",
  "hashtags": ["tag"],
  "metadata": {},
  "scheduled_at": "ISO8601",
  "status": "draft | scheduled | publishing | published | failed",
  "published_url": "string | null",
  "error_message": "string | null",
  "created_at": "ISO8601"
}]
```

### POST /schedule 🔒
**Body:** Partial ScheduledPost (workspace_id, media_id, account_id, platform, caption, hashtags, scheduled_at required)
**Response 201:** ScheduledPost object

### PUT /schedule/:id 🔒
**Body:** Partial ScheduledPost fields to update
**Response 200:** ScheduledPost object

### DELETE /schedule/:id 🔒
**Response 204:** No content

---

## 6. Queue

### GET /queue?workspace_id=:id 🔒
**Response 200:** Array of QueueJob
```json
[{
  "id": "uuid",
  "post_id": "uuid",
  "status": "pending | processing | completed | failed | retrying",
  "attempts": 1,
  "max_attempts": 3,
  "started_at": "ISO8601 | null",
  "completed_at": "ISO8601 | null",
  "error": "string | null",
  "created_at": "ISO8601"
}]
```

### POST /queue/:id/retry 🔒
**Response 200:** QueueJob object

---

## 7. Analytics

### GET /analytics?workspace_id=:id&period=30d 🔒
**Response 200:** AnalyticsData
```json
{
  "total_posts": 42,
  "posts_this_week": 5,
  "total_views": 150000,
  "total_engagement": 8500,
  "engagement_rate": 5.6,
  "platform_breakdown": [
    { "platform": "youtube", "posts": 15, "views": 80000, "engagement": 4000 }
  ],
  "daily_posts": [
    { "date": "2026-03-01", "count": 2 }
  ],
  "top_posts": []
}
```

---

## 8. Health (already exists)

### GET /health
**Response 200:** `{ "status": "ok" }`
