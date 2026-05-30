import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const potentialLocale = request.nextUrl.pathname.split("/")[1];

  if (
    potentialLocale &&
    /^[a-z]{2}$/i.test(potentialLocale) &&
    !routing.locales.includes(potentialLocale as (typeof routing.locales)[number])
  ) {
    return NextResponse.next();
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
