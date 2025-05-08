// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgenoQuiz - Smart Quiz System",
  description:
    "Secure, smart, and student-friendly quiz app for schools and teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
