"use client";

import Header from "../components/Header";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5 z-0"></div>
        <div className="container mx-auto px-4 pt-20 pb-24 text-center relative z-10">
          <div className="animate-fadeIn">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-primary to-tech-blue-light">
              Agenoverse Assessment Portal
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Simplify your learning assessment experience with our streamlined
              quiz platform. Access secure exams with ease and track your
              academic progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/join"
                className="btn-primary inline-flex items-center justify-center py-3.5 px-8 rounded-lg text-white font-medium bg-gradient-to-r from-purple-primary to-tech-blue-light hover:from-purple-primary/90 hover:to-tech-blue-light/90 shadow-lg hover:shadow-purple-primary/20 transition-all duration-300 transform hover:-translate-y-1 min-w-[160px] relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-primary to-tech-blue-light opacity-0 group-hover:opacity-90 transition-opacity duration-300 rounded-lg"></span>
                <span className="relative z-10 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 5L21 12M21 12L15 19M21 12H3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Join Quiz
                </span>
              </Link>
              {!user && !loading && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center py-3.5 px-8 rounded-lg bg-white border-2 border-purple-primary/30 text-purple-primary font-medium hover:bg-purple-primary/5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-[160px]"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 17L15 12L10 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12H3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Sign In
                </Link>
              )}
              {user && !loading && (
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center py-3.5 px-8 rounded-lg bg-white border-2 border-purple-primary/30 text-purple-primary font-medium hover:bg-purple-primary/5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-[160px]"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  My Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto mb-12 text-center">
          <h2 className="text-3xl font-bold mb-2">Why Choose Agenoverse?</h2>
          <div className="w-24 h-1 bg-accent-primary mx-auto mb-10 rounded-full"></div>
        </div>

        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-accent-primary">
              <div className="size-16 flex items-center justify-center bg-accent-primary/10 text-accent-primary rounded-2xl mb-6">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 11L12 14L22 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Secure Access</h3>
              <p className="text-gray-600">
                Our access code system ensures that only authorized students can
                participate in assessments, maintaining academic integrity
                across all quizzes.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-accent-secondary">
              <div className="size-16 flex items-center justify-center bg-accent-secondary/15 text-accent-primary rounded-2xl mb-6">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 9H9H8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Immediate Results</h3>
              <p className="text-gray-600">
                Get your quiz results instantly after submission, allowing you
                to understand your performance and identify areas for
                improvement.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-tech-blue-light">
              <div className="size-16 flex items-center justify-center bg-tech-blue-light/10 text-tech-blue-light rounded-2xl mb-6">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20V10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 20V4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 20V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Simple Interface</h3>
              <p className="text-gray-600">
                Enjoy a clean, intuitive quiz-taking experience that lets you
                focus on the content without any unnecessary distractions or
                complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-primary/10 to-tech-blue-light/10 py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Take Your Quiz?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Access your assignments quickly with just an access code. Our
            platform makes assessment simple and straightforward.
          </p>
          <Link
            href="/quiz/join"
            className="btn-primary inline-block py-3 px-10 rounded-lg shadow-lg text-lg font-medium hover:shadow-xl transition-all duration-300"
          >
            Start Now
          </Link>
        </div>
      </section>

      {/* Footer Note */}
      {/* Footer Note */}
      <div className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 Agenoverse. All rights reserved.</p>
      </div>
    </main>
  );
}
