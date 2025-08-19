import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { MusicProvider } from "@/components/MusicContext";

export const metadata = {
  title: 'Our Lady of Perpetual Profit',
  viewport: 'width=device-width',
  initialscale:'1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <MusicProvider>
            {children}
          </MusicProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}



