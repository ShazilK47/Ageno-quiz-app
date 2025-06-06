"use client";

import { useState } from "react";
import { User } from "./types";
import { formatDate } from "./utils";
import { ROLES } from "@/constants/role";

interface UserTableProps {
  users: User[];
  updating: string | null;
  onUpdateRole: (userId: string, newRole: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export default function UserTable({
  users,
  updating,
  onUpdateRole,
  onDeleteUser,
}: UserTableProps) {
  const [sortField, setSortField] = useState<"name" | "role" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting
  const handleSort = (field: "name" | "role" | "date") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort users based on sort criteria
  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "name":
        const nameA = a.displayName || a.email || "";
        const nameB = b.displayName || b.email || "";
        comparison = nameA.localeCompare(nameB);
        break;
      case "role":
        const roleA = a.role || "";
        const roleB = b.role || "";
        comparison = roleA.localeCompare(roleB);
        break;
      case "date":
        const dateA = a.createdAt
          ? new Date(
              typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
                ? a.createdAt.toDate() 
                : a.createdAt
            ).getTime()
          : 0;
        const dateB = b.createdAt
          ? new Date(
              typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
                ? b.createdAt.toDate() 
                : b.createdAt
            ).getTime()
          : 0;
        comparison = dateA - dateB;
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Render sort indicator
  const renderSortIndicator = (field: "name" | "role" | "date") => {
    if (sortField !== field) return null;

    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">
                <span>User</span>
                {renderSortIndicator("name")}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("role")}
            >
              <div className="flex items-center">
                <span>Role</span>
                {renderSortIndicator("role")}
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("date")}
            >
              <div className="flex items-center">
                <span>Joined</span>
                {renderSortIndicator("date")}
              </div>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium">
                    {user.displayName
                      ? user.displayName.charAt(0).toUpperCase()
                      : user.email?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName || "No name"}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.role === ROLES.ADMIN ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Student
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <RoleToggleButton
                    user={user}
                    updating={updating}
                    onUpdateRole={onUpdateRole}
                  />

                  {onDeleteUser && (
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Delete user"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RoleToggleButtonProps {
  user: User;
  updating: string | null;
  onUpdateRole: (userId: string, newRole: string) => void;
}

function RoleToggleButton({
  user,
  updating,
  onUpdateRole,
}: RoleToggleButtonProps) {
  const isUpdating = updating === user.id;
  const isAdmin = user.role === ROLES.ADMIN;

  return (
    <button
      onClick={() => onUpdateRole(user.id, isAdmin ? ROLES.USER : ROLES.ADMIN)}
      disabled={isUpdating}
      className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isAdmin
          ? "text-purple-700 bg-purple-100 hover:bg-purple-200 focus:ring-purple-500"
          : "text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500"
      } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isUpdating ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : null}
      {isAdmin ? "Make Student" : "Make Admin"}
    </button>
  );
}
