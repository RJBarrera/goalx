import { useState } from "react";
import SeasonHighlights from "./components/SeasonHighlights";
import MatchAnalytics from "./components/MatchAnalytics";
import LiveCenter from "./components/LiveCenter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdBanner from "./components/AdBanner/AdBanner";
import "./App.css";

function App() {
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

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

export default App;