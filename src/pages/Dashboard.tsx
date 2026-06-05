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
  // FILTRI
  // =========================
  const filtrati = dati.filter((r) => {
    const d = new Date(r.data);

    const matchTesto =
      (r.nome_autista || "")
        .toLowerCase()
        .includes(filtro.toLowerCase()) ||
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
      Data: r.data
        ? new Date(r.data).toLocaleString("it-IT")
        : ""
    }));
  }

  function formatRifornimenti(data: any[]) {
    return data.map((r) => ({
      Autista: r.nome_autista,
      Targa: r.targa,
      Litri: r.litri,
      Importo: r.importo_carburante,
      Data: r.data
        ? new Date(r.data).toLocaleString("it-IT")
        : ""
    }));
  }

  // =========================
  // EXPORT REPORT GIORNO
  // =========================
  function exportGiornaliero() {
    if (!giornoSelezionato) {
      alert("Seleziona una data");
      return;
    }

    const dataFiltrata = dati.filter(
      (r) =>
        new Date(r.data).toISOString().split("T")[0] ===
        giornoSelezionato
    );

    esportaExcel(
      `REPORT_${giornoSelezionato}.xlsx`,
      formatReport(dataFiltrata)
    );
  }

  // =========================
  // EXPORT REPORT MESE
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
      `REPORT_${annoSelezionato}_${String(
        meseSelezionato + 1
      ).padStart(2, "0")}.xlsx`,
      formatReport(dataFiltrata)
    );
  }

  // =========================
  // EXPORT RIFORNIMENTI GIORNO
  // =========================
  function exportRifornimentiGiornaliero() {
    if (!giornoSelezionato) {
      alert("Seleziona una data");
      return;
    }

    const dataFiltrata = dati.filter(
      (r) =>
        new Date(r.data).toISOString().split("T")[0] ===
        giornoSelezionato
    );

    esportaExcel(
      `RIFORNIMENTI_${giornoSelezionato}.xlsx`,
      formatRifornimenti(dataFiltrata)
    );
  }

  // =========================
  // EXPORT RIFORNIMENTI MESE
  // =========================
  function exportRifornimentiMensile() {
    const dataFiltrata = dati.filter((r) => {
      const d = new Date(r.data);

      return (
        d.getMonth() === meseSelezionato &&
        d.getFullYear() === annoSelezionato
      );
    });

    esportaExcel(
      `RIFORNIMENTI_${annoSelezionato}_${String(
        meseSelezionato + 1
      ).padStart(2, "0")}.xlsx`,
      formatRifornimenti(dataFiltrata)
    );
  }

  // =========================
  // ELIMINA REPORT
  // =========================
  async function eliminaReport(id: string) {
    await supabase
      .from("registri_giornalieri")
      .delete()
      .eq("id", id);

    setDati((prev) =>
      prev.filter((r) => r.id !== id)
    );
  }

  async function eliminaFiltrati() {
    if (
      !window.confirm(
        `Eliminare ${filtrati.length} record?`
      )
    )
      return;

    const ids = filtrati.map((r) => r.id);

    await supabase
      .from("registri_giornalieri")
      .delete()
      .in("id", ids);

    setDati((prev) =>
      prev.filter((r) => !ids.includes(r.id))
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Dashboard Flotta</h2>

      <input
        placeholder="Cerca autista o targa"
        value={filtro}
        onChange={(e) =>
          setFiltro(e.target.value)
        }
        style={{
          padding: 10,
          width: "100%",
          marginBottom: 10
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 15,
          flexWrap: "wrap"
        }}
      >
        <input
          type="date"
          value={giornoSelezionato}
          onChange={(e) =>
            setGiornoSelezionato(e.target.value)
          }
        />

        <select
          value={meseSelezionato}
          onChange={(e) =>
            setMeseSelezionato(
              Number(e.target.value)
            )
          }
        >
          {[
            "Gennaio",
            "Febbraio",
            "Marzo",
            "Aprile",
            "Maggio",
            "Giugno",
            "Luglio",
            "Agosto",
            "Settembre",
            "Ottobre",
            "Novembre",
            "Dicembre"
          ].map((mese, i) => (
            <option key={i} value={i}>
              {mese}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={annoSelezionato}
          onChange={(e) =>
            setAnnoSelezionato(
              Number(e.target.value)
            )
          }
          style={{ width: 100 }}
        />
      </div>

      <button onClick={exportGiornaliero}>
        📊 Giornaliero
      </button>

      <button
        onClick={exportMensile}
        style={{ marginLeft: 5 }}
      >
        📊 Mensile
      </button>

      <button
        onClick={exportRifornimentiGiornaliero}
        style={{ marginLeft: 5 }}
      >
        ⛽ Riforn. Giorno
      </button>

      <button
        onClick={exportRifornimentiMensile}
        style={{ marginLeft: 5 }}
      >
        ⛽ Riforn. Mese
      </button>

      <button
        onClick={eliminaFiltrati}
        style={{
          color: "red",
          marginLeft: 10
        }}
      >
        🗑 Elimina Filtrati
      </button>

      <hr />

      {loading && <p>Caricamento...</p>}

      {filtrati.map((r) => (
        <div
          key={r.id}
          style={{
            padding: 10,
            border: "1px solid #ddd",
            marginBottom: 8
          }}
        >
          <b>{r.nome_autista}</b> - {r.targa}

          <br />

          Km: {r.km_inizio} → {r.km_fine}
          {" | "}
          ⛽ {r.litri}L
          {" | "}
          € {r.importo_carburante}

          <br />

          <button
            onClick={() =>
              eliminaReport(r.id)
            }
            style={{
              background: "red",
              color: "white",
              marginTop: 5
            }}
          >
            🗑 Elimina
          </button>
        </div>
      ))}
    </div>
  );
}