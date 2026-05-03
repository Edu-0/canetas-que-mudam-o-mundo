import { useState, useEffect, useRef } from "react";
import { IMaskInput } from "react-imask";
import Botao from "./Botao";
import { validarCampo } from "../utils/validacoesONG";
import { normalizarUrl } from "../utils/validacoes";
import { useUsuario } from "../context/UserContext";
import { useONG } from "../context/OngContext";

type PropsCadastro = {
  modo: "cadastro";
  aoEnviar: (dados: any) => void;

  valoresIniciais?: {
    id: number;
    nome: string;
    cnpj: string;
    cep?: string;
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    numero?: string;
    complemento?: string;
    telefone: string;
    email: string;
    diasFuncionamento: number[];
    horarioInicio: string;
    horarioFim: string;
    sobre: string;
    instagram?: string;
    facebook?: string;
    site?: string;
  };

  textoBotaoEnviar?: string;
  textoBotaoCancelar?: string;
  mostrarCancelar?: boolean;
  aoCancelar?: () => void;
  mudouDados?: (dados: any) => void;
  aoErro?: (erro: { campo?: string; mensagem: string }) => void;
};

type PropsEdicao = {
  modo: "edicao";
  aoEnviar: (dados: any) => void;

  valoresIniciais?: {
    id: number;
    nome: string;
    cnpj: string;
    cep?: string;
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    numero?: string;
    complemento?: string;
    telefone: string;
    email: string;
    diasFuncionamento: number[];
    horarioInicio: string;
    horarioFim: string;
    sobre: string;
    instagram?: string;
    facebook?: string;
    site?: string;
  };

  textoBotaoEnviar?: string;
  textoBotaoCancelar?: string;
  mostrarCancelar?: boolean;
  aoCancelar?: () => void;
  mudouDados?: (dados: any) => void;
  aoErro?: (erro: { campo?: string; mensagem: string }) => void;
};

type Props = PropsCadastro | PropsEdicao;

