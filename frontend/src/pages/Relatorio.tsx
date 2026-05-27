import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import api from "../services/api";
import { useUsuario } from "../context/UserContext";

type ItemDoacaoResumo = {
  id: number;
  tipo_material: string;
  descricao: string;
  quantidade: number;
  status: string;
};

type DoacaoRelatorio = {
  id: number;
  doador_nome?: string | null;
  status: string;
  status_tag: string;
  created_at: string;
  tempo_cadastrada_dias: number;
  tempo_cadastrada_tag: string;
  itens: ItemDoacaoResumo[];
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  AGUARDANDO_TRIAGEM: { label: "Aguardando triagem", className: "bg-amber-100 text-amber-800" },
  PRE_APROVADO: { label: "Pré-aprovado", className: "bg-emerald-100 text-emerald-800" },
  DISPONIVEL: { label: "Disponível", className: "bg-green-100 text-green-800" },
  MATERIAL_COLETADO: { label: "Material coletado", className: "bg-sky-100 text-sky-800" },
  INAPTO: { label: "Inapto", className: "bg-rose-100 text-rose-800" },
  INCOMPLETO: { label: "Incompleto", className: "bg-orange-100 text-orange-800" },
  CANCELADO: { label: "Cancelado", className: "bg-gray-200 text-gray-700" },
  AGUARDANDO_NOVA_TRIAGEM: { label: "Aguardando nova triagem", className: "bg-blue-100 text-blue-800" },
};

function formatarData(data?: string) {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data));
}

