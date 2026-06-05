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

  async function carica() {
    setLoading(true);

    const { data, error } = await supabase
      .from("registri_giornalieri")
      .select("*")
      .order("data", { ascending: false });

    if (!error) setDati(data || []);

    setLoading(false);
  }

  useEffect(() => {
    carica();
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

  // 📦 EXPORT BASE
  function esportaExcel(nome: string, data: any[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, nome);
  }

  // 📊 REPORT GIORNALIERO
  function exportGiornaliero() {
    const data = filtrati.map((r) => ({
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

  // ⛽ RIFORNIMENTI GIORNALIERI
  function exportRifornimentiGiornalieri() {
    const data = filtrati
      .filter((r) => r.litri || r.importo_carburante)
      .map((r) => ({
        Autista: r.nome_autista,
        Targa: r.targa,
        "Km Rifornimento": r.km_rifornimento,
        Litri: r.litri,
        Importo: r.importo_carburante,
      }));

    esportaExcel("RIFORNIMENTI_GIORNALIERI.xlsx", data);
  }

  // 📆 RIFORNIMENTI MENSILI
  function exportRifornimentiMensili() {
    const data = filtrati
      .filter((r) => r.litri || r.importo_carburante)
      .map((r) => ({
        Autista: r.nome_autista,
        Targa: r.targa,
        "Km Rifornimento": r.km_rifornimento,
        Litri: r.litri,
        Importo: r.importo_carburante,
      }));

    esportaExcel(
      `RIFORNIMENTI_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      data
    );
  }

  // 🗑 ELIMINA
  async function eliminaReport(id: string) {
    if (!confirm("Eliminare questo report?")) return;

    await supabase.from("registri_giornalieri").delete().eq("id", id);

    setDati((prev) => prev.filter((r) => r.id !== id));
  }

  async function eliminaFiltrati() {
    if (!confirm(`Eliminare ${filtrati.length} report?`)) return;

    const ids = filtrati.map((r) => r.id);

    await supabase.from("registri_giornalieri").delete().in("id", ids);

    setDati((prev) => prev.filter((r) => !ids.includes(r.id)));
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Dashboard Flotta</h2>

      {/* STATISTICHE */}
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

      {/* FILTRI */}
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

        {/* EXPORT BUTTONS */}
        <button onClick={exportGiornaliero}>📊 Giornaliero</button>
        <button onClick={exportMensile}>📅 Mensile</button>
        <button onClick={exportRifornimentiGiornalieri}>⛽ Rif. Giornalieri</button>
        <button onClick={exportRifornimentiMensili}>📆 Rif. Mensili</button>

        <button
          onClick={eliminaFiltrati}
          style={{ background: "red", color: "white" }}
        >
          🗑 Elimina Filtrati
        </button>
      </div>

      <hr />

      {loading && <p>Caricamento...</p>}

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
          📅 {r.data ? new Date(r.data).toLocaleString() : "-"}
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