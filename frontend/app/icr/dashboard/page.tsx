// app/fournisseur/dashboard/page.tsx
"use client";

import DashboardIcr from "@/components/icr/DashboardICR ";
import DashboardFournisseur from "../../../components/fournisseur/DashboardFournisseur";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ICRDashboardPage() {
  return (
          <DashboardLayout>
            <DashboardIcr/>
          </DashboardLayout>
        );
}