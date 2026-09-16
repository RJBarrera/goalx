import { useEffect, useRef } from "react";

import "./AdBanner.css";

const ADSENSE_CLIENT = "ca-pub-2884427950883230";

function AdBanner({
  slot,
  className = "",
  variant = "default",
  format = "auto",
  responsive = true,
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});

      initialized.current = true;
    } catch (error) {
      console.error("Error al cargar anuncio de AdSense:", error);
    }
  }, []);

  if (!slot) {
    return null;
  }

  return (
    <div className={`ad-banner ad-banner--${variant} ${className}`}>
      <span className="ad-banner__label">Publicidad</span>

      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

export default AdBanner;
