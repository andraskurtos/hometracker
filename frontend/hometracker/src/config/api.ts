/**
 * Central API configuration.
 *
 * Production (Docker): the frontend is served from the same origin as the
 * backend — nginx proxies `/api` and `/uploads` — so relative URLs are used and
 * nothing about host, port, or scheme is baked into the bundle. This is what
 * makes the app work behind any address, with or without TLS.
 *
 * Local dev: the Vite dev server proxies the same paths to the backend (see
 * vite.config.ts), so the relative defaults work there too. To point at a
 * backend running elsewhere, set VITE_API_ORIGIN (e.g. http://192.168.0.10:8000).
 */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/** Origin of the backend. Empty string means "same origin as this page". */
export const BACKEND_ORIGIN = trimTrailingSlash(import.meta.env.VITE_API_ORIGIN ?? '');

/** Base URL for REST endpoints: `<origin>/api`. */
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;
