"use client";

import { logout } from "@/app/actions/logout";

interface LogoutButtonProps {
  children: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onclick = () => {
    logout();
  };

  return (
    <span className="cursor-pointer" onClick={onclick}>
      {children}
    </span>
  );
};
