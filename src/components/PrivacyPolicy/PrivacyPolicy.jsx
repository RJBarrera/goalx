import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faShieldHalved,
  faCookieBite,
  faRectangleAd,
  faDatabase,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

import "./PrivacyPolicy.css";

const CONTACT_EMAIL = "contacto@goalx.com";

function PrivacyPolicy() {
  return (
    <main className="privacy-page">
      <div className="privacy-page__container">
        <Link to="/" className="privacy-page__back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Volver a GoalX
        </Link>

        <header className="privacy-page__header">
          <div className="privacy-page__icon">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>

          <div>
            <span className="privacy-page__eyebrow">LEGAL</span>
            <h1>Política de privacidad</h1>

            <p>Última actualización: 16 de septiembre de 2026</p>
          </div>
        </header>

        <section className="privacy-page__card">
          <p>
            En GoalX respetamos la privacidad de nuestros usuarios. Esta
            Política de privacidad explica de forma general qué información
            puede recopilarse al utilizar el sitio, cómo puede utilizarse y qué
            tecnologías de terceros pueden intervenir durante la navegación.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faDatabase} />
            Información que puede recopilarse
          </h2>

          <p>
            GoalX puede procesar información técnica generada durante el uso del
            sitio, como dirección IP, tipo de navegador, dispositivo, sistema
            operativo, páginas visitadas, fecha y hora de acceso y otros datos
            técnicos relacionados con la navegación.
          </p>

          <p>
            GoalX no solicita de forma directa información financiera,
            contraseñas bancarias ni datos de tarjetas de crédito para utilizar
            las funcionalidades públicas del sitio.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faCookieBite} />
            Cookies y tecnologías similares
          </h2>

          <p>
            GoalX y determinados proveedores externos pueden utilizar cookies,
            identificadores, balizas web u otras tecnologías similares para
            operar el sitio, medir su funcionamiento y mostrar publicidad.
          </p>

          <p>
            El usuario puede configurar su navegador para bloquear o eliminar
            cookies. Sin embargo, algunas funciones del sitio o determinados
            servicios de terceros podrían verse afectados.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faRectangleAd} />
            Google AdSense y publicidad
          </h2>

          <p>
            GoalX utiliza Google AdSense para mostrar anuncios. Google y otros
            proveedores externos pueden utilizar cookies para mostrar anuncios
            basados en visitas anteriores del usuario a GoalX o a otros sitios
            web.
          </p>

          <p>
            El uso de cookies publicitarias permite a Google y a sus socios
            mostrar anuncios que pueden estar relacionados con los intereses del
            usuario y con su actividad previa en Internet.
          </p>

          <p>
            Los usuarios pueden administrar o desactivar la publicidad
            personalizada desde la configuración de anuncios de Google.
          </p>

          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
            className="privacy-page__external"
          >
            Administrar preferencias de anuncios de Google
          </a>
        </section>

        <section className="privacy-page__section">
          <h2>Consentimiento y gestión de privacidad</h2>

          <p>
            Cuando sea requerido por la legislación aplicable, GoalX podrá
            mostrar un mensaje de consentimiento administrado mediante una
            plataforma de gestión de consentimiento certificada por Google.
          </p>

          <p>
            Dicho mecanismo permite al usuario aceptar, rechazar o administrar
            determinadas finalidades relacionadas con cookies y publicidad,
            según su ubicación y la normativa aplicable.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>Proveedores externos</h2>

          <p>
            Algunos anuncios pueden ser suministrados por Google o por redes y
            proveedores de publicidad autorizados. Estos terceros pueden
            utilizar tecnologías propias de medición, publicidad o
            identificación de dispositivos de acuerdo con sus respectivas
            políticas.
          </p>

          <p>
            El tratamiento realizado directamente por terceros se encuentra
            sujeto a sus propias políticas y condiciones.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>Finalidad de la información</h2>

          <p>La información técnica recopilada puede utilizarse para:</p>

          <ul>
            <li>operar y mantener el funcionamiento del sitio;</li>
            <li>analizar el rendimiento y uso de GoalX;</li>
            <li>mejorar la experiencia del usuario;</li>
            <li>detectar errores o comportamientos anómalos;</li>
            <li>mostrar y medir publicidad;</li>
            <li>cumplir obligaciones legales aplicables.</li>
          </ul>
        </section>

        <section className="privacy-page__section">
          <h2>Enlaces a sitios externos</h2>

          <p>
            GoalX puede contener enlaces a sitios externos. GoalX no controla
            las políticas de privacidad, contenido ni prácticas de esos sitios.
            Se recomienda revisar sus respectivas políticas antes de
            proporcionar información.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>Cambios a esta política</h2>

          <p>
            Esta Política de privacidad puede actualizarse cuando cambien las
            funcionalidades de GoalX, los proveedores utilizados o las
            obligaciones legales aplicables. La fecha de actualización se
            mostrará al inicio del documento.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2>
            <FontAwesomeIcon icon={faEnvelope} />
            Contacto
          </h2>

          <p>
            Si tienes alguna pregunta relacionada con esta Política de
            privacidad, puedes comunicarte a:
          </p>

          <a href={`mailto:${CONTACT_EMAIL}`} className="privacy-page__email">
            {CONTACT_EMAIL}
          </a>
        </section>

        <footer className="privacy-page__note">
          <p>
            GoalX es una plataforma informativa de análisis, estadísticas y
            predicciones deportivas. La información presentada no constituye
            asesoría financiera ni garantiza resultados futuros.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default PrivacyPolicy;
