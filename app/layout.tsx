// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgenoQuiz - Smart Quiz System",
  description:
    "Secure, smart, and student-friendly quiz app for schools and teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} overscroll-none`}>
        <main className="min-h-screen flex flex-col relative overflow-x-hidden">
          <AuthProvider>{children}</AuthProvider>
        </main>
      </body>
    </html>
  );
}
