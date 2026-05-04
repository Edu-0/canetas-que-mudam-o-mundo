import { ONG } from "../context/OngContext";

type Props = {
  ong: ONG;
};

function formatarCNPJ(cnpj: string) {
  const numeros = cnpj.replace(/\D/g, "");
  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");
  if (numeros.length === 11) { // ex: 11987654321 -> (11) 98765-4321
    return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  } else if (numeros.length === 10) { // ex: 1132654321 -> (11) 3265-4321
    return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  } else {
    return telefone; // retorna original se formato for inesperado
  } 
} 

function formatarCEP(cep: string) {
  const numeros = cep.replace(/\D/g, "");
  return numeros.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function CardONG({ ong }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4 border border-[var(--base-40)]">

      {/* Nome */}
      <h3 className="body-semibold-medio text-center font-bold">
        {ong.nome}
      </h3>

      <p className="body-semibold-pequeno text-center text-[var(--base-60)]">
        CNPJ: {formatarCNPJ(ong.cnpj)}
      </p>

      {/* linha */}
      <div className="border-t border-[var(--base-40)]" />

      {/* ENDEREÇO */}
      <h4 className="body-semibold-pequeno text-center">
        Endereço
      </h4>

      <div className="grid grid-cols-1 gap-1 body-semibold-pequeno">
        <p><strong>Estado:</strong> {ong.estado}</p>
        <p><strong>Cidade:</strong> {ong.cidade}</p>
        <p><strong>Bairro:</strong> {ong.bairro}</p>
        <p><strong>Rua:</strong> {ong.rua}</p>
        <p><strong>Número:</strong> {ong.numero || "Não informado"}</p>
        {ong.complemento && (
          <p><strong>Complemento:</strong> {ong.complemento}</p>
        )}
        {ong.cep && (
          <p><strong>CEP:</strong> {formatarCEP(ong.cep)}</p>
        )}
      </div>

      {/* linha */}
      <div className="border-t border-[var(--base-40)]" />

      {/* CONTATO */}
      <h4 className="body-semibold-pequeno text-center">
        Contato
      </h4>

      <div className="flex flex-col gap-1 body-semibold-pequeno">
        <p><strong>Telefone:</strong> {formatarTelefone(ong.telefone)}</p>
        <p><strong>Email:</strong> {ong.email}</p>
      </div>

      {/* linha */}
      <div className="border-t border-[var(--base-40)]" />

      {/* FUNCIONAMENTO */}
      <h4 className="body-semibold-pequeno text-center">
        Funcionamento
      </h4>

      <p className="body-semibold-pequeno text-center">
        {ong.horarioInicio} às {ong.horarioFim}
      </p>

      {/* linha */}
      <div className="border-t border-[var(--base-40)]" />

      {/* SOBRE */}
      <h4 className="body-semibold-pequeno text-center">
        Sobre
      </h4>

      <p className="body-semibold-pequeno text-center">
        {ong.sobre}
      </p>

      {/* linha */}
      <div className="border-t border-[var(--base-40)]" />

      {/* REDES */}
      <h4 className="body-semibold-pequeno text-center">
        Redes sociais
      </h4>

      <div className="flex flex-wrap justify-center gap-3 body-semibold-pequeno">

        <p className="body-semibold-pequeno">
          <strong>Instagram:</strong>{" "}
          {ong.instagram ? (
            <a href={ong.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all">
              {ong.instagram}
            </a>
          ) : (
            "Não informado"
          )}
        </p>

        <p className="body-semibold-pequeno">
          <strong>Facebook:</strong>{" "}
          {ong.facebook ? (
            <a href={ong.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all">
              {ong.facebook}
            </a>
          ) : (
            "Não informado"
          )}
        </p>

        <p className="body-semibold-pequeno">
          <strong>Site da ONG:</strong>{" "}
          {ong.site ? (
            <a href={ong.site} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all">
              {ong.site}
            </a>
          ) : (
            "Não informado"
          )}
        </p>

      </div>
    </div>
  );
}

export default CardONG;