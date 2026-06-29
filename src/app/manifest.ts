import type { MetadataRoute } from "next";

const themeColor = "#1f3328";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sejura",
    short_name: "Sejura",
    description: "Asistent de rezervari pentru pensiuni, cabane si vile locale.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: themeColor,
    theme_color: themeColor,
    categories: ["business", "productivity", "travel"],
    lang: "ro",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
