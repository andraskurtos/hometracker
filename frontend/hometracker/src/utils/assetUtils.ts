import { BACKEND_ORIGIN } from '@/config/api';

/**
 * Resolves a potentially relative asset URL (like /uploads/...) to a full URL
 * pointing to the backend server.
 *
 * With BACKEND_ORIGIN empty (same-origin deployment) the path stays relative,
 * which is exactly what we want behind the nginx reverse proxy.
 */
export const getAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // If it's a relative path starting with /, prepend the backend origin
  if (path.startsWith('/')) {
    return `${BACKEND_ORIGIN}${path}`;
  }

  // Otherwise just return it as is (might be a local asset or broken)
  return path;
};
