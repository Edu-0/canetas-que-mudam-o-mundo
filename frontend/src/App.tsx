import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Auditoria from "./pages/AuditoriaVoluntario";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/logar" element={<Logar />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-voluntario" element={<Cadastro />} /> {/* para cadastrar com link */}
        <Route path="/conta" element={<Conta />} />
        <Route path="/conta/editar" element={<EditarConta />} />
        <Route path="/conta/cadastro-responsavel" element={<CadastroResponsavel />} />
        <Route path="/conta/cadastro-beneficiario" element={<CadastroBeneficiario />} />
        <Route path="/doacoes" element={<Doacoes />} />
        <Route path="/doacoes/doar" element={<Doar />} />
        <Route path="/pedido" element={<Pedido />} />
        <Route path="/relatorio" element={<Relatorio />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/auditoria/:id" element={<Auditoria />} /> {/* usando ID do voluntário, aí pega todas as triagens que ele já fez */} 
        <Route path="/analise-voluntarios" element={<AnaliseVoluntarios />} />
        <Route path="/conta/editar-renda-e-familiares" element={<EditarRendaFamiliares />} />
        <Route path="/trocar-senha" element={<TrocarSenha/>} />
        <Route path="/confirmar-familiares" element={<ConfirmarFamiliares />} />
        <Route path="/status-materiais" element={<StatusMateriais />} />
        <Route path="/conta/cadastro-ong" element={<CadastroONG />} />
        <Route path="/links-para-voluntarios" element={<LinkParaVoluntario />} />
        <Route path="/conta/editar-ong" element={<EditarONG />} />
        <Route path="/ongs" element={<ListarONGs />} />
        <Route path="/lista-triagem" element={<ListaTriagem />} />
        <Route path="/lista-triagem/triagem" element={<Triagem />} />
        <Route path="/lista-triagem/triagem/:id" element={<Triagem />} /> {/* usando ID da doação */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;