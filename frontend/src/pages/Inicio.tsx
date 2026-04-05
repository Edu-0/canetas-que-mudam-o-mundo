import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";

function Inicio() {
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
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default Inicio;