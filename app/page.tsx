"use client";

import Header from "../components/Header";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { UserWithRole } from "@/hooks/useAuth";

export default function Home() {
  const auth = useAuth();
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use useEffect to safely access auth state
  useEffect(() => {
    setUser(auth.user);
    setLoading(auth.loading);
  }, [auth.user, auth.loading]);
  
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-neutral-50 py-16 lg:py-24">
        {/* Modern background with subtle patterns */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-[0.03] z-0 bg-repeat"></div>
          <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-purple-600/10 to-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-[10%] w-96 h-96 rounded-full bg-gradient-to-tr from-purple-200/10 to-blue-500/5 blur-3xl"></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              {/* Hero content */}
              <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left animate-[fade-in_1s_ease-out]">
                <div className="space-y-4">
                  <h1 className="text-6xl lg:text-7xl font-bold tracking-tight">
                    <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 drop-shadow-sm">Agenoverse</span>
                    <span className="block mt-2 text-4xl lg:text-5xl text-gray-800">Assessment Portal</span>
                  </h1>
                  <p className="text-xl text-gray-600 mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Simplify your learning assessment experience with our streamlined
                    quiz platform. Access secure exams with ease and track your
                    academic progress.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <Link
                    href="/join"
                    className="group inline-flex items-center justify-center py-4 px-8 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
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
                      <span>Join Quiz</span>
                    </span>
                  </Link>
                  
                  {!user && !loading && (
                    <Link
                      href="/sign-in"
                      className="group inline-flex items-center justify-center py-4 px-8 rounded-full font-medium bg-white text-purple-600 border-2 border-purple-500/30 hover:bg-purple-50 hover:border-purple-500/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
                    >
                      <span className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-purple-600"
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
                        <span>Sign In</span>
                      </span>
                    </Link>
                  )}
                  
                  {user && !loading && (
                    <Link
                      href="/profile"
                      className="group inline-flex items-center justify-center py-4 px-8 rounded-full font-medium bg-white text-purple-600 border-2 border-purple-500/30 hover:bg-purple-50 hover:border-purple-500/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
                    >
                      <span className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-purple-600"
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
                        <span>My Profile</span>
                      </span>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Hero image/illustration */}
              <div className="w-full lg:w-1/2 h-full flex justify-center lg:justify-end">
                <div className="relative w-full max-w-xl">
                  <div className="absolute -top-6 -left-6 w-72 h-72 bg-purple-600/5 rounded-full mix-blend-multiply filter blur-xl"></div>
                  <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-blue-500/5 rounded-full mix-blend-multiply filter blur-xl"></div>
                  <div className="relative">
                    <svg className="w-full h-auto drop-shadow-xl" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="100" y="50" width="400" height="300" rx="20" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
                      <rect x="130" y="90" width="340" height="40" rx="8" fill="#f1f5f9"/>
                      <rect x="130" y="150" width="340" height="30" rx="6" fill="#f1f5f9"/>
                      <rect x="130" y="190" width="340" height="30" rx="6" fill="#f1f5f9"/>
                      <rect x="130" y="230" width="340" height="30" rx="6" fill="#f1f5f9"/>
                      <rect x="130" y="270" width="120" height="40" rx="20" fill="#9333ea"/>
                      <circle cx="150" cy="70" r="10" fill="#9333ea"/>
                      <circle cx="180" cy="70" r="10" fill="#3b82f6"/>
                      <circle cx="210" cy="70" r="10" fill="#d8b4fe"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white relative">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-neutral-50 to-white"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-purple-600/5 mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-1/4 left-10 w-48 h-48 rounded-full bg-blue-500/5 mix-blend-multiply filter blur-2xl"></div>
        
        <div className="container mx-auto max-w-7xl relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">Why Choose <span className="text-purple-600 inline-block">Agenoverse</span>?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Experience an assessment platform designed with modern educational needs in mind.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature Card 1 */}
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/[0.03] to-blue-500/[0.07] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="p-8 relative">
                <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-600/10 to-purple-500/5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                    <svg
                      width="24"
                      height="24"
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
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-purple-600 transition-colors duration-300">Secure Access</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our access code system ensures that only authorized students can
                  participate in assessments, maintaining academic integrity
                  across all quizzes.
                </p>
                
                <div className="mt-6 flex items-center font-medium opacity-80 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-purple-600 font-bold">Learn more</span>
                  <svg className="w-5 h-5 ml-1 text-purple-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200/[0.05] to-blue-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 to-blue-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="p-8 relative">
                <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-300/15 to-purple-200/5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-400/20">
                    <svg
                      width="24"
                      height="24"
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
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-purple-500 transition-colors duration-300">Immediate Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get your quiz results instantly after submission, allowing you
                  to understand your performance and identify areas for
                  improvement.
                </p>
                
                <div className="mt-6 flex items-center font-medium opacity-80 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-purple-600 font-bold">Learn more</span>
                  <svg className="w-5 h-5 ml-1 text-purple-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-blue-500/[0.07] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="p-8 relative">
                <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-400/5">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <svg
                      width="24"
                      height="24"
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
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-blue-500 transition-colors duration-300">Simple Interface</h3>
                <p className="text-gray-600 leading-relaxed">
                  Enjoy a clean, intuitive quiz-taking experience that lets you
                  focus on the content without any unnecessary distractions or
                  complexity.
                </p>
                
                <div className="mt-6 flex items-center font-medium opacity-80 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-blue-500 font-bold">Learn more</span>
                  <svg className="w-5 h-5 ml-1 text-blue-500 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-[0.02]"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-purple-600 mb-2 bg-white rounded-lg py-3 px-2 shadow-md">500+</div>
                <p className="text-gray-700 mt-3 font-medium">Students Daily</p>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-purple-600 mb-2 bg-white rounded-lg py-3 px-2 shadow-md">100+</div>
                <p className="text-gray-700 mt-3 font-medium">Assessments</p>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue-500 mb-2 bg-white rounded-lg py-3 px-2 shadow-md">98%</div>
                <p className="text-gray-700 mt-3 font-medium">Completion Rate</p>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-purple-600 mb-2 bg-white rounded-lg py-3 px-2 shadow-md">10+</div>
                <p className="text-gray-700 mt-3 font-medium">Institutions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-500/[0.02] to-purple-600/[0.03]"></div>
        <div className="absolute -top-1 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 to-transparent"></div>
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-600/10 to-blue-500/5 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-tr from-purple-300/10 to-blue-500/5 rounded-full filter blur-3xl opacity-30"></div>
        
        <div className="container mx-auto relative">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl p-12 shadow-xl shadow-purple-600/5">
            <div className="flex flex-col md:flex-row md:items-center gap-12">
              <div className="md:w-2/3">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Ready to Take Your Quiz?</h2>
                <p className="text-xl text-gray-600 mb-8">
                  Access your assignments quickly with just an access code. Our
                  platform makes assessment simple and straightforward.
                </p>
                <Link
                  href="/join"
                  className="group inline-flex items-center justify-center py-4 px-8 rounded-full font-medium bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="flex items-center">
                    Start Now
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
              </div>
              
              <div className="hidden md:block md:w-1/3">
                <div className="relative w-full aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-500/20 rounded-2xl transform rotate-3"></div>
                  <div className="absolute inset-0 bg-white rounded-2xl transform -rotate-3 flex items-center justify-center p-6 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                      className="w-16 h-16 text-purple-600">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <div className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="w-10 h-10 relative mr-3">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5Z" 
                    fill="url(#paint0_linear)" />
                  <path d="M26 14L18 26L14 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="5" y1="20" x2="35" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9333ea"/>
                      <stop offset="1" stopColor="#3b82f6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div className="font-bold text-purple-600">Agenoverse</div>
                <div className="text-xs text-gray-500">Assessment Portal</div>
              </div>
            </div>
            
            <div className="text-gray-600 text-sm">© 2025 Agenoverse. All rights reserved.</div>
            
            <div className="flex space-x-5 mt-6 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-all duration-300 hover:-translate-y-1">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-all duration-300 hover:-translate-y-1">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-all duration-300 hover:-translate-y-1">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
