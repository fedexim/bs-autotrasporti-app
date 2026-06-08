import { useEffect, useState } from "react";
import Login from "./pages/Login";
import RegistroGiornaliero from "./pages/RegistroGiornaliero";
import Dashboard from "./pages/Dashboard";
import CambiaPassword from "./pages/CambiaPassword";

export default function App() {
  const [autista, setAutista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState("home");

  useEffect(() => {
    const saved = localStorage.getItem("autista");

    if (saved) {
      try {
        setAutista(JSON.parse(saved));
      } catch (err) {
        console.error(err);
        localStorage.removeItem("autista");
      }
    }

    setLoading(false);
  }, []);

  function logout() {
    localStorage.removeItem("autista");
    setAutista(null);
  }

  if (loading) {
    return <div style={{ padding: 30, textAlign: "center" }}>Caricamento...</div>;
  }

  if (!autista) {
    return <Login />;
  }

  const isAdmin = autista.ruolo === "admin";

  return (
    <div>
      {/* TOP BAR */}
      <div
        style={{
          padding: 10,
          background: "#1976d2",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          👤 {autista.nome}

          {autista.targa && <> - 🚚 {autista.targa}</>}

          {isAdmin && <> (Amministratore)</>}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setPagina("password")}
            style={{
              background: "white",
              border: "none",
              borderRadius: 4,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            🔐 Password
          </button>

          <button
            onClick={logout}
            style={{
              background: "white",
              border: "none",
              borderRadius: 4,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* PAGINE */}
      {pagina === "password" ? (
        <CambiaPassword />
      ) : isAdmin ? (
        <Dashboard />
      ) : (
        <RegistroGiornaliero />
      )}
    </div>
  );
}