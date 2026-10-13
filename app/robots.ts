import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/map", "/unsubscribe"],
    },
    sitemap: "https://www.stopnest.com/sitemap.xml",
  };
}
