import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "AI Assist – ADA Compliance, AI Receptionist, Docs→AI",
  description: "Protect, automate, and scale your business in 14 days.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        {children}
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a1885fb1ce15bb9e9813833"
          data-source="WEB_USER"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}