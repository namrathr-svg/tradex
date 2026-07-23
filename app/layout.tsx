import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: {
    default: "TradeX — Buy & sell verified sneakers, streetwear & collectibles",
    template: "%s · TradeX",
  },
  description:
    "TradeX is a trusted marketplace for sneakers, streetwear and collectibles. Every seller is identity-verified before they can trade.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
