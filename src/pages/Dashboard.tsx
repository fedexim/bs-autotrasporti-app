import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [dati, setDati] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");

  // 🚚 CARICA DATI
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
    const matchTesto =
      (r.nome_autista || "").toLowerCase().includes(filtro.toLowerCase()) ||
      (r.targa || "").toLowerCase().includes(filtro.toLowerCase());

    const matchData = dataFiltro
      ? new Date(r.data).toISOString().split("T")[0] === dataFiltro
      : true;

    return matchTesto && matchData;
  });

  // 📊 TOTALI
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
  // 📦 EXPORT BASE
  // =========================
  function esportaExcel(nome: string, data: any[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dati");
    XLSX.writeFile(wb, nome);
  }

  // =========================
  // 📊 FORMAT REPORT
  // =========================
  function formatReport(data: any[]) {
    return data.map((r) => ({
      Autista: r.nome_autista,
      Username: r.username,
      Targa: r.targa,
      "Targa Secondaria": r.targa_secondaria || "",
      "Km Inizio": r.km_inizio,
      "Km Fine": r.km_fine,
      "Km Totali": (r.km_fine || 0) - (r.km_inizio || 0),
      "Litri": r.litri,
      "Importo €": r.importo_carburante,
      Data: r.data ? new Date(r.data).toLocaleString() : ""
    }));
  }

  // =========================
  // ⛽ FORMAT RIFORNIMENTI
  // =========================
  function formatRifornimenti(data: any[]) {
    return data.map((r) => ({
      Autista: r.nome_autista,
      Username: r.username,
      Targa: r.targa,
      "Litri": r.litri,
      "Importo €": r.importo_carburante,
      Data: r.data ? new Date(r.data).toLocaleString() : ""
    }));
  }

  // =========================
  // 📤 GIORNALIERO
  // =========================
  function exportGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const giornalieri = dati.filter((r) => {
      if (!r.data) return false;
      return new Date(r.data).toISOString().split("T")[0] === oggi;
    });

    esportaExcel(
      `REPORT_Giornaliero_${oggi}.xlsx`,
      formatReport(giornalieri)
    );

    esportaExcel(
      `RIFORNIMENTI_Giornaliero_${oggi}.xlsx`,
      formatRifornimenti(giornalieri)
    );
  }

  // =========================
  // 📅 MENSILE
  // =========================
  function exportMensile() {
    const now = new Date();
    const mese = now.getMonth();
    const anno = now.getFullYear();

    const mensili = dati.filter((r) => {
      if (!r.data) return false;
      const d = new Date(r.data);
      return d.getMonth() === mese && d.getFullYear() === anno;
    });

    esportaExcel(
      `REPORT_Mensile_${anno}_${mese + 1}.xlsx`,
      formatReport(mensili)
    );

    esportaExcel(
      `RIFORNIMENTI_Mensile_${anno}_${mese + 1}.xlsx`,
      formatRifornimenti(mensili)
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📊 Dashboard Flotta Autotrasporti</h2>

      {/* 🔎 FILTRO */}
      <input
        placeholder="🔎 Cerca autista o targa..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {/* 📅 DATA */}
      <input
        type="date"
        value={dataFiltro}
        onChange={(e) => setDataFiltro(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 15 }}
      />

      {/* 📊 STATISTICHE */}
      <div style={{ background: "#f4f4f4", padding: 15, marginBottom: 15 }}>
        <p>🚚 Km Totali: <b>{totaleKm}</b></p>
        <p>⛽ Litri Totali: <b>{totaleLitri}</b></p>
        <p>💰 Spesa Totale: <b>€ {totaleSpesa.toFixed(2)}</b></p>
      </div>

      {/* 📤 EXPORT */}
      <button onClick={exportGiornaliero} style={{ marginRight: 10, padding: 10 }}>
        📤 Giornaliero (Report + Rifornimenti)
      </button>

      <button onClick={exportMensile} style={{ marginRight: 10, padding: 10 }}>
        📊 Mensile (Report + Rifornimenti)
      </button>

      <button onClick={carica} style={{ padding: 10 }}>
        🔄 Aggiorna
      </button>

      <hr />

      {/* 📋 LISTA */}
      {loading && <p>Caricamento...</p>}

      {filtrati.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "4fr 2fr 3fr 1.5fr 2fr",
            gap: 10
          }}
        >
          <div><b>👤 {r.nome_autista}</b></div>

          <div>
            🚚 {r.targa}
            {r.targa_secondaria && (
              <div style={{ fontSize: 11, color: "#777" }}>
                ↳ {r.targa_secondaria}
              </div>
            )}
          </div>

          <div>
            Km: {r.km_inizio} → {r.km_fine}
          </div>

          <div>⛽ {r.litri} L</div>

          <div>
            📅 {new Date(r.data).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}