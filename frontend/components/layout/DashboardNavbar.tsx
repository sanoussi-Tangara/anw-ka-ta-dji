"use client";

import { logout } from "@/lib/api";
const handleLogout = async () => {
  await logout();
}; 

export default function DashboardNavbar() {
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black text-white flex items-center justify-between px-6 shadow-md z-50">
      <h1 className="text-xl font-bold">
        Anw Ka Ta Djì
      </h1>

      <button
  onClick={handleLogout}
  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
>
  Déconnexion
</button>
    </nav>
  );
}