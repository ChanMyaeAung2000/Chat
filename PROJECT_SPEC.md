# ShweChat — Project Specification

> Full-stack real-time one-to-one chat application built on the MERN stack
> (MongoDB, Express, React, Node.js) with Socket.io.

**Repository layout**: single git repo, two independent npm packages:

| Directory        | Package   | Role                                        |
| ---------------- | --------- | ------------------------------------------- |
| `chat_backend/`  | `backend` | Express 5 REST API + Socket.io server       |
| `chat_frontend/` | `frontend`| React 19 SPA (Vite)                         |

There is no root `package.json`; each package is installed and run independently.

---

## 1. Tech Stack

### Backend (`chat_backend/`)
- **Runtime**: Node.js (ESM — `"type": "module"`)
- **Framework**: Express 5.1
- **Database**: MongoDB via Mongoose 8
- **Realtime**: Socket.io 4 (shares the HTTP server with Express)
- **Auth**: JWT (`jsonwebtoken`) in an httpOnly cookie, password hashing via `bcryptjs`
- **Uploads**: Cloudinary v2 (avatars, message images, voice-message audio)
- **Infra**: `cors`, `cookie-parser`, `dotenv`, `express.json({ limit: "10mb" })` for base64 payloads
- **Dev**: `nodemon`

### Frontend (`chat_frontend/`)
- **Framework**: React 19 + Vite 6
- **Routing**: react-router-dom 7
- **State**: zustand 5 (`useAuthStore`, `useChatStore`, `useThemeStore`)
- **Styling**: TailwindCSS 3 + daisyUI 4 (themeable UI, 30+ themes)
- **HTTP**: axios instance with `withCredentials: true`
- **Realtime**: socket.io-client
- **UX**: react-hot-toast (toasts), lucide-react (icons), emoji-picker-react
- **Lint**: ESLint 9 flat config (`eslint.config.js`), react-hooks + react-refresh plugins

### Data flow at a glance
```
Browser (React SPA)
   │  axios (REST, cookie auth, CORS credentials)
   ▼
Express API  ─────────►  MongoDB (users, messages)
   │                        ▲
   └── Socket.io server ────┤  (same http.Server)
         ▲                  │
         └──── persistent WebSocket ────┘
Cloudinary ◄── base64 uploads (images / audio / avatars)
```

---

## 2. Features

- **Authentication**: signup, login, logout. JWT issued into an httpOnly `jwt` cookie (7-day expiry, `sameSite: lax`, `secure: false`). Client bootstraps session via `GET /api/auth/check`.
- **Profile**: change full name, upload avatar (base64 → Cloudinary), change password.
- **Messaging**: 1-to-1 text, image and voice messages. Images/audio are sent as base64 data URLs and uploaded to Cloudinary server-side. Messages render optimistically from REST responses; incoming messages arrive via `newMessage` socket event.
- **Soft delete**: sender-only delete; message is flagged `isDeleted: true` and both parties see "This message was deleted" via `messageDeleted` socket event.
- **Contacts / Friends**: add a friend by email (one-directional — stored in `user.friends`), view contacts, view a friend's profile page.
- **Chat list**: sidebar lists users you have an existing message history with (`GET /api/messages/chats`), derived by scanning your messages.
- **Online presence**: in-memory `userSocketMap`; `getOnlineUsers` broadcast on every connect/disconnect. (Not durable, single-process only.)
- **Theming**: daisyUI themes, persisted in `localStorage` under `chat-theme` (default `coffee`).
- **Seeding**: `src/seeds/user.seed.js` inserts demo users.

---

## 3. Data Models (Mongoose)

### `User` (`chat_backend/src/models/user.model.js`)
| Field        | Type                        | Notes                    |
| ------------ | --------------------------- | ------------------------ |
| `email`      | String, required, unique    | login identifier         |
| `fullName`   | String, required            |                          |
| `password`   | String, required, minlength 6 | bcrypt hash              |
| `profilePic` | String, default `""`        | Cloudinary URL           |
| `friends`    | [ObjectId ref `User`]       | one-way friend list      |
| timestamps   | createdAt/updatedAt         |                          |

### `Message` (`chat_backend/src/models/message.model.js`)
| Field        | Type                     | Notes                          |
| ------------ | ------------------------ | ------------------------------ |
| `senderId`   | ObjectId ref `User`, req |                                |
| `receiverId` | ObjectId ref `User`, req |                                |
| `text`       | String                   | optional (image/audio possible)|
| `image`      | String                   | Cloudinary URL                 |
| `audio`      | String                   | Cloudinary URL (voice)         |
| `isDeleted`  | Boolean, default `false` | soft delete flag               |
| timestamps   | createdAt/updatedAt      |                                |

