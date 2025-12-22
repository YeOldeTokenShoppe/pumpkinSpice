import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches
  defaultLocale,
  
  // Automatically redirect based on browser language
  localeDetection: true,
  
  // Always show locale in URL (e.g., /en/home3)
  localePrefix: 'always'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|es|fr|de|it|pt|ja|zh)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};