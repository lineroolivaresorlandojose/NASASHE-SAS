// src/utils/assetPath.js
// Devuelve la ruta correcta para un asset público respetando `import.meta.env.BASE_URL`.
// Así evitamos 404 cuando la app se sirve desde un subdirectorio (por ejemplo GitHub Pages).
export default function assetPath(path = '') {
  if (!path) return path;

  // Rutas absolutas completas (http/https) se devuelven sin cambios
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '') || '/';
  const baseWithoutSlash = base.replace(/^\/+/, '');

  // Normalizamos la ruta recibida quitando barras iniciales
  let cleanedPath = path.replace(/^\/+/, '');

  // Si la ruta ya incluye el `base` (con o sin slash inicial), lo retiramos para no duplicarlo
  if (baseWithoutSlash && cleanedPath.startsWith(`${baseWithoutSlash}/`)) {
    cleanedPath = cleanedPath.slice(baseWithoutSlash.length + 1);
  }

  const prefix = base === '/' ? '' : base;
  return `${prefix}/${cleanedPath}`;
}
