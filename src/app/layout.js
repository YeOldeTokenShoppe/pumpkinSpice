import "./globals.css";

import { ClerkProvider } from
"@clerk/nextjs";




export const metadata = {
  title: 'Our Lady of Perpetual Profit',
  viewport: 'width=device-width',
  initialscale:'1',
};


export default function 
  RootLayout({ children }) {
    return (
      <html lang="en" 
  data-theme="dark" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <ClerkProvider>

                {/* Music player here
   will NEVER unmount */}
                {children}

          </ClerkProvider>
        </body>
      </html>
    );
  }



