// Empty on purpose: this sub-project uses plain inline styles, no Tailwind.
// Without this file, Vite would walk up and pick up the parent repo's
// postcss.config.js (which requires tailwindcss, not installed here).
export default {}
