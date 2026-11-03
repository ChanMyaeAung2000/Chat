import { config } from "dotenv";

// Load env here too: ESM import hoisting means this module may be evaluated
// before dotenv.config() runs in the entry point (e.g. socket.js is imported
// before dotenv.config() is called in index.js).
config();

// CLIENT_URL may be a single origin or a comma-separated list, e.g.
// CLIENT_URL=http://localhost:5173,http://192.168.91.67:5173
export const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn(
    "CLIENT_URL is not set — only localhost/127.0.0.1 origins will be allowed by CORS."
  );
}

// Dev fallback when CLIENT_URL is unset/empty: allow any localhost origin.
const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (curl, same-origin via dev proxy,
    // server-to-server) don't need CORS headers.
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0 ? isLocalOrigin(origin) : allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`CORS rejected origin: ${origin}`);
    // Omit CORS headers instead of throwing — the browser blocks the response.
    return callback(null, false);
  },
  credentials: true,
};
