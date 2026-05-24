import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import {
  Doacao,
  StatusDoacao,
  listarMinhasDoacoes,
} from "../services/doacaoService";

type PeriodoFiltro = "todos" | "0-1" | "2-3" | "4-5" | "6-7" | "8-9" | "10-11" | "12" | "24" | "25+";
type OrdemFiltro = "data-desc" | "data-asc";

function useFiltroDoacao(doacoes: Doacao[], status: StatusDoacao | "todos", periodo: PeriodoFiltro, ordem: OrdemFiltro): Doacao[] {
  let filtradas = [...doacoes];

  if (status !== "todos") {
    filtradas = filtradas.filter(d => d.status === status);
  }

  if (periodo !== "todos") {
    filtradas = filtradas.filter(d => {
      const dataAtual = new Date();
      const dataCriacao = new Date(d.data_criacao?.replace(" ", "T") || "");
      const diffMeses = (dataAtual.getFullYear() - dataCriacao.getFullYear()) * 12 + (dataAtual.getMonth() - dataCriacao.getMonth());
      
      if (periodo === "0-1") return diffMeses <= 1;
      if (periodo === "2-3") return diffMeses >= 2 && diffMeses <= 3;
      if (periodo === "4-5") return diffMeses >= 4 && diffMeses <= 5;
      if (periodo === "6-7") return diffMeses >= 6 && diffMeses <= 7;
      if (periodo === "8-9") return diffMeses >= 8 && diffMeses <= 9;
      if (periodo === "10-11") return diffMeses >= 10 && diffMeses <= 11;
      if (periodo === "12") return diffMeses === 12;
      if (periodo === "24") return diffMeses >= 12 && diffMeses <= 24;
      if (periodo === "25+") return diffMeses > 24;
      return true;
    });
  }

  if (ordem === "data-asc") {
    filtradas.sort((a, b) => new Date(a.data_criacao?.replace(" ", "T") || "").getTime() - new Date(b.data_criacao?.replace(" ", "T") || "").getTime());
  } else {
    filtradas.sort((a, b) => new Date(b.data_criacao?.replace(" ", "T") || "").getTime() - new Date(a.data_criacao?.replace(" ", "T") || "").getTime());
  }

  return filtradas;
}

// configuração visual de cada status 
const STATUS_CONFIG: Record<
  StatusDoacao,
  { label: string; className: string }
> = {
  aguardando_triagem: {
    label: "Aguardando triagem",
    className: "bg-yellow-100 text-yellow-800",
  },
  pre_aprovado: {
    label: "Pré-aprovado",
    className: "bg-green-100 text-green-800",
  },
  inapto: {
    label: "Inapto",
    className: "bg-red-100 text-red-800",
  },
  incompleta: {
    label: "Incompleta",
    className: "bg-orange-100 text-orange-800",
  },
  aguardando_nova_triagem: {
    label: "Aguardando nova triagem",
    className: "bg-blue-100 text-blue-800",
  },
};

