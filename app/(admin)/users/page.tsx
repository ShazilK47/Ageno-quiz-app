"use client";

import React, { useState } from "react";
import UserManagement from "@/components/UserManagement";
import AdminProtected from "@/components/AdminProtected";
import Header from "@/components/Header";

export default function UsersPage() {
  const [view, setView] = useState<"all" | "admin" | "student">("all");

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminProtected
          fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                You need administrator privileges to view this page
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please contact an administrator if you need access.
              </p>
            </div>
          }
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600 mt-2">
              View and manage user accounts and permissions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 text-sm rounded-md ${
                      view === "all"
                        ? "bg-purple-100 text-purple-800 font-medium"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setView("all")}
                  >
                    All Users
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-md ${
                      view === "admin"
                        ? "bg-purple-100 text-purple-800 font-medium"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setView("admin")}
                  >
                    Administrators
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-md ${
                      view === "student"
                        ? "bg-purple-100 text-purple-800 font-medium"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setView("student")}
                  >
                    Students
                  </button>
                </div>
              </div>
            </div>

            <UserManagement filterRole={view} />
          </div>
        </AdminProtected>
      </div>
    </>
  );
}
