# Building Management

A React app to manage **buildings** (floors and apartments) and **parkings** (sections and spaces). Data is stored in the browser (localStorage).

## Quick start

- `npm install` then `npm run dev`
- **Buildings:** Open the app → “Create new building” or pick an existing one → click a floor → see apartments and their status (Available / In negotiation / Sold). You can drag apartment dots on floor plans and change status.
- **Parkings:** “Create new parking” or pick an existing one → draw sections on the overview image → add a plan image per section → set space count per section. Open a section to manage space circles and statuses (same as apartments).

## Buildings

- **Create/Edit:** Name, number of floors, upload facade image, draw floor areas on the image, set apartments per floor and sizes, optionally add floor plan images per floor. Edit and delete from the home page or building view.
- **View:** Click a building to see the facade; click a floor to open the floor plan. Each floor can show a custom floor plan image with draggable apartment dots (green/blue/red by status). Apartment status can be changed on the floor plan or in the list below.
- **Data:** Stored under `building-management-buildings` in localStorage. Images are compressed before saving to reduce quota usage.

## Parkings

- **Create/Edit:** Name → upload **overview** image (big picture of the parking) → **draw sections** on that image (as many rectangles as you want) → upload one **plan image per section** (used for placing circles) → set **number of parking spaces per section** → save. Edit and delete from the home page or parking view.
- **View:** Click a parking to see the overview image with section areas. Click a section (or a “Section N” button) to open that section’s **plan**: same image you uploaded for that section, with draggable circles per space and status (Available / In negotiation / Sold), like apartments.
- **Data:** Stored under `building-management-parkings` in localStorage. Overview and plan images are compressed before saving.

## Adding more buildings (via config)

- **Buildings** – Edit `src/config/buildings.ts`. Add a new object to the `buildings` array with `id`, `name`, `sectionLabel`, `floorCount`, and `floors` (each floor has `floorNumber`, `section`, `availableCount`, `apartments`).
- **Building facade image** – Set `imageUrl` on a building (e.g. `imageUrl: '/building-facade.jpg'`) and put the image in `public/`. If you omit `imageUrl`, a generated numbered facade is shown.
- **Floor plan image** – Optionally set `floorPlanImageUrl` on a floor in the config to show a custom blueprint/plan for that floor.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
