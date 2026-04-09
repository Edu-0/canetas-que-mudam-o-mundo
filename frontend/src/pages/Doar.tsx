// Ainda será feita, mas não vamos mexer nela agora, para não atrapalhar o desenvolvimento da Sprint da semana.

// import Header from "../components/Header";
// import Footer from "../components/Footer";
// import Botao from "../components/Botao";
// import { useState } from "react";

// function Doar() {

//   const [nome, setNome] = useState("");
//   const [cpf, setCpf] = useState("");
//   const [cep, setCep] = useState("");

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

//     const dadosCompletos = {
//       ...usuario,
//       nome,
//       cpf,
//       cep,
//       tipo: "doador"
//     };

//     console.log("Cadastro completo:", dadosCompletos);
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-[var(--base-5)]">

//       <Header />

//       <main className="flex-1 pt-24 flex justify-center">
        
//         <form 
//           onSubmit={handleSubmit}
//           className="w-full max-w-md bg-[var(--primario-5)] p-6 rounded-lg shadow-lg flex flex-col gap-4"
//         >

//           <h2 className="header-medio text-center">
//             Doar materiais
//           </h2>

//           <input
//             className="input-padrao"
//             placeholder="Nome"
//             value={nome}
//             onChange={(e) => setNome(e.target.value)}
//           />

//           <input
//             className="input-padrao"
//             placeholder="CPF"
//             value={cpf}
//             onChange={(e) => setCpf(e.target.value)}
//           />

//           <input
//             className="input-padrao"
//             placeholder="CEP"
//             value={cep}
//             onChange={(e) => setCep(e.target.value)}
//           />

//           <Botao tipo="submit" variante="confirmar">
//             Finalizar cadastro
//           </Botao>

//         </form>
//       </main>

//       <Footer />
//     </div>
//   );
// }

// export default Doar;