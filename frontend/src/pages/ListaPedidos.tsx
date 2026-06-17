import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import {
  listarMeusPedidos,
  type PedidoMaterial,
  type StatusPedidoMaterial,
} from "../services/pedidoService";

type OrdemFiltro = "data-desc" | "data-asc";

type StatusFiltro = StatusPedidoMaterial | "todos";

const STATUS_CONFIG: Record<
  StatusPedidoMaterial,
  { label: string; className: string }
> = {
  AGUARDANDO_APROVACAO: {
    label: "Aguardando aprovação",
    className: "bg-yellow-100 text-yellow-800",
  },
  AGUARDANDO_RETIRADA: {
    label: "Aguardando retirada",
    className: "bg-blue-100 text-blue-800",
  },
  MATERIAL_COLETADO: {
    label: "Material coletado",
    className: "bg-green-100 text-green-800",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800",
  },
};

function TagStatus({ status }: { status: StatusPedidoMaterial }) {
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

function ListaPedidos() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<PedidoMaterial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [pedidoVer, setPedidoVer] = useState<PedidoMaterial | null>(null);

  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [ordem, setOrdem] = useState<OrdemFiltro>("data-desc");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const ITENS_POR_PAGINA = 5;

  const pedidosFiltrados = useMemo(() => {
    let filtrados = [...pedidos];

    if (statusFiltro !== "todos") {
      filtrados = filtrados.filter((pedido) => pedido.status === statusFiltro);
    }

    filtrados.sort((a, b) => {
      const dataA = new Date(a.created_at?.replace(" ", "T") || "").getTime();
      const dataB = new Date(b.created_at?.replace(" ", "T") || "").getTime();
      return ordem === "data-asc" ? dataA - dataB : dataB - dataA;
    });

    return filtrados;
  }, [pedidos, statusFiltro, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / ITENS_POR_PAGINA));
  const pedidosPagina = pedidosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  useEffect(() => {
    const mensagemSalva = localStorage.getItem("toast");
    if (mensagemSalva) {
      setMensagem(mensagemSalva);
      setTipoMensagem("sucesso");
      localStorage.removeItem("toast");
    }
  }, []);

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarMeusPedidos();
        setPedidos(dados);
      } catch (erro: any) {
        console.error("Erro ao carregar pedidos:", erro);
        const status = erro?.response?.status;
        if (status === 401) {
          setMensagem("Sessão expirada. Faça login novamente.");
        } else {
          setMensagem("Erro ao carregar pedidos.");
        }
        setTipoMensagem("erro");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      <Header />

      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
            <h1 className="header-medio text-center">Canetas que Mudam o Mundo</h1>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">
              <h2 className="header-pequeno text-center mb-6">MEUS PEDIDOS</h2>

              <div className="flex justify-center mb-6">
                <Botao variante="confirmar" aoClicar={() => navigate("/lista-pedidos/pedido")}>
                  Fazer novo pedido
                </Botao>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
                <div className="text-black text-2xl font-extrabold font-['Nunito']">Filtros:</div>

                <div>
                  <select
                    value={statusFiltro}
                    onChange={(event) => {
                      setStatusFiltro(event.target.value as StatusFiltro);
                      setPaginaAtual(1);
                    }}
                    className="input-padrao w-full sm:w-60 hover:border-2 border-[var(--base-70)] focus-acessivel"
                    aria-label="Filtrar por status"
                  >
                    <option value="todos">Status</option>
                    <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
                    <option value="AGUARDANDO_RETIRADA">Aguardando retirada</option>
                    <option value="MATERIAL_COLETADO">Material coletado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div>
                  <select
                    value={ordem}
                    onChange={(event) => {
                      setOrdem(event.target.value as OrdemFiltro);
                      setPaginaAtual(1);
                    }}
                    className="input-padrao w-full sm:w-52 hover:border-2 border-[var(--base-70)] focus-acessivel"
                    aria-label="Ordenar pedidos"
                  >
                    <option value="data-desc">Mais recentes primeiro</option>
                    <option value="data-asc">Mais antigos primeiro</option>
                  </select>
                </div>
              </div>

              {carregando ? (
                <p className="text-center body-semibold-pequeno py-6">Carregando pedidos...</p>
              ) : pedidos.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">Você ainda não realizou nenhum pedido.</div>
              ) : pedidosPagina.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">Nenhum pedido encontrado com esses filtros.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pedidosPagina.map((pedido, index) => (
                    <div key={pedido.id} className="flex flex-col sm:flex-row gap-3 border-b py-3 w-full">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-['Nunito'] font-semibold text-sm sm:text-base md:text-lg truncate">
                          {String((paginaAtual - 1) * ITENS_POR_PAGINA + index + 1).padStart(3, "0")} — Pedido #{pedido.id}
                        </span>

                        <span className="body-muito-pequeno text-gray-500 mt-[2px]">
                          {formatarData(pedido.created_at)}
                        </span>

                        <div className="mt-1 flex flex-wrap gap-2 items-center">
                          <TagStatus status={pedido.status} />
                          <span className="body-muito-pequeno text-[var(--base-70)]">
                            {pedido.itens.length} item(s) · {pedido.itens.reduce((total, item) => total + item.quantidade, 0)} unidade(s)
                          </span>
                        </div>

                        <p className="body-muito-pequeno text-[var(--base-70)] mt-2">
                          {pedido.itens.map((item) => `${item.quantidade}x ${item.tipo_material}`).join(" · ")}
                        </p>
                      </div>

                      <div className="flex flex-row items-center justify-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <Botao variante="botao-pequeno-editar" aoClicar={() => setPedidoVer(pedido)}>
                          Ver
                        </Botao>
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

              <ModalConfirmacao
                aberto={!!pedidoVer}
                titulo="Detalhes do pedido"
                descricao={
                  pedidoVer
                    ? `Pedido #${pedidoVer.id} · Status: ${STATUS_CONFIG[pedidoVer.status]?.label ?? pedidoVer.status} · Data: ${formatarData(pedidoVer.created_at)} · Itens: ${pedidoVer.itens.map((item) => `${item.quantidade}x ${item.tipo_material}`).join("; ")}`
                    : ""
                }
                varianteCancelar="cancelar"
                botaoConfirmar="Fechar"
                onCancelar={() => setPedidoVer(null)}
                onConfirmar={() => setPedidoVer(null)}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ListaPedidos;
