/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from 'react';

/**
 * A simple debug component that can be temporarily added to pages
 * to debug authentication issues
 */
export default function AuthDebugger() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Check session status
        const res = await fetch('/api/auth/session/debug', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        
        const authData = await res.json();
        setData(authData);
        
        // Also check browser storage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storageData: Record<string, any> = {};
        
        try {
          storageData.localStorage = {
            auth_user: localStorage.getItem('auth_user'),
            auth_timestamp: localStorage.getItem('auth_timestamp')
          };        } catch (_e) {
          storageData.localStorage = { error: 'Cannot access localStorage' };
        }
        
        try {
          storageData.sessionStorage = {
            auth_user: sessionStorage.getItem('auth_user'),
            is_mobile_browser: sessionStorage.getItem('is_mobile_browser')
          };        } catch (_e) {
          storageData.sessionStorage = { error: 'Cannot access sessionStorage' };
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData((prev: any) => ({
          ...prev,
          browser: {
            userAgent: navigator.userAgent,
            storage: storageData
          }
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  if (loading) {
    return <div className="text-sm text-gray-500">Loading debug info...</div>;
  }
  
  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }
  
  return (
    <details className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
      <summary className="font-medium cursor-pointer">Auth Debug Info</summary>
      <pre className="mt-2 p-2 bg-gray-200 rounded overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
