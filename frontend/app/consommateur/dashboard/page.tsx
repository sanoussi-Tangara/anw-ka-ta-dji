// app/fournisseur/dashboard/page.tsx
"use client";

import DashboardIcr from "@/components/icr/DashboardICR ";
import DashboardFournisseur from "../../../components/fournisseur/DashboardFournisseur";
import DashboardGerant from "@/components/gerant/DashboardGerant";
import DashboardConsommateur from "@/components/consommateur/DashboardConsommateur";

export default function consommateurDashboardPage() {
  return <DashboardConsommateur />;
}