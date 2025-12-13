# NASASHE-SAS

Aplicación React construida con Vite. Este documento explica cómo ejecutarla localmente y cómo publicarla automáticamente en GitHub Pages con GitHub Actions.

## Requisitos
- Node.js 18 o superior
- npm 9 o superior (incluido con Node.js)
  
## Scripts disponibles
- `npm install`: instala dependencias.
- `npm run dev`: arranca el servidor de desarrollo.
- `npm run build`: genera la versión estática en `dist/`.
- `npm run preview`: sirve la build estática localmente.

## Despliegue automático en GitHub Pages (rama `gh-pages` generada por Actions)
1. **Sube el workflow al repositorio**
   - El archivo `.github/workflows/deploy-pages.yml` ya está configurado. Solo tienes que hacer *push* de la rama donde se encuentre (por defecto `main`).

2. **Activa GitHub Pages para usar Actions**
   - En GitHub: `Settings → Pages → Build and deployment → Source` elige **GitHub Actions** (no rama).

3. **Qué hace el workflow al hacer push a `main`**
   - Usa Node.js 18.
   - Ejecuta `npm ci` para instalar dependencias con el `package-lock.json`.
   - Ejecuta `npm run build` para generar la carpeta `dist/`.
   - Sube `dist/` como artefacto y lo publica en el entorno `github-pages` usando las acciones oficiales `upload-pages-artifact` y `deploy-pages`.
   - GitHub crea/actualiza la rama interna de Pages (equivalente a `gh-pages`) y sirve los archivos desde la raíz.

4. **Primera publicación**
   - Haz un *commit* y *push* a `main`. 
   - En la pestaña **Actions** verás el flujo `Deploy to GitHub Pages`; al terminar, la URL aparecerá en **Settings → Pages**.

5. **Base URL para Vite**
   - Si publicas bajo `https://<usuario>.github.io/<repo>/`, asegúrate de que `vite.config.js` tenga `base: "/<repo>/"` en `defineConfig` para que los assets se resuelvan correctamente. Ajusta el valor si cambias el nombre del repositorio o usas dominio personalizado.

6. **Despliegues manuales**
   - También puedes lanzar el flujo desde **Actions → Deploy to GitHub Pages → Run workflow** (usa el evento `workflow_dispatch`).

Con estos pasos, cada cambio en `main` disparará un build limpio y publicará automáticamente la carpeta `dist/` en GitHub Pages.
