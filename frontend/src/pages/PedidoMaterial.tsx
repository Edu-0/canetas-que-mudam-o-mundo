import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Botao from "../components/Botao";
import { obterFamiliares, type FamiliarRetorno } from "../services/usuarioService";
import { obterTodasONGs } from "../services/ongService";
import {
  criarPedidoMaterial,
  obterMateriaisDisponiveis,
  type ItemPedidoMaterial,
  type MaterialDisponivel,
} from "../services/pedidoService";

function PedidoMaterial() {
  const [ongs, setOngs] = useState<any[]>([]);
  const [familiares, setFamiliares] = useState<FamiliarRetorno[]>([]);
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState<MaterialDisponivel[]>([]);
  const [ongId, setOngId] = useState("");
  const [familiarId, setFamiliarId] = useState("");
  const [itens, setItens] = useState<ItemPedidoMaterial[]>([
    { tipo_material: "", quantidade: 1 },
  ]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregandoMateriais, setCarregandoMateriais] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [ongsResposta, familiaresResposta] = await Promise.all([
          obterTodasONGs(),
          obterFamiliares(),
        ]);

        setOngs(ongsResposta);
        setFamiliares(familiaresResposta.filter((item) => item.beneficiario));
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os dados iniciais. Tente novamente mais tarde.");
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!ongId) {
      setMateriaisDisponiveis([]);
      setItens([{ tipo_material: "", quantidade: 1 }]);
      return;
    }

    async function carregarMateriais() {
      setCarregandoMateriais(true);
      setErro(null);

      try {
        const materiais = await obterMateriaisDisponiveis(Number(ongId));
        setMateriaisDisponiveis(materiais);

        if (materiais.length > 0) {
          setItens((prevItens) =>
            prevItens.map((item) => {
              if (item.tipo_material && materiais.some((m) => m.tipo_material === item.tipo_material)) {
                return item;
              }
              return {
                tipo_material: materiais[0].tipo_material,
                quantidade: 1,
              };
            })
          );
        } else {
          setItens([{ tipo_material: "", quantidade: 1 }]);
        }
      } catch (error) {
        console.error(error);
        setMateriaisDisponiveis([]);
        setErro("Não foi possível buscar os materiais disponíveis. Verifique a ONG selecionada e tente novamente.");
      } finally {
        setCarregandoMateriais(false);
      }
    }

    carregarMateriais();
  }, [ongId]);

  function obterQuantidadeDisponivel(tipo_material: string) {
    return (
      materiaisDisponiveis.find((item) => item.tipo_material === tipo_material)
        ?.quantidade_disponivel ?? 0
    );
  }

  function atualizarItem(index: number, item: Partial<ItemPedidoMaterial>) {
    setItens((prevItens) =>
      prevItens.map((valor, indice) =>
        indice === index ? { ...valor, ...item } : valor
      )
    );
  }

  function adicionarItem() {
    const primeiroTipo = materiaisDisponiveis[0]?.tipo_material || "";

    setItens((prevItens) => [
      ...prevItens,
      { tipo_material: primeiroTipo, quantidade: 1 },
    ]);
  }

  function resetarFormulario() {
    setOngId("");
    setFamiliarId("");
    setMateriaisDisponiveis([]);
    setItens([{ tipo_material: "", quantidade: 1 }]);
  }

  function removerItem(index: number) {
    setItens((prevItens) => prevItens.filter((_, indice) => indice !== index));
  }

  function validarPedido() {
    const ongSelecionada = Number(ongId);
    const familiarSelecionado = Number(familiarId);

    if (!Number.isInteger(ongSelecionada) || ongSelecionada <= 0) {
      setErro("Selecione uma ONG válida para atender o pedido.");
      return false;
    }

    if (!Number.isInteger(familiarSelecionado) || familiarSelecionado <= 0) {
      setErro("Selecione um familiar beneficiário válido.");
      return false;
    }

    if (itens.length === 0) {
      setErro("Adicione ao menos um item ao pedido.");
      return false;
    }

    const totalQuantidade = itens.reduce((acc, item) => acc + item.quantidade, 0);
    if (totalQuantidade > 20) {
      setErro("O pedido não pode ultrapassar 20 unidades no total.");
      return false;
    }

    for (const item of itens) {
      if (!item.tipo_material) {
        setErro("Selecione o tipo de material em todos os itens.");
        return false;
      }

      if (item.quantidade < 1) {
        setErro("Informe uma quantidade válida para todos os itens.");
        return false;
      }

      const disponivel = obterQuantidadeDisponivel(item.tipo_material);
      if (item.quantidade > disponivel) {
        setErro(`A quantidade solicitada para ${item.tipo_material} não pode ser maior do que ${disponivel}.`);
        return false;
      }
    }

    setErro(null);
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSucesso(null);
    setErro(null);

    if (!validarPedido()) {
      return;
    }

    const ongSelecionada = Number(ongId);
    const familiarSelecionado = Number(familiarId);

    if (!Number.isInteger(ongSelecionada) || ongSelecionada <= 0) {
      setErro("Selecione uma ONG válida para atender o pedido.");
      return;
    }

    if (!Number.isInteger(familiarSelecionado) || familiarSelecionado <= 0) {
      setErro("Selecione um familiar beneficiário válido.");
      return;
    }

    setSubmetendo(true);

    try {
      await criarPedidoMaterial({
        ong_id: ongSelecionada,
        familiar_id: familiarSelecionado,
        itens,
      });

      setSucesso("Pedido de materiais enviado com sucesso.");
      resetarFormulario();
    } catch (error: any) {
      console.error(error);
      setErro(
        error?.response?.data?.detail ||
          error?.message ||
          "Não foi possível enviar o pedido. Tente novamente mais tarde."
      );
    } finally {
      setSubmetendo(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      <Header />

      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
            <h1 className="header-medio text-center">Canetas que Mudam o Mundo</h1>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">
              <h2 className="header-pequeno text-center mb-6">Pedido de materiais</h2>

              <p className="body-pequeno text-[var(--base-70)] text-center mb-6">
                Solicite materiais disponíveis para um beneficiário cadastrado. O pedido será enviado à ONG selecionada para aprovação.
              </p>

              {erro ? (
                <div className="rounded-xl border border-[var(--cor-resposta-errada)] bg-[var(--cor-resposta-errada-fundo)] p-4 mb-6 text-[var(--cor-resposta-errada)]" role="alert" aria-live="assertive">
                  {erro}
                </div>
              ) : null}

              {sucesso ? (
                <div className="rounded-xl border border-[var(--cor-resposta-correta)] bg-[var(--cor-resposta-correta-fundo)] p-4 mb-6 text-[var(--cor-resposta-correta)]" role="status" aria-live="polite">
                  {sucesso}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 body-semibold-pequeno">
                    ONG atendente
                    <select
                      className="input-padrao w-full"
                      value={ongId}
                      onChange={(event) => {
                        setErro(null);
                        setSucesso(null);
                        setOngId(event.target.value);
                      }}
                      required
                    >
                      <option value="">{ongs.length > 0 ? "Selecione uma ONG" : "Nenhuma ONG disponível"}</option>
                      {ongs.map((ongItem) => (
                        <option key={ongItem.id} value={ongItem.id}>
                          {ongItem.nome}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 body-semibold-pequeno">
                    Beneficiário
                    <select
                      className="input-padrao w-full"
                      value={familiarId}
                      onChange={(event) => {
                        setErro(null);
                        setSucesso(null);
                        setFamiliarId(event.target.value);
                      }}
                      required
                      disabled={familiares.length === 0}
                    >
                      <option value="">
                        {familiares.length > 0 ? "Selecione um beneficiário" : "Nenhum beneficiário disponível"}
                      </option>
                      {familiares.map((familiar) => (
                        <option key={familiar.id} value={familiar.id}>
                          {familiar.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rounded-3xl border border-[var(--base-70)] bg-white p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <p className="body-semibold-pequeno">Itens solicitados</p>
                      <p className="body-muito-pequeno text-[var(--base-70)]">
                        Escolha o material e informe a quantidade desejada.
                      </p>
                    </div>

                                    <Botao
                      tipo="button"
                      aoClicar={adicionarItem}
                      desabilitado={carregandoMateriais || materiaisDisponiveis.length === 0}
                      variante="padrao"
                      className="max-w-[220px]"
                    >
                      Adicionar item
                    </Botao>
                  </div>

                  {carregandoMateriais ? (
                    <p className="body-pequeno text-[var(--base-70)]">Buscando materiais disponíveis...</p>
                  ) : materiaisDisponiveis.length === 0 ? (
                    <p className="body-pequeno text-[var(--base-70)]">
                      Selecione uma ONG para ver os materiais disponíveis.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {itens.map((item, index) => (
                        <div
                          key={`${item.tipo_material}-${index}`}
                          className="grid gap-4 sm:grid-cols-[1.6fr_1fr_auto] items-end"
                        >
                          <label className="flex flex-col gap-2 body-semibold-pequeno">
                            Material
                            <select
                              className="input-padrao w-full"
                              value={item.tipo_material}
                              onChange={(event) =>
                                atualizarItem(index, {
                                  tipo_material: event.target.value,
                                })
                              }
                              required
                            >
                              {materiaisDisponiveis.map((material) => (
                                <option key={material.tipo_material} value={material.tipo_material}>
                                  {material.tipo_material}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="flex flex-col gap-2 body-semibold-pequeno">
                            Quantidade
                            <input
                              type="number"
                              min={1}
                              max={obterQuantidadeDisponivel(item.tipo_material)}
                              value={item.quantidade}
                              onChange={(event) =>
                                atualizarItem(index, {
                                  quantidade: Number(event.target.value) || 0,
                                })
                              }
                              className="input-padrao w-full"
                              required
                            />
                            <span className="body-muito-pequeno text-[var(--base-70)]">
                              Disponíveis: {obterQuantidadeDisponivel(item.tipo_material)}
                            </span>
                          </label>

                          <div className="flex gap-2">
                            <Botao
                              tipo="button"
                              variante="cancelar"
                              aoClicar={() => removerItem(index)}
                              desabilitado={itens.length === 1}
                              className="w-full sm:w-auto"
                            >
                              Remover
                            </Botao>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--base-70)] bg-[var(--base-10)] p-4 body-muito-pequeno text-[var(--base-70)]">
                  <p className="body-semibold-pequeno mb-2">Resumo do pedido</p>
                  <p>
                    Total de unidades solicitadas: <strong>{itens.reduce((total, item) => total + item.quantidade, 0)}</strong>
                  </p>
                  <p>
                    Materiais diferentes selecionados: <strong>{itens.length}</strong>
                  </p>
                  <p className="mt-2 text-[var(--base-60)]">
                    O sistema aceita até 20 unidades por pedido. Se você precisa de mais materiais, entre em contato com a ONG.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                  <Botao tipo="submit" variante="confirmar" desabilitado={submetendo || carregandoMateriais}>
                    {submetendo ? "Enviando pedido..." : "Enviar pedido"}
                  </Botao>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PedidoMaterial;
