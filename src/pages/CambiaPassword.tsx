import { useState } from "react";
import { supabase } from "../services/supabase";

export default function CambiaPassword() {
  const [vecchia, setVecchia] = useState("");
  const [nuova, setNuova] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function salva() {
    setMsg("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("autista") || "{}");

      if (!user.username) {
        setMsg("❌ Utente non valido");
        setLoading(false);
        return;
      }

      // 🔍 prendo password attuale
      const { data, error } = await supabase
        .from("autisti")
        .select("password")
        .eq("username", user.username)
        .single();

      if (error || !data) {
        setMsg("❌ Errore nel recupero dati");
        setLoading(false);
        return;
      }

      // 🔐 controllo password attuale
      if (data.password !== vecchia) {
        setMsg("❌ Password attuale errata");
        setLoading(false);
        return;
      }

      // 💾 UPDATE PASSWORD (FIX DEFINITIVO)
      const { data: updateData, error: updateError } = await supabase
        .from("autisti")
        .update({ password: nuova })
        .eq("username", user.username)
        .select(); // 🔥 fondamentale per verificare update

      console.log("UPDATE RESULT:", updateData, updateError);

      if (updateError) {
        setMsg("❌ Errore aggiornamento password: " + updateError.message);
        setLoading(false);
        return;
      }

      if (!updateData || updateData.length === 0) {
        setMsg("❌ Nessuna riga aggiornata (controlla RLS o username)");
        setLoading(false);
        return;
      }

      setMsg("✅ Password aggiornata con successo");

      setVecchia("");
      setNuova("");
    } catch (err: any) {
      setMsg("❌ Errore: " + err.message);
    }

    setLoading(false);
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

      <button onClick={salva} disabled={loading} style={{ padding: 10 }}>
        {loading ? "⏳ Salvataggio..." : "💾 Salva Password"}
      </button>

      <p>{msg}</p>
    </div>
  );
}