# AGENTS.md — Guide for AI Coding Agents

Instructions for AI agents (and humans) working in this repository. Read this before making changes; also see `PROJECT_SPEC.md` for the full specification.

## What this project is

**ShweChat** — a real-time 1-to-1 chat app. MERN-style monorepo split into two packages:

- `chat_backend/` — Express 5 (ESM) + MongoDB (Mongoose) + Socket.io REST/WebSocket API.
- `chat_frontend/` — React 19 + Vite SPA (Tailwind + daisyUI, zustand).

No root `package.json`. Work happens inside the two package folders.

## Commands

```bash
# Backend (chat_backend/)
npm run dev      # nodemon src/index.js (auto-reload) — needs .env
npm start        # node src/index.js
node src/seeds/user.seed.js   # seed demo users (note: inserts PLAINTEXT passwords — currently broken for login)

# Frontend (chat_frontend/)
npm run dev      # vite on 0.0.0.0:5173
npm run build    # production build
npm run lint     # eslint .
```

Manual verification is the norm — there are **no automated tests**. After changes, run both dev servers and click through the affected flow.

## Environment

- `chat_backend/.env`: `MONGODB_URL`, `PORT`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL` (comma-separated CORS allowlist, e.g. `http://localhost:5173,http://192.168.91.67:5173`), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `chat_frontend/.env`: `VITE_API_URL` (backend origin; **empty** = same-origin `/api` via the Vite dev proxy — the default setup), `VITE_PROXY_TARGET` (backend origin the dev proxy forwards `/api` + `/socket.io` ws to, default `http://localhost:5001`).
- CORS: shared options in `chat_backend/src/lib/corsOptions.js` used by both Express and Socket.io. Unknown origins get no CORS headers; requests without `Origin` (curl, proxy) pass.
- Both `.env` files are gitignored — **never commit secrets**, never print their values.

## Repository map

```
chat_backend/src/
  index.js                 # entry: express + http server + socket wiring, routes mount, static serving
  lib/db.js                # connectDB()
  lib/socket.js            # io + app + server singletons, getReceiverSocketId(), userSocketMap
  lib/utils.js             # generateToken(userId, res) → httpOnly cookie
  lib/cloudinary.js        # configured v2 client
  middleware/auth.middleware.js   # protectRoute: cookie → jwt verify → req.user (-password)
  models/user.model.js     # email, fullName, password (bcrypt), profilePic, friends[]
  models/message.model.js  # senderId, receiverId, text?, image?, audio?, isDeleted
  routes/*.js              # /api/auth, /api/messages, /api/friends
  controllers/*.js         # business logic
  seeds/user.seed.js       # demo users

chat_frontend/src/
  main.jsx, App.jsx        # router + auth bootstrapping
  pages/                   # Home, Login, SignUp, Settings, Profile, Friend (friend profile), Contacts
  components/              # Navbar, Sidebar, ChatContainer, ChatHeader, MessageInput, skeletons/, ...
  store/                   # useAuthStore, useChatStore, useThemeStore   (zustand)
  lib/axios.js             # axiosInstance → ${VITE_API_URL}/api, withCredentials
  lib/utils.js             # formatMessageTime
  constants/index.js       # THEMES (daisyUI theme names)
```

## Conventions & style

- **ESM only**. Backend imports use explicit `.js` extensions; frontend imports usually omit extensions.
- Backend flow: `route → protectRoute → controller → model`. Keep controllers thin-ish; use `try/catch` and return `500 { message }` on unexpected errors.
- Auth always goes through `protectRoute`; never pass the password hash to clients (`.select("-password")`).
- Frontend global state in zustand stores, not context. Screens read/write via store actions.
- Styling: Tailwind + daisyUI classes (`btn`, `chat`, `chat-bubble`, `bg-base-*`). Theme is a `data-theme` attribute set on the wrapper div in `App.jsx` and persisted to `localStorage["chat-theme"]`.
- New API calls go through `axiosInstance`; new socket usage goes through `useAuthStore.getState().socket` / chat store subscribe helpers.
- Keep user-facing copy consistent with existing tone (e.g., toasts via `react-hot-toast`).
- Code comments should be English; a few Burmese-language comments exist from the original author — you may translate them when touching those files.

