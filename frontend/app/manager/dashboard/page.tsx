// app/manager/dashboard/page.tsx
"use client";

import DashboardLayout from "@/app/(dashboard)/layout";
import DashboardManager from "../../../components/manager/DashboardManager";

export default function ManagerDashboardPage() {
  return (
          <DashboardLayout>
            <DashboardManager/>
          </DashboardLayout>
        );
}