import { useEffect, useState } from "react";
import Login from "./pages/Login";
import RegistroGiornaliero from "./pages/RegistroGiornaliero";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [autista, setAutista] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("autista");
    if (saved) {
      setAutista(JSON.parse(saved));
    }
  }, []);

  // 🔴 LOGOUT (opzionale)
  function logout() {
    localStorage.removeItem("autista");
    setAutista(null);
  }

  // ❌ NON LOGGATO → LOGIN
  if (!autista) {
    return <Login />;
  }

  return (
    <div>
      {/* TOP BAR */}
      <div
        style={{
          padding: 10,
          background: "#1976d2",
          color: "white",
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <div>
          👤 {autista.nome} - 🚚 {autista.targa}
        </div>

        <button onClick={logout} style={{ background: "white", border: "none" }}>
          Logout
        </button>
      </div>

      {/* 🔥 LOGICA RUOLI */}
      {autista.username === "admin" ? (
        // 🟡 ADMIN
        <Dashboard />
      ) : (
        // 🟢 AUTISTA
        <RegistroGiornaliero />
      )}
    </div>
  );
}