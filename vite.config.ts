import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mockApi } from "./mock/mockApi";

// `npm run dev:mock` runs Vite in "mock" mode: the console talks to its own origin ("/")
// and this plugin answers the four backend endpoints from the demo data.
// No .env file is needed; an explicit VITE_API_URL still wins.
export default defineConfig(({ mode }) => {
  if (mode === "mock") process.env.VITE_API_URL ??= "/";
  return {
    plugins: [react(), ...(mode === "mock" ? [mockApi()] : [])],
    test: {
      environment: "node",
    },
  };
});
