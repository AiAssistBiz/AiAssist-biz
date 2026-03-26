import "./globals.css";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("../components/ChatWidget"), { ssr: false });

export const metadata = {
  title: "AI Assist – ADA Compliance, AI Receptionist, Docs→AI",
  description: "Protect, automate, and scale your business in 14 days.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}