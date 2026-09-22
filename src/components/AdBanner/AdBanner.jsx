import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./AdBanner.css";

const ADSENSE_CLIENT = "ca-pub-2884427950883230";

function AdBanner({
  slot,
  className = "",
  variant = "default",
  format = "auto",
  responsive = true,
}) {
  // Hook de traduccion
  const { t } = useTranslation();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});

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
      <span className="ad-banner__label">{t("adBanner.label")}</span>

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
