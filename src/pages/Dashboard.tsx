import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [dati, setDati] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtro, setFiltro] = useState("");

  const [giornoSelezionato, setGiornoSelezionato] = useState("");
  const [meseSelezionato, setMeseSelezionato] = useState(
    new Date().getMonth()
  );
  const [annoSelezionato, setAnnoSelezionato] = useState(
    new Date().getFullYear()
  );

  const [nonCompilati, setNonCompilati] = useState<any[]>([]);

  // 📊 CARICA DATI REGISTRI
  async function carica() {
    setLoading(true);

    const { data, error } = await supabase
      .from("registri_giornalieri")
      .select("*")
      .order("data", { ascending: false });

    if (!error) {
      setDati(data || []);
    } else {
      console.error(error.message);
    }

    setLoading(false);
  }

  // ⚠️ AUTISTI NON COMPILATI OGGI
  async function checkNonCompilati() {
    const oggi = new Date().toISOString().split("T")[0];

    const { data: autisti } = await supabase
      .from("autisti")
      .select("username, nome");

    const { data: registri } = await supabase
      .from("registri_giornalieri")
      .select("username, data")
      .gte("data", oggi);

    const compilati = new Set(registri?.map((r) => r.username));

    const mancanti = autisti?.filter((a) => !compilati.has(a.username));

    setNonCompilati(mancanti || []);
  }

  useEffect(() => {
    carica();
    checkNonCompilati();
  }, []);

  // 🔎 FILTRI
  const filtrati = dati.filter((r) => {
    const d = new Date(r.data);

    const matchTesto =
      (r.nome_autista || "").toLowerCase().includes(filtro.toLowerCase()) ||
      (r.targa || "").toLowerCase().includes(filtro.toLowerCase());

    const matchGiorno = giornoSelezionato
      ? d.toISOString().split("T")[0] === giornoSelezionato
      : true;

    const matchMeseAnno =
      d.getMonth() === meseSelezionato &&
      d.getFullYear() === annoSelezionato;

    return matchTesto && matchGiorno && matchMeseAnno;
  });

  // 📊 STATISTICHE
  const kmTotali = filtrati.reduce(
    (acc, r) =>
      acc +
      (Number(r.km_percorsi) ||
        Number(r.km_fine || 0) - Number(r.km_inizio || 0)),
    0
  );

  const litriTotali = filtrati.reduce(
    (acc, r) => acc + Number(r.litri || 0),
    0
  );

  const spesaTotale = filtrati.reduce(
    (acc, r) => acc + Number(r.importo_carburante || 0),
    0
  );

  const consumoMedio =
    litriTotali > 0 ? (kmTotali / litriTotali).toFixed(2) : "0";

  // 📦 EXPORT EXCEL
  function esportaExcel(nome: string, data: any[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, nome);
  }

  // 📊 REPORT GIORNALIERO
  function exportGiornaliero() {
    const data = filtrati.map((r) => ({
      Data: r.data ? new Date(r.data).toLocaleString("it-IT") : "-",
      Autista: r.nome_autista,
      Targa: r.targa,
      "Km Inizio": r.km_inizio,
      "Km Fine": r.km_fine,
      "Km Rifornimento": r.km_rifornimento || "-",
    }));

    esportaExcel(
      `REPORT_GIORNALIERO_${giornoSelezionato || "tutti"}.xlsx`,
      data
    );
  }

  // 📅 REPORT MENSILE
  function exportMensile() {
    const data = filtrati.map((r) => ({
      Data: r.data ? new Date(r.data).toLocaleString("it-IT") : "-",
      Autista: r.nome_autista,
      Targa: r.targa,
      "Km Inizio": r.km_inizio,
      "Km Fine": r.km_fine,
      "Km Rifornimento": r.km_rifornimento || "-",
    }));

    esportaExcel(
      `REPORT_MENSILE_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      data
    );
  }

  // ⛽ RIFORNIMENTI
  function exportRifornimenti() {
    const data = filtrati
      .filter((r) => r.litri || r.importo_carburante)
      .map((r) => ({
        Data: r.data ? new Date(r.data).toLocaleString("it-IT") : "-",
        Autista: r.nome_autista,
        Targa: r.targa,
        "Km Rifornimento": r.km_rifornimento,
        Litri: r.litri,
        Importo: r.importo_carburante,
      }));

    esportaExcel("RIFORNIMENTI.xlsx", data);
  }

  // 🗑 ELIMINA SINGOLO
  async function eliminaReport(id: string) {
    if (!confirm("Eliminare questo report?")) return;

    await supabase.from("registri_giornalieri").delete().eq("id", id);

    setDati((prev) => prev.filter((r) => r.id !== id));
  }

  // 🗑 ELIMINA FILTRATI
  async function eliminaFiltrati() {
    if (!confirm(`Eliminare ${filtrati.length} report?`)) return;

    const ids = filtrati.map((r) => r.id);

    await supabase.from("registri_giornalieri").delete().in("id", ids);

    setDati((prev) => prev.filter((r) => !ids.includes(r.id)));
  }

  // ⏳ FIX VERCEL ERROR (loading used)
  if (loading) {
    return <p style={{ padding: 20 }}>⏳ Caricamento dati...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Dashboard Flotta</h2>

      {/* ⚠️ NON COMPILATI */}
      <div style={{ marginBottom: 20 }}>
        <h3>⚠️ Autisti non compilati oggi</h3>

        {nonCompilati.length === 0 ? (
          <p>✅ Tutti hanno compilato</p>
        ) : (
          nonCompilati.map((a) => (
            <div key={a.username} style={{ color: "red" }}>
              ❌ {a.nome}
            </div>
          ))
        )}
      </div>

      {/* 📊 STATISTICHE */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #ddd", padding: 15 }}>
          🚚 Km Totali <h3>{kmTotali}</h3>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 15 }}>
          ⛽ Litri Totali <h3>{litriTotali.toFixed(2)}</h3>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 15 }}>
          💶 Spesa Totale <h3>€ {spesaTotale.toFixed(2)}</h3>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 15 }}>
          📈 Km/L <h3>{consumoMedio}</h3>
        </div>
      </div>

      {/* 🔎 FILTRI */}
      <input
        placeholder="Cerca autista o targa"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "10px 0" }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="date"
          value={giornoSelezionato}
          onChange={(e) => setGiornoSelezionato(e.target.value)}
        />

        <select
          value={meseSelezionato}
          onChange={(e) => setMeseSelezionato(Number(e.target.value))}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              Mese {i + 1}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={annoSelezionato}
          onChange={(e) => setAnnoSelezionato(Number(e.target.value))}
        />

        {/* EXPORT */}
        <button onClick={exportGiornaliero}>📊 Giornaliero</button>
        <button onClick={exportMensile}>📅 Mensile</button>
        <button onClick={exportRifornimenti}>⛽ Rifornimenti</button>

        <button
          onClick={eliminaFiltrati}
          style={{ background: "red", color: "white" }}
        >
          🗑 Elimina Filtrati
        </button>
      </div>

      <hr />

      {/* LISTA */}
      {filtrati.map((r) => (
        <div key={r.id} style={{ border: "1px solid #ddd", padding: 10 }}>
          <b>{r.nome_autista}</b>
          <br />
          🚚 {r.targa}
          <br />
          Km: {r.km_inizio} → {r.km_fine}
          <br />
          ⛽ {r.litri || 0} L
          <br />
          💶 € {r.importo_carburante || 0}
          <br />
          📅 {r.data ? new Date(r.data).toLocaleString("it-IT") : "-"}
          <br />

          <button
            onClick={() => eliminaReport(r.id)}
            style={{ background: "red", color: "white", marginTop: 8 }}
          >
            🗑 Elimina
          </button>
        </div>
      ))}
    </div>
  );
}