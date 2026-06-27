// app/fournisseur/dashboard/page.tsx
"use client";

import DashboardLayout from "@/app/(dashboard)/layout";
import DashboardFournisseur from "../../../components/fournisseur/DashboardFournisseur";
import DashboardChauffeur from "@/components/chauffeur/DashboardChauffeur";

export default function FournisseurDashboardPage() {
  return (
        <DashboardLayout>
          <DashboardFournisseur />
        </DashboardLayout>
      );
}