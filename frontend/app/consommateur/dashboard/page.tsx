"use client";

import DashboardConsommateur from "@/components/consommateur/DashboardConsommateur";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ConsommateurDashboardPage() {
  return (
    <DashboardLayout>
      <DashboardConsommateur />
    </DashboardLayout>
  );
}