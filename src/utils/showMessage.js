// src/utils/showMessage.js

// Utilidad sencilla para mostrar mensajes tanto en Tauri como en el navegador
// Evita los errores de referencia cuando 'message' no está disponible en web

const isTauriEnvironment = () =>
  typeof window !== 'undefined' && (Boolean(window.__TAURI__) || Boolean(window.__TAURI_INTERNALS__));

const loadTauriMessage = async () => {
  // Evita que Vite falle si el plugin no está instalado en el entorno web
  const pluginModule = await import(/* @vite-ignore */ '@tauri-apps/plugin-dialog').catch(() => null);
  return pluginModule?.message ?? null;
};

export async function showMessage(texto, options = {}) {
  if (isTauriEnvironment()) {
    const messageFn = await loadTauriMessage();
    if (messageFn) {
      return messageFn(texto, options);
    }
  }

  // Fallback sencillo para la versión web
  if (options?.title) {
    alert(`${options.title}: ${texto}`);
    return;
  }

  alert(texto);
}