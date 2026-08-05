import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Target,
  Upload,
  Wallet,
} from "lucide-react";
import { Page } from "@/components/dashboard/page";
import { Panel } from "@/components/dashboard/charts";

export const Route = createFileRoute("/_gated/como-usar")({
  head: () => ({
    meta: [
      { title: "Como usar · PINA Finanças" },
      {
        name: "description",
        content:
          "Guia rápido da PINA Finanças: importar planilhas, cadastrar contas, editar em linha, acompanhar metas e personalizar painéis.",
      },
      { property: "og:title", content: "Como usar · PINA Finanças" },
      { property: "og:description", content: "Passo a passo completo da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HowToPage,
});

const STEPS = [
  {
    icon: Upload,
    title: "1. Traga seus dados",
    to: "/importar" as const,
    cta: "Ir para Importar Planilhas",
    body: [
      "Arraste arquivos .xlsx, .xls, .xlsm ou .csv para a área de upload (ou clique para escolher).",
      "Revise o resumo de abas e avisos e clique em “Confirmar importação” para gravar os lançamentos na sua conta.",
      "Não existem colunas obrigatórias: o sistema reconhece cabeçalhos comuns (data, conta, valor, vencimento, situação) e guarda as demais colunas como informações extras.",
    ],
  },
  {
    icon: Wallet,
    title: "2. Cadastre e edite contas",
    to: "/contas" as const,
    cta: "Ir para Contas",
    body: [
      "Use “Novo registro” para lançar manualmente, com abas Principal e Detalhamento (observações, histórico, links e comentários).",
      "Na lista e nos cards, clique sobre qualquer campo para editar em linha: data, conta, despesa, vencimento, situação e valor.",
      "Use “Copiar informações” para levar os dados de uma conta para onde quiser e a replicação para repetir contas em outros meses.",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "3. Acompanhe os painéis",
    to: "/paineis" as const,
    cta: "Ir para Painéis",
    body: [
      "O Dashboard mostra saldo, receitas, despesas, economia, gráficos e insights do período escolhido.",
      "Em Painéis, clique em “Personalizar” para mostrar/ocultar cards, mudar o tamanho e reordenar. A organização fica salva na sua conta.",
      "Dia, Semana, Mês, Ano e Categorias oferecem recortes prontos dos mesmos dados.",
    ],
  },
  {
    icon: Target,
    title: "4. Defina metas",
    to: "/metas" as const,
    cta: "Ir para Metas",
    body: [
      "Informe o nome e o valor alvo da meta e salve — o progresso é calculado com o saldo dos seus lançamentos.",
      "A previsão em meses considera a economia média do período atual.",
    ],
  },
  {
    icon: Settings,
    title: "5. Ajuste o sistema",
    to: "/configuracoes" as const,
    cta: "Ir para Configurações",
    body: [
      "Personalize nome do app, saudação, cor de destaque, densidade da interface e os rótulos do menu.",
      "Tudo é salvo na sua conta e volta igual em qualquer dispositivo.",
    ],
  },
];

const FAQ = [
  {
    q: "Meus dados ficam salvos?",
    a: "Sim. Tudo o que você cadastra ou importa é gravado na sua conta, protegido por login. Ao entrar em outro dispositivo com o mesmo e-mail, as informações aparecem novamente.",
  },
  {
    q: "Outra pessoa pode ver meus lançamentos?",
    a: "Não. Cada conta só enxerga os próprios dados — as regras de acesso são aplicadas no banco de dados.",
  },
  {
    q: "Posso usar sem planilha?",
    a: "Pode. O cadastro manual é completo e alimenta gráficos, relatórios e metas do mesmo jeito.",
  },
  {
    q: "Como remover uma planilha importada?",
    a: "Em Importar Planilhas, use o ícone de lixeira do arquivo. Os lançamentos que vieram dele são removidos junto; os manuais permanecem.",
  },
  {
    q: "Esqueci minha senha, e agora?",
    a: "Na tela de entrada, escolha “Esqueci a senha”, informe o e-mail e siga o link enviado para definir uma nova senha.",
  },
];

function HowToPage() {
  return (
    <Page title="Como usar" subtitle="Guia completo da PINA Finanças" requireData={false}>
      <div className="flex flex-col gap-5">
        <Panel title="Visão geral" description="Em poucos minutos você tem o controle completo">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <BookOpen className="size-5" />
            </span>
            <p>
              A PINA Finanças reúne seus lançamentos — importados de planilhas ou cadastrados à mão —
              em indicadores, gráficos, contas a pagar e metas. Siga os passos abaixo na ordem: eles
              cobrem todos os recursos disponíveis hoje.
            </p>
          </div>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-2">
          {STEPS.map((step, i) => (
            <Panel key={step.title} title={step.title} delay={0.05 * i}>
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {step.body.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={step.to}
                  className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/60"
                >
                  <step.icon className="size-4" /> {step.cta}
                </Link>
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="Perguntas frequentes" description="Dúvidas comuns do dia a dia">
          <div className="flex flex-col gap-2">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-primary/40"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
