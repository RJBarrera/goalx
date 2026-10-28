// sections/MatchQuickNav.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function MatchQuickNav({
  items,
  onSelect,
  onToggleAll,
  isAllCollapsed,
}) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(items[0]?.id || "");
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const trackRef = useRef(null);
  const buttonsRef = useRef({});
  const isClickingRef = useRef(false);
  const clickTimeoutRef = useRef(null);

  // Para detectar la sección activa
  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickingRef.current) return;

        const visibles = entries.filter((entry) => entry.isIntersecting);
        if (visibles.length > 0) {
          const primero = visibles.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
          setActiveId(primero.target.id);
        }
      },
      {
        root: null,
        rootMargin: "-25% 0px -60% 0px",
        threshold: 0,
      },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  // Posicionamiento de la pastilla deslizante
  useLayoutEffect(() => {
    const botonActivo = buttonsRef.current[activeId];
    const track = trackRef.current;

    if (botonActivo && track) {
      setIndicatorStyle({
        left: botonActivo.offsetLeft,
        width: botonActivo.offsetWidth,
        opacity: 1,
      });

      const targetScrollLeft =
        botonActivo.offsetLeft -
        track.clientWidth / 2 +
        botonActivo.offsetWidth / 2;

      track.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeId, items]);

  const handleClick = (item) => {
    isClickingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 850);

    setActiveId(item.id);
    onSelect(item);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="match-quick-nav-wrapper">
      <nav
        className="match-quick-nav"
        aria-label="Navegación de mercados y estadísticas"
      >
        {/* Pista de secciones */}
        <div className="match-quick-nav__track" ref={trackRef}>
          <span
            className="match-quick-nav__indicator"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
            aria-hidden="true"
          />

          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => (buttonsRef.current[item.id] = el)}
                type="button"
                className={`match-quick-nav__item ${isActive ? "is-active" : ""}`}
                onClick={() => handleClick(item)}
                aria-current={isActive ? "true" : undefined}
              >
                {item.code && (
                  <span
                    className={`match-quick-nav__code ${item.codeClass || ""}`}
                  >
                    {item.code}
                  </span>
                )}
                <span className="match-quick-nav__label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Botón de acción: Colapsar / Desplegar Todo */}
        {onToggleAll && (
          <>
            <span className="match-quick-nav__divider" aria-hidden="true" />
            <button
              type="button"
              className={`match-quick-nav__toggle-all ${isAllCollapsed ? "is-collapsed" : ""}`}
              onClick={onToggleAll}
              title={
                isAllCollapsed
                  ? t("matchAnalytics.analytics.results.quickNav.expandAll")
                  : t("matchAnalytics.analytics.results.quickNav.collapseAll")
              }
              aria-label={
                isAllCollapsed
                  ? t("matchAnalytics.analytics.results.quickNav.expandAll")
                  : t("matchAnalytics.analytics.results.quickNav.collapseAll")
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isAllCollapsed ? (
                  // Icono para Expandir (flechas hacia afuera)
                  <>
                    <polyline points="7 11 12 6 17 11" />
                    <polyline points="7 17 12 22 17 17" />
                  </>
                ) : (
                  // Icono para Colapsar (flechas hacia adentro)
                  <>
                    <polyline points="7 6 12 11 17 6" />
                    <polyline points="7 22 12 17 17 22" />
                  </>
                )}
              </svg>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