function TagStatus({ status }: { status: StatusDoacao }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`text-[10px] sm:text-[12px] px-2 py-[2px] text-center leading-none rounded-sm w-fit font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function formatarData(data?: string) {
  if (!data) return "N/A";
  const d = new Date(data.replace(" ", "T"));
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// componente principal
function Doacoes() {
  const navigate = useNavigate();

  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [doacaoVer, setDoacaoVer] = useState<Doacao | null>(null);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [statusFiltro, setStatusFiltro] = useState<StatusDoacao | "todos">("todos");
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("todos");
  const [ordem, setOrdem] = useState<OrdemFiltro>("data-desc");

  const doacoesFiltradas = useFiltroDoacao(doacoes, statusFiltro, periodo, ordem);

  const totalPaginas = Math.max(
    1,
    Math.ceil(doacoesFiltradas.length / ITENS_POR_PAGINA)
  );

  const doacoesPagina = doacoesFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarMinhasDoacoes();
        setDoacoes(dados);
      } catch (erro: any) {
        console.error("Erro ao carregar doações:", erro);
        const status = erro?.response?.status;
        if (status === 401) {
          setMensagem("Sessão expirada. Faça login novamente.");
        } else {
          setMensagem("Erro ao carregar doações.");
        }
        setTipoMensagem("erro");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // ajusta página se filtro reduzir os resultados
  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [doacoesFiltradas]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          {/* título e logo */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                MINHAS DOAÇÕES
              </h2>

              {/* botão nova doação */}
              <div className="flex justify-center mb-6">
                <Botao variante="confirmar" aoClicar={() => navigate("/doar")}>
                  Fazer nova doação
                </Botao>
              </div>

              {/* filtros */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
                <div className="text-black text-2xl font-extrabold font-['Nunito']">
                  Filtros:
                </div>

                {/* status */}
                <div>
                  <select
                    value={statusFiltro}
                    onChange={(e) => {
                      setStatusFiltro(e.target.value as StatusDoacao | "todos");
                      setPaginaAtual(1);
                    }}
                    className="input-padrao w-full sm:w-60 hover:border-2 border-[var(--base-70)] focus-acessivel"
                    aria-label="Filtrar por status"
                  >
                    <option value="todos">Status</option>
                    <option value="aguardando_triagem">Aguardando triagem</option>
                    <option value="pre_aprovado">Pré-aprovado</option>
                    <option value="inapto">Inapto</option>
                    <option value="incompleta">Incompleta</option>
                    <option value="aguardando_nova_triagem">
                      Aguardando nova triagem
                    </option>
                  </select>
                </div>

                {/* período */}
                <div>
                  <select
                    value={periodo}
                    onChange={(e) => {
                      setPeriodo(e.target.value as PeriodoFiltro);
                      setPaginaAtual(1);
                    }}
                    className="input-padrao w-full sm:w-48 hover:border-2 hover:border-[var(--base-70)] focus-acessivel"
                    aria-label="Filtrar por período"
                  >
                    <option value="todos">Período</option>
                    <option value="0-1">Até 1 mês</option>
                    <option value="2-3">2 a 3 meses</option>
                    <option value="4-5">4 a 5 meses</option>
                    <option value="6-7">6 a 7 meses</option>
                    <option value="8-9">8 a 9 meses</option>
                    <option value="10-11">10 a 11 meses</option>
                    <option value="12">1 ano</option>
                    <option value="24">2 anos</option>
                    <option value="25+">Mais de 3 anos</option>
                  </select>
                </div>

                {/* ordem */}
                <div>
                  <select
                    value={ordem}
                    onChange={(e) => {
                      setOrdem(e.target.value as OrdemFiltro);
                      setPaginaAtual(1);
                    }}
                    className="input-padrao w-full sm:w-52 hover:border-2 border-[var(--base-70)] focus-acessivel"
                    aria-label="Ordenar doações"
                  >
                    <option value="data-desc">Mais recentes primeiro</option>
                    <option value="data-asc">Mais antigas primeiro</option>
                  </select>
                </div>
              </div>

              {/* lista de doações */}
              {carregando ? (
                <p className="text-center body-semibold-pequeno py-6">
                  Carregando doações...
                </p>
              ) : doacoes.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Você ainda não realizou nenhuma doação.
                </div>
              ) : doacoesPagina.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma doação encontrada com esses filtros.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {doacoesPagina.map((d, index) => (
                    <div
                      key={d.id}
                      className="flex flex-col sm:flex-row gap-3 border-b py-3 w-full"
                    >
                      {/* esquerda: info da doação */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-['Nunito'] font-semibold text-sm sm:text-base md:text-lg truncate">
                          {String(
                            (paginaAtual - 1) * ITENS_POR_PAGINA + index + 1
                          ).padStart(3, "0")}{" "}
                          — {d.tipo_material}
                        </span>

                        <span className="body-muito-pequeno text-gray-500 mt-[2px]">
                          {formatarData(d.data_criacao)}
                        </span>

                        <div className="mt-1">
                          <TagStatus status={d.status} />
                        </div>
                      </div>

                      {/* direita: ações */}
                      <div className="flex flex-row items-center justify-between gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <Botao
                          variante="botao-pequeno-editar"
                          aoClicar={() => setDoacaoVer(d)}
                        >
                          Ver
                        </Botao>

                        {d.status === "incompleta" && (
                          <Botao
                            variante="botao-pequeno-desativar"
                            aoClicar={() => navigate(`/doar?id=${d.id}`)}
                          >
                            Editar
                          </Botao>
                        )}
                      </div>
                    </div>
                  ))}

                  <Paginacao
                    paginaAtual={paginaAtual}
                    totalPaginas={totalPaginas}
                    setPagina={setPaginaAtual}
                  />
                </div>
              )}

              {/* modal: detalhes da doação */}
              <ModalConfirmacao
                aberto={!!doacaoVer}
                titulo="Detalhes da doação"
                descricao={
                  doacaoVer
                    ? `Tipo: ${doacaoVer.tipo_material} · Qtd: ${doacaoVer.quantidade} · Status: ${STATUS_CONFIG[doacaoVer.status]?.label ?? doacaoVer.status} · Data: ${formatarData(doacaoVer.data_criacao)} · Descrição: ${doacaoVer.descricao}${doacaoVer.possiveis_defeitos ? ` · Possíveis defeitos: ${doacaoVer.possiveis_defeitos}` : ""}`
                    : ""
                }
                varianteCancelar="cancelar"
                botaoConfirmar="Fechar"
                onCancelar={() => setDoacaoVer(null)}
                onConfirmar={() => setDoacaoVer(null)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default Doacoes;