import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin() {
    setMsg("🔄 Accesso in corso...");

    const { data, error } = await supabase
      .from("autisti")
      .select("*")
      .eq("username", username.trim())
      .eq("password", password.trim())
      .single();

    if (error || !data) {
      setMsg("❌ Username o password errati");
      return;
    }

    // 💾 salva sessione autista
    localStorage.setItem("autista", JSON.stringify(data));

    setMsg("✅ Benvenuto " + data.nome);

    // 🔁 vai al registro giornaliero
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  }

  return (
    <div style={{
      padding: 20,
      fontFamily: "Arial",
      maxWidth: 300,
      margin: "auto",
      marginTop: 100
    }}>
      <h2>🚚 BS AUTOTRASPORTI</h2>
      <h3>Login Autista</h3>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button
        onClick={handleLogin}
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Accedi
      </button>

      <p style={{ marginTop: 10 }}>{msg}</p>
    </div>
  );
}