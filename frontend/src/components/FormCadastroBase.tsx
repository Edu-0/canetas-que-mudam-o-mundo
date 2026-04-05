import { IMaskInput } from "react-imask";
import { useState } from "react";
import Botao from "./Botao";
import { validarCampo } from "../utils/validacoesFormulario";
import { verificarRequisitosSenha } from "../utils/validacoes";

type Props = {
  aoEnviar: (dados: { 
    nome: string;
    dataNascimento: string;
    cpf: string;
    cep: string;
    telefone: string;
    email: string; 
    senha: string 
  }) => void;
};

function FormCadastroBase({ aoEnviar }: Props) {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [telefone, setTelefone] = useState("");
  const[email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const requisitosSenha = verificarRequisitosSenha(senha);

  const [erros, setErros] = useState({
    nome: "",
    dataNascimento: "",
    cpf: "",
    cep: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [tocados, setTocados] = useState({
    nome: false,
    dataNascimento: false,
    cpf: false,
    cep: false,
    telefone: false,
    email: false,
    senha: false,
    confirmarSenha: false,
  });

  const [carregando, setCarregando] = useState(false);

  const dados = {
    nome,
    dataNascimento,
    cpf,
    cep,
    telefone,
    email,
    senha,
    confirmarSenha,
  };

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) return; // evita múltiplos envios

    const novosErros = {
      nome: validarCampo("nome", dados),
      dataNascimento: validarCampo("dataNascimento", dados),
      cpf: validarCampo("cpf", dados),
      cep: validarCampo("cep", dados),
      telefone: validarCampo("telefone", dados),
      email: validarCampo("email", dados),
      senha: validarCampo("senha", dados),
      confirmarSenha: validarCampo("confirmarSenha", dados),
    };

    setErros(novosErros);

    if (Object.values(novosErros).some((erro) => erro !== "")) {
      setTocados({
        nome: true,
        dataNascimento: true,
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

    setTimeout(() => {
      aoEnviar({
        nome,
        dataNascimento,
        cpf,
        cep,
        telefone,
        email,
        senha,
      });
      setCarregando(false);
    }, 1000);
  }

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" onKeyDown={(e) => {if (e.key === "Enter") {e.preventDefault();
    const campoAtual = (e.target as any).id as keyof typeof erros; marcarComoTocado(campoAtual); validarUmCampo(campoAtual);}}}>

      <div>
        <label className="body-semibold-pequeno" htmlFor="nome">Nome completo <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="nome" type="text" required className={`input-padrao ${erros.nome && tocados.nome ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="name" 
        placeholder="Digite aqui o seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={!!erros.nome} aria-describedby={erros.nome ? "erro-nome" : undefined} onBlur={() => {marcarComoTocado("nome"), validarUmCampo("nome");}}/>
      </div>
      {erros.nome && tocados.nome && <p id="erro-nome" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.nome}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="data-nascimento">Data de nascimento <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="data-nascimento" type="date" max={hoje} required className={`input-padrao ${erros.dataNascimento && tocados.dataNascimento ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="off" 
        value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} aria-invalid={!!erros.dataNascimento} aria-describedby={erros.dataNascimento ? "erro-data-nascimento" : undefined} onBlur={() => {marcarComoTocado("dataNascimento"), validarUmCampo("dataNascimento");}}/>
      </div>
      {erros.dataNascimento && tocados.dataNascimento && <p id="erro-data-nascimento" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.dataNascimento}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="cpf">CPF <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="000.000.000-00" id="cpf" type="text" required className={`input-padrao ${erros.cpf && tocados.cpf ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="off" 
        placeholder="Digite aqui o seu CPF 000.000.000-00" value={cpf} onAccept={(value) => setCpf(value)} onBlur={() => {marcarComoTocado("cpf"), validarUmCampo("cpf");}} aria-invalid={!!erros.cpf} aria-describedby={erros.cpf ? "erro-cpf" : undefined}/>
      </div>
      {erros.cpf && tocados.cpf && <p id="erro-cpf" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.cpf}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="cep">CEP <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="00000-000" id="cep" type="text" required className={`input-padrao ${erros.cep && tocados.cep ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="postal-code" 
        placeholder="Digite aqui o seu CEP 00000-000" value={cep} onAccept={(value) => setCep(value)} onBlur={() => {marcarComoTocado("cep"), validarUmCampo("cep");}} aria-invalid={!!erros.cep} aria-describedby={erros.cep ? "erro-cep" : undefined}/>
      </div>
      {erros.cep && tocados.cep && <p id="erro-cep" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.cep}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="telefone">Telefone</label>
        <IMaskInput mask="(00) 00000-0000" id="telefone" type="tel" className={`input-padrao ${erros.telefone && tocados.telefone ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="tel" 
        placeholder="Digite aqui o seu telefone (00) 00000-0000" value={telefone} onAccept={(value) => setTelefone(value)} onBlur={() => {marcarComoTocado("telefone"), validarUmCampo("telefone");}} aria-invalid={!!erros.telefone} aria-describedby={erros.telefone ? "erro-telefone" : undefined} />
      </div>
      {erros.telefone && tocados.telefone && <p id="erro-telefone" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.telefone}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="email">Email <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="email" type="email" required className={`input-padrao ${erros.email && tocados.email ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="email"
        placeholder="Digite aqui o seu email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!erros.email} aria-describedby={erros.email ? "erro-email" : undefined} onBlur={() => {marcarComoTocado("email"), validarUmCampo("email");}}/> 
      </div>
      {erros.email && tocados.email && <p id="erro-email" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.email}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="senha">Senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="senha" type="password" className={`input-padrao ${erros.senha && tocados.senha ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="new-password"
        placeholder="Digite aqui a sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={!!erros.senha} aria-describedby={erros.senha ? "erro-senha" : undefined} onBlur={() => {marcarComoTocado("senha"), validarUmCampo("senha");}}/>
      </div>
      {erros.senha && tocados.senha && <p id="erro-senha" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.senha}</p>}
      
      <div className="text-sm mt-0 space-y-1">
        <p className={requisitosSenha.tamanho ? "text-green-600" : "text-[var(--cor-resposta-obrigatoria)]"}>
          {requisitosSenha.tamanho ? "✔" : "✖"} Mínimo 6 caracteres
        </p>

        <p className={requisitosSenha.maiuscula ? "text-green-600" : "text-[var(--cor-resposta-obrigatoria)]"}>
          {requisitosSenha.maiuscula ? "✔" : "✖"} Inclua pelo menos uma letra maiúscula
        </p>

        <p className={requisitosSenha.numero ? "text-green-600" : "text-[var(--cor-resposta-obrigatoria)]"}>
          {requisitosSenha.numero ? "✔" : "✖"} Inclua pelo menos um número
        </p>
      </div>

      <div>
        <label className="body-semibold-pequeno" htmlFor="confirmar-senha">Confirmar senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="confirmar-senha" type="password" className={`input-padrao ${erros.confirmarSenha && tocados.confirmarSenha ? "border-[var(--cor-resposta-obrigatoria)] focus:ring-[var(--cor-resposta-obrigatoria)]": ""}`} autoComplete="new-password"
        placeholder="Confirme aqui a sua senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} aria-invalid={!!erros.confirmarSenha} aria-describedby={erros.confirmarSenha ? "erro-confirmar-senha" : undefined} onBlur={() => {marcarComoTocado("confirmarSenha"), validarUmCampo("confirmarSenha");}}/>
      </div>
      {erros.confirmarSenha && tocados.confirmarSenha && <p id="erro-confirmar-senha" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.confirmarSenha}</p>}

      <Botao tipo="submit" variante="confirmar" desabilitado={carregando}>
        {carregando ? "Enviando..." : "Cadastrar"}
      </Botao>

    </form>
  );
}

export default FormCadastroBase;