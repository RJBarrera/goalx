import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL = "";
const STORAGE_KEY = "goalx_selected_competition";

const CompetitionContext = createContext(null);

const getCompetitionFromUrl = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  return String(params.get("competition") || "").trim();
};

const updateCompetitionInUrl = (competitionId) => {
  if (typeof window === "undefined" || window.location.pathname !== "/") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("competition", competitionId);
  window.history.replaceState(window.history.state, "", url);
};

export function CompetitionProvider({ children }) {
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [defaultCompetitionId, setDefaultCompetitionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCompetitions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.get(`${API_URL}/api/competitions`);

      if (!data?.success) {
        throw new Error("No fue posible cargar las competiciones.");
      }

      const nextCompetitions = Array.isArray(data?.competitions)
        ? data.competitions
        : [];

      const backendDefault = String(data?.default || "").trim();
      const urlCompetition = getCompetitionFromUrl();
      const storedCompetition = String(
        window.localStorage.getItem(STORAGE_KEY) || "",
      ).trim();

      const availableIds = new Set(
        nextCompetitions.map((item) => String(item?.id || "").trim()),
      );

      const nextCompetitionId =
        [urlCompetition, storedCompetition, backendDefault].find((candidate) =>
          availableIds.has(candidate),
        ) || String(nextCompetitions[0]?.id || "").trim();

      setCompetitions(nextCompetitions);
      setDefaultCompetitionId(backendDefault || nextCompetitionId);
      setCompetitionId(nextCompetitionId);

      if (nextCompetitionId) {
        window.localStorage.setItem(STORAGE_KEY, nextCompetitionId);
        updateCompetitionInUrl(nextCompetitionId);
      }
    } catch (requestError) {
      console.error("GoalX competitions:", requestError);
      setCompetitions([]);
      setCompetitionId("");
      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          "No fue posible cargar las competiciones.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCompetitions();
  }, [refreshCompetitions]);

  const changeCompetition = useCallback(
    (nextCompetitionId) => {
      const normalizedId = String(nextCompetitionId || "").trim();

      if (!normalizedId) {
        return false;
      }

      const exists = competitions.some(
        (item) => String(item?.id || "").trim() === normalizedId,
      );

      if (!exists) {
        return false;
      }

      setCompetitionId(normalizedId);
      window.localStorage.setItem(STORAGE_KEY, normalizedId);
      updateCompetitionInUrl(normalizedId);
      return true;
    },
    [competitions],
  );

  const competition = useMemo(
    () =>
      competitions.find(
        (item) => String(item?.id || "").trim() === competitionId,
      ) || null,
    [competitions, competitionId],
  );

  const value = useMemo(
    () => ({
      competitions,
      competition,
      competitionId,
      defaultCompetitionId,
      loading,
      error,
      changeCompetition,
      refreshCompetitions,
    }),
    [
      competitions,
      competition,
      competitionId,
      defaultCompetitionId,
      loading,
      error,
      changeCompetition,
      refreshCompetitions,
    ],
  );

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetition() {
  const context = useContext(CompetitionContext);

  if (!context) {
    throw new Error(
      "useCompetition debe usarse dentro de CompetitionProvider.",
    );
  }

  return context;
}
