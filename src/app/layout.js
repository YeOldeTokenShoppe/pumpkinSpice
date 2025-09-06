import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { MusicProvider } from "@/components/MusicContext";
import { MiniKitContextProvider } from "../../providers/MiniKitProvider";




export const metadata = {
  title: '𝓞𝖚𝖗 𝕷𝖆𝖉𝖞 𝔬𝔣 𝕻𝖊𝖗𝖕𝖊𝖙𝖚𝖆𝖑 𝕻𝖗𝖔𝖋𝖎𝖙',
  viewport: 'width=device-width',
  initialscale:'1',
  icons: {
    icon: '/favicon.svg', // or '/icon.png' if you use PNG
    apple: '/apple-icon.png', // optional: for Apple devices
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning style={{ margin: 0, padding: 0 }}>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, backgroundColor: '#000000' }}>
        <ClerkProvider>
          <MiniKitContextProvider>
            <MusicProvider>
              {children}
            </MusicProvider>
          </MiniKitContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}



