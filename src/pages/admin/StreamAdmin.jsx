import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { getTeamLogo } from "../../utils/teamLogos";
import { useAuth } from "../../context/AuthContext";
import { useCompetition } from "../../context/CompetitionContext";
import Swal from "sweetalert2";

import "./Admin.css";

const API_URL = "";

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const emptySource = (index = 1) => ({
  id: `fuente-${index}`,
  name: `Fuente ${index}`,
  type: "iframe",
  url: "",
});

const streamMatchesMatch = (stream, match) => {
  if (!stream || !match) {
    return false;
  }

  if (
    stream.sportsdb_event_id &&
    match.sportsdb_event_id &&
    String(stream.sportsdb_event_id) === String(match.sportsdb_event_id)
  ) {
    return true;
  }

  if (
    stream.fixture_id &&
    match.fixture_id &&
    String(stream.fixture_id) === String(match.fixture_id)
  ) {
    return true;
  }

  return (
    stream.date === match.date_local &&
    normalize(stream.home) === normalize(match.home?.name) &&
    normalize(stream.away) === normalize(match.away?.name)
  );
};

const createFormFromMatch = (match, stream = null) => ({
  id: stream?.id || null,
  sportsdb_event_id:
    match?.sportsdb_event_id || stream?.sportsdb_event_id || null,
  fixture_id: match?.fixture_id || stream?.fixture_id || null,
  date: match?.date_local || stream?.date || "",
  time: match?.time_local || stream?.time || "",
  home: match?.home?.name || stream?.home || "",
  away: match?.away?.name || stream?.away || "",
  title:
    stream?.title ||
    `${match?.home?.name || stream?.home || "Local"} vs ${match?.away?.name || stream?.away || "Visitante"}`,
  enabled: stream?.enabled ?? true,
  sources:
    Array.isArray(stream?.sources) && stream.sources.length > 0
      ? stream.sources.map((source, index) => ({
          id: source.id || `fuente-${index + 1}`,
          name: source.name || `Fuente ${index + 1}`,
          type: "iframe",
          url: source.url || "",
        }))
      : [emptySource()],
});

function TeamMini({ team }) {
  const logo = getTeamLogo(team?.name) || team?.logo;

  return (
    <div className="stream-admin-team">
      <div className="stream-admin-team__logo">
        {logo ? <img src={logo} alt={team?.name} /> : <span>?</span>}
      </div>
      <strong>{team?.name || "Equipo"}</strong>
    </div>
  );
}

