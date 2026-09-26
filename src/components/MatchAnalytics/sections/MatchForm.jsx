// sections/MatchForm.jsx
import { useTranslation } from "react-i18next";
import SportsSelect from "../../SportsSelect/SportsSelect";
export default function MatchForm({
  competition,
  form,
  catalogos,
  actualizarCampo,
  analizarPartido,
  loading,
  loadingCatalogos,
  errorCatalogos,
  modelStatus,
  error,
}) {
  const { t } = useTranslation();

  // Si los datos aún no existen, no renderizamos nada
  if (!form) return null;

  return (
    <>
      <div className="match-prediction-block__heading">
        <div>
          <span className="match-block-kicker">
            {competition?.name || t("matchAnalytics.form.defaultCompetition")}
          </span>

          <h2>{t("matchAnalytics.form.title")}</h2>

          <p>{t("matchAnalytics.form.subtitle")}</p>
        </div>
      </div>
      <form onSubmit={analizarPartido}>
        <div className="match-form-grid">
          {/* EQUIPO LOCAL */}
          <SportsSelect
            label={t("matchAnalytics.form.localLabel")}
            badge={t("matchAnalytics.form.localBadge")}
            value={form.local}
            options={catalogos.equipos}
            placeholder={t("matchAnalytics.form.localPlaceholder")}
            searchPlaceholder={t("matchAnalytics.form.searchPlaceholder")}
            loading={loadingCatalogos}
            disabledValues={[form.visitante]}
            variant="green"
            showTeamLogo
            onChange={(value) => actualizarCampo("local", value)}
          />

          {/* VS */}
          <div className="match-versus">
            <span>{t("matchAnalytics.form.vs")}</span>
          </div>

          {/* EQUIPO VISITANTE */}
          <SportsSelect
            label={t("matchAnalytics.form.visitorLabel")}
            badge={t("matchAnalytics.form.visitorBadge")}
            value={form.visitante}
            options={catalogos.equipos}
            placeholder={t("matchAnalytics.form.visitorPlaceholder")}
            searchPlaceholder={t("matchAnalytics.form.searchPlaceholder")}
            loading={loadingCatalogos}
            disabledValues={[form.local]}
            variant="cyan"
            showTeamLogo
            onChange={(value) => actualizarCampo("visitante", value)}
          />

          {/* ÁRBITRO */}
          <SportsSelect
            label={t("matchAnalytics.form.refereeLabel")}
            badge={t("matchAnalytics.form.refereeBadge")}
            value={form.arbitro}
            options={catalogos.arbitros}
            placeholder={t("matchAnalytics.form.refereePlaceholder")}
            searchPlaceholder={t(
              "matchAnalytics.form.searchRefereePlaceholder",
            )}
            loading={loadingCatalogos}
            variant="yellow"
            onChange={(value) => actualizarCampo("arbitro", value)}
          />
        </div>

        {!loadingCatalogos && !errorCatalogos && !modelStatus.ready && (
          <div className="match-model-notice">
            <div className="match-model-notice__icon">↻</div>

            <div>
              <strong>{t("matchAnalytics.form.modelPreparingTitle")}</strong>
              <span>
                {modelStatus.message ||
                  t("matchAnalytics.form.modelPreparingMessage", {
                    competition:
                      competition?.name ||
                      t("matchAnalytics.form.thisCompetition"),
                  })}
              </span>

              {modelStatus.minimumRecords > 0 && (
                <small>
                  {t("matchAnalytics.form.recordsProgress", {
                    records: modelStatus.records,
                    minimum: modelStatus.minimumRecords,
                  })}
                </small>
              )}
            </div>
          </div>
        )}

        {/* ERROR CATÁLOGOS */}
        {errorCatalogos && (
          <div className="match-error">
            <div className="match-error__icon">!</div>

            <div>
              <strong>{t("matchAnalytics.form.connectionErrorTitle")}</strong>

              {/* <span>{errorCatalogos}</span> */}
            </div>
          </div>
        )}

        {/* ERROR GENERAL */}
        {error && (
          <div className="match-error">
            <div className="match-error__icon">!</div>

            <div>
              <strong>{t("matchAnalytics.form.analysisErrorTitle")}</strong>

              {/* <span>{error}</span> */}
            </div>
          </div>
        )}

        {/* ACCIONES */}
        <div className="match-search-actions">
          <div className="match-data-note"></div>

          <button
            type="submit"
            className="match-analyze-button"
            disabled={
              loading ||
              loadingCatalogos ||
              Boolean(errorCatalogos) ||
              !modelStatus.ready
            }
          >
            {loading ? (
              <>
                <span className="match-spinner" />{" "}
                {t("matchAnalytics.form.processingButton")}
              </>
            ) : (
              <>
                {t("matchAnalytics.form.executeButton")}{" "}
                <span className="match-analyze-button__arrow">→</span>
              </>
            )}
          </button>
        </div>
      </form>{" "}
    </>
  );
}
