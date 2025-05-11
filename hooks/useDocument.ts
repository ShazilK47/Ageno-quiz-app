/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { db } from "@/firebase/client";
// import { handleFirebaseError } from "@/firebase/utils";

interface UseDocumentOptions {
  path: string;
  id: string;
  dependencies?: any[];
}

/**
 * Custom hook to fetch a single document from Firestore
 */
export function useDocument<T = DocumentData>({
  path,
  id,
  dependencies = [],
}: UseDocumentOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);

        // Skip fetching if ID is not provided or invalid
        if (!id || id === "undefined" || id === "null") {
          setData(null);
          return;
        }

        const docRef = doc(db, path, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData({
            id: docSnap.id,
            ...docSnap.data(),
          } as T);
        } else {
          setData(null);
        }

        setError(null);
      } catch (err) {
        console.error(`Error fetching document ${id} from ${path}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ...dependencies]);

  return { data, loading, error };
}
