// components/Header.tsx
"use client";
import Link from "next/link";
import UserProfile from "./UserProfile";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 backdrop-blur-md ${
        scrolled
          ? "py-2 shadow-lg bg-white/90 dark:bg-tech-blue-dark/90"
          : "py-4 bg-white/80 dark:bg-tech-blue-dark/80"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 hover:scale-105 transition-transform duration-300"
          >
            <div className="relative w-10 h-10 overflow-hidden">
              {" "}
              <Image
                src="/logo.svg"
                alt="Agenoverse Logo"
                className="object-contain"
                fill
                priority
                sizes="40px"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-500">
                Agenoverse
              </span>
              <span className="text-xs -mt-1 text-muted-foreground">
                Assessment Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/join">Join Quiz</NavLink>
          {/* <NavLink href="/assessments">Assessments</NavLink> */}{" "}
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          {/* Admin-only navigation links */}
          {user && isAdmin && (
            <>
              <NavLink href="/dashboard">
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Dashboard
                </span>
              </NavLink>
              <NavLink href="/quizzes">
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Quizzes
                </span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-1 rounded-md"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${
              menuOpen ? "rotate-90" : ""
            }`}
          >
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </>
            )}
          </svg>
        </button>

        {/* User Profile */}
        <div className="hidden md:block">
          <UserProfile />
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen
            ? "max-h-96 opacity-100 border-b border-neutral-200 dark:border-neutral-700"
            : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 py-3 space-y-3">
          <MobileNavLink href="/join" onClick={() => setMenuOpen(false)}>
            Join Quiz
          </MobileNavLink>
          {/* <MobileNavLink href="/assessments" onClick={() => setMenuOpen(false)}>
            Assessments
          </MobileNavLink> */}{" "}
          <MobileNavLink href="/leaderboard" onClick={() => setMenuOpen(false)}>
            Leaderboard
          </MobileNavLink>
          {/* Admin-only mobile navigation links */}
          {user && isAdmin && (
            <>
              <div className="py-1 border-t border-neutral-200 dark:border-neutral-700">
                <div className="px-2 py-1 text-sm font-medium text-gray-500">
                  Admin
                </div>
              </div>
              <MobileNavLink
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  Dashboard
                </span>
              </MobileNavLink>
              <MobileNavLink
                href="/quizzes"
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Quizzes
                </span>
              </MobileNavLink>
            </>
          )}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 mt-2">
            {/* Explicitly pass user and isAdmin props to ensure visibility */}
            <UserProfile isMobile={true} />
          </div>
        </nav>
      </div>
    </header>
  );
}

// Navigation Link Component with animation
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative font-medium text-foreground transition-colors duration-300 hover:text-purple-600"
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );
}

// Mobile Navigation Link
function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block py-2 px-2 font-medium text-foreground hover:text-purple-600 transition-colors duration-300 hover:bg-neutral-100 dark:hover:bg-blue-900 rounded-md"
    >
      {children}
    </Link>
  );
}