function Relatorio() {
  const navigate = useNavigate();
  const { usuario } = useUsuario();
  const [doacoes, setDoacoes] = useState<DoacaoRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const ehCoordenador = usuario?.tipos?.includes("Coordenador de Processos") ?? false;

  const carregarRelatorio = async (inicio?: string, fim?: string) => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get<DoacaoRelatorio[]>("/doacoes/", {
        params: {
          data_inicio: inicio || undefined,
          data_final: fim || undefined,
          ordem: "desc",
        },
      });

      setDoacoes(resposta.data ?? []);
    } catch (error: any) {
      setErro(error?.response?.data?.detail || "Não foi possível carregar o relatório das doações.");
      setDoacoes([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!usuario) {
      navigate("/logar", { replace: true });
      return;
    }

    if (!ehCoordenador) {
      return;
    }

    carregarRelatorio();
  }, [ehCoordenador, navigate, usuario]);

  const resumo = useMemo(() => {
    const totalItens = doacoes.reduce((acc, doacao) => acc + doacao.itens.reduce((s, item) => s + item.quantidade, 0), 0);

    const aprovadas = doacoes.filter((doacao) =>
      ["PRE_APROVADO", "DISPONIVEL", "MATERIAL_COLETADO"].includes(doacao.status)
    ).length;

    const pendentes = doacoes.filter((doacao) =>
      ["AGUARDANDO_TRIAGEM", "AGUARDANDO_NOVA_TRIAGEM"].includes(doacao.status)
    ).length;

    const inaptas = doacoes.filter((doacao) =>
      ["INAPTO", "CANCELADO"].includes(doacao.status)
    ).length;

    const porMaterial = doacoes
      .flatMap((doacao) => doacao.itens.map((item) => ({
        nome: item.tipo_material,
        quantidade: item.quantidade,
      })))
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.nome] = (acc[item.nome] ?? 0) + item.quantidade;
        return acc;
      }, {});

    return {
      totalDoacoes: doacoes.length,
      totalItens,
      aprovadas,
      pendentes,
      inaptas,
      porMaterial,
    };
  }, [doacoes]);

  const materiaisOrdenados = useMemo(
    () => Object.entries(resumo.porMaterial).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [resumo.porMaterial]
  );

  const aplicarFiltro = () => {
    carregarRelatorio(dataInicio, dataFim);
  };

  const limparFiltro = () => {
    setDataInicio("");
    setDataFim("");
    carregarRelatorio();
  };

  const exportarPdf = () => {
    window.print();
  };

  if (!usuario) {
    return null;
  }

  if (!ehCoordenador) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
        <div className="print:hidden"><Header /></div>
        <main className="flex-1 pt-24 pb-10">
          <div className="w-full px-6 md:px-20 flex justify-center">
            <section className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-[2px_10px_40px_rgba(0,0,0,0.1)] text-center">
              <h2 className="header-pequeno text-[var(--primario-80)]">Acesso restrito</h2>
              <p className="mt-3 text-gray-700">Este relatório é exclusivo para usuários com perfil de Coordenador de Processos.</p>
              <button
                type="button"
                onClick={() => navigate("/conta")}
                className="mt-6 rounded-full bg-[var(--primario-80)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primario-70)] transition"
              >
                Voltar para a conta
              </button>
            </section>
          </div>
        </main>
        <div className="print:hidden"><Footer /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      <div className="print:hidden"><Header /></div>

      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
            <h1 className="header-medio text-center">Canetas que Mudam o Mundo</h1>
          </div>

          <section className="w-full max-w-7xl mx-auto rounded-2xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] p-6 md:p-8">
            <div className="flex flex-col gap-3 text-center md:text-left md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="header-pequeno">Relatório das doações</h2>
                <p className="body-pequeno text-gray-700 mt-2">Resumo rápido do volume, status e materiais recebidos.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <button
                  type="button"
                  onClick={exportarPdf}
                  className="rounded-full bg-[var(--primario-80)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primario-70)] transition"
                >
                  Exportar PDF
                </button>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--primario-80)] shadow-sm">Atualizado em tempo real</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--base-30)] bg-white p-4 shadow-sm print:hidden">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 flex-1">
                  <label className="text-sm text-gray-700">
                    <span className="mb-1 block font-semibold">Data inicial</span>
                    <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-padrao w-full" />
                  </label>
                  <label className="text-sm text-gray-700">
                    <span className="mb-1 block font-semibold">Data final</span>
                    <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input-padrao w-full" />
                  </label>
                  <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2">
                    <button type="button" onClick={aplicarFiltro} className="rounded-full bg-[var(--primario-80)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primario-70)] transition">Aplicar filtro</button>
                    <button type="button" onClick={limparFiltro} className="rounded-full border border-[var(--base-70)] bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-[var(--base-10)] transition">Limpar</button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-600">Use o filtro para visualizar um período específico. A exportação em PDF usa a visão filtrada atual.</p>
            </div>

            {carregando ? (
              <div className="mt-8 rounded-xl border border-dashed border-[var(--base-70)] bg-white p-10 text-center text-gray-700">Carregando relatório...</div>
            ) : erro ? (
              <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{erro}</div>
            ) : (
              <>
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <ResumoCard titulo="Total de doações" valor={resumo.totalDoacoes} subtitulo="registros cadastrados" />
                  <ResumoCard titulo="Itens cadastrados" valor={resumo.totalItens} subtitulo="itens disponíveis para análise" />
                  <ResumoCard titulo="Aprovadas" valor={resumo.aprovadas} subtitulo="prontas para seguir" />
                  <ResumoCard titulo="Pendentes" valor={resumo.pendentes} subtitulo="em triagem ou aguardando revisão" />
                  <ResumoCard titulo="Inaptas / canceladas" valor={resumo.inaptas} subtitulo="não seguem para disponibilidade" />
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <article className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--base-30)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Últimas doações</h3>
                        <p className="text-sm text-gray-600">Visão rápida dos registros mais recentes.</p>
                      </div>
                      <span className="rounded-full bg-[var(--primario-5)] px-3 py-1 text-xs font-semibold text-[var(--primario-80)]">{doacoes.length} registros</span>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="text-gray-500 uppercase tracking-wide text-[11px]">
                          <tr>
                            <th className="px-3 py-2">Doação</th>
                            <th className="px-3 py-2">Doador</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Itens</th>
                            <th className="px-3 py-2">Cadastrada em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {doacoes.slice(0, 8).map((doacao) => (
                            <tr key={doacao.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3 font-semibold text-gray-900">#{doacao.id}</td>
                              <td className="px-3 py-3 text-gray-700">{doacao.doador_nome || "—"}</td>
                              <td className="px-3 py-3"><StatusTag status={doacao.status} label={doacao.status_tag} /></td>
                              <td className="px-3 py-3 text-gray-700">{doacao.itens.reduce((acc, item) => acc + item.quantidade, 0)}</td>
                              <td className="px-3 py-3 text-gray-700">{formatarData(doacao.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article className="rounded-2xl bg-white p-5 shadow-sm border border-[var(--base-30)]">
                    <h3 className="text-lg font-semibold text-gray-900">Materiais mais doados</h3>
                    <p className="text-sm text-gray-600 mt-1">Distribuição por tipo de material registrado.</p>

                    <div className="mt-5 space-y-3">
                      {materiaisOrdenados.length === 0 ? (
                        <p className="text-sm text-gray-600">Ainda não há itens cadastrados para resumir.</p>
                      ) : materiaisOrdenados.map(([nome, quantidade]) => (
                        <div key={nome} className="rounded-xl border border-[var(--base-30)] bg-[var(--base-5)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <strong className="text-gray-900">{nome}</strong>
                            <span className="rounded-full bg-[var(--primario-5)] px-3 py-1 text-xs font-semibold text-[var(--primario-80)]">{quantidade} itens</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-[var(--base-30)]">
                            <div
                              className="h-2 rounded-full bg-[var(--primario-60)]"
                              style={{ width: `${Math.min(100, (quantidade / Math.max(...Object.values(resumo.porMaterial), 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <div className="print:hidden"><Footer /></div>
    </div>
  );
}

function ResumoCard({ titulo, valor, subtitulo }: { titulo: string; valor: number; subtitulo: string }) {
  return (
    <article className="rounded-2xl border border-[var(--base-30)] bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="mt-3 text-3xl font-black text-[var(--primario-80)]">{valor}</p>
      <p className="mt-1 text-xs text-gray-600">{subtitulo}</p>
    </article>
  );
}

function StatusTag({ status, label }: { status: string; label: string }) {
  const meta = STATUS_META[status] ?? { label, className: "bg-gray-100 text-gray-700" };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>;
}

export default Relatorio;