// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/auth-context";

// Load Inter font with extended latin support
const inter = Inter({ 
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"]
});

// Enhanced metadata for better SEO
export const metadata: Metadata = {
  title: {
    default: "AgenoQuiz - Smart Quiz System",
    template: "%s | AgenoQuiz"
  },
  description: "Secure, smart, and student-friendly quiz app for schools and teams. Create, manage, and analyze educational assessments with ease.",
  applicationName: "AgenoQuiz",
  authors: [{ name: "CodeRiders Development Team" }],
  keywords: ["quiz", "education", "assessment", "learning", "exam", "test", "school", "teacher", "student"],
  creator: "CodeRiders Development Team",
  publisher: "Agenoverse",
  metadataBase: new URL("https://agenoquiz.example.com"),
  category: "education",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://agenoquiz.example.com",
    title: "AgenoQuiz - Smart Quiz System",
    description: "Secure, smart, and student-friendly quiz app for schools and teams.",
    siteName: "AgenoQuiz",
    images: [
      {
        url: "/og-image.svg", // Replace with your actual OG image path
        width: 1200,
        height: 630,
        alt: "AgenoQuiz - Smart Assessment Platform"
      }
    ],
  },
  
  // Twitter card metadata
  twitter: {
    card: "summary_large_image",
    title: "AgenoQuiz - Smart Quiz System",
    description: "Secure, smart, and student-friendly quiz app for schools and teams.",
    images: ["/twitter-image.png"], // Replace with your actual Twitter image path
  },
  
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon-16x16.png",
      },
      {
        rel: "manifest",
        url: "/site.webmanifest",
      }
    ],
  },
  
  // Verification tags for search engines
  verification: {
    google: "google-site-verification-code", // Replace with actual verification code
  },
};

// Improved viewport settings for better accessibility and mobile experience
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0, // Allow zooming for better accessibility
  userScalable: true, // Allow zooming for better accessibility
  themeColor: "#6E45E1", // Match your brand's primary color
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://agenoquiz.example.com" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body className={`${inter.className} antialiased text-gray-800 bg-white overscroll-none`}>
        <main className="min-h-screen flex flex-col relative overflow-x-hidden">
          <AuthProvider>{children}</AuthProvider>
        </main>
        {/* Skip to main content link for accessibility */}
        <div className="fixed top-0 left-0 z-50">
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:p-4 focus:block focus:bg-white focus:text-purple-600"
          >
            Skip to main content
          </a>
        </div>
      </body>
    </html>
  );
}
