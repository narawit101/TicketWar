import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { PwaRegister } from "@/components/common";

const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.FRONTEND_URL || "https://ticket-war-ten.vercel.app",
  ),
  title: {
    default: "TicketWar - ห้องแชท",
    template: "%s | TicketWar",
  },
  description: "ระบบแชทห้องส่วนตัว ไว้สำหรับพูดคุย",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TicketWar",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    siteName: "TicketWar",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${kanit.variable} ${kanit.className} h-full antialiased`}
    >
      <body className="min-h-full bg-[#121212] text-white flex flex-col">
        <AuthProvider>
          <PwaRegister />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#181818",
                color: "#ffffff",
                border: "1px solid #282828",
                borderRadius: "12px",
                fontSize: "13px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              },
              success: {
                iconTheme: {
                  primary: "#1ed760",
                  secondary: "#000000",
                },
              },
              error: {
                iconTheme: {
                  primary: "#f3727f",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </AuthProvider>
            </body>
    </html>
  );
}
