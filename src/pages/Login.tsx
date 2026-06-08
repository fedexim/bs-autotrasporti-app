import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setMsg("");

    if (!username.trim() || !password.trim()) {
      setMsg("❌ Inserisci username e password");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("autisti")
        .select("*")
        .eq("username", username.trim())
        .limit(1);

      if (error) {
        setMsg("❌ Errore server: " + error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMsg("❌ Utente non trovato");
        setLoading(false);
        return;
      }

      const user = data[0];

      if (user.password !== password.trim()) {
        setMsg("❌ Password errata");
        setLoading(false);
        return;
      }

      // 🟢 SALVATAGGIO COMPLETO UTENTE
      localStorage.setItem(
        "autista",
        JSON.stringify({
          id: user.id,
          username: user.username,
          nome: user.nome,
          targa: user.mezzo_principale,
          mezzo_principale: user.mezzo_principale,
          mezzo_alternativo: user.mezzo_alternativo,

          // 🆕 AGGIUNTO: ruolo (DEFAULT autista)
          ruolo: user.ruolo || "autista",
        })
      );

      setMsg("✅ Login effettuato");

      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: any) {
      setMsg("❌ Errore: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src="/logo.png" alt="Logo aziendale" style={styles.logo} />

        <h2 style={styles.title}>Login Autisti</h2>
        <p style={styles.subtitle}>Accedi al gestionale consegne</p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={login} style={styles.button} disabled={loading}>
          {loading ? "⏳ Accesso..." : "🔐 Accedi"}
        </button>

        {msg && <p style={styles.msg}>{msg}</p>}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    fontFamily: "Arial",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#ffffff",
    padding: 30,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    textAlign: "center",
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: "contain",
    marginBottom: 10,
  },
  title: {
    marginBottom: 5,
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 13,
    color: "#666",
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  msg: {
    marginTop: 12,
    fontSize: 13,
  },
};