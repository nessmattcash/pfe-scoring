import { useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useApp } from "../AppContext";
import * as XLSX from "xlsx"; // npm install xlsx

// ─── Composant de bulles (version locale, nom unique) ──────────────────────
function BatchBubbles() {
  const bubbles = useMemo(() => Array.from({ length: 18 }, () => ({
    left: Math.random() * 100,
    size: 4 + Math.random() * 14,
    dur: 9 + Math.random() * 11,
    delay: -Math.random() * 14,
  })), []);
  return (
    <div className="bubble-field">
      {bubbles.map((b, i) => (
        <div key={i} className="bubble" style={{
          left: `${b.left}%`,
          width: b.size,
          height: b.size,
          animationDuration: `${b.dur}s`,
          animationDelay: `${b.delay}s`
        }} />
      ))}
    </div>
  );
}

export default function MassScoringPage() {
  const { t, lang } = useApp();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Lecture du CSV et preview
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "text/csv" && !f.name.endsWith(".csv")) {
      setError("Veuillez uploader un fichier CSV valide.");
      return;
    }
    setFile(f);
    setError(null);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        setError("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données.");
        return;
      }
      const headerRow = lines[0].split(",").map(h => h.trim());
      const dataRows = lines.slice(1, 6).map(line => {
        const vals = line.split(",");
        const obj = {};
        headerRow.forEach((h, idx) => obj[h] = vals[idx] || "");
        return obj;
      });
      setHeaders(headerRow);
      setPreviewData(dataRows);
    };
    reader.readAsText(f, "UTF-8");
  };

  const triggerFileInput = () => fileInputRef.current.click();

  // Appel batch scoring
  const handleBatchScoring = async () => {
    if (!file) {
      setError("Aucun fichier sélectionné.");
      return;
    }
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/batch_predict", formData, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded / p.total) * 100)),
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults(response.data);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de communication avec le backend.");
    } finally {
      setIsLoading(false);
    }
  };

  // Export CSV enrichi
  const exportResults = () => {
    if (!results || !results.predictions.length) return;
    const allRows = results.predictions;
    const allHeaders = [...headers, "score", "niveau", "decision", "proba_ml", "score_metier"];
    const csvRows = [allHeaders.join(",")];
    allRows.forEach(row => {
      const line = allHeaders.map(h => {
        let val = row[h];
        if (val === undefined) val = row[h.toLowerCase()];
        if (h === "score") val = row.score;
        if (h === "niveau") val = row.niveau;
        if (h === "decision") val = row.decision;
        if (h === "proba_ml") val = row.proba_ml;
        if (h === "score_metier") val = row.score_metier;
        return JSON.stringify(val ?? "");
      }).join(",");
      csvRows.push(line);
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultats_scoring.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aide : détection niveau visuel
  const getScoreColor = (score) => {
    if (score <= 30) return "var(--green)";
    if (score <= 60) return "var(--amber)";
    return "var(--red)";
  };

  const renderTable = () => {
    if (!results) return null;
    const data = results.predictions;
    const displayHeaders = [...headers, "score", "niveau"];
    return (
      <div className="mass-table-wrapper">
        <table className="mass-table">
          <thead>
            <tr>
              {displayHeaders.map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {displayHeaders.map(h => {
                  if (h === "score") {
                    const score = row.score;
                    return <td key={h} style={{ color: getScoreColor(score), fontWeight: 600 }}>{score}</td>;
                  }
                  if (h === "niveau") {
                    const level = row.niveau;
                    let bg = "rgba(92,184,116,0.15)";
                    if (level === "MODÉRÉ") bg = "rgba(232,169,61,0.15)";
                    if (level === "ÉLEVÉ") bg = "rgba(211,74,74,0.15)";
                    return (
                      <td key={h}>
                        <span className="mass-level-badge" style={{ background: bg, color: getScoreColor(row.score) }}>{level}</span>
                      </td>
                    );
                  }
                  let val = row[h];
                  if (val === undefined) val = row[h.toLowerCase()];
                  return <td key={h}>{val ?? ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
  <>
    <BatchBubbles />
    <section className="form-section">
      <div className="container">
        <div className="section-eyebrow">
          <span className="num">03</span><span className="line"/>Scoring en masse
        </div>
        <h2 className="section-title">
          Analysez tout votre portefeuille en <span className="gold">un clic</span>
        </h2>

        <div className="form-shell">
          <div className="form-card mass-scoring-card">
            <div className="mass-upload-area" onClick={triggerFileInput}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" style={{ display: "none" }} />
              <div className="mass-upload-icon">📂</div>
              <div className="mass-upload-text">
                {file ? file.name : "Cliquez ou glissez votre fichier CSV"}
              </div>
              <div className="mass-upload-hint">Format attendu : colonnes identiques au scoring individuel</div>
            </div>

            {previewData && headers.length > 0 && (
              <div className="mass-preview">
                <div className="mass-preview-title">Aperçu (5 premières lignes)</div>
                <div className="mass-preview-table-wrapper">
                  <table className="mass-preview-table">
                    <thead>
                      <tr>
                        {headers.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {headers.map(h => <td key={h}>{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="submit-row" style={{ marginTop: 24, borderTop: "none", paddingTop: 0 }}>
              <button className="submit-btn" onClick={handleBatchScoring} disabled={!file || isLoading}>
                {isLoading ? "Scoring en cours..." : "Lancer le scoring masse"}
              </button>
            </div>

            {isLoading && (
              <div className="mass-progress">
                <div className="mass-progress-bar" style={{ width: `${progress}%` }} />
                <div className="mass-progress-text">{progress}%</div>
              </div>
            )}

            {error && <div className="mass-error">⚠ {error}</div>}

            {results && (
              <div className="mass-results">
                <div className="mass-results-header">
                  <span>Résultats · {results.predictions.length} clients scorés</span>
                  <button className="mass-export-btn" onClick={exportResults}>📎 Exporter CSV</button>
                </div>
                {renderTable()}
              </div>
            )}
          </div>

          <div className="risk-rail">
            <div className="risk-card">
              <div className="risk-card-head">
                <div>
                  <div className="risk-card-label">Scoring en masse</div>
                  <div className="risk-card-client-name" style={{ fontSize: 14 }}>CSV · lot unique</div>
                </div>
                <div className="risk-card-live"><span className="dot"/>BATCH</div>
              </div>
              <div className="bottle-mini">
                <svg viewBox="0 0 200 400" width="140">
                  <rect x="70" y="80" width="60" height="140" fill="rgba(244,197,66,0.1)" stroke="var(--gold)" strokeWidth="1"/>
                  <text x="100" y="175" textAnchor="middle" fontSize="12" fill="var(--gold)">CSV</text>
                </svg>
              </div>
              <div className="risk-readout">
                <div className="risk-readout-score" style={{ fontSize: 38 }}>
                  {results ? results.predictions.length : "—"} <span className="of">clients</span>
                </div>
              </div>
              <div className="factor-list">
                <div className="factor">
                  <div className="factor-label">Prêt en masse</div>
                  <div className="factor-bar"><div className="factor-bar-fill" style={{ width: "100%", background: "var(--gold)" }}/></div>
                  <div className="factor-val">100%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
);}