import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function RegistroGiornaliero() {
  const [kmInizio, setKmInizio] = useState("");
  const [kmFine, setKmFine] = useState("");
  const [kmRifornimento, setKmRifornimento] = useState("");

  const [litri, setLitri] = useState("");
  const [importo, setImporto] = useState("");

  const [targa, setTarga] = useState("");

  const [usaAlternativo, setUsaAlternativo] = useState(false);
  const [targaAlternativa, setTargaAlternativa] = useState("");

  const [fotoKm, setFotoKm] = useState<File | null>(null);
  const [fotoScontrino, setFotoScontrino] = useState<File | null>(null);

  const [msg, setMsg] = useState("");

  const mezziList = [
    "HB881JF",
    "HB232JH",
    "HB866JF",
    "HB877JF",
    "HB859JF",
    "HB882JF",
    "HB860JF",
    "HB883JF",
    "HB869JF",
    "HB857JF",
    "HB873JF",
    "HB862JF",
    "HB203JH",
    "GR701EP",
    "HA141WX",
  ];

  useEffect(() => {
    async function load() {
      const local = JSON.parse(
        localStorage.getItem("autista") || "{}"
      );

      if (!local.username) return;

      const { data, error } = await supabase
        .from("autisti")
        .select("mezzo_principale")
        .eq("username", local.username)
        .single();

      if (error) {
        console.error(error.message);
        return;
      }

      setTarga(data?.mezzo_principale || "");
    }

    load();
  }, []);

  async function uploadFile(
    file: File,
    folder: string
  ) {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("documenti-autisti")
      .upload(`${folder}/${fileName}`, file);

    if (error) throw error;

    return data.path;
  }

  async function invia() {
    if (!kmInizio.trim()) {
      setMsg("❌ Inserire i Km Inizio");
      return;
    }

    if (!kmFine.trim()) {
      setMsg("❌ Inserire i Km Fine");
      return;
    }

    if (Number(kmFine) <= Number(kmInizio)) {
      setMsg(
        "❌ I Km Fine devono essere maggiori dei Km Inizio"
      );
      return;
    }

    if (!fotoKm) {
      setMsg(
        "❌ Caricare la foto del contachilometri"
      );
      return;
    }

    if (
      usaAlternativo &&
      !targaAlternativa
    ) {
      setMsg(
        "❌ Selezionare il mezzo alternativo"
      );
      return;
    }

    const haLitri = litri.trim() !== "";
    const haImporto = importo.trim() !== "";

    const rifornimento =
      haLitri || haImporto;

    if (haLitri !== haImporto) {
      setMsg(
        "❌ Inserire sia litri che importo carburante"
      );
      return;
    }

    if (rifornimento) {
      if (!kmRifornimento.trim()) {
        setMsg(
          "❌ Inserire i Km al momento del rifornimento"
        );
        return;
      }

      if (!fotoScontrino) {
        setMsg(
          "❌ Caricare lo scontrino carburante"
        );
        return;
      }

      if (
        Number(kmRifornimento) <
          Number(kmInizio) ||
        Number(kmRifornimento) >
          Number(kmFine)
      ) {
        setMsg(
          "❌ I Km del rifornimento devono essere compresi tra Km Inizio e Km Fine"
        );
        return;
      }
    }

    setMsg("⏳ Invio in corso...");

    try {
      const local = JSON.parse(
        localStorage.getItem("autista") || "{}"
      );

      let urlKm = "";
      let urlScontrino = "";

      if (fotoKm) {
        urlKm = await uploadFile(
          fotoKm,
          "km"
        );
      }

      if (fotoScontrino) {
        urlScontrino = await uploadFile(
          fotoScontrino,
          "scontrini"
        );
      }

      const { error } = await supabase
        .from("registri_giornalieri")
        .insert({
          username: local.username,
          nome_autista: local.nome,

          targa:
            usaAlternativo &&
            targaAlternativa
              ? targaAlternativa
              : targa,

          km_inizio: Number(kmInizio),

          km_fine: Number(kmFine),

          km_percorsi:
            Number(kmFine) -
            Number(kmInizio),

          km_rifornimento:
            kmRifornimento.trim() !== ""
              ? Number(
                  kmRifornimento
                )
              : null,

          litri:
            litri.trim() !== ""
              ? Number(litri)
              : null,

          importo_carburante:
            importo.trim() !== ""
              ? Number(importo)
              : null,

          foto_km:
            urlKm || null,

          foto_scontrino:
            urlScontrino || null,

          data: new Date(),
        });

      if (error) {
        setMsg(
          "❌ Errore DB: " +
            error.message
        );
        return;
      }

      setMsg(
        "✅ Registro salvato correttamente"
      );

      setKmInizio("");
      setKmFine("");
      setKmRifornimento("");
      setLitri("");
      setImporto("");

      setFotoKm(null);
      setFotoScontrino(null);

      setUsaAlternativo(false);
      setTargaAlternativa("");
    } catch (err: any) {
      setMsg(
        "❌ Errore: " + err.message
      );
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🚚 Registro Giornaliero</h2>

      <p>
        <b>Mezzo assegnato:</b>{" "}
        {targa || "Caricamento..."}
      </p>

      <div style={{ marginTop: 15 }}>
        <label>
          <input
            type="checkbox"
            checked={usaAlternativo}
            onChange={(e) =>
              setUsaAlternativo(
                e.target.checked
              )
            }
          />
          {" "}Uso mezzo alternativo
        </label>

        {usaAlternativo && (
          <select
            value={targaAlternativa}
            onChange={(e) =>
              setTargaAlternativa(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: 10,
              marginTop: 10,
            }}
          >
            <option value="">
              Seleziona mezzo alternativo
            </option>

            {mezziList.map((t) => (
              <option
                key={t}
                value={t}
              >
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      <br />

      <input
        type="number"
        placeholder="Km Inizio"
        value={kmInizio}
        onChange={(e) =>
          setKmInizio(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Km Fine"
        value={kmFine}
        onChange={(e) =>
          setKmFine(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Litri carburante"
        value={litri}
        onChange={(e) =>
          setLitri(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        type="number"
        step="0.01"
        placeholder="Importo carburante (€)"
        value={importo}
        onChange={(e) =>
          setImporto(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Km al momento del rifornimento"
        value={kmRifornimento}
        onChange={(e) =>
          setKmRifornimento(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <p>📸 Foto contachilometri</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFotoKm(
            e.target.files?.[0] ||
              null
          )
        }
      />

      <p>⛽ Scontrino carburante</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFotoScontrino(
            e.target.files?.[0] ||
              null
          )
        }
      />

      <br />
      <br />

      <button
        onClick={invia}
        style={{
          padding: 10,
          cursor: "pointer",
        }}
      >
        🚀 Invia Registro
      </button>

      <p>{msg}</p>
    </div>
  );
}