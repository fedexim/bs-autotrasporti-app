import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const login = async () => {
    setMsg("");

    if (!username.trim() || !password.trim()) {
      setMsg("❌ Inserisci username e password");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("autisti")
        .select("*")
        .eq("username", username.trim())
        .limit(1);

      if (error) {
        setMsg("❌ Errore server: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        setMsg("❌ Utente non trovato");
        return;
      }

      const user = data[0];

      if (user.password !== password.trim()) {
        setMsg("❌ Password errata");
        return;
      }

      // salva sessione
      localStorage.setItem(
        "autista",
        JSON.stringify({
          username: user.username,
          nome: user.nome,
          mezzo_principale: user.mezzo_principale,
        })
      );

      setMsg("✅ Login effettuato");

      // opzionale: refresh pagina o redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: any) {
      setMsg("❌ Errore: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>🚚 Login Autisti</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={login} style={{ padding: 10, width: "100%" }}>
        🔐 Accedi
      </button>

      <p style={{ marginTop: 10 }}>{msg}</p>
    </div>
  );
}
console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);