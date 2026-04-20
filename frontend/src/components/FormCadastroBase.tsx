import { IMaskInput } from "react-imask";
import { useState, useEffect, useRef } from "react";
import Botao from "./Botao";
import { validarCampo } from "../utils/validacoesFormulario";
import { verificarRequisitosSenha } from "../utils/validacoes";
import olho_visivel from "../assets/icon_olho_visivel.png";
import olho_bloqueado from "../assets/icon_olho_bloqueado.png";
import { criarUsuario, atualizarUsuario, DadosUsuario, AtualizarUsuarioEnvio, solicitarRedefinicaoSenha } from "../services/usuarioService";

type PropsCadastro = {
  modo: "cadastro";
  aoEnviar: (usuario: DadosUsuario) => void;

  valoresIniciais?: {
    id: number;
    nome_completo?: string;
    data_nascimento?: string;
    cpf?: string;
    cep?: string;
    telefone?: string;
    email?: string;
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
  aoEnviar: (usuario: DadosUsuario) => void;
  aoMensagemSucessoSenha?: (mensagem: string) => void;

  valoresIniciais?: {
    id: number;
    nome_completo?: string;
    data_nascimento?: string;
    cpf?: string;
    cep?: string;
    telefone?: string;
    email?: string;
  };

  textoBotaoEnviar?: string;
  textoBotaoCancelar?: string;
  mostrarCancelar?: boolean;
  aoCancelar?: () => void;
  mudouDados?: (dados: any) => void;
  aoErro?: (erro: { campo?: string; mensagem: string }) => void;
};

type Props = PropsCadastro | PropsEdicao;

function FormCadastroBase(props: Props) {
  const {
    aoEnviar,
    valoresIniciais,
    modo,
    textoBotaoEnviar = "Cadastrar",
    textoBotaoCancelar = "Cancelar",
    mostrarCancelar = false,
    aoCancelar,
    mudouDados,
    aoErro,
  } = props;

  const [nome_completo, setNomeCompleto] = useState(valoresIniciais?.nome_completo || "");
  const [data_nascimento, setDataNascimento] = useState(valoresIniciais?.data_nascimento || "");
  const [cpf, setCpf] = useState(valoresIniciais?.cpf || "");
  const [cep, setCep] = useState(valoresIniciais?.cep || "");
  const [telefone, setTelefone] = useState(valoresIniciais?.telefone || "");
  const [email, setEmail] = useState(valoresIniciais?.email || "");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const deveMostrarSenha = modo === "cadastro";

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // const [setEmailConfirmado] para ver sobre a confirmacao do email no futuro

  const requisitosSenha = verificarRequisitosSenha(senha);
  const primeiraRenderizacao = useRef(true);

  const [erros, setErros] = useState({
    nome_completo: "",
    data_nascimento: "",
    cpf: "",
    cep: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [tocados, setTocados] = useState({
    nome_completo: false,
    data_nascimento: false,
    cpf: false,
    cep: false,
    telefone: false,
    email: false,
    senha: false,
    confirmarSenha: false,
  });

  const [carregando, setCarregando] = useState(false);

  const dados = {
    nome_completo,
    data_nascimento,
    cpf,
    cep,
    telefone,
    email,
    senha,
    confirmarSenha,
  };

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    mudouDados?.({
      nome_completo,
      data_nascimento,
      cpf,
      cep,
      telefone,
      email,
      senha,
      confirmarSenha,
    });
  }, [nome_completo, data_nascimento, cpf, cep, telefone, email, senha, confirmarSenha]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) return; // evita múltiplos envios

    // validação de todos os campos
    const novosErros = {
      nome_completo: validarCampo("nome_completo", dados),
      data_nascimento: validarCampo("data_nascimento", dados),
      cpf: validarCampo("cpf", dados),
      cep: validarCampo("cep", dados),
      telefone: validarCampo("telefone", dados),
      email: validarCampo("email", dados),
      senha: modo === "cadastro" ? validarCampo("senha", dados) : "",
      confirmarSenha: modo === "cadastro" ? validarCampo("confirmarSenha", dados) : "",
    };

    setErros(novosErros);

    if (Object.values(novosErros).some((erro) => erro !== "")) {
      setTocados({
        nome_completo: true,
        data_nascimento: true,
        cpf: true,
        cep: true,
        telefone: true,
        email: true,
        senha: true,
        confirmarSenha: true,
      });
      return;
    }

    setCarregando(true);

    try {
      if (modo === "cadastro") {
        const propsCadastro = { aoEnviar } as PropsCadastro;

        // chama API do backend
        const usuarioCadastrado = await criarUsuario({
          nome_completo,
          data_nascimento,
          cpf: cpf.replace(/\D/g, ""),
          cep: cep.replace(/\D/g, ""),
          telefone: telefone ? telefone.replace(/\D/g, "") : undefined,
          email,
          senha,
        });

        propsCadastro.aoEnviar(usuarioCadastrado); // envia para o Cadastro.tsx

      } else if (modo === "edicao") {

        const propsEdicao = { aoEnviar } as PropsEdicao;

        const dadosAtualizados: AtualizarUsuarioEnvio = {
          nome_completo,
          data_nascimento,
          cpf: cpf.replace(/\D/g, ""),
          cep: cep.replace(/\D/g, ""),
          telefone: telefone ? telefone.replace(/\D/g, "") : undefined,
          email,
        };

        if (!valoresIniciais?.id) {
          throw new Error("ID do usuário não encontrado para atualização");
        }

        const usuarioAtualizado = await atualizarUsuario(valoresIniciais.id, dadosAtualizados); // chama API do backend para obter os dados atualizados do usuário

        propsEdicao.aoEnviar(usuarioAtualizado); // envia para o EditarConta.tsx
      }

    } catch (error: any) {
        console.error(error);

        const erroBackend = error.response?.data?.detail;

        if (erroBackend) { // se o backend retornou um erro esperado com mensagem e campo
          // mostra no modal
          aoErro?.(erroBackend);

          // marca campo (cpf/email)
          if (erroBackend.campo) {
            setErros((prev) => ({
              ...prev,
              [erroBackend.campo]: erroBackend.mensagem
            }));

            setTocados((prev) => ({
              ...prev,
              [erroBackend.campo]: true
            }));
          }

        } else {
          // erro inesperado
          const mensagemPadrao =
            modo === "cadastro"
              ? "Erro ao cadastrar usuário. Tente novamente."
              : "Erro ao atualizar usuário. Tente novamente.";

          aoErro?.({ mensagem: mensagemPadrao });
        }

    } finally {
      setCarregando(false);
    }
  }

  const hoje = new Date();
  const hojeFormatado = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0"); // data máxima para o input de data (hoje)

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" 
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;

          if (!target.id || !(target.id in erros)) return;

          e.preventDefault();
          marcarComoTocado(target.id as keyof typeof erros);
          validarUmCampo(target.id as keyof typeof erros);
        }
      }}
    >

      <div>
        <label className="body-semibold-pequeno" htmlFor="nome_completo">Nome completo <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="nome_completo" type="text" maxLength={100} required className={`input-padrao ${tocados.nome_completo && nome_completo ? erros.nome_completo ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
        autoComplete="name" placeholder="Digite aqui o seu nome completo" value={nome_completo} onChange={(e) => setNomeCompleto(e.target.value)} aria-invalid={!!erros.nome_completo} aria-describedby={erros.nome_completo ? "erro-nome" : undefined} onBlur={() => {marcarComoTocado("nome_completo"), validarUmCampo("nome_completo");}}/>
      </div>
      {erros.nome_completo && tocados.nome_completo && <p id="erro-nome" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.nome_completo}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="data_nascimento">Data de nascimento <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="data_nascimento" type="date" max={hojeFormatado} required className={`input-padrao ${tocados.data_nascimento && data_nascimento ? erros.data_nascimento ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
        autoComplete="off" value={data_nascimento} onChange={(e) => setDataNascimento(e.target.value)} aria-invalid={!!erros.data_nascimento} aria-describedby={erros.data_nascimento ? "erro-data-nascimento" : undefined} onBlur={() => {marcarComoTocado("data_nascimento"), validarUmCampo("data_nascimento");}}/>
      </div>
      {erros.data_nascimento && tocados.data_nascimento && <p id="erro-data-nascimento" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.data_nascimento}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="cpf">CPF <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="000.000.000-00" id="cpf" type="text" required className={`input-padrao ${tocados.cpf && cpf ? erros.cpf ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
        autoComplete="off" placeholder="Digite aqui o seu CPF 000.000.000-00" value={cpf} onAccept={(value) => setCpf(value)} onBlur={() => {marcarComoTocado("cpf"), validarUmCampo("cpf");}} aria-invalid={!!erros.cpf} aria-describedby={erros.cpf ? "erro-cpf" : undefined}/>
      </div>
      {erros.cpf && tocados.cpf && <p id="erro-cpf" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.cpf}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="cep">CEP <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="00000-000" id="cep" type="text" required className={`input-padrao ${tocados.cep && cep ? erros.cep ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
        autoComplete="postal-code" placeholder="Digite aqui o seu CEP 00000-000" value={cep} onAccept={(value) => setCep(value)} onBlur={() => {marcarComoTocado("cep"), validarUmCampo("cep");}} aria-invalid={!!erros.cep} aria-describedby={erros.cep ? "erro-cep" : undefined}/>
      </div>
      {erros.cep && tocados.cep && <p id="erro-cep" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.cep}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="telefone">Telefone</label>
        <IMaskInput mask="(00) 00000-0000" id="telefone" type="tel" className={`input-padrao ${tocados.telefone && telefone ? erros.telefone ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]": "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
        autoComplete="tel" placeholder="Digite aqui o seu telefone (00) 00000-0000" value={telefone} onAccept={(value) => setTelefone(value)} onBlur={() => {marcarComoTocado("telefone"), validarUmCampo("telefone");}} aria-invalid={!!erros.telefone} aria-describedby={erros.telefone ? "erro-telefone" : undefined} />
      </div>
      {erros.telefone && tocados.telefone && <p id="erro-telefone" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.telefone}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="email">Email <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="email" type="email" maxLength={254} required className={`input-padrao ${tocados.email && email ? erros.email ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]": "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
        autoComplete="email" placeholder="Digite aqui o seu email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!erros.email} aria-describedby={erros.email ? "erro-email" : undefined} onBlur={() => {marcarComoTocado("email"), validarUmCampo("email");}}/> 
      </div>
      {erros.email && tocados.email && <p id="erro-email" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.email}</p>}

      {modo === "edicao" && (
        <Botao variante="editar" tipo="button"    
          aoClicar={async () => {
            try {
              await solicitarRedefinicaoSenha(email); 

              props.aoMensagemSucessoSenha?.("Enviamos um email para redefinir sua senha."); // faca ser uma mensagem no Toast SUCESSO
            
            } catch {
              aoErro?.({mensagem: "Erro ao enviar email para redefinir a sua senha."}); // faca ser uma mensagem no Toast ERRO
            }
          }} 
        >Redefinir senha</Botao> // aoClicar={./conta}
      )}

      {deveMostrarSenha && (
        <>
          <div>
            <label className="body-semibold-pequeno" htmlFor="senha">Senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
            <div className="relative">
              <input id="senha" type={mostrarSenha ? "text" : "password"} maxLength={50} className={`input-padrao pr-10 ${tocados.senha && senha ? erros.senha ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]": "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
              autoComplete="new-password" placeholder="Digite aqui a sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={!!erros.senha} aria-describedby={erros.senha ? "erro-senha" : undefined} onBlur={() => {marcarComoTocado("senha"), validarUmCampo("senha");}}/>

              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 focus-acessivel" aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}>
                <img src={mostrarSenha ? olho_visivel : olho_bloqueado} alt={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="w-5 h-5"/>
              </button>
            </div>
          </div>
          {erros.senha && tocados.senha && <p id="erro-senha" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.senha}</p>}
          
          {senha && (
            <div className="text-sm mt-0 space-y-1">
              <p className={requisitosSenha.tamanho ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
                {requisitosSenha.tamanho ? "✔" : "✖"} A senha deve ter no mínimo 8 caracteres
              </p>

              <p className={requisitosSenha.minuscula ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
                {requisitosSenha.minuscula ? "✔" : "✖"} A senha deve conter pelo menos uma letra minúscula
              </p>

              <p className={requisitosSenha.maiuscula ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
                {requisitosSenha.maiuscula ? "✔" : "✖"} A senha deve conter pelo menos uma letra maiúscula
              </p>

              <p className={requisitosSenha.numero ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
                {requisitosSenha.numero ? "✔" : "✖"} A senha deve conter pelo menos um número
              </p>

              <p className={requisitosSenha.caractereEspecial ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
                {requisitosSenha.caractereEspecial ? "✔" : "✖"} A senha deve conter pelo menos um caractere especial
              </p>
            </div>
          )}

          <div>
            <label className="body-semibold-pequeno" htmlFor="confirmarSenha">Confirmar senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
            <div className="relative">
              <input id="confirmarSenha" type={mostrarConfirmarSenha ? "text" : "password"} maxLength={50} className={`input-padrao pr-10 ${tocados.confirmarSenha && confirmarSenha ? erros.confirmarSenha ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]": "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
              autoComplete="new-password" placeholder="Confirme aqui a sua senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} aria-invalid={!!erros.confirmarSenha} aria-describedby={erros.confirmarSenha ? "erro-confirmar-senha" : undefined} onBlur={() => {marcarComoTocado("confirmarSenha"), validarUmCampo("confirmarSenha");}}/>
              
              <button type="button" onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 focus-acessivel" aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}>
                <img src={mostrarConfirmarSenha ? olho_visivel : olho_bloqueado} alt={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"} className="w-5 h-5"/>
              </button>
            </div>
          </div>
          {erros.confirmarSenha && tocados.confirmarSenha && <p id="erro-confirmar-senha" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.confirmarSenha}</p>}
        </>
      )}

      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {mostrarCancelar && (
          <div className="flex-1">
            <Botao variante="cancelar" aoClicar={aoCancelar}>
              {textoBotaoCancelar || "Cancelar"}
            </Botao>
          </div>
        )}

        <div className="flex-1">
          <Botao tipo="submit" variante="confirmar" desabilitado={carregando}>
            {carregando ? "Salvando..." : textoBotaoEnviar || "Cadastrar"}
          </Botao>
        </div>

      </div>

    </form>
  );
}

export default FormCadastroBase;