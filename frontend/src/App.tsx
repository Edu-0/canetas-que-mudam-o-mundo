import { BrowserRouter, Routes, Route } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import RotaPublica from "./components/RotaPublica";
import { TipoUsuario } from "./context/UserContext";

import Inicio from "./pages/Inicio";
import Cadastro from "./pages/Cadastro";
import Logar from "./pages/Logar";
import Conta from "./pages/Conta";
import EditarConta from "./pages/EditarConta";
import CadastroBeneficiario from "./pages/CadastroBeneficiario";
import Doar from "./pages/Doar";
import Doacoes from "./pages/Doacoes";
import Triagem from "./pages/Triagem";
import Pedido from "./pages/PedidoMaterial";
import Relatorio from "./pages/Relatorio";
import Auditoria from "./pages/AuditoriaTriagensQuarentena";
import InfosVoluntario from "./pages/InfosVoluntario";
import AnaliseVoluntarios from "./pages/AnaliseVoluntarios";
import EditarRendaFamiliares from "./pages/EditarRendaFamiliares";
import TrocarSenha from "./pages/TrocarSenha";
import ConfirmarFamiliares from "./pages/ConfirmarCadastroFamilia";
import CadastroResponsavel from "./pages/CadastroResponsavel";
import CadastroONG from "./pages/CadastroONG";
import LinkParaVoluntario from "./pages/LinkParaVoluntario";
import EditarONG from "./pages/EditarONG";
import ListarONGs from "./pages/ListaONGs";
import ListaTriagem from "./pages/ListaTriagem";
import StatusMateriais from "./pages/StatusMateriais";
import ListaPedidos from "./pages/ListaPedidos";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/logar" element={<Logar />} />

        {/* cadastro - só pode acessar quem não estiver logado */}
        <Route element={<RotaPublica />}>
          <Route path="/cadastro" element={<Cadastro />} /> 
          <Route path="/cadastro-voluntario" element={<Cadastro />} /> {/* para cadastrar com link */}
        </Route>

        {/* usuário genérico */}
        <Route element={<RotaProtegida permissoes={["Genérico", "Doador", "Responsável pelo beneficiário", "Voluntário da triagem", "Coordenador de Processos"]} />}>
          <Route path="/conta" element={<Conta />} />
          <Route path="/conta/editar" element={<EditarConta />} />
          <Route path="/conta/cadastro-responsavel" element={<CadastroResponsavel />} />
          <Route path="/conta/cadastro-beneficiario" element={<CadastroBeneficiario />} />
          <Route path="/confirmar-familiares" element={<ConfirmarFamiliares />} />
          <Route path="/trocar-senha" element={<TrocarSenha/>} />
          <Route path="/conta/cadastro-ong" element={<CadastroONG />} /> {/* só não pode ver o doador, responsavel e voluntário */}
        </Route>

        {/* só não pode ver o voluntário */}
        <Route element={<RotaProtegida permissoes={["Genérico", "Doador", "Responsável pelo beneficiário", "Coordenador de Processos"]} />}>
          <Route path="/ongs" element={<ListarONGs />} /> 
        </Route>

        {/* Doador */}
        <Route element={<RotaProtegida permissoes={["Doador"]} />}>
          <Route path="/doacoes" element={<Doacoes />} />
          <Route path="/doacoes/doar" element={<Doar />} />
        </Route>

        {/* Responsável pelo beneficiário */}
        <Route element={<RotaProtegida permissoes={["Responsável pelo beneficiário"]} />}>
          <Route path="/lista-pedidos" element={<ListaPedidos />} />
          <Route path="/lista-pedidos/pedido" element={<Pedido />} />
          <Route path="/conta/editar-renda-e-familiares" element={<EditarRendaFamiliares />} />
        </Route>

        {/* Coordenador de Processos */}
        <Route element={<RotaProtegida permissoes={["Coordenador de Processos"]} />}>
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/analise-voluntarios" element={<AnaliseVoluntarios />} />
          <Route path="/analise-voluntarios/voluntario" element={<InfosVoluntario />} />
          <Route path="/analise-voluntarios/voluntario/:id" element={<InfosVoluntario />} /> {/* usando ID do voluntário, aí pega as informações dele */} 
          <Route path="/auditoria-triagens" element={<Auditoria />} />
          <Route path="/links-para-voluntarios" element={<LinkParaVoluntario />} />
          <Route path="/conta/editar-ong" element={<EditarONG />} />
        </Route>

        {/* só pode ver o coordenador de processos e o voluntário */}
        <Route element={<RotaProtegida permissoes={["Coordenador de Processos", "Voluntário da triagem"]} />}>
          <Route path="/status-materiais" element={<StatusMateriais />} /> 
        </Route>
        
        
        {/* Voluntário da triagem */}
        <Route element={<RotaProtegida permissoes={["Voluntário da triagem"]} />}>
          <Route path="/lista-triagem" element={<ListaTriagem />} />
          <Route path="/lista-triagem/triagem" element={<Triagem />} />
          <Route path="/lista-triagem/triagem/:id" element={<Triagem />} /> {/* usando ID da doação */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;