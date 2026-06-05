import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function RegistroGiornaliero() {
  const [kmInizio, setKmInizio] = useState("");
  const [kmFine, setKmFine] = useState("");
  const [kmRifornimento, setKmRifornimento] = useState("");

  const [litri, setLitri] = useState("");
  const [importo, setImporto] = useState("");

  const [targa, setTarga] = useState("");

  const [usaAlternativo, setUsaAlternativo] = useState(false);
  const [targaAlternativa, setTargaAlternativa] = useState("");

  const [fotoKm, setFotoKm] = useState<File | null>(null);
  const [fotoScontrino, setFotoScontrino] = useState<File | null>(null);

  const [msg, setMsg] = useState("");

  // ✔ USATO CORRETTAMENTE (fix TS6133)
  const mezziList = [
    "HB881JF",
    "HB232JH",
    "HB866JF",
    "HB877JF",
    "HB859JF",
    "HB882JF",
    "HB860JF",
    "HB883JF",
    "HB869JF",
    "HB857JF",
    "HB873JF",
    "HB862JF",
    "HB203JH",
    "GR701EP",
    "HA141WX",
  ];

  useEffect(() => {
    async function load() {
      const local = JSON.parse(localStorage.getItem("autista") || "{}");

      if (!local.username) return;

      const { data } = await supabase
        .from("autisti")
        .select("mezzo_principale")
        .eq("username", local.username)
        .single();

      setTarga(data?.mezzo_principale || "");
    }

    load();
  }, []);

  async function uploadFile(file: File, folder: string) {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("documenti-autisti")
      .upload(`${folder}/${fileName}`, file);

    if (error) throw error;

    return data.path;
  }

  async function invia() {
    setMsg("");

    // 🚚 KM INIZIO OBBLIGATORIO
    if (!kmInizio.trim()) {
      setMsg("❌ Inserire i Km Inizio");
      return;
    }

    // 🚚 KM FINE OBBLIGATORIO
    if (!kmFine.trim()) {
      setMsg("❌ Inserire i Km Fine");
      return;
    }

    if (Number(kmFine) <= Number(kmInizio)) {
      setMsg("❌ Km Fine deve essere maggiore di Km Inizio");
      return;
    }

    if (usaAlternativo && !targaAlternativa) {
      setMsg("❌ Selezionare mezzo alternativo");
      return;
    }

    const haLitri = litri.trim() !== "";
    const haImporto = importo.trim() !== "";
    const rifornimento = haLitri || haImporto;

    if (haLitri !== haImporto) {
      setMsg("❌ Inserire sia litri che importo");
      return;
    }

    // ⛽ BLOCCO RIFORNIMENTO
    if (rifornimento) {
      if (!kmRifornimento.trim()) {
        setMsg("❌ Inserire Km rifornimento");
        return;
      }

      if (!fotoScontrino) {
        setMsg("❌ Caricare scontrino carburante");
        return;
      }

      if (
        Number(kmRifornimento) < Number(kmInizio) ||
        Number(kmRifornimento) > Number(kmFine)
      ) {
        setMsg("❌ Km rifornimento non valido");
        return;
      }
    }

    setMsg("⏳ Invio in corso...");

    try {
      const local = JSON.parse(localStorage.getItem("autista") || "{}");

      let urlKm = "";
      let urlScontrino = "";

      // 📸 FOTO KM SEMPRE OPZIONALE
      if (fotoKm) {
        urlKm = await uploadFile(fotoKm, "km");
      }

      if (fotoScontrino) {
        urlScontrino = await uploadFile(fotoScontrino, "scontrini");
      }

      const { error } = await supabase.from("registri_giornalieri").insert({
        username: local.username,
        nome_autista: local.nome,

        targa:
          usaAlternativo && targaAlternativa
            ? targaAlternativa
            : targa,

        km_inizio: Number(kmInizio),
        km_fine: Number(kmFine),
        km_percorsi: Number(kmFine) - Number(kmInizio),

        km_rifornimento: kmRifornimento.trim()
          ? Number(kmRifornimento)
          : null,

        litri: litri.trim() ? Number(litri) : null,
        importo_carburante: importo.trim() ? Number(importo) : null,

        foto_km: urlKm || null,
        foto_scontrino: urlScontrino || null,

        data: new Date(),
      });

      if (error) {
        setMsg("❌ Errore DB: " + error.message);
        return;
      }

      setMsg("✅ Registro salvato correttamente");

      // reset
      setKmInizio("");
      setKmFine("");
      setKmRifornimento("");
      setLitri("");
      setImporto("");
      setFotoKm(null);
      setFotoScontrino(null);
      setUsaAlternativo(false);
      setTargaAlternativa("");
    } catch (err: any) {
      setMsg("❌ Errore: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🚚 Registro Giornaliero</h2>

      <p>
        <b>Mezzo assegnato:</b> {targa || "Caricamento..."}
      </p>

      {usaAlternativo && (
        <select
          value={targaAlternativa}
          onChange={(e) => setTargaAlternativa(e.target.value)}
        >
          <option value="">Seleziona mezzo alternativo</option>
          {mezziList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )}

      <br /><br />

      <input
        type="number"
        placeholder="Km Inizio"
        value={kmInizio}
        onChange={(e) => setKmInizio(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Km Fine"
        value={kmFine}
        onChange={(e) => setKmFine(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Litri carburante"
        value={litri}
        onChange={(e) => setLitri(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        step="0.01"
        placeholder="Importo carburante"
        value={importo}
        onChange={(e) => setImporto(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Km rifornimento"
        value={kmRifornimento}
        onChange={(e) => setKmRifornimento(e.target.value)}
      />

      <br /><br />

      <p>📸 Foto contachilometri (OPZIONALE)</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFotoKm(e.target.files?.[0] || null)}
      />

      <p>⛽ Scontrino carburante (OBBLIGATORIO se rifornimento)</p>
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