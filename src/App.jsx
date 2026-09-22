import { Route, Routes } from "react-router-dom";
import AdminRoute from "./components/auth/AdminRoute";
import { AuthProvider } from "./context/AuthContext";
import { CompetitionProvider } from "./context/CompetitionContext";
import StreamAdmin from "./pages/admin/StreamAdmin";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import WatchMatch from "./pages/WatchMatch/WatchMatch";

function App() {
  return (
    <AuthProvider>
      <CompetitionProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/politica-de-privacidad" element={<PrivacyPolicy />} />

          <Route path="/ver-partido/:streamId" element={<WatchMatch />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/admin/transmisiones"
            element={
              <AdminRoute>
                <StreamAdmin />
              </AdminRoute>
            }
          />
        </Routes>
      </CompetitionProvider>
    </AuthProvider>
  );
}

export default App;
