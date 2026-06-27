// app/fournisseur/dashboard/page.tsx
"use client";

import DashboardIcr from "@/components/icr/DashboardICR ";
import DashboardFournisseur from "../../../components/fournisseur/DashboardFournisseur";
import DashboardGerant from "@/components/gerant/DashboardGerant";
import DashboardLayout from "@/app/(dashboard)/layout";

export default function gerantDashboardPage() {
  return (
          <DashboardLayout>
            <DashboardGerant />
          </DashboardLayout>
        );
}