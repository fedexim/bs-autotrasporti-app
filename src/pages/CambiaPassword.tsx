import { useState } from "react";
import { supabase } from "../services/supabase";

export default function CambiaPassword() {
  const [vecchia, setVecchia] = useState("");
  const [nuova, setNuova] = useState("");
  const [msg, setMsg] = useState("");

  async function salva() {
    setMsg("");

    const user = JSON.parse(localStorage.getItem("autista") || "{}");

    if (!user.username) {
      setMsg("❌ Utente non valido");
      return;
    }

    // 🔍 prendo password attuale dal DB
    const { data, error } = await supabase
      .from("autisti")
      .select("password")
      .eq("username", user.username)
      .single();

    if (error) {
      setMsg("❌ Errore server");
      return;
    }

    // 🔐 controllo vecchia password
    if (data.password !== vecchia) {
      setMsg("❌ Password attuale errata");
      return;
    }

    // 💾 aggiorno password
    const { error: updateError } = await supabase
      .from("autisti")
      .update({ password: nuova })
      .eq("username", user.username);

    if (updateError) {
      setMsg("❌ Errore aggiornamento password");
      return;
    }

    setMsg("✅ Password aggiornata con successo");

    setVecchia("");
    setNuova("");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🔐 Cambia Password</h2>

      <input
        type="password"
        placeholder="Password attuale"
        value={vecchia}
        onChange={(e) => setVecchia(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Nuova password"
        value={nuova}
        onChange={(e) => setNuova(e.target.value)}
      />

      <br /><br />

      <button onClick={salva} style={{ padding: 10 }}>
        💾 Salva nuova password
      </button>

      <p>{msg}</p>
    </div>
  );
}