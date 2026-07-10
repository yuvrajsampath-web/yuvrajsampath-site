import type { MetadataRoute } from "next";
import { PORTAL_PATH } from "@/lib/portal-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [`/${PORTAL_PATH}`, `/${PORTAL_PATH}/`],
    },
  };
}
