import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [dati, setDati] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtro, setFiltro] = useState("");

  const [giornoSelezionato, setGiornoSelezionato] = useState("");
  const [meseSelezionato, setMeseSelezionato] = useState(new Date().getMonth());
  const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());

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
  // FILTRO COMPLETO
  // =========================
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

  // =========================
  // EXCEL
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
  // EXPORT
  // =========================
  function exportGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const dataFiltrata = dati.filter(
      (r) => new Date(r.data).toISOString().split("T")[0] === oggi
    );

    esportaExcel("REPORT_GIORNALIERO.xlsx", formatReport(dataFiltrata));
  }

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

  function exportRifornimentiGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const dataFiltrata = dati.filter(
      (r) => new Date(r.data).toISOString().split("T")[0] === oggi
    );

    esportaExcel("RIFORNIMENTI_GIORNALIERI.xlsx", formatRifornimenti(dataFiltrata));
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

  // =========================
  // DELETE
  // =========================
  async function eliminaReport(id: string) {
    await supabase.from("registri_giornalieri").delete().eq("id", id);
    setDati((prev) => prev.filter((r) => r.id !== id));
  }

  async function eliminaFiltrati() {
    const ids = filtrati.map((r) => r.id);

    await supabase.from("registri_giornalieri").delete().in("id", ids);

    setDati((prev) => prev.filter((r) => !ids.includes(r.id)));
  }

  // =========================
  // UI
  // =========================
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

      {/* GIORNO */}
      <input
        type="date"
        value={giornoSelezionato}
        onChange={(e) => setGiornoSelezionato(e.target.value)}
        style={{ padding: 10, marginBottom: 10 }}
      />

      {/* MESE ANNO */}
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

      {/* BOTTONI */}
      <button onClick={exportGiornaliero}>📊 Giornaliero</button>
      <button onClick={exportMensile}>📊 Mensile</button>
      <button onClick={exportRifornimentiGiornaliero}>⛽ Riforn. Giorno</button>
      <button onClick={exportRifornimentiMensile}>⛽ Riforn. Mese</button>

      <button onClick={eliminaFiltrati} style={{ color: "red", marginLeft: 10 }}>
        🗑 Elimina Filtrati
      </button>

      <hr />

      {/* LISTA */}
      {loading && <p>Caricamento...</p>}

      {filtrati.map((r) => (
        <div
          key={r.id}
          style={{ padding: 10, border: "1px solid #ddd", marginBottom: 8 }}
        >
          <b>{r.nome_autista}</b> - {r.targa}
          <br />
          Km: {r.km_inizio} → {r.km_fine} | ⛽ {r.litri}L | €{" "}
          {r.importo_carburante}

          <br />

          <button
            onClick={() => eliminaReport(r.id)}
            style={{ background: "red", color: "white", marginTop: 5 }}
          >
            🗑 Elimina
          </button>
        </div>
      ))}
    </div>
  );
}