import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased font-sans text-slate-900">{children}</body>
    </html>
  );
}
