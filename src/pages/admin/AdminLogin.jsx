import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Admin.css";

const API_URL = "";

function AdminLogin() {
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        await axios.get(`${API_URL}/api/admin/session`, {
          withCredentials: true,
        });

        if (mounted) {
          navigate("/admin/transmisiones", {
            replace: true,
          });
        }
      } catch {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const login = async (event) => {
    event.preventDefault();

    if (!user.trim() || !password) {
      setError("Captura usuario y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${API_URL}/api/admin/login`,
        {
          user: user.trim(),
          password,
        },
        {
          withCredentials: true,
        },
      );

      navigate("/admin/transmisiones", {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "No fue posible iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="goalx-admin-login-page">
        <div className="goalx-admin-login-loading">Validando sesión...</div>
      </main>
    );
  }

  return (
    <main className="goalx-admin-login-page">
      <div className="goalx-admin-login-shell">
        <Link className="goalx-admin-back" to="/">
          ← Volver a GoalX
        </Link>

        <section className="goalx-admin-login-card">
          <div className="goalx-admin-brand">
            <span>GOALX</span>
            <strong>ADMIN</strong>
          </div>

          <div className="goalx-admin-login-heading">
            <span>ACCESO RESTRINGIDO</span>
            <h1>Panel administrativo</h1>
            <p>
              Inicia sesión para administrar las transmisiones disponibles en
              GoalX.
            </p>
          </div>

          <form onSubmit={login}>
            <label>
              Usuario
              <input
                type="text"
                autoComplete="username"
                value={user}
                onChange={(event) => setUser(event.target.value)}
                placeholder="Usuario administrador"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña"
              />
            </label>

            {error && <div className="goalx-admin-form-error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default AdminLogin;
