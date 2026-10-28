// sections/CollapsibleSection.jsx
import { useState } from "react";
import "../MatchAnalytics.css";
import { SectionHeader } from "./utils";

export default function CollapsibleSection({
  id,
  code,
  eyebrow,
  title,
  description,
  header,
  isOpenDefault = true,
  isForcedOpen = false,
  isOpen,
  onToggle,
  children,
}) {
  const [localOpen, setLocalOpen] = useState(isOpenDefault);
  const abierto = isForcedOpen || (isOpen !== undefined ? isOpen : localOpen);

  const toggle = () => {
    if (onToggle) {
      onToggle(!abierto);
    } else {
      setLocalOpen((prev) => !prev);
    }
  };

  return (
    <section id={id} className="match-dashboard-section match-collapsible">
      {/* El encabezado nativo actúa como botón interactivo */}
      <div
        className="match-collapsible__header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className="match-collapsible__header-content">
          {header || (
            <SectionHeader
              code={code}
              eyebrow={eyebrow}
              title={title}
              description={description}
            />
          )}
        </div>

        <button
          type="button"
          className={`match-collapsible__trigger ${abierto ? "is-open" : ""}`}
          aria-expanded={abierto}
          aria-label={abierto ? "Minimizar sección" : "Expandir sección"}
          tabIndex={-1}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Contenido colapsable */}
      {abierto && <div className="match-collapsible__body">{children}</div>}
    </section>
  );
}