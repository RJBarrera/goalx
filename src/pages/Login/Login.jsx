import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getTeamLogo } from "../../utils/teamLogos";

import "./Login.css";

function Login() {
  // Hook de traduccion
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(location.search);
  const next = params.get("next");

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (next) {
      navigate(next, { replace: true });
      return;
    }

    navigate(user.role === "ADMIN" ? "/admin/transmisiones" : "/", {
      replace: true,
    });
  }, [loading, navigate, next, user]);

  const submit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError(t("login.errors.emptyFields"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const data = await login(username.trim(), password);
      const nextUser = data?.user;

      if (next) {
        navigate(next, { replace: true });
      } else {
        navigate(nextUser?.role === "ADMIN" ? "/admin/transmisiones" : "/", {
          replace: true,
        });
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail || t("login.errors.failedLogin"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="goalx-login-page">
        <div className="goalx-login-shell">
          <section className="goalx-login-panel">
            <div className="goalx-login-brand">
              <div className="goalx-login-logo">
                <img src={getTeamLogo("logo")} alt="GoalX" />
              </div>

              <div>
                <span>{t("login.brand.subtitle")}</span>
                <h1>{t("login.brand.title")}</h1>
                <p>{t("login.brand.description")}</p>
              </div>
            </div>

            <form className="goalx-login-form" onSubmit={submit}>
              <label>
                <span>{t("login.form.usernameLabel")}</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t("login.form.usernamePlaceholder")}
                />
              </label>

              <label>
                <span>{t("login.form.passwordLabel")}</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("login.form.passwordPlaceholder")}
                />
              </label>

              {error && <div className="goalx-login-error">{error}</div>}

              <button type="submit" disabled={submitting}>
                {submitting
                  ? t("login.form.submitting")
                  : t("login.form.submit")}
                <span>→</span>
              </button>
            </form>

            <div className="goalx-login-footer">
              <Link to="/">{t("login.footer.visitorLink")}</Link>

              <small>{t("login.footer.visitorNote")}</small>
            </div>
          </section>

          <aside className="goalx-login-side">
            <span>{t("login.side.brand")}</span>
            <h2>{t("login.side.title")}</h2>
            <p>{t("login.side.description")}</p>

            <div className="goalx-login-side__status">
              <i />
              <div>
                <strong>{t("login.side.statusTitle")}</strong>
                <small>{t("login.side.statusSubtitle")}</small>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Login;
