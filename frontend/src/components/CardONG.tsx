import { ONG } from "../context/OngContext";
import { useUsuario } from "../context/UserContext";
import { useState } from "react";

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

function formatarDias(dias: number[]) {
  const diasSemana = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  if (!dias || dias.length === 0) return "Não informado";

  const diasOrdenados = [...dias].sort((a, b) => a - b);

  // todos os dias
  if (diasOrdenados.length === 7) {
    return "Todos os dias da semana";
  }

  // Fim de semana
  if ( diasOrdenados.length === 2 && diasOrdenados.includes(0) && diasOrdenados.includes(6)) {
    return "Fim de semana";
  }

  // 2 dias
  if (diasOrdenados.length === 2) {
    return `${diasSemana[diasOrdenados[0]]} e ${diasSemana[diasOrdenados[1]]}`;
  }

  // Agrupar sequências
  const grupos: number[][] = [];
  let grupoAtual: number[] = [diasOrdenados[0]];

  for (let i = 1; i < diasOrdenados.length; i++) {
    if (diasOrdenados[i] === diasOrdenados[i - 1] + 1) {
      grupoAtual.push(diasOrdenados[i]);
    } else {
      grupos.push(grupoAtual);
      grupoAtual = [diasOrdenados[i]];
    }
  }
  grupos.push(grupoAtual);

  const partes = grupos.map((grupo) => {
    if (grupo.length === 1) {
      return diasSemana[grupo[0]];
    }

    return `${diasSemana[grupo[0]]} a ${
      diasSemana[grupo[grupo.length - 1]]
    }`;
  });

  if (partes.length === 1) return partes[0];

  if (partes.length === 2) {
    return `${partes[0]} e ${partes[1]}`;
  }

  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}

function CardONG({ ong }: Props) {
  const [expandido, setExpandido] = useState(false);
  const { usuario } = useUsuario();

  return (
    <div className="relative bg-white rounded-2xl shadow-md p-4 sm:p-6 w-full flex flex-col gap-4 border border-[var(--base-40)]">

      <button onClick={() => setExpandido(!expandido)} aria-label="Botão para expandir ou recolher informações da ONG" className="absolute top-2 right-2 text-xs sm:text-sm text-black body-semibold-muito-pequeno sm:body-semibold-pequeno p-2 rounded-full bg-[var(--base-10)] hover:bg-[var(--base-20)] transition">
        {expandido ? "Recolher ▲" : "Expandir ▼"}
      </button>

      <div className="text-center">
        <h3 className="body-bold-pequeno sm:body-bold-medio font-bold mt-7 sm:mt-0">
          {ong.nome}
        </h3>

        <p className="sm:body-pequeno body-muito-pequeno text-black mt-2">
          <strong className="sm:body-semibold-pequeno body-semibold-muito-pequeno text-[var(--base-60)]">CNPJ:</strong> {formatarCNPJ(ong.cnpj)}
        </p>
      </div>

      {expandido && (
        <>

          <div className="border-t border-[var(--base-40)] pt-3 sm:pt-4">
            <h4 className="body-bold-pequeno text-center mb-2">
              Endereço da ONG
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-1">
              {ong.cep && (
                <p className="text-sm sm:body-pequeno"><strong className="text-sm font-semibold sm:body-semibold-pequeno">CEP:</strong> {formatarCEP(ong.cep)}</p>
              )}
              
              <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-pequeno">Bairro:</strong> {ong.bairro}</p>
              <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Estado:</strong> {ong.estado}</p>
              <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Rua:</strong> {ong.rua}</p>
              <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Cidade:</strong> {ong.cidade}</p>
              <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Número:</strong> {ong.numero || "Não informado"}</p>
              {ong.complemento && (
                <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Complemento:</strong> {ong.complemento}</p>
              )}
              
            </div>
          </div>

          <div className="border-t border-[var(--base-40)] pt-3 sm:pt-4">
            <h4 className="body-bold-medio text-center mb-2">
              Informações de contato
            </h4>

            <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Telefone:</strong> {formatarTelefone(ong.telefone)}</p>
            <p className="body-muito-pequeno sm:body-pequeno break-words"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Email:</strong> {ong.email}</p>
            {(ong as any).usuario?.nome_completo && (
              <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Coordenador de processos: </strong>{(ong as any).usuario.nome_completo}</p>
            )}
          </div>

          <div className="border-t border-[var(--base-40)] pt-3 sm:pt-4">
            <h4 className="body-bold-medio text-center mb-2">
              Funcionamento da ONG
            </h4>

            <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Dias da semana:</strong> {formatarDias(ong.diasFuncionamento)}</p>
            <p className="body-muito-pequeno sm:body-pequeno"><strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Horário:</strong> {ong.horarioInicio} às {ong.horarioFim}</p>
          </div>

          <div className="border-t border-[var(--base-40)] pt-3 sm:pt-4">
            <h4 className="body-bold-medio text-center mb-2">
              Sobre a ONG
            </h4>

            <p className="body-muito-pequeno sm:body-pequeno">
              {ong.sobre}
            </p>
          </div>

          <div className="border-t border-[var(--base-40)] pt-3 sm:pt-4">
            <h4 className="body-bold-medio text-center mb-2">
              Redes sociais
            </h4>

            {ong.instagram || ong.facebook || ong.site ? (
              <div className="flex flex-col gap-2 body-semibold-pequeno">

                {ong.instagram && (
                  <p className="body-muito-pequeno sm:body-pequeno">
                    <strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Instagram:</strong>{" "}
                    <a aria-label="Instagram da ONG" href={ong.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all focus-acessivel">
                      {ong.instagram}
                    </a>
                  </p>
                )}

                {ong.facebook && (
                  <p className="body-muito-pequeno sm:body-pequeno">
                    <strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Facebook:</strong>{" "}
                    <a aria-label="Facebook da ONG" href={ong.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all focus-acessivel">
                      {ong.facebook}
                    </a>
                  </p>
                )}

                {ong.site && ( 
                  <p className="body-muito-pequeno sm:body-pequeno">
                    <strong className="body-semibold-pequeno sm:body-semibold-muito-pequeno">Site:</strong>{" "}
                    <a aria-label="Site da ONG" href={ong.site} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all focus-acessivel">
                      {ong.site}
                    </a>
                  </p>
                )}

              </div>
            ) : (
              <p className="body-muito-pequeno sm:body-pequeno">
                Sem informações disponíveis
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CardONG;