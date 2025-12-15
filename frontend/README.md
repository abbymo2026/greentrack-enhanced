
# GreenTrack – Enhanced Grant Manager (Frontend v2)

This is the React frontend for your Enhanced Grant Manager.

## Features
- Outcome tracking (success/failure, feedback, resubmission planning)
- Document upload with 5 categories + subcategories
- File management (download/delete)
- Communications log (emails, calls, meetings)
- Success dashboard with metrics
- Grants listing and detail pages

## Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Configure API base (optional)
By default, API requests go to `/api`. If you run the backend on another URL, create a `.env` file:
```
VITE_API_BASE=https://your-backend.example.com/api
```

### 3) Run the dev server (with proxy to backend on localhost:3001)
```bash
npm run dev
```
Open http://localhost:5173

### 4) Build for production
```bash
npm run build
```
The static files will be generated under `dist/`.

## Render deployment
If your repository has `frontend/` and `backend/` folders, place this project in `frontend/`. Render can build both services using `render.yaml`, or you can deploy the static frontend separately.

## Project Structure
```
src/
  components/
    EnhancedFileUpload.jsx
    FileManager.jsx
    CommunicationsLog.jsx
    OutcomeForm.jsx
    SuccessDashboard.jsx
  pages/
    Dashboard.jsx
    GrantsList.jsx
    GrantDetails.jsx
  services/api.js
  hooks/useFetch.js
  App.jsx
  main.jsx
  styles.css
```

## Notes
- Endpoints expected by this UI:
  - `GET /api/grants` — list of grants
  - `GET /api/grants/:id` — single grant (optional; UI falls back to list if not available)
  - `POST /api/grants/:id/outcome`
  - `GET /api/grants/:id/files`, `POST /api/grants/:id/files`
  - `DELETE /api/files/:id`, `GET /api/files/:id/download`
  - `GET /api/grants/:id/communications`, `POST /api/grants/:id/communications`
  - `DELETE /api/communications/:id`
  - `GET /api/dashboard/stats`

- If you run frontend and backend on different domains, ensure CORS is enabled on the backend and set `VITE_API_BASE` accordingly.

## License
MIT
