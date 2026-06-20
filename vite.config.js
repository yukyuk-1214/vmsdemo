import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes asset paths relative, so it works on GitHub Pages project
// sites (https://<user>.github.io/<repo>/) without further configuration.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
