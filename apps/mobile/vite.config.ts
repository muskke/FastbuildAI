import uni from "@dcloudio/vite-plugin-uni";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [uni()],
    server: {
        port: 4092,
        host: "0.0.0.0",
        open: true,
    },
    base: "/mobile",
});
