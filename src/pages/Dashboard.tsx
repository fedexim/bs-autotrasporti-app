import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [dati, setDati] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  const [meseSelezionato, setMeseSelezionato] = useState(new Date().getMonth());
  const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());

  // =========================
  // 📦 CARICA DATI
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
  // 🔎 FILTRO
  // =========================
  const filtrati = dati.filter((r) => {
    return (
      (r.nome_autista || "").toLowerCase().includes(filtro.toLowerCase()) ||
      (r.targa || "").toLowerCase().includes(filtro.toLowerCase())
    );
  });

  // =========================
  // 📊 TOTALI
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
  // 📦 EXCEL
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
      "Km Inizio": r.km_inizio,
      "Km Fine": r.km_fine,
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
  // 📅 EXPORT MENSILE CUSTOM
  // =========================
  function exportReportMensile() {
    const datiFiltrati = dati.filter((r) => {
      const d = new Date(r.data);
      return (
        d.getMonth() === meseSelezionato &&
        d.getFullYear() === annoSelezionato
      );
    });

    esportaExcel(
      `REPORT_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      formatReport(datiFiltrati)
    );
  }

  // =========================
  // 📊 EXPORT GIORNALIERO
  // =========================
  function exportReportGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const datiFiltrati = dati.filter((r) => {
      return new Date(r.data).toISOString().split("T")[0] === oggi;
    });

    esportaExcel(
      `REPORT_GIORNALIERO_${oggi}.xlsx`,
      formatReport(datiFiltrati)
    );
  }

  // =========================
  // ⛽ RIFORNIMENTI
  // =========================
  function exportRifornimentiGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const datiFiltrati = dati.filter((r) => {
      return new Date(r.data).toISOString().split("T")[0] === oggi;
    });

    esportaExcel(
      `RIFORNIMENTI_GIORNO_${oggi}.xlsx`,
      formatRifornimenti(datiFiltrati)
    );
  }

  function exportRifornimentiMensile() {
    const datiFiltrati = dati.filter((r) => {
      const d = new Date(r.data);
      return (
        d.getMonth() === meseSelezionato &&
        d.getFullYear() === annoSelezionato
      );
    });

    esportaExcel(
      `RIFORNIMENTI_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      formatRifornimenti(datiFiltrati)
    );
  }

  // =========================
  // 🗑 DELETE
  // =========================
  async function eliminaRecord(id: string) {
    await supabase.from("registri_giornalieri").delete().eq("id", id);
    setDati((prev) => prev.filter((r) => r.id !== id));
  }

  async function eliminaTutti() {
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

      {/* 📅 MESE */}
      <div style={{ marginBottom: 10 }}>
        <select
          value={meseSelezionato}
          onChange={(e) => setMeseSelezionato(Number(e.target.value))}
        >
          {["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"].map(
            (m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            )
          )}
        </select>

        <input
          type="number"
          value={annoSelezionato}
          onChange={(e) => setAnnoSelezionato(Number(e.target.value))}
          style={{ marginLeft: 10, width: 100 }}
        />
      </div>

      {/* BOTTONI */}
      <button onClick={exportReportGiornaliero}>📊 Giornaliero</button>
      <button onClick={exportReportMensile}>📊 Mensile</button>
      <button onClick={exportRifornimentiGiornaliero}>⛽ Riforn. Giorno</button>
      <button onClick={exportRifornimentiMensile}>⛽ Riforn. Mese</button>
      <button onClick={eliminaTutti} style={{ marginLeft: 10, color: "red" }}>
        🗑 Elimina Filtrati
      </button>

      <hr />

      {/* LISTA */}
      {filtrati.map((r) => (
        <div key={r.id} style={{ padding: 10, border: "1px solid #ddd" }}>
          <b>{r.nome_autista}</b> - {r.targa}
          <br />
          Km: {r.km_inizio} → {r.km_fine} | ⛽ {r.litri}L | € {r.importo_carburante}

          <br />

          <button
            onClick={() => eliminaRecord(r.id)}
            style={{ color: "white", background: "red", marginTop: 5 }}
          >
            🗑 Elimina
          </button>
        </div>
      ))}
    </div>
  );
}