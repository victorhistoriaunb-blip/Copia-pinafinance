import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { getGateStatus } from "@/lib/gate.functions";
import { FinanceProvider } from "@/lib/finance-store";

export const Route = createFileRoute("/_gated")({
  beforeLoad: async () => {
    const { unlocked } = await getGateStatus();
    if (!unlocked) throw redirect({ to: "/login" });
  },
  component: GatedLayout,
});

function GatedLayout() {
  return (
    <FinanceProvider>
      <Outlet />
    </FinanceProvider>
  );
}
