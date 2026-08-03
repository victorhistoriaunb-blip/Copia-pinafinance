import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Calendar,
  CalendarClock,
  LayoutGrid,
  LayoutDashboard,
  FileBarChart,
  Target,
  Upload,
  Menu,
  X,
  LogOut,
  Wallet,
  BookOpen,
  Settings,
} from "lucide-react";

import logo from "@/assets/logo.png";
import { useFinance } from "@/lib/finance-store";
import { useAuth } from "@/lib/auth-context";

const ACCENTS: Record<string, { primary: string; accent: string }> = {
  azul: { primary: "oklch(0.623 0.188 259.8)", accent: "oklch(0.715 0.126 215.2)" },
  violeta: { primary: "oklch(0.62 0.21 295)", accent: "oklch(0.72 0.14 320)" },
  esmeralda: { primary: "oklch(0.65 0.15 162)", accent: "oklch(0.74 0.13 190)" },
  ambar: { primary: "oklch(0.72 0.16 70)", accent: "oklch(0.78 0.14 95)" },
  rosa: { primary: "oklch(0.65 0.2 350)", accent: "oklch(0.74 0.14 20)" },
};

function useNavItems() {
  const { settings } = useFinance();
  return [
    { label: settings.labels.dashboard, icon: LayoutGrid, to: "/" as const },
    { label: "Painéis", icon: LayoutDashboard, to: "/paineis" as const },
    { label: settings.labels.contas, icon: Wallet, to: "/contas" as const },
    { label: "Importar Planilhas", icon: Upload, to: "/importar" as const },
    { label: "Dia", icon: CalendarDays, to: "/dia" as const },
    { label: "Semana", icon: CalendarRange, to: "/semana" as const },
    { label: "Mês", icon: Calendar, to: "/mes" as const },
    { label: "Ano", icon: CalendarClock, to: "/ano" as const },
    { label: "Categorias", icon: BarChart3, to: "/categorias" as const },
    { label: settings.labels.relatorios, icon: FileBarChart, to: "/relatorios" as const },
    { label: settings.labels.metas, icon: Target, to: "/metas" as const },
    { label: "Como usar", icon: BookOpen, to: "/como-usar" as const },
    { label: "Configurações", icon: Settings, to: "/configuracoes" as const },
  ];
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const items = useNavItems();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{
            className:
              "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]",
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <item.icon className="size-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) {
  const { settings } = useFinance();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2 pt-1">
        <img src={logo} alt={settings.appName} width={512} height={512} className="size-9 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{settings.appName}</p>
          <p className="truncate text-xs text-muted-foreground">{settings.tagline}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Navegação
        </p>
        <NavList onNavigate={onNavigate} />
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/15 hover:text-destructive"
      >
        <LogOut className="size-4" />
        Sair
      </button>
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  onLogout,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { settings } = useFinance();
  const { name } = useAuth();

  useEffect(() => {
    const theme = ACCENTS[settings.accent] ?? ACCENTS["azul"]!;
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--ring", theme.primary);
    root.style.setProperty("--chart-1", theme.primary);
    root.style.setProperty("--chart-2", theme.accent);
  }, [settings.accent]);

  const compact = settings.density === "compacta";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarBody onLogout={onLogout} />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} onLogout={onLogout} />
          </motion.div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-4" />
            </button>
            <img
              src={logo}
              alt={settings.appName}
              width={512}
              height={512}
              className="size-9 shrink-0 rounded-xl object-contain lg:hidden"
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold tracking-wide text-primary">
                {settings.greeting}
                {name ? `, ${name}` : ""}
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </header>

        <main className={`min-w-0 flex-1 ${compact ? "p-3 sm:p-4" : "p-4 sm:p-6"}`}>{children}</main>
      </div>
    </div>
  );
}
