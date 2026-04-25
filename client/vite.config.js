import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	// This project uses JSX in `.js` files (CRA-style). Parse all `src/**/*.js(x)`
	// as JSX so Vite import-analysis doesn't choke on JSX syntax.
	esbuild: {
		loader: "jsx",
		include: /src\/.*\.[jt]sx?$/,
	},
	optimizeDeps: {
		esbuildOptions: {
			loader: {
				".js": "jsx",
			},
		},
	},
	build: {
		// Keep Express production hosting unchanged: it serves `client/build`
		outDir: "build",
		emptyOutDir: true,
	},
});

