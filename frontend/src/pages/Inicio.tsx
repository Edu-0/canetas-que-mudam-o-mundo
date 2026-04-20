import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Carrossel from "../components/Carrossel";
import logo from "../assets/logo.svg";
import { loadCarrosselImages } from "../services/carrosselImages";
import type { CarrosselImage } from "../components/Carrossel";

function Inicio() {
   const [carrosselImages, setCarrosselImages] = useState<CarrosselImage[]>([]);

  useEffect(() => {
    loadCarrosselImages().then(setCarrosselImages);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

          <section aria-label="Apresentação do projeto">
            {/* título e logo da caneta */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-center">
              <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />

              <h1 className="header-medio text-center">
                Canetas que Mudam o Mundo
              </h1>
            </div>
          </section>

          <section aria-labelledby="sobre-projeto">
            {/* subtitulo */}
            <h2 id="sobre-projeto" className="body-semibold-medio w-full">
              Sobre o projeto:
            </h2>

            <p className="body-pequeno w-full text-justify">
              Atualmente, crianças e jovens em situações de vulnerabilidade não conseguem ter seus momentos de{" "}
              <span className="font-semibold">estudos com qualidade</span>, pois não possuem os materiais adequados e em boa qualidade.
              <br /><br />

              Somos um projeto na qual foi desenvolvido com a finalidade atender essa comunidade{" "}
              <span className="font-semibold">infanto juvenil</span> mais necessitada, com o propósito de democratizar o acesso a materiais escolares de qualidade.
              <br /><br />

              O projeto tem como objetivo se tornar um{" "}
              <span className="font-semibold">intermediador</span> entre pessoas voluntárias, que querem fazer o bem para alguém em situação de carência, e voluntários que desejam realizar a entrega desses materiais para instituições e famílias mais necessitadas.
              <br /><br />

              Por meio de doações, jovens podem receber{" "}
              <span className="font-semibold">diversos materiais escolares</span> como lápis, borracha, caderno, estojo, mochila e entre outros.
            </p>
          </section>

          <section aria-label="Galeria de imagens do projeto">
            <div>
              <h2 className="body-semibold-medio text-center w-full mb-0">
                Galeria de imagens do projeto:
              </h2>
            </div>

            <div className="w-full overflow-hidden">
              {/* carrossel de imagens */}
              {carrosselImages.length > 0 && (
                <div className="w-full max-w-full">
                  <Carrossel
                    images={carrosselImages}
                  />
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="tipos-usuarios">
            {/* informações sobre os usuários */}
            <div>
              <h2 className="body-semibold-medio text-center w-full mb-6">
                Tipos de usuários:
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                {/* Genérico */}
                <article className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-azul-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
                  <h3 className="header-pequeno-tela-inicial text-center">
                    Usuário Genérico
                  </h3>

                  <p className="body-pequeno text-justify">
                    Todo usuário começa como genérico ao se cadastrar na plataforma. Esse tipo permite o acesso inicial ao sistema e aos botões para se tornar um ou mais tipos específicos de usuário. 
                    Mesmo ao adquirir outras funções, o usuário nunca deixa de ser genérico.
                  </p>

                  <div className="border-t border-[var(--pastel-azul-borda)] my-2" />

                  <h4 className="body-semibold-medio text-center">
                    Como se tornar
                  </h4>

                  <p className="body-pequeno text-justify">
                    Todo usuário já inicia automaticamente como genérico ao se cadastrar. Esse tipo é permanente e não pode ser removido.
                  </p>
                </article>

                {/* Doador */}
                <article className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-laranja-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
                  <h3 className="header-pequeno-tela-inicial text-center">
                    Doador
                  </h3>

                  <p className="body-pequeno text-justify">
                    Permite disponibilizar itens para doação de forma simples, com envio de fotos e descrições. 
                    Os materiais passam por análise antes de ficarem disponíveis para envio ao ponto de entrega designado pelo site.
                  </p>

                  <div className="border-t border-[var(--pastel-laranja-borda)] my-2" />

                  <h4 className="body-semibold-medio text-center">
                    Como se tornar
                  </h4>

                  <p className="body-pequeno text-justify">
                    Pode ser ativado diretamente na tela de conta, sem necessidade de etapas adicionais.
                  </p>
                </article>

                {/* Voluntário */}
                <article className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-roxo-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
                  <h3 className="header-pequeno-tela-inicial text-center">
                    Voluntário da triagem
                  </h3>

                  <p className="body-pequeno text-justify">
                    Usuário vinculado a uma ONG, e garante que apenas materiais em bom estado cheguem aos beneficiários. Ele analisa fotos e descrições enviadas pelos doadores, seguindo critérios de qualidade para aprovar ou reprovar os itens.
                  </p>

                  <div className="border-t border-[var(--pastel-roxo-borda)] my-2" />

                  <h4 className="body-semibold-medio text-center">
                    Como se tornar
                  </h4>

                  <p className="body-pequeno text-justify">
                    É necessário ter recebido um <strong>link</strong> do coordenador de processos onde já vinculado com uma ONG podera fazer o seu cadastro e atuar na triagem dos materiais.
                  </p>
                </article>

                {/* Responsável */}
                <article className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-rosa-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
                  <h3 className="header-pequeno-tela-inicial text-center">
                    Responsável pelo beneficiário
                  </h3>

                  <p className="body-pequeno text-justify">
                    Pode solicitar itens para seus dependentes e realizar a retirada no local de coleta, dentro do prazo definido pelo site.
                  </p>

                  <div className="border-t border-[var(--pastel-rosa-borda)] my-2" />

                  <h4 className="body-semibold-medio text-center">
                    Como se tornar
                  </h4>

                  <p className="body-pequeno text-justify">
                    É necessário preencher um <strong>cadastro</strong> com renda e familiares. Após isso, é preciso aguardar a aprovação.
                  </p>
                </article>

                {/* Coordenador */}
                <article className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-verde-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3 md:col-span-2">
                  <h3 className="header-pequeno-tela-inicial text-center">
                    Coordenador de processos
                  </h3>

                  <p className="body-pequeno text-justify">
                    Usuário vinculado a uma ONG, responsável por gerenciar operações da plataforma, como pontos de coleta e entrega, validação das primeiras triagens dos voluntários e acompanhamento do impacto social.
                  </p>

                  <div className="border-t border-[var(--pastel-verde-borda)] my-2" />

                  <h4 className="body-semibold-medio text-center">
                    Como se tornar
                  </h4>

                  <p className="body-pequeno text-justify">
                    Esse tipo é atribuído apenas a usuários vinculados a uma ONG, não podendo ser selecionado diretamente na plataforma.
                  </p>
                </article>
            </div>
          </div>
        </section>


        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default Inicio;