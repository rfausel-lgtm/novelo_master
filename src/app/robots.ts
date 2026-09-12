import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    /*
     * `/grafo/?n=<id>` só abre o canvas focado num nó: não é página própria para indexar, e cada
     * dossiê gera um link desses. O Google casa a regra com a query string, então `/grafo/` segue livre.
     */
    rules: { userAgent: "*", allow: "/", disallow: ["/grafo/?", "/grafo?"] },
    sitemap: `${SITE.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
