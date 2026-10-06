import React from "react";
import { isCurrentUserSuperAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata = {
  title: "Console de Contrôle Super Admin — Corafric",
  description: "Gestion des équipes de collecte, modération lexicale et pilotage du dictionnaire audio.",
};

export default async function AdminPage() {
  const isSuperAdmin = await isCurrentUserSuperAdmin();
  if (!isSuperAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-[calc(100vh-140px)] py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <AdminDashboardClient />
    </div>
  );
}