---

## 4. API Reference

Base URL: `${VITE_API_URL}/api` (e.g. `http://localhost:5001/api` in dev, or `/api` when served from the same origin).
Auth: httpOnly cookie `jwt`. Protected routes require the cookie. CORS is configured with `origin: process.env.CLIENT_URL` and `credentials: true`.

### Auth — `/api/auth`
| Method | Path               | Guard         | Body                              | Response / Notes |
| ------ | ------------------ | ------------- | --------------------------------- | ---------------- |
| POST   | `/signup`          | public        | `{ fullName, email, password }`   | 201 user (no password); sets cookie. Password ≥ 6 chars, email must be unique. |
| POST   | `/login`           | public        | `{ email, password }`             | 200 user; sets cookie. 400 on bad credentials. |
| POST   | `/logout`          | public        | —                                 | Clears cookie. |
| GET    | `/check`           | `protectRoute`| —                                 | `req.user` (password excluded) |
| PUT    | `/update-profile`  | `protectRoute`| `{ profilePic? (base64), fullName? }` | Updates profile; uploads pic to Cloudinary. ⚠️ Returns the full updated user doc including `password` — see Known Issues. |
| PUT    | `/change-password` | `protectRoute`| `{ oldPassword, newPassword }`    | Verifies old password (bcrypt), re-hashes new. |

### Messages — `/api/messages`
| Method | Path          | Guard         | Body                              | Notes |
| ------ | ------------- | ------------- | --------------------------------- | ----- |
| GET    | `/users`      | `protectRoute`| —                                 | All users except self (NOT friend-filtered). |
| GET    | `/chats`      | `protectRoute`| —                                 | Users you have message history with (scanned from `Message` collection). |
| GET    | `/:id`        | `protectRoute`| —                                 | Full 1-to-1 conversation with user `:id` (sender/receiver `$or`). Unpaginated. |
| POST   | `/send/:id`   | `protectRoute`| `{ text?, image? (base64), audio? (base64) }` | Cloudinary-upload, save, emit `newMessage` to receiver's socket. 201 + message. |
| DELETE | `/delete/:id` | `protectRoute`| —                                 | Sender-only soft delete (`isDeleted=true`); emits `messageDeleted` to sender & receiver. |
| DELETE | `/:id`        | **none**      | —                                 | ⚠️ Duplicate, unprotected route to the same handler (see Known Issues). |

### Friends — `/api/friends`
| Method | Path    | Guard         | Body / Query | Notes |
| ------ | ------- | ------------- | ------------ | ----- |
| POST   | `/add`  | `protectRoute`| `{ email }`  | Finds user by email, rejects self-add, prevents duplicates, pushes id into `req.user.friends`. One-way. |
| GET    | `/`     | `protectRoute`| —            | Populated friend list (passwords excluded). |

### Socket.io (same origin/port as the API)
| Event            | Direction         | Payload                | Notes |
| ---------------- | ----------------- | ---------------------- | ----- |
| connection       | client → server   | `query: { userId }`    | ⚠️ `userId` is trusted blindly — no JWT verification on the handshake (see Known Issues). |
| `getOnlineUsers` | server → client   | `string[]` (userIds)   | Broadcast on connect/disconnect. |
| `newMessage`     | server → client   | `Message`              | Emitted to receiver only; sender updates from HTTP response. |
| `messageDeleted` | server → clients  | `{ messageId }`        | Emitted to both parties on soft delete. |

---

## 5. Frontend Structure

