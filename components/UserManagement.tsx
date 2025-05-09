"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { ROLES } from "@/constants/role";
import AdminProtected from "./AdminProtected";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: any;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);

        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];

        // Sort users by role (admins first) then by name
        usersData.sort((a, b) => {
          if (a.role === ROLES.ADMIN && b.role !== ROLES.ADMIN) return -1;
          if (a.role !== ROLES.ADMIN && b.role === ROLES.ADMIN) return 1;
          return (a.displayName || a.email).localeCompare(
            b.displayName || b.email
          );
        });

        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      setError(null);
      setSuccess(null);

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: newRole,
      });

      // Update the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      setSuccess(`User role updated successfully to ${newRole}`);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating user role:", err);
      setError("Failed to update user role");
    } finally {
      setUpdating(null);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  return (
    <AdminProtected
      fallback={
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            You don't have permission to access this page
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Please contact an administrator if you need access.
          </p>
        </div>
      }
    >
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">User Management</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-primary border-t-transparent rounded-full"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-primary to-tech-blue-light flex items-center justify-center text-white font-medium">
                          {user.displayName
                            ? user.displayName.charAt(0).toUpperCase()
                            : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || "No name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === ROLES.ADMIN ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
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
                      {user.role === ROLES.ADMIN ? (
                        <button
                          onClick={() => updateUserRole(user.id, ROLES.USER)}
                          disabled={updating === user.id}
                          className="text-purple-primary hover:text-purple-600 focus:outline-none disabled:opacity-50"
                        >
                          {updating === user.id ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                              Updating...
                            </span>
                          ) : (
                            "Make Student"
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserRole(user.id, ROLES.ADMIN)}
                          disabled={updating === user.id}
                          className="text-purple-primary hover:text-purple-600 focus:outline-none disabled:opacity-50"
                        >
                          {updating === user.id ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                              Updating...
                            </span>
                          ) : (
                            "Make Admin"
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminProtected>
  );
}