function StreamAdmin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    competitions,
    competition,
    competitionId,
    changeCompetition,
  } = useCompetition();

  const [scope, setScope] = useState("today");
  const [matches, setMatches] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAuthError = useCallback(
    async (requestError) => {
      if (requestError?.response?.status !== 401) {
        return false;
      }

      await logout();
      navigate("/login?next=/admin/transmisiones", { replace: true });
      return true;
    },
    [logout, navigate],
  );

  const loadStreams = useCallback(async () => {
    const { data } = await axios.get(`${API_URL}/api/admin/streams`, {
      params: { competition: competitionId },
      withCredentials: true,
    });

    setStreams(Array.isArray(data?.streams) ? data.streams : []);
  }, [competitionId]);

  const loadMatches = useCallback(async () => {
    const { data } = await axios.get(`${API_URL}/api/live`, {
      params: { scope, competition: competitionId },
    });

    setMatches(Array.isArray(data?.matches) ? data.matches : []);
  }, [scope, competitionId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        await Promise.all([loadMatches(), loadStreams()]);
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        if (await handleAuthError(requestError)) {
          return;
        }

        setError(
          requestError?.response?.data?.detail ||
            requestError?.message ||
            "No fue posible cargar el panel.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [handleAuthError, loadMatches, loadStreams]);

  useEffect(() => {
    setSelectedMatch(null);
    setForm(null);
    setMessage("");
    setError("");
  }, [scope, competitionId]);

  const configuredByMatch = useMemo(() => {
    return matches.reduce((result, match) => {
      const stream = streams.find((item) => streamMatchesMatch(item, match));

      if (stream) {
        result[String(match.id)] = stream;
      }

      return result;
    }, {});
  }, [matches, streams]);

  const selectMatch = (match) => {
    const existing = streams.find((stream) =>
      streamMatchesMatch(stream, match),
    );

    setSelectedMatch(match);
    setForm(createFormFromMatch(match, existing));
    setMessage("");
    setError("");
  };

  const updateSource = (index, field, value) => {
    setForm((current) => ({
      ...current,
      sources: current.sources.map((source, sourceIndex) =>
        sourceIndex === index
          ? {
              ...source,
              [field]: value,
            }
          : source,
      ),
    }));
  };

  const addSource = () => {
    setForm((current) => ({
      ...current,
      sources: [...current.sources, emptySource(current.sources.length + 1)],
    }));
  };

  const removeSource = (index) => {
    setForm((current) => ({
      ...current,
      sources: current.sources.filter(
        (_, sourceIndex) => sourceIndex !== index,
      ),
    }));
  };

  const save = async () => {
    if (!form || saving) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        competition: competitionId,
        sources: form.sources.map((source, index) => ({
          id: source.id || `fuente-${index + 1}`,
          name: source.name || `Fuente ${index + 1}`,
          type: "iframe",
          url: source.url,
        })),
      };

      const { data } = form.id
        ? await axios.put(
            `${API_URL}/api/admin/streams/${encodeURIComponent(form.id)}`,
            payload,
            { withCredentials: true },
          )
        : await axios.post(`${API_URL}/api/admin/streams`, payload, {
            withCredentials: true,
          });

      await loadStreams();

      setForm((current) => ({
        ...current,
        id: data?.stream?.id || current.id,
      }));
      setMessage("Transmisión guardada correctamente.");
    } catch (requestError) {
      if (await handleAuthError(requestError)) {
        return;
      }

      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          "No fue posible guardar la transmisión.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeStream = async () => {
    if (!form?.id || saving) {
      return;
    }

    const result = await Swal.fire({
      title: "¿Estas seguro?",
      text: "No podras revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar!",
      cancelButtonText: "Cancelar",
    });

    // Si presiona Cancelar, solo se cierra el modal
    if (!result.isConfirmed) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await axios.delete(
        `${API_URL}/api/admin/streams/${encodeURIComponent(form.id)}`,
        {
          params: { competition: competitionId },
          withCredentials: true,
        },
      );

      await loadStreams();
      setForm(createFormFromMatch(selectedMatch));

      await Swal.fire({
        title: "Eliminado!",
        text: "La transmisión ha sido eliminada.",
        icon: "success",
      });

      setMessage("Transmisión eliminada.");
    } catch (requestError) {
      if (await handleAuthError(requestError)) {
        return;
      }

      setError(
        requestError?.response?.data?.detail ||
          "No fue posible eliminar la transmisión.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="stream-admin-page">
        <div className="stream-admin-shell">
          <section className="stream-admin-heading">
            <div>
              <span>GOALX - PANEL DE ADMINISTRACIÓN</span>
              <h1>Transmisiones</h1>
              <p>
                Selecciona un partido del calendario y administra las fuentes
                que aparecerán en GoalX.
              </p>
            </div>

            <div className="stream-admin-heading__actions">
              <label className="stream-admin-competition">
                <span>Competición</span>
                <select
                  value={competitionId}
                  onChange={(event) => changeCompetition(event.target.value)}
                >
                  {competitions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="stream-admin-user">
                <span>Sesión</span>
              <strong>{user?.username}</strong>
                <small>{user?.role}</small>
              </div>
            </div>
          </section>

          <div className="stream-admin-grid">
            <section className="stream-admin-matches">
              <div className="stream-admin-panel-heading">
                <div>
                  <span>CALENDARIO</span>
                  <h2>Partidos</h2>
                </div>

                <div className="stream-admin-tabs">
                  <button
                    type="button"
                    className={scope === "today" ? "active" : ""}
                    onClick={() => setScope("today")}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    className={scope === "upcoming" ? "active" : ""}
                    onClick={() => setScope("upcoming")}
                  >
                    {competition?.upcoming_scope_label || "Próximos"}
                  </button>
                  <button
                    type="button"
                    className={scope === "next" ? "active" : ""}
                    onClick={() => setScope("next")}
                  >
                    {competition?.next_scope_label || "Próxima jornada"}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="stream-admin-empty">Cargando partidos...</div>
              ) : matches.length === 0 ? (
                <div className="stream-admin-empty">
                  No hay partidos disponibles en esta sección.
                </div>
              ) : (
                <div className="stream-admin-match-list">
                  {matches.map((match) => {
                    const configured = configuredByMatch[String(match.id)];
                    const selected = selectedMatch?.id === match.id;

                    return (
                      <button
                        key={match.id}
                        type="button"
                        className={`stream-admin-match ${selected ? "selected" : ""}`}
                        onClick={() => selectMatch(match)}
                      >
                        <div className="stream-admin-match__top">
                          <span>{match.time_local || "NS"}</span>
                          <small className={configured ? "configured" : ""}>
                            {configured ? "CONFIGURADO" : "SIN FUENTE"}
                          </small>
                        </div>

                        <div className="stream-admin-match__teams">
                          <TeamMini team={match.home} />
                          <b>vs</b>
                          <TeamMini team={match.away} />
                        </div>

                        <div className="stream-admin-match__meta">
                          {match.date_local || competition?.name || "Competición"}
                          {match.league?.round
                            ? ` · ${match.league.round}`
                            : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="stream-admin-editor">
              {!form ? (
                <div className="stream-admin-editor-empty">
                  <span>GOALX EN VIVO</span>
                  <h2>Selecciona un partido</h2>
                  <p>
                    Aquí podrás agregar, editar, activar o eliminar sus fuentes
                    de transmisión.
                  </p>
                </div>
              ) : (
                <>
                  <div className="stream-admin-panel-heading">
                    <div>
                      <span>CONFIGURACIÓN</span>
                      <h2>
                        {form.home} vs {form.away}
                      </h2>
                      <p>
                        {form.date}
                        {form.time ? ` · ${form.time}` : ""}
                      </p>
                    </div>

                    <label className="stream-admin-switch">
                      <input
                        type="checkbox"
                        checked={form.enabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            enabled: event.target.checked,
                          }))
                        }
                      />
                      <span />
                      Activa
                    </label>
                  </div>

                  <label className="stream-admin-field">
                    <span>Título</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="stream-admin-sources-heading">
                    <div>
                      <span>FUENTES</span>
                      <h3>Señales disponibles</h3>
                    </div>

                    <button type="button" onClick={addSource}>
                      + Agregar fuente
                    </button>
                  </div>

                  <div className="stream-admin-sources">
                    {form.sources.map((source, index) => (
                      <div
                        className="stream-admin-source"
                        key={`${source.id}-${index}`}
                      >
                        <div className="stream-admin-source__top">
                          <strong>Fuente {index + 1}</strong>

                          {form.sources.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSource(index)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>

                        <div className="stream-admin-source__grid">
                          <label className="stream-admin-field">
                            <span>Nombre</span>
                            <input
                              type="text"
                              value={source.name}
                              onChange={(event) =>
                                updateSource(index, "name", event.target.value)
                              }
                            />
                          </label>

                          <label className="stream-admin-field stream-admin-field--url">
                            <span>URL iframe</span>
                            <input
                              type="url"
                              value={source.url}
                              onChange={(event) =>
                                updateSource(index, "url", event.target.value)
                              }
                              placeholder="https://proveedor.com/embed/..."
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {message && (
                    <div className="stream-admin-message">{message}</div>
                  )}
                  {error && <div className="stream-admin-error">{error}</div>}

                  <div className="stream-admin-actions">
                    {form.id && (
                      <button
                        type="button"
                        className="stream-admin-delete"
                        disabled={saving}
                        onClick={removeStream}
                      >
                        Eliminar transmisión
                      </button>
                    )}

                    <button
                      type="button"
                      className="stream-admin-save"
                      disabled={saving}
                      onClick={save}
                    >
                      {saving ? "Guardando..." : "Guardar transmisión"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default StreamAdmin;
