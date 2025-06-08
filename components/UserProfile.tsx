"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  isMobile?: boolean;
}

export default function UserProfile({ isMobile = false }: UserProfileProps) {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/sign-in");
  };
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="text-sm text-gray-500">Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    if (isMobile) {
      return (
        <div className="space-y-3 px-1 py-1">
          <Link
            href="/sign-in"
            className="block w-full text-center py-2.5 px-4 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 text-white text-sm font-medium hover:shadow-lg hover:from-purple-500 hover:to-blue-600 transition-all duration-300"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="block w-full text-center py-2.5 px-4 rounded-full border-2 border-purple-600 text-purple-600 text-sm font-medium hover:text-purple-700 hover:border-purple-700 hover:bg-purple-50 hover:shadow-md transition-all duration-300"
          >
            Sign Up
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="text-sm font-medium px-4 py-2 text-purple-600 hover:text-purple-700 transition-all duration-300 relative group"
        >
          Sign In
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
        </Link>
        <Link
          href="/sign-up"
          className="py-2 px-5 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 text-white text-sm font-medium hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-300 active:translate-y-0 transform transition-all duration-300"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // For signed-in users
  const displayName = user.displayName || user.email?.split("@")[0] || "User";

  if (isMobile) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-3 z-50">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{displayName}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
        </div>
        <div className="space-y-2 flex flex-row ">
          <Link
            href="/profile"
            className=" w-[50%] mr-5 text-left py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100 transition flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My Profile
          </Link>

           <button
            onClick={handleSignOut}
            className="w-[50%] text-left py-2 px-3 rounded-md text-red-600 hover:bg-red-50 transition flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>

        </div>
        {/* <div className="mt-2">
         
        </div> */}
      </div>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center gap-2 cursor-pointer group">
        {" "}
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg transition-transform transform group-hover:scale-110 shadow-md">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {displayName}
          </span>
          <span className="text-xs text-gray-500">{user.email}</span>
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-40">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={`${
                    active
                      ? "bg-purple-100/80 text-purple-600"
                      : "text-gray-900"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-all duration-200`}
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  My Profile
                </Link>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/my-quizzes"
                  className={`${
                    active
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-gray-900"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  My Quizzes
                </Link>
              )}
            </Menu.Item>

            {/* Only show admin dashboard link to admins */}
            {isAdmin && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/dashboard"
                    className={`${
                      active
                        ? "bg-accent-primary/10 text-accent-primary"
                        : "text-gray-900"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Admin Dashboard
                  </Link>
                )}
              </Menu.Item>
            )}
          </div>

          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  className={`${
                    active ? "bg-red-50 text-red-600" : "text-red-600"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
