import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import * as XLSX from "xlsx";

export default function Dashboard() {
  const [dati, setDati] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");

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

  // 📊 FORMAT EXCEL
  function formatExcel(data: any[]) {
    return data.map((r) => ({
      Autista: r.nome_autista || "",
      Username: r.username || "",
      Targa: r.targa || "",
      "Targa Secondaria": r.targa_secondaria || "",
      "Km Inizio": r.km_inizio || 0,
      "Km Fine": r.km_fine || 0,
      "Km Percorsi": (r.km_fine || 0) - (r.km_inizio || 0),
      "Litri": r.litri || 0,
      "Importo €": r.importo_carburante || 0,
      Data: r.data ? new Date(r.data).toLocaleString() : "",
    }));
  }

  // 📤 GIORNALIERO
  function exportGiornaliero() {
    const oggi = new Date().toISOString().split("T")[0];

    const giornalieri = dati.filter((r) => {
      if (!r.data) return false;
      return new Date(r.data).toISOString().split("T")[0] === oggi;
    });

    const ws = XLSX.utils.json_to_sheet(formatExcel(giornalieri));
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Giornaliero");

    XLSX.writeFile(wb, `Registro_Giornaliero_${oggi}.xlsx`);
  }

  // 📊 MENSILE
  function exportMensile() {
    const now = new Date();
    const mese = now.getMonth();
    const anno = now.getFullYear();

    const mensili = dati.filter((r) => {
      if (!r.data) return false;
      const d = new Date(r.data);
      return d.getMonth() === mese && d.getFullYear() === anno;
    });

    const ws = XLSX.utils.json_to_sheet(formatExcel(mensili));
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Mensile");

    XLSX.writeFile(wb, `Registro_Mensile_${anno}_${mese + 1}.xlsx`);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📊 Dashboard Flotta Autotrasporti</h2>

      {/* 🔎 FILTRO TESTO */}
      <input
        placeholder="🔎 Cerca autista o targa..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {/* 📅 FILTRO DATA */}
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
        📤 Excel Giornaliero
      </button>

      <button onClick={exportMensile} style={{ marginRight: 10, padding: 10 }}>
        📊 Excel Mensile
      </button>

      <button onClick={carica} style={{ padding: 10 }}>
        🔄 Aggiorna dati
      </button>

      <hr />

      {/* ⏳ LOADING */}
      {loading && <p>Caricamento...</p>}

      {/* 📋 LISTA */}
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
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            👤 {r.nome_autista}
          </div>

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