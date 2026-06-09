# Deploying Edvade

Edvade has two parts:

| Folder | Role |
|--------|------|
| `edvade-backend` | Node.js API (Express + MySQL) |
| `edvadefrontend` | Static HTML/CSS/JS site |

---

## 1. Prepare the database

1. Create a MySQL database (local, Railway, PlanetScale, Aiven, etc.).
2. Import the schema:

```bash
mysql -u YOUR_USER -p YOUR_DATABASE < edvade-backend/schema.sql
```

3. Create a lecturer account:

```bash
cd edvade-backend
cp .env.example .env
# Edit .env with your DB credentials
npm install
node scripts/seed-lecturer.js
```

Default lecturer (change in `.env` before seeding):

- Email: `lecturer@edvade.com`
- Password: `lecturer123`

---

## 2. Configure the backend

Copy `edvade-backend/.env.example` to `.env` and set:

| Variable | Example |
|----------|---------|
| `DB_HOST` | `containers-us-west-xxx.railway.app` |
| `DB_USER` | `root` |
| `DB_PASS` | your password |
| `DB_NAME` | `edvade` |
| `DB_SSL` | `true` (if your host requires SSL) |
| `JWT_SECRET` | long random string (new for production) |
| `PORT` | leave empty — host usually sets this |
| `FRONTEND_URL` | `https://your-frontend.netlify.app` |
| `NODE_ENV` | `production` |

Test locally:

```bash
cd edvade-backend
npm run dev
```

```bash
curl http://localhost:3000/api/health
```

Expected: `{"ok":true,"database":"connected"}`

Production start:

```bash
npm start
```

---

## 3. Configure the frontend API URL

Every HTML page loads `js/config.js` before `js/auth.js`.

### Option A — Same domain (recommended)

Deploy backend with `SERVE_FRONTEND=true`. API is at `/api` on the same domain.

In backend `.env`:

```
SERVE_FRONTEND=true
NODE_ENV=production
```

Frontend auto-uses `https://yourdomain.com/api`.

### Option B — Split hosting (e.g. Netlify + Render)

1. Deploy backend → note URL e.g. `https://edvade-api.onrender.com`
2. On the frontend, uncomment and set in `index.html` `<head>` (copy to other pages or use a shared pattern):

```html
<meta name="edvade-api-base" content="https://edvade-api.onrender.com/api" />
```

Or copy `js/config.production.example.js` → `js/config.production.js`, set your URL, and load it **before** `config.js`:

```html
<script src="js/config.production.js"></script>
<script src="js/config.js"></script>
```

3. Set backend `FRONTEND_URL` to your frontend URL exactly:

```
FRONTEND_URL=https://your-app.netlify.app
```

---

## 4. Deployment options

### Single server (VPS / Railway / Render)

1. Upload both folders (keep `edvadefrontend` next to `edvade-backend`).
2. Set env vars on the host.
3. Run `npm install && npm start` in `edvade-backend`.
4. Set `SERVE_FRONTEND=true` for one-domain hosting.

### Split hosting

| Service | Host | Deploy |
|---------|------|--------|
| Backend | Render, Railway, Fly.io | Root: `edvade-backend`, start: `npm start` |
| Frontend | Netlify, Vercel, Cloudflare Pages | Root: `edvadefrontend`, no build command |
| Database | Railway MySQL, PlanetScale | Import `schema.sql` |

---

## 5. Pre-deploy checklist

- [ ] `schema.sql` imported on production MySQL
- [ ] Lecturer account seeded
- [ ] `.env` **not** committed (use host env panel)
- [ ] Strong `JWT_SECRET` in production
- [ ] `FRONTEND_URL` matches deployed frontend (HTTPS, exact URL)
- [ ] Frontend API URL points to production backend (not `localhost`)
- [ ] `GET /api/health` returns `database: connected`
- [ ] Upload `images/` and `pdfs/` with frontend
- [ ] Test: register → login → module → quiz → logout

---

## 6. Common errors

| Error | Fix |
|-------|-----|
| CORS blocked | Set `FRONTEND_URL` to exact frontend origin |
| Failed to fetch | Wrong API URL — check meta tag or `config.production.js` |
| MySQL connection failed | Check `DB_*` and try `DB_SSL=true` |
| 401 on all requests | Token expired or `JWT_SECRET` changed |
| Mixed content | Use HTTPS for both frontend and API |

---

## 7. Local development

```bash
# Terminal 1 — backend
cd edvade-backend
npm run dev

# Terminal 2 — frontend
cd edvadefrontend
npx serve .
```

`config.js` auto-uses `http://localhost:3000/api` when hostname is `localhost` or `127.0.0.1`.
