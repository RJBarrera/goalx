// hooks/useMatchPrediction.js
import { useState } from "react";
import axios from "axios";

// Si API_URL lo tienes definido en constantes globales, impórtalo.
// Si no, déjalo aquí como lo tenías en tu archivo original.
const API_URL = "";

export default function useMatchPrediction(competitionId, form) {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analizarPartido = async (event) => {
    if (event) event.preventDefault();

    const local = form.local.trim();
    const visitante = form.visitante.trim();
    const arbitro = form.arbitro.trim();

    // Validación
    if (!local || !visitante || !arbitro) {
      setError("Selecciona el equipo local, visitante y árbitro.");
      return;
    }

    if (
      local.toLocaleLowerCase("es-MX") === visitante.toLocaleLowerCase("es-MX")
    ) {
      setError("El equipo local y visitante deben ser diferentes.");
      return;
    }

    // Petición
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(`${API_URL}/api/prediccion`, {
        competition: competitionId,
        local,
        visitante,
        arbitro,
      });

      if (!data?.success) {
        throw new Error(
          data?.message || "No fue posible calcular la predicción.",
        );
      }

      setResultado(data);

      // Scroll Resultados
      setTimeout(() => {
        document.getElementById("analitica")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (requestError) {
      console.error("Error calculando predicción:", requestError);

      setResultado(null);

      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          "No fue posible comunicarse con el motor de predicción.",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    resultado,
    setResultado,
    loading,
    error,
    setError,
    analizarPartido,
  };
}
