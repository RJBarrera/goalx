import { useState } from "react";
import SeasonHighlights from "./components/SeasonHighlights";
import MatchAnalytics from "./components/MatchAnalytics";
import LiveCenter from "./components/LiveCenter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
      <SeasonHighlights />
      <MatchAnalytics partidoSeleccionado={partidoSeleccionado} />
      <LiveCenter onSeleccionarPartido={seleccionarPartidoParaPrediccion} />

      <Footer />
    </>
  );
}

export default App;