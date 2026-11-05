import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CompetitionProvider } from "./context/CompetitionContext";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";

function App() {
  return (
    <AuthProvider>
      <CompetitionProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/politica-de-privacidad" element={<PrivacyPolicy />} />
          {/* <Route path="/login" element={<Login />} /> */}
        </Routes>
      </CompetitionProvider>
    </AuthProvider>
  );
}

export default App;
