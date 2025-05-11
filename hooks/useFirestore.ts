/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { handleFirebaseError } from "@/firebase/utils";

/**
 * Custom hook that provides CRUD operations for Firestore
 * with optimized error handling and cache management
 */
export function useFirestore(collectionName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create document (with custom ID if provided)
  const createDocument = useCallback(
    async (data: any, customId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const collectionRef = collection(db, collectionName);
        let docRef;

        if (customId) {
          // Use the custom ID
          docRef = doc(collectionRef, customId);
          await setDoc(docRef, {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return { id: customId, ...data };
        } else {
          // Generate a new ID
          const newDocRef = doc(collectionRef);
          await setDoc(newDocRef, {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return { id: newDocRef.id, ...data };
        }
      } catch (err) {
        const formattedError = handleFirebaseError(err);
        setError(formattedError.message);
        console.error("Error creating document:", formattedError);
        throw formattedError;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  // Read document by ID
  const getDocument = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          return null;
        }

        return { id: docSnap.id, ...docSnap.data() };
      } catch (err) {
        const formattedError = handleFirebaseError(err);
        setError(formattedError.message);
        console.error(`Error getting document with ID ${id}:`, formattedError);
        throw formattedError;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  // Query documents
  const queryDocuments = useCallback(
    async (field: string, operator: any, value: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, where(field, operator, value));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (err) {
        const formattedError = handleFirebaseError(err);
        setError(formattedError.message);
        console.error("Error querying documents:", formattedError);
        throw formattedError;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  // Update document
  const updateDocument = useCallback(
    async (id: string, data: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const docRef = doc(db, collectionName, id);

        // Update the document with the new data and updatedAt timestamp
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date(),
        });

        return { id, ...data };
      } catch (err) {
        const formattedError = handleFirebaseError(err);
        setError(formattedError.message);
        console.error(`Error updating document with ID ${id}:`, formattedError);
        throw formattedError;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        const formattedError = handleFirebaseError(err);
        setError(formattedError.message);
        console.error(`Error deleting document with ID ${id}:`, formattedError);
        throw formattedError;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  // Get all documents
  const getAllDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      setError(formattedError.message);
      console.error("Error getting all documents:", formattedError);
      throw formattedError;
    } finally {
      setIsLoading(false);
    }
  }, [collectionName]);

  return {
    isLoading,
    error,
    createDocument,
    getDocument,
    queryDocuments,
    updateDocument,
    deleteDocument,
    getAllDocuments,
  };
}
