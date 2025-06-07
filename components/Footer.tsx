import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaGithub, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-white to-gray-100 dark:from-tech-blue-dark dark:to-tech-blue-darker pt-10 pb-6 mt-auto border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        {/* Top section with columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand column */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              {" "}
              <Image
                src="/logo.svg"
                alt="AgenoQuiz Logo"
                width={40}
                height={40}
                className="mr-2"
                priority
              />
              <span className="text-xl font-bold text-tech-blue-dark dark:text-white">
                AgenoQuiz
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Secure, smart, and student-friendly quiz app for schools and
              teams.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-200">
              Navigation
            </h4>
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              About
            </Link>
            <Link
              href="/join"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              Join Quiz
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              Leaderboard
            </Link>
          </div>

          {/* Account Links */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-200">
              Account
            </h4>
            <Link
              href="/sign-in"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              Sign Up
            </Link>
            <Link
              href="/profile"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              My Profile
            </Link>
            <Link
              href="/my-quizzes"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              My Quizzes
            </Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-gray-700 dark:text-gray-200">
              Contact Us
            </h4>
            <a
              href="mailto:agenoverse@gmail.com"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              agenoverse@gmail.com
            </a>
            <a
              href="tel:+92152248647"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
            >
              +923152248647
            </a>
            <div className="flex space-x-4 mt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <FaTwitter size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <FaLinkedin size={18} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <FaGithub size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-4" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {currentYear} AgenoQuiz. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              href="/privacy-policy"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
