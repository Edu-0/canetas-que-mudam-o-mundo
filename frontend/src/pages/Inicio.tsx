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

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />

            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          {/* subtitulo */}
          <h2 className="body-semibold-medio w-full">
            Sobre o projeto:
          </h2>

          <p className="body-pequeno w-full text-justify">
            Atualmente, crianças e jovens em situações de vulnerabilidade não conseguem ter seus momentos de{" "}
            <span className="font-semibold">
              estudos com qualidade
            </span>
            , pois não possuem os materiais adequados e em boa qualidade. Levando em conta este problema, será desenvolvido um projeto pensando em atender essas necessidades.
            <br/><br/>
            Somos um projeto na qual foi desenvolvido com a finalidade atender essa comunidade{" "}
            <span className="font-semibold">
              infanto juvenil
            </span>{" "}
            mais necessitada, com o propósito de democratizar o acesso a materiais escolares de qualidade.
            <br/><br/>
            O projeto tem como objetivo se tornar um{" "}
            <span className="font-semibold">
              intermediador
            </span>{" "}
            entre pessoas voluntárias, que querem fazer o bem para alguém em situação de carência, e voluntários que desejam realizar a entrega desses materiais para instituições e famílias mais necessitadas.
            <br/><br/>
            Por meio de doações, esses jovens poderão receber{" "}
            <span className="font-semibold">
              todos os tipos
            </span>{" "}
            de materiais escolares, incluindo: lápis, borracha, caderno, estojo, mochila e etc.
          </p>

          {/* carrossel de imagens */}
          <div className="w-full mt-10">
            {carrosselImages.length > 0 && (
              <Carrossel
                images={carrosselImages}
                autoPlay={true}
                interval={5000}
              />
            )}
          </div>

          {/* informações sobre os usuários */}
          <div>
            <h2 className="body-semibold-medio text-center w-full mb-6">
              Tipos de usuários:
            </h2>

            <div className="grid md:grid-cols-2 gap-6">

              {/* Genérico */}
              <div className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-azul-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
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
              </div>

              {/* Doador */}
              <div className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-laranja-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
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
              </div>

              {/* Voluntário */}
              <div className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-roxo-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
                <h3 className="header-pequeno-tela-inicial text-center">
                  Voluntário da triagem
                </h3>

                <p className="body-pequeno text-justify">
                  Garante que apenas materiais em bom estado cheguem aos beneficiários. Ele analisa fotos e descrições enviadas pelos doadores, seguindo critérios de qualidade para aprovar ou reprovar os itens.
                </p>

                <div className="border-t border-[var(--pastel-roxo-borda)] my-2" />

                <h4 className="body-semibold-medio text-center">
                  Como se tornar
                </h4>

                <p className="body-pequeno text-justify">
                  É necessário realizar um <strong>quiz</strong> de avaliação para validar seu conhecimento antes de atuar na triagem dos materiais.
                </p>
              </div>

              {/* Responsável */}
              <div className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-rosa-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3">
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
              </div>

              {/* Coordenador */}
              <div className="bg-[var(--primario-5)] border-l-4 border-[var(--pastel-verde-borda)] rounded-lg p-6 shadow-[2px_8px_25px_rgba(0,0,0,0.08)] flex flex-col gap-3 md:col-span-2">
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
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default Inicio;