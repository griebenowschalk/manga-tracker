# 📡 MangaTracker API

**Base URL:**  
```
http://localhost:4000
```

## Endpoints

### GET `/manga`
Fetch all manga entries.

### GET `/manga/:id`
Fetch a single manga.

### POST `/manga`
Create a new manga entry.  
**Body:**
```json
{
  "title": "string",
  "author": "string"
}
```

### PATCH `/manga/:id`
Update manga details.

### DELETE `/manga/:id`
Delete manga by ID.
