// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 3012,
  },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ["shadcn-nuxt", "@vueuse/nuxt", "@nuxtjs/color-mode"],
  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },
  colorMode: {
    classSuffix: "",
  },
});
