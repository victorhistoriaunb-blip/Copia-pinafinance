import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Loader2, Lock, User } from "lucide-react";
import { login } from "@/lib/gate.functions";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · PINA Finanças — Dashboard Financeiro" },
      {
        name: "description",
        content:
          "Acesse seu dashboard financeiro pessoal com visão de receitas, despesas, categorias e metas.",
      },
      { property: "og:title", content: "Entrar · PINA Finanças" },
      {
        property: "og:description",
        content: "Área protegida do seu dashboard financeiro pessoal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const doLogin = useServerFn(login);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!username || !password) {
      setError("Preencha usuário e senha.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await doLogin({ data: { username, password } });
      if (res.ok) {
        await router.navigate({ to: "/" });
      } else {
        setError("Usuário ou senha inválidos.");
      }
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid-noise relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="pointer-events-none absolute top-1/4 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="panel relative w-full max-w-sm p-8"
      >
        <div className="flex flex-col items-center text-center">
          <motion.img
            src={logo}
            alt="PINA Finanças"
            width={512}
            height={512}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="size-16 object-contain"
          />
          <h1 className="mt-3 text-xl font-semibold tracking-tight">PINA Finanças</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso protegido ao seu painel financeiro
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Usuário
            </span>
            <span className="relative flex items-center">
              <User className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                name="username"
                autoComplete="username"
                maxLength={100}
                placeholder="seu usuário"
                className="w-full rounded-xl border border-input bg-background/60 py-2.5 pr-3 pl-9 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/35"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Senha
            </span>
            <span className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength={200}
                placeholder="••••••••"
                className="w-full rounded-xl border border-input bg-background/60 py-2.5 pr-3 pl-9 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/35"
              />
            </span>
          </label>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-destructive/12 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.985] disabled:opacity-70"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
