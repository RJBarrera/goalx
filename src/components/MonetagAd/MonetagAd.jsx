import { useEffect } from "react";

const MONETAG_SCRIPT_ID = "monetag-inpage-push";
const MONETAG_ZONE_ID = "11875184";

function MonetagAd() {
  useEffect(() => {
    // Evita cargar Monetag más de una vez
    if (document.getElementById(MONETAG_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");

    script.id = MONETAG_SCRIPT_ID;
    script.dataset.zone = MONETAG_ZONE_ID;
    script.src = "https://nap5k.com/tag.min.js";
    script.async = true;

    document.body.appendChild(script);

    console.log("Monetag In-Page Push cargado");
  }, []);

  return null;
}

export default MonetagAd;
