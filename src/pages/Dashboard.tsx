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

  const filtrati = dati.filter((r) => {
    const d = new Date(r.data);

    const matchTesto =
      (r.nome_autista || "")
        .toLowerCase()
        .includes(filtro.toLowerCase()) ||
      (r.targa || "")
        .toLowerCase()
        .includes(filtro.toLowerCase());

    const matchGiorno = giornoSelezionato
      ? d.toISOString().split("T")[0] === giornoSelezionato
      : true;

    const matchMeseAnno =
      d.getMonth() === meseSelezionato &&
      d.getFullYear() === annoSelezionato;

    return matchTesto && matchGiorno && matchMeseAnno;
  });

  const kmTotali = filtrati.reduce(
    (acc, r) =>
      acc +
      (Number(r.km_percorsi) ||
        Number(r.km_fine || 0) -
          Number(r.km_inizio || 0)),
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
    litriTotali > 0
      ? (kmTotali / litriTotali).toFixed(2)
      : "0";

  function esportaExcel(nome: string, data: any[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Report"
    );

    XLSX.writeFile(wb, nome);
  }

  function exportMensile() {
    esportaExcel(
      `REPORT_${annoSelezionato}_${meseSelezionato + 1}.xlsx`,
      filtrati
    );
  }

  async function eliminaReport(id: string) {
    const conferma = confirm(
      "Eliminare questo report?"
    );

    if (!conferma) return;

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
      !confirm(
        `Eliminare ${filtrati.length} report?`
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

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Dashboard Flotta</h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
          }}
        >
          🚚 Km Totali
          <h3>{kmTotali}</h3>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
          }}
        >
          ⛽ Litri Totali
          <h3>{litriTotali.toFixed(2)}</h3>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
          }}
        >
          💶 Spesa Totale
          <h3>€ {spesaTotale.toFixed(2)}</h3>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 15,
          }}
        >
          📈 Km/L
          <h3>{consumoMedio}</h3>
        </div>
      </div>

      <input
        placeholder="Cerca autista o targa"
        value={filtro}
        onChange={(e) =>
          setFiltro(e.target.value)
        }
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <input
          type="date"
          value={giornoSelezionato}
          onChange={(e) =>
            setGiornoSelezionato(
              e.target.value
            )
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
          {Array.from({
            length: 12,
          }).map((_, i) => (
            <option key={i} value={i}>
              Mese {i + 1}
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
        />

        <button onClick={exportMensile}>
          📥 Excel
        </button>

        <button
          onClick={eliminaFiltrati}
          style={{
            background: "red",
            color: "white",
          }}
        >
          🗑 Elimina Filtrati
        </button>
      </div>

      <hr />

      {loading && <p>Caricamento...</p>}

      {filtrati.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ddd",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <b>{r.nome_autista || "-"}</b>

          <br />

          🚚 {r.targa || "-"}

          <br />

          Km: {r.km_inizio} → {r.km_fine}

          <br />

          ⛽ {r.litri || 0} L

          <br />

          💶 € {r.importo_carburante || 0}

          <br />

          📅{" "}
          {r.data
            ? new Date(
                r.data
              ).toLocaleString()
            : "-"}

          <br />

          <button
            onClick={() =>
              eliminaReport(r.id)
            }
            style={{
              background: "red",
              color: "white",
              marginTop: 8,
            }}
          >
            🗑 Elimina
          </button>
        </div>
      ))}
    </div>
  );
}