import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Calendar,
  CalendarClock,
  LayoutGrid,
  FileBarChart,
  Target,
  Settings,
  Menu,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutGrid, to: "/" as const, ready: true },
  { label: "Dia", icon: CalendarDays, ready: false },
  { label: "Semana", icon: CalendarRange, ready: false },
  { label: "Mês", icon: Calendar, ready: false },
  { label: "Ano", icon: CalendarClock, ready: false },
  { label: "Categorias", icon: BarChart3, ready: false },
  { label: "Relatórios", icon: FileBarChart, ready: false },
  { label: "Metas", icon: Target, ready: false },
  { label: "Configurações", icon: Settings, ready: false },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) =>
        item.ready && item.to ? (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]",
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ) : (
          <button
            key={item.label}
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/45"
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            <span className="ml-auto rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] tracking-wide text-muted-foreground">
              em breve
            </span>
          </button>
        ),
      )}
    </nav>
  );
}

function SidebarBody({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2 pt-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)]">
          <Sparkles className="size-4 text-primary-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Finance BI</p>
          <p className="truncate text-xs text-muted-foreground">Controle pessoal</p>
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
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/12 hover:text-destructive"
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
              className="absolute top-4 right-3 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent"
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} onLogout={onLogout} />
          </motion.div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          {actions}
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
