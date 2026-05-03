import { useEffect, useState } from "react";
import { obterLinkCadastroVoluntario } from "../services/usuarioService";
import { useUsuario } from "../context/UserContext";

type RetornoLink = {
  link: string | null;
  carregando: boolean;
};

function useLinkVoluntario(): RetornoLink {
  const { usuario } = useUsuario();

  const [link, setLink] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarLink() {
      if (!usuario?.tipos?.includes("Coordenador de Processos")) {
        setCarregando(false);
        return;
      }

      try {
        const link = await obterLinkCadastroVoluntario(); // pega o link do backend
        setLink(link); // salva o link no estado

      } catch (error) {
        console.error("Erro ao buscar link:", error);
        setLink(null); // se der erro, garante que o link seja null

      } finally {
        setCarregando(false);
      }
    }

    buscarLink();
  }, [usuario]);

  return { link, carregando };
}

export default useLinkVoluntario;