## Gotchas (read before editing)

1. **`index.js` binds `0.0.0.0`** and computes `__dirname = path.resolve()` (cwd, NOT the file dir). The production static path (`../frontend/dist`) is currently wrong for this repo layout.
2. **Socket.io and Express share one HTTP server** (`lib/socket.js` exports `app`, `server`, `io`). `index.js` imports them and only calls `server.listen`. Don't create a second server.
3. **Message schema allows empty content** (all of text/image/audio optional) — validate in the controller if you need non-empty messages.
4. **Soft delete only**: `deleteMessage` sets `isDeleted: true` and emits `messageDeleted`; UIs render a tombstone. Never hard-delete unless the product requirement changes.
5. **The sender appends their own message from the HTTP response**; `newMessage` is emitted only to the *receiver*. Don't also append via the socket for the sender.
6. **`subscribeToMessages` registers listeners on the shared socket** — always pair with `unsubscribeFromMessages` in the effect cleanup, as `ChatContainer` does.
7. **Base64 uploads**: profile pics and message media travel as base64 (10mb JSON limit). Cloudinary uploads happen server-side; clients never hold Cloudinary credentials.
8. **`VITE_API_URL` has no `/api` suffix** — the code appends `/api`; empty string means same-origin `/api` (proxy). The socket connects directly to `VITE_API_URL` (or `/` — proxied via ws). In dev, the Vite proxy handles `/api` + `/socket.io`, so CORS should not be needed; if you bypass the proxy, the page's origin must be in the backend `CLIENT_URL` allowlist (comma-separated).
9. **Delete route duplication**: `DELETE /api/messages/delete/:id` (protected) is canonical; unprotected `DELETE /api/messages/:id` exists and should be removed when safe.
10. **Seeded users cannot log in** (plaintext passwords). Fix by hashing in the seed if you use it.
11. Backend depends on `"chat-app": "file:.."` — a self-reference artifact; don't rely on it.

## Security do-nots

- Don't commit or echo `.env` values (see also: `chat_backend/.env` contains a stray comment that looks like a secret — treat it as compromised and suggest rotation if the repo ever goes public).
- Don't log `req.cookies` or tokens (the current `protectRoute` does; avoid replicating, fix it when nearby).
- Don't add endpoints that return the user document without stripping `password` (e.g., `update-profile` currently leaks the hash — do not copy that pattern).
- Don't trust client-supplied `userId` on the socket handshake without JWT verification.
- Don't set `secure: true` only in dev assumptions; cookie flags must match deployment (HTTP LAN = `lax`/insecure, HTTPS = `secure`).

## Suggested workflow for a change

1. Locate the right package (`chat_backend/` vs `chat_frontend/`) — no shared code exists.
2. Backend change: add/adjust route → controller → model; wire through `protectRoute`; test with the frontend or curl (`curl -c cookies.txt -b cookies.txt ...`).
3. Frontend change: state in zustand; UI in components/pages; verify by running `npm run dev` and exercising the flow with two browser windows/users.
4. Keep diffs small and focused; match existing naming (`getX`, `isXLoading`, camelCase).
5. Update `PROJECT_SPEC.md` and this file if you add routes, env vars, scripts, models, or sockets.

## Known issues (short list — details in PROJECT_SPEC.md §9)

Unauthenticated socket handshake; unprotected duplicate DELETE route; leaky production static path; password logged via cookies in `protectRoute`; `update-profile` leaks password hash; `secure:false` cookie; seed users unusable; sidebar exposes all users; no pagination; one-way friends; O(N) chat-list derivation; dead commented code.
