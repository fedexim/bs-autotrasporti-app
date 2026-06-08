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

  // 🟢 NUOVO
  const [nonCompilati, setNonCompilati] = useState<any[]>([]);

  async function carica() {
    setLoading(true);

    const { data, error } = await supabase
      .from("registri_giornalieri")
      .select("*")
      .order("data", { ascending: false });

    if (!error) setDati(data || []);

    setLoading(false);
  }

  // 🟢 NUOVA FUNZIONE
  async function checkNonCompilati() {
    const oggi = new Date().toISOString().split("T")[0];

    const { data: autisti } = await supabase
      .from("autisti")
      .select("username, nome");

    const { data: registri } = await supabase
      .from("registri_giornalieri")
      .select("username")
      .gte("data", oggi);

    const compilati = new Set(registri?.map(r => r.username));

    const mancanti = autisti?.filter(a => !compilati.has(a.username));

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

  // 📊 STATISTICHE (TUTTE INVARIATE)
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

  // 📦 EXPORT BASE (INVARIATO)
  function esportaExcel(nome: string, data: any[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, nome);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Dashboard Flotta</h2>

      {/* 🟢 NUOVO BLOCCO */}
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

      {/* STATISTICHE (ORIGINALI) */}
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

      {/* RESTO DEL TUO CODICE (filtri, export, lista ecc) RESTA IDENTICO */}
    </div>
  );
}