import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import { useONG } from "../context/OngContext";
import { Doacao } from "../context/DoacaoContext";
import { obterDoacoes } from "../services/triagemService";
import { atualizarStatusPedido, obterPedidos } from "../services/statusMateriaisService";

  type TipoItem = "DOACAO" | "PEDIDO";

  type StatusMaterial =
    | "PRE_APROVADO"
    | "AGUARDANDO_RETIRADA"
    | "DISPONIVEL"
    | "MATERIAL_COLETADO";

  type ItemUnificado = {
    id: number;
    origem: TipoItem;
    codigo_coleta?: string;
    status: StatusMaterial;
    created_at: string;

    itens?: any[]; // para expandir
  };

  const STATUS_VISIVEIS: StatusMaterial[] = [
    "PRE_APROVADO",
    "AGUARDANDO_RETIRADA",
  ];

  const STATUS_FINAL: StatusMaterial[] = [
    "DISPONIVEL",
    "MATERIAL_COLETADO",
  ];

  function proximoStatus(status: StatusMaterial): StatusMaterial | null {
    switch (status) {
      case "PRE_APROVADO":
        return "AGUARDANDO_RETIRADA";
      case "AGUARDANDO_RETIRADA":
        return "DISPONIVEL";
      case "DISPONIVEL":
        return "MATERIAL_COLETADO";
      default:
        return null;
    }
  }

function StatusMateriais() {
  const navigate = useNavigate();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroModal, setErroModal] = useState<{campo?: string; mensagem: string; } | null>(null);
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [itens, setItens] = useState<ItemUnificado[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);

  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | TipoItem>("TODOS");
  const [statusFiltro, setStatusFiltro] = useState<"TODOS" | StatusMaterial>("TODOS");
  const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
  const [codigoFiltro, setCodigoFiltro] = useState("");

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  function formatarStatus(status: string) {
    return status
      .toLowerCase()
      .replaceAll("_", " ");
  }

  function corStatus(status: string) {
    switch (status) {
      case "PRE_APROVADO":
        return "bg-yellow-100 text-black";

      case "AGUARDANDO_RETIRADA":
        return "bg-orange-100 text-black";

      default:
        return "bg-gray-100 text-black";
    }
  }

  const ITENS = itens.filter((i) => {
    const tipoOk = tipoFiltro === "TODOS" || i.origem === tipoFiltro;
    const statusOk = statusFiltro === "TODOS" || i.status === statusFiltro;
    const codigoOk =
      !codigoFiltro ||
      i.codigo_coleta?.toLowerCase().includes(codigoFiltro.toLowerCase());

    return tipoOk && statusOk && codigoOk;
  });

  const totalPaginas = Math.max(1, Math.ceil(ITENS.length / ITENS_POR_PAGINA));
  
  const pagina = ITENS.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const validarBusca = (valor: string) => {
    if (valor.length >= 50) 
      return "Você atingiu o limite máximo de 50 caracteres";
    if (!/^[\wÀ-ÿ\s./-]*$/.test(valor))
      return "Caracteres inválidos";
    return "";
  };

  // carregar doações e pedidos
  useEffect(() => {
    async function carregar() {
      const doacoes = await obterDoacoes({ ordem, status: undefined });
      const pedidos = await obterPedidos({ ordem, status: undefined });

      const mapDoacoes: ItemUnificado[] = doacoes.data.flatMap((d: any) =>
        d.itens.map((i: any) => ({
          id: i.id,
          origem: "DOACAO",
          codigo_coleta: d.codigo_coleta,
          status: i.status,
          created_at: d.created_at,
          itens: d.itens,
        }))
      );

      const mapPedidos: ItemUnificado[] = pedidos.data.flatMap((p: any) =>
        p.itens.map((i: any) => ({
          id: i.id,
          origem: "PEDIDO",
          codigo_coleta: p.codigo_coleta,
          status: i.status,
          created_at: p.created_at,
          itens: p.itens,
        }))
      );

      const unidos = [...mapDoacoes, ...mapPedidos].filter((i) =>
        STATUS_VISIVEIS.includes(i.status)
      );

      setItens(unidos);
    }

    carregar();
  }, [ordem]);

  async function concluir(item: ItemUnificado) {
    await atualizarStatusPedido(item.id, {
      status: "MATERIAL_COLETADO",
    });

    setItens((prev) =>
      prev.filter((i) => i.id !== item.id)
    );
  }

  useEffect(() => {
    const total = Math.ceil(ITENS.length / ITENS_POR_PAGINA);

    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [totalPaginas, paginaAtual]);


  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* título do formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                STATUS DOS MATERIAIS
              </h2>

              
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">

                  <div className="text-black text-2xl font-extrabold font-['Nunito'] flex items-center self-stretch">Filtros:</div>
  
                  <div className="justify-start w-full sm:w-56 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-tipo">Buscar por código de coleta</label>
                    {/* busca por codigo de coleta */}
                    <input id="busca" type="text" maxLength={100} placeholder="Buscar por código de coleta..." value={codigoFiltro} onChange={(e) => { const valor = e.target.value; setCodigoFiltro(valor); setPaginaAtual(1); const erro = validarBusca(valor); setErroBusca(erro);}}
                      onBlur={() => setTocadoBusca(true)} className={`input-padrao h-9 w-full ${ tocadoBusca && erroBusca ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel"}`} aria-invalid={!!erroBusca} aria-label="Pesquisar por código de coleta"/>
                    
                    {tocadoBusca && erroBusca && <div className="text-[var(--cor-resposta-errada)] mt-1 text-sm">{erroBusca}</div>}
                  </div>

                  <div className="justify-start w-full sm:w-56 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-tipo">Tipo</label>
                    {/* status */}
                    <select id="busca-tipo" value={statusFiltro} onChange={(e) => { setTipoFiltro(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-56 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar o status das doações">
                      <option value="TODOS">Todos</option>
                      <option value="DOACAO">Doação</option>
                      <option value="PEDIDO">Pedido</option>
                    </select>
                  </div>
  
                  <div className="justify-start w-full sm:w-44 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-ordem">Ordem de exibição</label>
                    <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-44 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição das doações">
                      <option value="desc">Mais novas</option>
                      <option value="asc">Mais antigas</option>
                    </select>
                  </div>
  
                </div>
  
                {/* LISTA */}
                <div className="flex flex-col gap-4">

                  {pagina.map((i) => (
                    <div key={i.id} className="p-4 bg-white rounded-lg border">

                      {/* TAGS */}
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-xs rounded">
                          {i.origem}
                        </span>

                        <span className="px-2 py-1 bg-gray-200 text-xs rounded">
                          {i.status}
                        </span>
                      </div>

                      <div className="text-sm mt-1">
                        Código: {i.codigo_coleta}
                      </div>

                      {/* BOTÕES */}
                      <div className="flex gap-2 mt-3">

                        <Botao aoClicar={() => setExpandido(expandido === i.id ? null : i.id) }> {expandido === i.id ? "Fechar" : "Expandir"}</Botao>

                        <Botao aoClicar={() => concluir(i)}> {i.origem === "DOACAO" ? "Doação entregue" : "Pedido coletado"}</Botao>
                      </div>

                      {/* EXPANDIR */}
                      {expandido === i.id && (
                        <div className="mt-3 bg-gray-50 p-2 rounded text-sm">
                          {i.itens?.map((it: any) => (
                            <div key={it.id}>
                              • {it.tipo_material} - {it.quantidade}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                </div>

                <Paginacao
                  paginaAtual={paginaAtual}
                  totalPaginas={totalPaginas}
                  setPagina={setPaginaAtual}
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
export default StatusMateriais;