import { createServerFn } from "@tanstack/react-start";
import { requireUnlocked } from "./gate.server";
import { buildDashboard } from "./finance.server";

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  return buildDashboard();
});
