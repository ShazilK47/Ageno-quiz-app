"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/client";
import { ROLES } from "@/constants/role";
import UserTable from "./user-management/UserTable";
import Message from "./user-management/Message";
import { User } from "./user-management/types";
import { useCollection } from "@/hooks/useCollection";
import { handleFirebaseError } from "@/firebase/utils";
import { div } from "framer-motion/client";
import AdminProtected from "./AdminProtected";

interface UserManagementProps {
  filterRole?: 'all' | 'admin' | 'student';
}

export default function UserManagement({ filterRole = 'all' }: UserManagementProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    total: number;
    admins: number;
    students: number;
  }>({ total: 0, admins: 0, students: 0 });

  // Use the custom hook to fetch users
  const {
    data: users,
    loading,
    error: fetchError,
  } = useCollection<User>({
    path: "users",
    orderByField: "createdAt",
    orderDirection: "desc",
  });

  // Set error from fetch if any
  useEffect(() => {
    if (fetchError) {
      setError("Failed to load users: " + fetchError.message);
    }
  }, [fetchError]);

  // Calculate stats whenever users change
  useEffect(() => {
    if (users.length > 0) {
      const admins = users.filter(user => user.role === ROLES.ADMIN).length;
      setStats({
        total: users.length,
        admins,
        students: users.length - admins
      });
    }
  }, [users]);

  // Filter users by role and search term
  const filteredUsers = users.filter(user => {
    // Role filter
    if (filterRole === 'admin' && user.role !== ROLES.ADMIN) return false;
    if (filterRole === 'student' && user.role === ROLES.ADMIN) return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (user.displayName?.toLowerCase().includes(term) || false) ||
        (user.email?.toLowerCase().includes(term) || false)
      );
    }
    
    return true;
  });

  // Sort users (admins first, then by name)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.role === ROLES.ADMIN && b.role !== ROLES.ADMIN) return -1;
    if (a.role !== ROLES.ADMIN && b.role === ROLES.ADMIN) return 1;
    return (a.displayName || a.email).localeCompare(b.displayName || b.email);
  });

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

      setSuccess("User role updated successfully to " + newRole);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error updating user role:", formattedError);
      setError(formattedError.message);
    } finally {
      setUpdating(null);
    }
  };
  
  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      
      // Check if user has quiz attempts
      const attemptsQuery = query(
        collection(db, "attempts"),
        where("userId", "==", userId)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      
      if (!attemptsSnapshot.empty) {
        // Delete all user's attempts
        const deletePromises = attemptsSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
      }
      
      // Finally delete the user
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      
      setSuccess("User deleted successfully");
      setConfirmDelete(null);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error deleting user:", formattedError);
      setError(formattedError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        {/* Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Users</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Administrators</div>
            <div className="mt-1 text-3xl font-semibold text-purple-600">{stats.admins}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Students</div>
            <div className="mt-1 text-3xl font-semibold text-blue-600">{stats.students}</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">
              {filterRole === 'all' && 'All Users'}
              {filterRole === 'admin' && 'Administrators'}
              {filterRole === 'student' && 'Students'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Message type="error" message={error} />
      <Message type="success" message={success} />

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="bg-gray-50 rounded-md p-8 text-center">
          {searchTerm ? (
            <p className="text-gray-500">No users found matching "{searchTerm}"</p>
          ) : (
            <p className="text-gray-500">No users found in this category</p>
          )}
        </div>
      ) : (
        <UserTable
          users={sortedUsers}
          updating={updating}
          onUpdateRole={updateUserRole}
          onDeleteUser={(userId) => setConfirmDelete(userId)}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This will remove all their data, including quiz attempts.
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
      </div>
    </AdminProtected>
  );
}
