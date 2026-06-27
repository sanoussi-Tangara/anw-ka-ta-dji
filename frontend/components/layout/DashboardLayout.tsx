import DashboardNavbar from "./DashboardNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNavbar />
      <main className="pt-20">
        {children}
      </main>
    </>
  );
}