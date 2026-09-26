const porcentaje = (valor) => {
  return Number(valor || 0) * 100;
};


// Barra de probabildad
export function ProbabilityBar({ label, value, accent = "green" }) {
  const percent = Math.max(0, Math.min(100, porcentaje(value)));

  return (
    <div className="match-probability-row">
      <div className="match-probability-header">
        <span>{label}</span>

        <strong>{percent.toFixed(1)}%</strong>
      </div>

      <div className="match-probability-track">
        <div
          className={`match-probability-fill match-probability-fill--${accent}`}
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

// Métrica
export function MetricCard({
  label,
  value,
  description,
  variant = "default",
  tag,
}) {
  return (
    <article className={`match-metric-card match-metric-card--${variant}`}>
      <div className="match-metric-card__top">
        <div className="match-metric-label">{label}</div>

        {tag && <span className="match-metric-tag">{tag}</span>}
      </div>

      <div className="match-metric-value">{value}</div>

      {description && (
        <div className="match-metric-description">{description}</div>
      )}
    </article>
  );
}

// Encabezado de sección
export function SectionHeader({ code, eyebrow, title, description }) {
  return (
    <div className="match-section-heading">
      <div className="match-section-heading__code">{code}</div>

      <div>
        <span className="match-section-eyebrow">{eyebrow}</span>

        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>
    </div>
  );
}


// Tooltip
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="match-chart-tooltip">
      {label && <div className="match-chart-tooltip-label">{label}</div>}

      {payload.map((item) => (
        <div
          key={`${item.name}-${item.value}`}
          className="match-chart-tooltip-value"
        >
          <span>{item.name}</span>

          <strong>{Number(item.value).toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
}