### Routes (`src/App.jsx`)
| Path        | Element          | Guard |
| ----------- | ---------------- | ----- |
| `/`         | `HomePage`       | requires `authUser` |
| `/signup`   | `SignUpPage`     | guest-only |
| `/login`    | `LoginPage`      | guest-only |
| `/settings` | `SettingsPage`   | public (theme picker) |
| `/profile`  | `ProfilePage`    | requires `authUser` |
| `/contacts` | `ContactsPage`   | requires `authUser` |
| `/friend`   | `FriendPage`     | requires `selectedUser` (friend's profile) |

### State stores (`src/store/`, zustand)
- **`useAuthStore`** — `authUser`, auth bootstrap (`checkAuth`), signup/login/logout/updateProfile/changePassword, socket lifecycle (`connectSocket`/`disconnectSocket`), `onlineUsers`.
- **`useChatStore`** — `users`, `chatUsers`, `friends`, `messages`, `selectedUser`, fetch/send/delete message actions, `subscribeToMessages`/`unsubscribeFromMessages` (live `newMessage`/`messageDeleted`).
- **`useThemeStore`** — `theme` persisted in `localStorage` (`chat-theme`, default `coffee`).

### Key components
`Sidebar` (chat list via `/messages/chats`), `ChatContainer` + `ChatHeader` + `MessageInput` (text/image/voice via `MediaRecorder`, emoji picker), `NoChatSelected`, `MessageSkeleton`, `SidebarSkeleton`, `Navbar` (links: Settings / Contacts / Profile / Logout; brand: **ShweChat**), `AuthImagePattern` (login/signup visual).

### HTTP client (`src/lib/axios.js`)
```js
axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ""}/api`, withCredentials: true })
```
Socket URL uses the same `VITE_API_URL` (or `"/"`).

---

## 6. Environment Variables

### Backend (`chat_backend/.env`) — **gitignored**
| Variable                | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `MONGODB_URL`           | Mongoose connection string                |
| `PORT`                  | API listen port (server binds `0.0.0.0`)  |
| `JWT_SECRET`            | JWT signing secret (7-day tokens)         |
| `NODE_ENV`              | `production` enables static frontend serving |
| `CLIENT_URL`            | CORS origin (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary config                         |
| `CLOUDINARY_API_KEY`    | Cloudinary config                         |
| `CLOUDINARY_API_SECRET` | Cloudinary config                         |

> Note: `chat_backend/.env` also contains a stray commented-out secret-looking line. Rotate any real credentials before making the repo public.

### Frontend (`chat_frontend/.env`) — **gitignored**
| Variable           | Purpose                                                            | Example                 |
| ------------------ | ------------------------------------------------------------------ | ----------------------- |
| `VITE_API_URL`     | Backend origin (no trailing slash, no `/api`). **Empty in dev** — browser uses same-origin `/api` and the Vite dev proxy forwards to the backend. | `http://localhost:5001` (direct access), *empty* (proxy) |
| `VITE_PROXY_TARGET`| Backend origin the Vite **dev proxy** forwards `/api` and `/socket.io` (ws) to. Not exposed to the browser bundle. | `http://localhost:5001` |

When `VITE_API_URL` is empty (recommended dev setup, and production same-origin), API calls go to `/api` and the socket connects to `/`. CORS is then unnecessary in the browser; the Vite dev server proxies traffic to `VITE_PROXY_TARGET`. The backend CORS allowlist `CLIENT_URL` accepts a comma-separated list of origins (e.g. `http://localhost:5173,http://192.168.91.67:5173`) and applies to direct (non-proxied) access and to the Socket.io handshake.

---

## 7. Setup & Scripts

### Prerequisites
- Node.js (LTS) + npm
- A reachable MongoDB instance (Atlas or local)
- Cloudinary account (for image/audio/avatar uploads)

### Backend
```bash
cd chat_backend
npm install
npm run dev        # nodemon src/index.js — auto-reload
npm start          # node src/index.js
```
Server listens on `PORT` (bound to `0.0.0.0`), then calls `connectDB()`.

Seed demo users (not wired to an npm script):
```bash
cd chat_backend
node src/seeds/user.seed.js
```

### Frontend
```bash
cd chat_frontend
npm install
npm run dev        # vite dev server on 0.0.0.0:5173
npm run build      # production build → dist/
npm run preview    # serve built app
npm run lint       # eslint .
```

### Production
With `NODE_ENV=production`, the backend attempts to serve the built frontend as static files and fall back to `index.html` for SPA routes. See Known Issues #3 — the static path is computed from the **current working directory** and points at `../frontend/dist`, which does not match `chat_frontend/dist`; deploy by building the frontend and serving it correct with your own reverse proxy or by fixing the path.

