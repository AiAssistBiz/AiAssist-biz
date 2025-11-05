export const metadata = {
  title: "AI Assist — ADA Compliance, AI Receptionist, Docs→AI",
  description: "Protect, automate, and scale your business in 14 days.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
