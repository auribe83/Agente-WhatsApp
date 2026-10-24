import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const [business, brand] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.agencyBrand.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        agencyName={brand?.name || "Atiende"}
        userName={session?.name || "Administrador"}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          businessName={business?.name || "Clínica Dental Lumen"}
          initialIsActive={business?.isActive ?? true}
        />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
