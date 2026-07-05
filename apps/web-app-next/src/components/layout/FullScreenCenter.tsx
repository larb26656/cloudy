import React from "react";

interface FullScreenCenterProps {
  children: React.ReactNode;
}

export default function FullScreenCenter({ children }: FullScreenCenterProps) {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      {children}
    </div>
  );
}
