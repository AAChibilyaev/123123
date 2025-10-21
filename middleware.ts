import createMiddleware from "next-intl/middleware";
export default createMiddleware({ locales: ["en", "ru"], defaultLocale: "en", localeDetection: true });
export const config = { matcher: ["/", "/(en|ru)/:path*"] };
