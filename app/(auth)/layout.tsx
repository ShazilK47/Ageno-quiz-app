"use client";

import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Auth pages will render their own Header component */}
      <div className="flex-grow flex flex-col">{children}</div>
    </div>
  );
}
