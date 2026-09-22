import { useEffect, useState } from "react";
import AdBanner from "../../components/AdBanner/AdBanner";
import Footer from "../../components/Footer/Footer";
import LiveCenter from "../../components/LiveCenter/LiveCenter";
import MatchAnalytics from "../../components/MatchAnalytics/MatchAnalytics";
import Navbar from "../../components/Navbar/Navbar";
import SeasonHighlights from "../../components/SeasonHighlights/SeasonHighlights";
import { useCompetition } from "../../context/CompetitionContext";

import "../../App.css";

function Home() {
  const { competitionId } = useCompetition();
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  useEffect(() => {
    setPartidoSeleccionado(null);
  }, [competitionId]);

  const seleccionarPartidoParaPrediccion = (match) => {
    setPartidoSeleccionado({
      local: match.home,
      visitante: match.away,
      id: Date.now(),
    });

    window.requestAnimationFrame(() => {
      document.getElementById("prediccion")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <>
      <Navbar />

      <div className="goalx-layout">
        {/* Publicidad - lado izquierdo */}
        <aside className="goalx-layout__ad">
          <div className="goalx-layout__ad-sticky">
            <AdBanner slot="4569523678" variant="sidebar" />
          </div>
        </aside>

        <main className="goalx-layout__content">
          <SeasonHighlights />

          <div className="goalx-mobile-ad">
            <AdBanner slot="3123001052" variant="mobile" />
          </div>

          <MatchAnalytics partidoSeleccionado={partidoSeleccionado} />

          <div className="goalx-mobile-ad">
            <AdBanner slot="9053984589" variant="mobile" />
          </div>

          <LiveCenter onSeleccionarPartido={seleccionarPartidoParaPrediccion} />
        </main>

        {/* Publicidad - lado derecho */}
        <aside className="goalx-layout__ad">
          <div className="goalx-layout__ad-sticky">
            <AdBanner slot="5691033650" variant="sidebar" />
          </div>
        </aside>
      </div>

      <Footer />
    </>
  );
}
export default Home;
