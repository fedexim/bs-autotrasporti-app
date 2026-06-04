import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [dati, setDati] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  const [meseSelezionato, setMeseSelezionato] = useState(
    new Date().getMonth()
  );
  const [annoSelezionato, setAnnoSelezionato] = useState(
    new Date().getFullYear()
  );

  // =========================
  // CARICA DATI
  // =========================
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

  // =========================
  // FILTRO
  // =========================
  const filtrati = dati.filter((r) => {
    return (
      (r.nome_autista || "").toLowerCase().includes(filtro.toLowerCase()) ||
      (r.targa || "").toLowerCase().includes(filtro.toLowerCase())
    );
  });

  // =========================
  // TOTALI (USATI NEL JSX → FIX VERCEL)
  // =========================
  const totaleKm = filtrati.reduce(
    (sum, r) => sum + ((r.km_fine || 0) - (r.km_inizio || 0)),
    0
  );

  const totaleLitri = filtrati.reduce(
    (sum, r) => sum + Number(r.litri || 0),
    0
  );

  const totaleSpesa = filtrati.reduce(
    (sum, r) => sum + Number(r.importo_carburante || 0),
    0
  );

  // =========================
  // EXPORT EXCEL
  // =========================
  function esportaExcel(nome: string, data: any[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dati");
    XLSX.writeFile(wb, nome);
  }

  function formatReport(data: any[]) {
    return data.map((r) => ({
      Autista: r.nome_autista,
      Targa: r.targa,
      Km: `${r.km_inizio} → ${r.km_fine}`,
      "Km Totali": (r.km_fine || 0) - (r.km_inizio || 0),
      Litri: r.litri,
      Importo: r.importo_carburante,
      Data: r.data ? new Date(r.data).toLocaleString() : ""
    }));
  }

  function formatRifornimenti(data: any[]) {
    return data.map((r) => ({
      Autista: r.nome_autista,
      Targa: r.targa,
      Litri: r.litri,
      Importo: r.importo_carburante,
      Data: r.data ? new Date(r.data).toLocaleString() : ""
    }));
  }

  // =========================
  // EXPORT GIORNO
  // =========================
  function exportGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const dataFiltrata = dati.filter(
      (r) => new Date(r.data).toISOString().split("T")[0] === oggi
    );

    esportaExcel(
      `REPORT_GIORNALIERO_${oggi}.xlsx`,
      formatReport(dataFiltrata)
    );
  }

  function exportRifornimentiGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const dataFiltrata = dati.filter(
      (r) => new Date(r.data).toISOString().split("T")[0] === oggi
    );

    esportaExcel(
      `RIFORNIMENTI_GIORNALIERO_${oggi}.xlsx`,
      formatRifornimenti(dataFiltrata)
    );
  }

  // =========================
  // EXPORT MENSILE CUSTOM
  // =========================
  function exportMensile() {
    const dataFiltrata = dati.filter((r) => {
      const d = new Date(r.data);
      return (
        d.getMonth() === meseSelezionato &&
        d.getFullYear() === annoSelezionato
      );
    });

    esportaExcel(
      `REPORT_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      formatReport(dataFiltrata)
    );
  }

  function exportRifornimentiMensile() {
    const dataFiltrata = dati.filter((r) => {
      const d = new Date(r.data);
      return (
        d.getMonth() === meseSelezionato &&
        d.getFullYear() === annoSelezionato
      );
    });

    esportaExcel(
      `RIFORNIMENTI_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      formatRifornimenti(dataFiltrata)
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Dashboard Flotta</h2>

      {/* FILTRO */}
      <input
        placeholder="Cerca autista o targa"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {/* MESE */}
      <div style={{ marginBottom: 10 }}>
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
          style={{ marginLeft: 10, width: 100 }}
        />
      </div>

      {/* 📊 TOTALI (FIX VERCEL) */}
      <div style={{ background: "#f4f4f4", padding: 10, marginBottom: 10 }}>
        <p>🚚 Km Totali: <b>{totaleKm}</b></p>
        <p>⛽ Litri Totali: <b>{totaleLitri}</b></p>
        <p>💰 Spesa Totale: <b>€ {totaleSpesa.toFixed(2)}</b></p>
      </div>

      {/* BOTTONI */}
      <button onClick={exportGiornaliero}>📊 Report Giornaliero</button>
      <button onClick={exportMensile}>📊 Report Mensile</button>
      <button onClick={exportRifornimentiGiornaliero}>
        ⛽ Rifornimenti Giorno
      </button>
      <button onClick={exportRifornimentiMensile}>
        ⛽ Rifornimenti Mese
      </button>

      <hr />

      {/* LOADING FIX */}
      {loading && <p>Caricamento...</p>}

      {/* LISTA */}
      {filtrati.map((r) => (
        <div
          key={r.id}
          style={{ padding: 10, border: "1px solid #ddd", marginBottom: 8 }}
        >
          <b>{r.nome_autista}</b> - {r.targa}
          <br />
          Km: {r.km_inizio} → {r.km_fine} | ⛽ {r.litri}L | €{" "}
          {r.importo_carburante}
        </div>
      ))}
    </div>
  );
}