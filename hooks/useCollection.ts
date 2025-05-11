/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  Query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/client";
// import { handleFirebaseError } from "@/firebase/utils";

interface UseCollectionOptions {
  path: string;
  conditions?: {
    field: string;
    operator:
      | "<"
      | "<="
      | "=="
      | "!="
      | ">="
      | ">"
      | "array-contains"
      | "in"
      | "array-contains-any"
      | "not-in";
    value: any;
  }[];
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  dependencies?: any[];
}

/**
 * Custom hook to fetch a collection from Firestore with optional filtering and ordering
 */
export function useCollection<T = DocumentData>({
  path,
  conditions = [],
  orderByField,
  orderDirection = "asc",
  dependencies = [],
}: UseCollectionOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const collectionRef = collection(db, path);
        let queryRef: Query = collectionRef;

        // Apply query conditions if provided
        if (conditions && conditions.length > 0) {
          conditions.forEach(({ field, operator, value }) => {
            queryRef = query(queryRef, where(field, operator, value));
          });
        }

        // Apply ordering if provided
        if (orderByField) {
          queryRef = query(queryRef, orderBy(orderByField, orderDirection));
        }

        const snapshot = await getDocs(queryRef);
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        setData(result);
        setError(null);
      } catch (err) {
        console.error(`Error fetching collection from ${path}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return { data, loading, error };
}
