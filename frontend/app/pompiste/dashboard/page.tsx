// app/fournisseur/dashboard/page.tsx
"use client";

import DashboardIcr from "@/components/icr/DashboardICR ";
import DashboardFournisseur from "../../../components/fournisseur/DashboardFournisseur";
import DashboardGerant from "@/components/gerant/DashboardGerant";
import DashboardPompiste from "@/components/pompiste/DashboardPompiste";

export default function pompisteDashboardPage() {
  return <DashboardPompiste />;
}