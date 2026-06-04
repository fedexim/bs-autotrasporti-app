import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function RegistroGiornaliero() {
  const [kmInizio, setKmInizio] = useState("");
  const [kmFine, setKmFine] = useState("");
  const [litri, setLitri] = useState("");
  const [importo, setImporto] = useState("");

  const [targa, setTarga] = useState<string>("");

  const [fotoKm, setFotoKm] = useState<File | null>(null);
  const [fotoScontrino, setFotoScontrino] = useState<File | null>(null);

  const [msg, setMsg] = useState("");

  // 🚚 CARICA MEZZO PRINCIPALE DA SUPABASE
  useEffect(() => {
    async function load() {
      const local = JSON.parse(localStorage.getItem("autista") || "{}");

      if (!local.username) {
        console.log("Nessun utente in localStorage");
        return;
      }

      const { data, error } = await supabase
        .from("autisti")
        .select("mezzo_principale")
        .eq("username", local.username)
        .single();

      if (error) {
        console.error("Errore caricamento autista:", error.message);
        return;
      }

      console.log("Autista caricato:", data);

      // 🚚 SET DIRETTO DEL MEZZO PRINCIPALE
      setTarga(data?.mezzo_principale || "");
    }

    load();
  }, []);

  // 📸 UPLOAD FILE
  async function uploadFile(file: File, folder: string) {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("documenti-autisti")
      .upload(`${folder}/${fileName}`, file);

    if (error) throw error;

    return data.path;
  }

  // 🚀 INVIO REGISTRO
  async function invia() {
    setMsg("⏳ Invio in corso...");

    try {
      const local = JSON.parse(localStorage.getItem("autista") || "{}");

      let urlKm = "";
      let urlScontrino = "";

      if (fotoKm) urlKm = await uploadFile(fotoKm, "km");
      if (fotoScontrino) urlScontrino = await uploadFile(fotoScontrino, "scontrini");

      const { error } = await supabase
        .from("registri_giornalieri")
        .insert({
          username: local.username,
          nome_autista: local.nome,

          // 🚚 SEMPRE DA SUPABASE
          targa: targa,

          km_inizio: Number(kmInizio),
          km_fine: Number(kmFine),
          litri: Number(litri),
          importo_carburante: Number(importo),

          foto_km: urlKm || null,
          foto_scontrino: urlScontrino || null,

          data: new Date(),
        });

      if (error) {
        setMsg("❌ Errore DB: " + error.message);
        return;
      }

      setMsg("✅ Registro salvato!");

      setKmInizio("");
      setKmFine("");
      setLitri("");
      setImporto("");
      setFotoKm(null);
      setFotoScontrino(null);

    } catch (err: any) {
      setMsg("❌ Errore: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🚚 Registro Giornaliero</h2>

      {/* 🚚 MOSTRA SEMPRE MEZZO PRINCIPALE */}
      <p>
        <b>Mezzo assegnato:</b>{" "}
        {targa ? targa : "❌ Nessun mezzo assegnato"}
      </p>

      <input
        placeholder="Km Inizio"
        value={kmInizio}
        onChange={(e) => setKmInizio(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Km Fine"
        value={kmFine}
        onChange={(e) => setKmFine(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Litri carburante"
        value={litri}
        onChange={(e) => setLitri(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Importo carburante"
        value={importo}
        onChange={(e) => setImporto(e.target.value)}
      />
      <br /><br />

      {/* 📸 FOTO KM */}
      <p>📸 Foto contachilometri</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFotoKm(e.target.files?.[0] || null)}
      />

      {/* 📸 SCONTRINO */}
      <p>⛽ Scontrino carburante</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFotoScontrino(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={invia} style={{ padding: 10 }}>
        🚀 Invia Registro
      </button>

      <p>{msg}</p>
    </div>
  );
}