### Backend
The backend `CLIENT_URL` is a comma-separated CORS allowlist (e.g. `http://localhost:5173,http://192.168.91.67:5173`); requests without an `Origin` header (curl, dev proxy) always pass, unknown origins get no CORS headers. CORS options are shared between Express and Socket.io via `src/lib/corsOptions.js`, which loads `dotenv` itself (import hoisting means the entry point's `dotenv.config()` runs after imported modules are evaluated).

Typical dev topology: Vite on `:5173` serves the SPA and **proxies** `/api` and `/socket.io` (WebSocket) to the backend on `$PORT` (e.g. 5001) — the browser only ever talks same-origin to `:5173`, so no CORS error can occur. Direct browser→backend access (`VITE_API_URL` set) also works as long as the page's exact origin is in `CLIENT_URL`. The LAN IP of the dev machine may change; with the proxy it doesn't matter.

---

## 8. Conventions

- **Modules**: ESM everywhere (`import`/`export`); backend uses `.js` with explicit extensions.
- **Backend layout**: routes → controllers → models; `lib/` for singletons (db, socket, cloudinary, jwt utils); `middleware/` for guards.
- **Error handling**: controllers wrap in `try/catch`, log via `console.log`, return `500 { message: "Internal Server Error" }`.
- **Auth middleware**: `protectRoute` reads `req.cookies.jwt`, verifies, attaches `-password` user to `req.user`.
- **Frontend**: functional components, hooks, zustand for global state, no prop-drilling of auth/chat state.
- **Styling**: Tailwind utility classes + daisyUI component classes (`btn`, `chat`, `chat-bubble`, `bg-base-*`); theme via `data-theme` attribute on the root div.
- **Comments**: some Burmese-language comments exist in the codebase — keep new code in English.
- **No tests** exist yet; verification is manual (run both servers, exercise flows).

---

## 9. Known Issues & Tech Debt

1. **Socket handshake is unauthenticated.** `userId` comes from a query param and is trusted; anyone can impersonate any user and siphon their real-time `newMessage` events. Fix: verify the JWT cookie/token during the socket handshake.
2. **Unprotected duplicate route.** `DELETE /api/messages/:id` has no `protectRoute` (it 500s today because `req.user` is undefined, but it should be removed or guarded).
3. **Broken production static path.** `path.resolve()` + `"../frontend/dist"` doesn't match `chat_frontend/dist`; compute from `import.meta.url`/`__dirname`-equivalent instead.
4. **`protectRoute` logs the raw cookies** (including the JWT) on every request — leaks credentials into logs.
5. **`update-profile` returns the full user document**, including the bcrypt password hash, to the client.
6. **`secure: false` JWT cookie unconditionally** — must become `true` behind HTTPS in production (and consider `sameSite` implications for cross-site deployments).
7. **Seed users can't log in**: `user.seed.js` inserts plaintext passwords via `insertMany` (no bcrypt hashing), so `bcrypt.compare` fails for all seeded accounts. Hash in the seed or sign up fresh.
8. **`getUsersForSidebar` ignores friendship** — exposes every registered user to every client. Restrict to friends or contacts as intended.
9. **No message pagination / no index strategy** — `GET /api/messages/:id` loads the entire conversation.
10. **Friendship is one-directional** — adding someone adds them only to your list; no mutual consent or reverse lookup.
11. **Empty message allowed** — `sendMessage` permits no text/image/audio.
12. **Dead code & duplication**: large commented-out blocks (`message.controller.js`, `message.model.js`, `axios.js`, `useAuthStore.js`), hardcoded LAN IPs in comments, `console.log({ onlineUsers })` / `console.log({ authUser })` in `App.jsx`.
13. **Derived chat list is O(all messages)** — `getChatUsers` scans the full message collection per request; consider an aggregated `conversations` collection.
14. **No rate limiting, helmet, or input sanitization** on the API.
15. **Messenger deletes only affect the DB** — both parties' UIs update via socket, but offline clients only learn on reload (acceptable, but document it).
16. `"chat-app": "file:.."` self-referencing dependency in backend `package.json` — remove.
17. `PATH` inconsistency: backend `"main": "src/index.js"` is fine, but there is no `lint`/`test` script for the backend.

---

## 10. Roadmap / Natural Next Steps

- Socket authentication via token handshake; presence backed by Redis if scaling beyond one process.
- Friend request/accept flow (mutual consent) + remove-friend endpoint.
- Cursor-based message pagination; unread counts & typing indicators.
- Group chats (would require rethinking the 1-to-1 message schema or a `conversations` abstraction).
- Tighten auth: `secure` cookies, helmet, rate limits, email normalization, `select("-password")` everywhere.
- Remove dead code; add ESLint config for backend; add integration tests for auth + messaging.

---

## 11. Glossary

- **Contact** — a user added via `/api/friends/add` (stored in `user.friends`).
- **Chat user / conversation partner** — a user with whom you share message history (`/api/messages/chats`).
- **Online users** — userIds currently connected to Socket.io.
- **Soft delete** — `isDeleted: true` on the message document; UI renders a tombstone.