function FormCadastroONG(props: Props) {

  const {
    modo,
    valoresIniciais,
    aoEnviar,
    aoErro,
    aoCancelar,
    mostrarCancelar = false,
    mudouDados,
    textoBotaoEnviar = "Cadastrar ONG",
  } = props;

  const primeiraRenderizacao = useRef(true);
  const [carregando, setCarregando] = useState(false);
  const { usuario, definirUsuario } = useUsuario();
  const { ong, definirONG } = useONG();

  const [alterou, setAlterou] = useState(false);

  // estado dos campos do formulário
  const [nome, setNome] = useState(valoresIniciais?.nome || "");
  const [cnpj, setCnpj] = useState(valoresIniciais?.cnpj || "");
  const [cep, setCep] = useState(valoresIniciais?.cep || "");
  const [telefone, setTelefone] = useState(valoresIniciais?.telefone || "");
  const [email, setEmail] = useState(valoresIniciais?.email || "");

  const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>(valoresIniciais?.diasFuncionamento || []);
  const [horarioInicio, setHorarioInicio] = useState(valoresIniciais?.horarioInicio || "");
  const [horarioFim, setHorarioFim] = useState(valoresIniciais?.horarioFim || "");
  const [sobre, setSobre] = useState(valoresIniciais?.sobre || "");

  const [instagram, setInstagram] = useState(valoresIniciais?.instagram || "");
  const [facebook, setFacebook] = useState(valoresIniciais?.facebook || "");
  const [site, setSite] = useState(valoresIniciais?.site || "");

  const [rua, setRua] = useState(valoresIniciais?.rua || "");
  const [bairro, setBairro] = useState(valoresIniciais?.bairro || "");
  const [cidade, setCidade] = useState(valoresIniciais?.cidade || "");
  const [estado, setEstado] = useState(valoresIniciais?.estado || "");
  const [numero, setNumero] = useState(valoresIniciais?.numero || "");
  const [complemento, setComplemento] = useState(valoresIniciais?.complemento || "");

  const diasSemana = [
    { label: "Domingo", value: 0 },
    { label: "Segunda", value: 1 },
    { label: "Terça", value: 2 },
    { label: "Quarta", value: 3 },
    { label: "Quinta", value: 4 },
    { label: "Sexta", value: 5 },
    { label: "Sábado", value: 6 },
  ];

  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);

  const [erros, setErros] = useState({
    nome: "",
    cnpj: "",
    cep: "",
    rua: "",
    bairro: "",
    cidade: "",
    estado: "",
    numero: "",
    complemento: "",
    telefone: "",
    email: "",
    diasFuncionamento: "",
    horarioInicio: "",
    horarioFim: "",
    sobre: "",
    instagram: "",
    facebook: "",
    site: "",
  });
  
  const [tocados, setTocados] = useState({
    nome: false,
    cnpj: false,
    cep: false,
    rua: false,
    bairro: false,
    cidade: false,
    estado: false,
    numero: false,
    complemento: false,
    telefone: false,
    email: false,
    diasFuncionamento: false,
    horarioInicio: false,
    horarioFim: false,
    sobre: false,
    instagram: false,
    facebook: false,
    site: false,
  });

  const dados = {
    nome,
    cnpj,
    cep,
    rua,
    bairro,
    cidade,
    estado,
    numero,
    complemento,
    telefone,
    email,
    diasFuncionamento,
    horarioInicio,
    horarioFim,
    sobre,
    instagram,
    facebook,
    site,
  };

  const valoresIniciaisRef = useRef(JSON.stringify({
    nome: valoresIniciais?.nome || "",
    cnpj: valoresIniciais?.cnpj || "",
    cep: valoresIniciais?.cep || "",
    rua: valoresIniciais?.rua || "",
    bairro: valoresIniciais?.bairro || "",
    cidade: valoresIniciais?.cidade || "",
    estado: valoresIniciais?.estado || "",
    numero: valoresIniciais?.numero || "",
    complemento: valoresIniciais?.complemento || "",
    telefone: valoresIniciais?.telefone || "",
    email: valoresIniciais?.email || "",
    diasFuncionamento: valoresIniciais?.diasFuncionamento || [],
    horarioInicio: valoresIniciais?.horarioInicio || "",
    horarioFim: valoresIniciais?.horarioFim || "",
    sobre: valoresIniciais?.sobre || "",
    instagram: valoresIniciais?.instagram || "",
    facebook: valoresIniciais?.facebook || "",
    site: valoresIniciais?.site || "",
  }));

  useEffect(() => {
    async function carregarCidades() {
      if (!estado) {
        setCidadesDisponiveis([]);
        return;
      }

      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`
        );
        const data = await res.json();

        if (!Array.isArray(data)) return; // garantia de que data é um array antes de mapear

        const nomes = data.map((c: any) => c.nome);
        setCidadesDisponiveis(nomes);
      } catch (error) {
        console.error("Erro ao buscar cidades", error);
      } 
    }

    carregarCidades();
  }, [estado]);

  useEffect(() => {
      if (primeiraRenderizacao.current) {
        primeiraRenderizacao.current = false;
        return;
      }
  
      mudouDados?.({
        nome,
        cnpj,
        cep,
        rua,
        bairro,
        cidade,
        estado,
        numero,
        complemento,
        telefone,
        email,
        diasFuncionamento,
        horarioInicio,
        horarioFim,
        sobre,
        instagram,
        facebook,
        site,
      });
    }, [nome, cnpj, cep, rua, bairro, cidade, estado, numero, complemento, telefone, email, diasFuncionamento, horarioInicio, horarioFim, sobre, instagram, facebook, site]);

    function validarUmCampo(campo: keyof typeof erros) {
      const mensagem = validarCampo(campo, dados);
      
      setErros((prev) => ({
        ...prev,
        [campo]: mensagem,
      }));
    }
  
  function marcarComoTocado(campo: keyof typeof tocados) {
    setTocados((prev) => ({ ...prev, [campo]: true }));
  }

  function toggleDia(valor: number) {
    marcarComoTocado("diasFuncionamento");

    setDiasFuncionamento((prev) => {
      const novosDias = prev.includes(valor)
        ? prev.filter((d) => d !== valor)
        : [...prev, valor];

      // valida o novo valor
      const mensagem = validarCampo("diasFuncionamento", {
        ...dados,
        diasFuncionamento: novosDias,
      });

      setErros((prevErros) => ({
        ...prevErros,
        diasFuncionamento: mensagem,
      }));

      return novosDias;
    });
  }

  async function buscarCep(valor: string) {
    const cepLimpo = valor.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        setErros((prev) => ({
          ...prev,
          cep: "CEP não encontrado",
        }));

        return;
      }

      if (!data.erro) {
        const novosDados = {
          ...dados,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        };

        setRua(novosDados.rua);
        setBairro(novosDados.bairro);
        setCidade(novosDados.cidade);
        setEstado(novosDados.estado);

        // marca como tocado
        setTocados((prev) => ({
          ...prev,
          rua: true,
          bairro: true,
          cidade: true,
          estado: true,
        }));

        // valida os campos atualizados
        setErros((prev) => ({
          ...prev,
          rua: validarCampo("rua", novosDados),
          bairro: validarCampo("bairro", novosDados),
          cidade: validarCampo("cidade", novosDados),
          estado: validarCampo("estado", novosDados),
        }));
      }
    } catch {
      console.error("Erro ao buscar CEP");
    }
  }

  function atualizarCampo(campo: Campo, valor: any) {
    const novoDados = { ...dados, [campo]: valor };

    switch (campo) {
      case "nome": setNome(valor); break;
      case "cnpj": setCnpj(valor); break;
      case "cep": setCep(valor); break;
      case "telefone": setTelefone(valor); break;
      case "email": setEmail(valor); break;
      case "rua": setRua(valor); break;
      case "bairro": setBairro(valor); break;
      case "cidade": setCidade(valor); break;
      case "estado": setEstado(valor); break;
      case "numero": setNumero(valor); break;
      case "complemento": setComplemento(valor); break;
      case "horarioInicio": setHorarioInicio(valor); break;
      case "horarioFim": setHorarioFim(valor); break;
      case "sobre": setSobre(valor); break;
      case "instagram": setInstagram(valor); break;
      case "facebook": setFacebook(valor); break;
      case "site": setSite(valor); break;
    }

    if (tocados[campo]) {
      const mensagem = validarCampo(campo, novoDados);
      setErros((prev) => ({ ...prev, [campo]: mensagem }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) return;

    const novosErros = {
      nome: validarCampo("nome", dados),
      cnpj: validarCampo("cnpj", dados),
      cep: validarCampo("cep", dados),
      rua: validarCampo("rua", dados),
      bairro: validarCampo("bairro", dados),
      cidade: validarCampo("cidade", dados),
      estado: validarCampo("estado", dados),
      numero: validarCampo("numero", dados),
      complemento: validarCampo("complemento", dados),
      telefone: validarCampo("telefone", dados),
      email: validarCampo("email", dados),
      diasFuncionamento: validarCampo("diasFuncionamento", dados),
      horarioInicio: validarCampo("horarioInicio", dados),
      horarioFim: validarCampo("horarioFim", dados),
      sobre: validarCampo("sobre", dados),
      instagram: validarCampo("instagram", dados),
      facebook: validarCampo("facebook", dados),
      site: validarCampo("site", dados),
    };

    setErros(novosErros);

    if (Object.values(novosErros).some((erro) => erro !== "")) {
      setTocados({
        nome: true,
        cnpj: true,
        cep: true,
        rua: true,
        bairro: true,
        cidade: true,
        estado: true,
        numero: true,
        complemento: true,
        telefone: true,
        email: true,
        diasFuncionamento: true,
        horarioInicio: true,
        horarioFim: true,
        sobre: true,
        instagram: true,
        facebook: true,
        site: true,
      });
      return;
    }

    setCarregando(true);

    try {
      const dadosFormatados = {
        nome,
        cnpj: cnpj.replace(/\D/g, ""),
        cep: cep ? cep.replace(/\D/g, "") : undefined,
        rua,
        bairro,
        cidade,
        estado,
        numero,
        complemento,
        telefone: telefone.replace(/\D/g, ""),
        email,
        diasFuncionamento,
        horarioInicio,
        horarioFim,
        sobre,
        instagram,
        facebook,
        site,
      };

      if (modo === "cadastro") {
        await aoEnviar(dadosFormatados);

      } else if (modo === "edicao") {
        const propsEdicao = { aoEnviar } as PropsEdicao;

        if (!valoresIniciais?.id) {
          throw new Error("ID da ONG não encontrado para atualização");
        }

        await aoEnviar({
          id: valoresIniciais.id,
          ...dadosFormatados,
        });

      }

    } catch (error: any) {
      console.error(error);

      const erroBackend = error.response?.data?.detail;

      if (erroBackend) {
        aoErro?.(erroBackend);

        if (erroBackend.campo) {
          setErros((prev) => ({
            ...prev,
            [erroBackend.campo]: erroBackend.mensagem,
          }));

          setTocados((prev) => ({
            ...prev,
            [erroBackend.campo]: true,
          }));
        }

      } else {
        const mensagemPadrao =
          modo === "cadastro"
            ? "Erro ao cadastrar ONG. Tente novamente."
            : "Erro ao atualizar ONG. Tente novamente.";

        aoErro?.({ mensagem: mensagemPadrao });
      }

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (modo !== "edicao") return;

    const atual = JSON.stringify(dados);

    setAlterou(atual !== valoresIniciaisRef.current);
  }, [dados, modo]);

  type Campo = keyof typeof erros; // para garantir que usamos os campos definidos em erros

  function inputClass(campo: Campo, valor?: string) {
    return `input-padrao ${
      tocados[campo]
        ? erros[campo]
          ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
          : valor
            ? "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]"
            : ""
        : ""
    }`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;

          if (!target.id || !(target.id in erros)) return;

          e.preventDefault();


          const campo = target.id as keyof typeof erros;


          marcarComoTocado(campo);

          const valor = (target as HTMLInputElement | HTMLTextAreaElement).value?.trim();

          atualizarCampo(campo, valor); // atualiza o estado com o valor mais recente

          if (target.id === "cep") {
            buscarCep(valor);
          }

          if (["site", "instagram", "facebook"].includes(target.id) && valor) {
            const urlNormalizada = normalizarUrl(valor);

            if (target.id === "site") setSite(urlNormalizada);
            if (target.id === "instagram") setInstagram(urlNormalizada);
            if (target.id === "facebook") setFacebook(urlNormalizada);
          }

          const mensagem = validarCampo(campo, { ...dados, [campo]: valor });

          setErros((prev) => ({
            ...prev,
            [campo]: mensagem,
          }));
        }
      }}
    >

      {/* Nome */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="nome">Nome da ONG <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="nome" type="text" maxLength={100} required className={inputClass("nome", nome)} autoComplete="name" placeholder="Digite aqui o nome da ONG" value={nome} onChange={(e) => atualizarCampo("nome", e.target.value)} aria-invalid={!!erros.nome} aria-describedby={erros.nome ? "erro-nome" : undefined} onBlur={() => {marcarComoTocado("nome"); validarUmCampo("nome");}}/>

        {erros.nome && tocados.nome && <p id="erro-nome" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.nome}</p>}
      </div>

      {/* CNPJ */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="cnpj">CNPJ <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>

        <IMaskInput mask="00.000.000/0000-00" id="cnpj" type="text" required className={inputClass("cnpj", cnpj)} 
        autoComplete="off" placeholder="Digite aqui o CNPJ da ONG 00.000.000/0000-00" value={cnpj} onAccept={(value) => atualizarCampo("cnpj", value)} onBlur={() => {marcarComoTocado("cnpj"), validarUmCampo("cnpj");}} aria-invalid={!!erros.cnpj} aria-describedby={erros.cnpj ? "erro-cnpj" : undefined}/>

        {erros.cnpj && tocados.cnpj && <p id="erro-cnpj" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.cnpj}</p>}
      </div>

      {/* linha separadora */}
      <div className="border-t border-[var(--base-40)] my-2" />

      <h2 className="body-semibold-medio text-center w-full my-0">
          Endereço da ONG
      </h2>

      {/* CEP */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="cep">CEP</label>

        <IMaskInput mask="00000-000" id="cep" type="text" className={inputClass("cep", cep)} 
        autoComplete="postal-code" placeholder="Digite aqui o CEP da ONG 00000-000" value={cep} onAccept={(value) => atualizarCampo("cep", value)} onBlur={() => {marcarComoTocado("cep"), validarUmCampo("cep"); buscarCep(cep);}} aria-invalid={!!erros.cep} aria-describedby={erros.cep ? "erro-cep" : undefined}/>

        {erros.cep && tocados.cep && <p id="erro-cep" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.cep}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="body-semibold-pequeno" htmlFor="estado">Estado <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>

          <select id="estado" autoComplete="address-level1" className={inputClass("estado", estado)} value={estado} onChange={(e) => {atualizarCampo("estado", e.target.value); setCidade(""); if (tocados.estado) validarUmCampo("estado"); }} onBlur={() => { marcarComoTocado("estado"); validarUmCampo("estado"); }}>
            <option value="">Selecione o estado</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </select>
          
          {erros.estado && tocados.estado && (<p id="erro-estado" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.estado}</p>)}
        </div>

        <div>
          <label className="body-semibold-pequeno" htmlFor="cidade">Cidade <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>

          <select id="cidade" autoComplete="address-level2" className={inputClass("cidade", cidade)} value={cidade} onChange={(e) => {atualizarCampo("cidade", e.target.value); if (tocados.cidade) validarUmCampo("cidade"); }} onBlur={() => { marcarComoTocado("cidade"); validarUmCampo("cidade");}} disabled={!estado}>
            <option value="">
              {estado ? "Selecione a cidade" : "Selecione um estado primeiro"}
            </option>

            {cidadesDisponiveis.map((cidadeNome) => (
              <option key={cidadeNome} value={cidadeNome}>
                {cidadeNome}
              </option>
            ))}
          </select>
          
          {erros.cidade && tocados.cidade && (<p id="erro-cidade" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.cidade}</p>)}
        </div>

        <div>
          <label className="body-semibold-pequeno" htmlFor="bairro">Bairro <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>

          <input id="bairro" type="text" maxLength={100} required className={inputClass("bairro", bairro)} autoComplete="street-address" placeholder="Digite aqui o nome do bairro onde está a ONG" value={bairro} onChange={(e) => atualizarCampo("bairro", e.target.value)} aria-invalid={!!erros.bairro} aria-describedby={erros.bairro ? "erro-bairro" : undefined} onBlur={() => {marcarComoTocado("bairro"), validarUmCampo("bairro");}}/>

          {erros.bairro && tocados.bairro && (<p id="erro-bairro" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.bairro}</p>)}
        </div>

        <div>
          <label className="body-semibold-pequeno" htmlFor="rua">Rua <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>

          <input id="rua" type="text" maxLength={100} required className={inputClass("rua", rua)} autoComplete="street-address" placeholder="Digite aqui o nome da rua onde está a ONG" value={rua} onChange={(e) => {atualizarCampo("rua", e.target.value); if (tocados.rua) validarUmCampo("rua"); }} aria-invalid={!!erros.rua} aria-describedby={erros.rua ? "erro-rua" : undefined} onBlur={() => {marcarComoTocado("rua"), validarUmCampo("rua");}}/>

          {erros.rua && tocados.rua && (<p id="erro-rua" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.rua}</p>)}
        </div>

        <div>
          <label className="body-semibold-pequeno" htmlFor="numero">Número </label>

          <input id="numero" type="text" maxLength={10} className={inputClass("numero", numero)} autoComplete="street-address" placeholder="Digite aqui o número do endereço onde está a ONG" value={numero} onChange={(e) => atualizarCampo("numero", e.target.value)} aria-invalid={!!erros.numero} aria-describedby={erros.numero ? "erro-numero" : undefined} onBlur={() => {marcarComoTocado("numero"), validarUmCampo("numero");}}/>

          {erros.numero && tocados.numero && (<p id="erro-numero" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.numero}</p>)}
        </div>

        <div>
          <label className="body-semibold-pequeno" htmlFor="complemento">Complemento</label>
          
          <textarea id="complemento" maxLength={100} className={inputClass("complemento", complemento)} autoComplete="off" placeholder="Digite aqui o complemento do endereço onde está a ONG" value={complemento} onChange={(e) => atualizarCampo("complemento", e.target.value)} aria-invalid={!!erros.complemento} aria-describedby={erros.complemento ? "erro-complemento" : undefined} onBlur={() => {marcarComoTocado("complemento"), validarUmCampo("complemento");}}/>
                
          {erros.complemento && tocados.complemento && (<p id="erro-complemento" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.complemento}</p>)}
        </div>
      </div>

      {/* linha separadora */}
      <div className="border-t border-[var(--base-40)] my-2" />

      <h2 className="body-semibold-medio text-center w-full my-0">
          Informações de contato da ONG
      </h2>

      {/* Telefone */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="telefone">Telefone <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="(00) 00000-0000" id="telefone" type="tel" className={inputClass("telefone", telefone)} 
        autoComplete="tel" placeholder="Digite aqui o telefone da ONG (00) 00000-0000" value={telefone} onAccept={(value) => atualizarCampo("telefone", value)} onBlur={() => {marcarComoTocado("telefone"), validarUmCampo("telefone");}} aria-invalid={!!erros.telefone} aria-describedby={erros.telefone ? "erro-telefone" : undefined} />

        {erros.telefone && tocados.telefone && <p id="erro-telefone" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.telefone}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="email">Email <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="email" type="email" maxLength={254} required className={inputClass("email", email)} 
        autoComplete="email" placeholder="Digite aqui o email da ONG" value={email} onChange={(e) => atualizarCampo("email", e.target.value)} aria-invalid={!!erros.email} aria-describedby={erros.email ? "erro-email" : undefined} onBlur={() => {marcarComoTocado("email"), validarUmCampo("email");}}/> 
      
        {erros.email && tocados.email && <p id="erro-email" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.email}</p>}
      </div>

      {/* linha separadora */}
      <div className="border-t border-[var(--base-40)] my-2" />

      <h2 className="body-semibold-medio text-center w-full my-0">
          Informações sobre o funcionamento da ONG
      </h2>

      {/* Dias */}
      <div>
        <p className="body-semibold-pequeno" id="diasFuncionamento">Dias de funcionamento <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></p>
        <div role="group" aria-labelledby="diasFuncionamento">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 w-full">
            {diasSemana.map((dia) => (
              <button
                type="button"
                key={dia.value}
                onClick={() => toggleDia(dia.value)}
                className={`w-full px-3 py-2 rounded border border-black focus-acessivel ${
                  diasFuncionamento.includes(dia.value)
                    ? "bg-[var(--base-40)] hover:bg-[var(--base-50)]"
                    : "bg-white hover:bg-[var(--base-20)]"
                }`}
                aria-pressed={diasFuncionamento.includes(dia.value)}
              >
                {dia.label}
              </button>
            ))}
          </div>
        </div>
        
        {erros.diasFuncionamento && tocados.diasFuncionamento && <p id="erro-diasFuncionamento" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.diasFuncionamento}</p>}
      </div>

      {/* Horário */}
      <div>
        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <label className="body-semibold-pequeno" htmlFor="horarioInicio">Horário de abertura <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
            <input id="horarioInicio" type="time" required className={inputClass("horarioInicio", horarioInicio)} autoComplete="off" value={horarioInicio} onChange={(e) => atualizarCampo("horarioInicio", e.target.value)} aria-invalid={!!erros.horarioInicio} aria-describedby={erros.horarioInicio ? "erro-horarioInicio" : undefined} onBlur={() => {marcarComoTocado("horarioInicio"), validarUmCampo("horarioInicio");}}/>
          </div>

          <span className="body-semibold-pequeno flex items-end">até</span>
          {/* <span className="body-semibold-pequeno flex items-center justify-center px-1">até</span> */}
          
          <div className="flex flex-col flex-1">
            <label className="body-semibold-pequeno" htmlFor="horarioFim">Horário de fechamento <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
            <input id="horarioFim" type="time" required className={inputClass("horarioFim", horarioFim)} autoComplete="off" value={horarioFim} onChange={(e) => atualizarCampo("horarioFim", e.target.value)} aria-invalid={!!erros.horarioFim} aria-describedby={erros.horarioFim ? "erro-horarioFim" : undefined} onBlur={() => {marcarComoTocado("horarioFim"), validarUmCampo("horarioFim");}}/>
          </div>
        </div>

        {erros.horarioInicio && tocados.horarioInicio && <p id="erro-horarioInicio" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.horarioInicio}</p>}

        {erros.horarioFim && tocados.horarioFim && <p id="erro-horarioFim" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.horarioFim}</p>}
      </div>
      

      {/* linha separadora */}
      <div className="border-t border-[var(--base-40)] my-2" />

      <h2 className="body-semibold-medio text-center w-full my-0">
          Texto informativo sobre a ONG
      </h2>

      {/* Sobre */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="sobre">Sobre <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>

        <textarea id="sobre" maxLength={500} required className={inputClass("sobre", sobre)} 
        autoComplete="off" placeholder="Digite aqui informações sobre a ONG..." value={sobre} onChange={(e) => atualizarCampo("sobre", e.target.value)} aria-invalid={!!erros.sobre} aria-describedby={erros.sobre ? "erro-sobre" : undefined} onBlur={() => {marcarComoTocado("sobre"), validarUmCampo("sobre");}}/>
      
        {erros.sobre && tocados.sobre && <p id="erro-sobre" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.sobre}</p>}
      </div>

      {/* linha separadora */}
      <div className="border-t border-[var(--base-40)] my-2" />

      <h2 className="body-semibold-medio text-center w-full my-0">
          Redes sociais e site da ONG
      </h2>

      {/* Redes */}
      <div>
        <label className="body-semibold-pequeno" htmlFor="instagram">Instagram</label>
        <input id="instagram" maxLength={100} type="url" className={inputClass("instagram", instagram)} value={instagram} onChange={(e) => atualizarCampo("instagram", e.target.value)} aria-invalid={!!erros.instagram} aria-describedby={erros.instagram ? "erro-instagram" : undefined} placeholder="https://instagram.com/..." onBlur={() => {marcarComoTocado("instagram"), validarUmCampo("instagram");}}/>
          
        {erros.instagram && tocados.instagram && <p id="erro-instagram" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.instagram}</p>}
      </div>

      <div>
        <label className="body-semibold-pequeno" htmlFor="facebook">Facebook</label>

        <input id="facebook" maxLength={100} type="url" className={inputClass("facebook", facebook)} value={facebook} onChange={(e) => atualizarCampo("facebook", e.target.value)} aria-invalid={!!erros.facebook} aria-describedby={erros.facebook ? "erro-facebook" : undefined} placeholder="https://facebook.com/..." onBlur={() => {marcarComoTocado("facebook"), validarUmCampo("facebook");}}/>

        {erros.facebook && tocados.facebook && <p id="erro-facebook" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.facebook}</p>}
      </div>
      <div>
        <label className="body-semibold-pequeno" htmlFor="site">Site</label>

        <input id="site" maxLength={100} type="url" className={inputClass("site", site)} value={site} onChange={(e) => atualizarCampo("site", e.target.value)} aria-invalid={!!erros.site} aria-describedby={erros.site ? "erro-site" : undefined} placeholder="https://ongsite.com/..." onBlur={() => {marcarComoTocado("site"), validarUmCampo("site");}}/>
        
        {erros.site && tocados.site && <p id="erro-site" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.site}</p>}
      </div>

      {/* Botões */}
      <div className="flex gap-4 mt-4">
        {mostrarCancelar && (
          <div className="flex-1">
            <Botao variante="cancelar" aoClicar={aoCancelar}>
              Cancelar
            </Botao>
          </div>
        )}

        <div className="flex-1">
          <Botao tipo="submit" variante="confirmar" desabilitado={carregando || (modo === "edicao" && !alterou)}>
            {carregando ? "Salvando..." : textoBotaoEnviar || "Salvar alterações"}
          </Botao>
        </div>
      </div>

    </form>
  );
}

export default FormCadastroONG;