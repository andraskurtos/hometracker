const BACKEND_URL = `http://${window.location.hostname}:8000`;

/**
 * Resolves a potentially relative asset URL (like /uploads/...) to a full URL
 * pointing to the backend server.
 */
export const getAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;
  
  // If it's a relative path starting with /, prepend the backend URL
  if (path.startsWith('/')) {
    return `${BACKEND_URL}${path}`;
  }
  
  // Otherwise just return it as is (might be a local asset or broken)
  return path;
};
