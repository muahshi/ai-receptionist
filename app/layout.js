import "./globals.css";

export const metadata = {
  title: "AI Receptionist",
  description: "Smart Hotel Management System",
  manifest: "/manifest.json",
  themeColor: "#D4AF37",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Reception",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full bg-charcoal-800 font-body antialiased overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 10%, rgba(212,175,55,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 90%, rgba(212,175,55,0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(26,26,26,1) 0%, rgba(10,10,10,1) 100%)
            `,
          }}
        />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
