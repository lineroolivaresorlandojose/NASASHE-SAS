// src/utils/showMessage.js

// Utilidad sencilla para mostrar mensajes tanto en Tauri como en el navegador
// Evita los errores de referencia cuando 'message' no está disponible en web

const isTauriEnvironment = () =>
  typeof window !== 'undefined' && (Boolean(window.__TAURI__) || Boolean(window.__TAURI_INTERNALS__));

export async function showMessage(texto, options = {}) {
  if (isTauriEnvironment()) {
    // Importación dinámica para no romper en el entorno web␊
    const { message } = await import('@tauri-apps/plugin-dialog');
    return message(texto, options);
  }

  // Fallback sencillo para la versión web
  if (options?.title) {
    alert(`${options.title}: ${texto}`);
    return;
  }

  alert(texto);
}