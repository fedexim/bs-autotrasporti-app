import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function RegistroGiornaliero() {
  const [kmInizio, setKmInizio] = useState("");
  const [kmFine, setKmFine] = useState("");
  const [litri, setLitri] = useState("");
  const [importo, setImporto] = useState("");

  const [targa, setTarga] = useState("");
  const [targaSecondaria, setTargaSecondaria] = useState("");

  const [usaAlternativo, setUsaAlternativo] = useState(false);

  const [mezzi, setMezzi] = useState<any[]>([]);

  const [fotoKm, setFotoKm] = useState<File | null>(null);
  const [fotoScontrino, setFotoScontrino] = useState<File | null>(null);

  const [msg, setMsg] = useState("");

  // 🚚 CARICA MEZZI
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("mezzi")
        .select("*");

      if (error) {
        console.error("Errore caricamento mezzi:", error.message);
        return;
      }

      setMezzi(data || []);
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
      if (!targa) {
        setMsg("❌ Seleziona il mezzo principale");
        return;
      }

      let urlKm = "";
      let urlScontrino = "";

      if (fotoKm) {
        urlKm = await uploadFile(fotoKm, "km");
      }

      if (fotoScontrino) {
        urlScontrino = await uploadFile(fotoScontrino, "scontrini");
      }

      const user = JSON.parse(localStorage.getItem("autista") || "{}");

      const { error } = await supabase
        .from("registri_giornalieri")
        .insert({
          username: user.username,
          nome_autista: user.nome,

          targa: targa,
          targa_secondaria: usaAlternativo ? targaSecondaria : null,

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

      // RESET
      setKmInizio("");
      setKmFine("");
      setLitri("");
      setImporto("");
      setTarga("");
      setTargaSecondaria("");
      setUsaAlternativo(false);
      setFotoKm(null);
      setFotoScontrino(null);

    } catch (err: any) {
      setMsg("❌ Errore: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🚚 Registro Giornaliero</h2>

      {/* 🚚 MEZZO PRINCIPALE */}
      <select
        value={targa}
        onChange={(e) => setTarga(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      >
        <option value="">Seleziona mezzo principale *</option>
        {mezzi.map((m) => (
          <option key={m.id} value={m.targa}>
            {m.targa}
          </option>
        ))}
      </select>

      {/* 🚚 TOGGLE ALTERNATIVO */}
      <label style={{ display: "block", marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={usaAlternativo}
          onChange={(e) => setUsaAlternativo(e.target.checked)}
        />
        {" "}Uso mezzo alternativo
      </label>

      {/* 🚚 MEZZO SECONDARIO (SELECT O INPUT FALLBACK) */}
      {usaAlternativo && (
        mezzi.length > 0 ? (
          <select
            value={targaSecondaria}
            onChange={(e) => setTargaSecondaria(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          >
            <option value="">Seleziona mezzo alternativo</option>
            {mezzi.map((m) => (
              <option key={m.id} value={m.targa}>
                {m.targa}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={targaSecondaria}
            onChange={(e) => setTargaSecondaria(e.target.value)}
            placeholder="Inserisci targa alternativa"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />
        )
      )}

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