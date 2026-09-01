import React, { useState, useRef } from 'react';

interface DonneesExtraites {
  fournisseur: string;
  montants_detectes: number[];
  montant_suggere: number | null;
  dates_detectees: string[];
  date_suggeree: string | null;
}

interface ResultatOCR {
  success: boolean;
  texte_brut: string;
  donnees_extraites: DonneesExtraites;
  nb_caracteres: number;
  qualite_scan: string;
}

interface FormCharge {
  description: string;
  montant: string;
  date: string;
  fournisseur: string;
}

const OCR: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<ResultatOCR | null>(null);
  const [form, setForm] = useState<FormCharge>({
    description: '',
    montant: '',
    date: '',
    fournisseur: ''
  });
  const [valide, setValide] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResultat(null);
    setValide(false);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8001/extract', {
        method: 'POST',
        body: formData
      });
      const data: ResultatOCR = await response.json();
      setResultat(data);
      setForm({
        description: data.donnees_extraites.fournisseur || '',
        montant: data.donnees_extraites.montant_suggere?.toString() || '',
        date: data.donnees_extraites.date_suggeree || '',
        fournisseur: data.donnees_extraites.fournisseur || ''
      });
    } catch {
      setError('Erreur lors de l\'extraction OCR. Vérifiez que le service OCR est disponible.');
    } finally {
      setLoading(false);
    }
  };

  const handleValider = () => {
    setValide(true);
  };

  const qualiteColor = (qualite: string) => {
    if (qualite === 'bonne') return 'var(--vert-foret)';
    return 'var(--dore)';
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reconnaissance automatique de documents</h2>
        <p>Uploadez une facture ou un reçu : l'IA extrait automatiquement les données</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Zone upload */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>1. Uploader un document</h3>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed var(--gris-clair)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'var(--blanc-casse)',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--vert-foret)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--gris-clair)')}
            >
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</p>
              <p style={{ fontWeight: 500, color: 'var(--bleu-nuit)' }}>
                {file ? file.name : 'Cliquez pour sélectionner une image'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginTop: '0.25rem' }}>
                PNG, JPG, JPEG acceptés
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {preview && (
              <div style={{ marginTop: '1rem' }}>
                <img
                  src={preview}
                  alt="Aperçu"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--gris-clair)' }}
                />
              </div>
            )}

            {file && !resultat && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                onClick={handleExtract}
                disabled={loading}
              >
                {loading ? '⏳ Extraction en cours...' : '🔍 Lancer l\'extraction OCR'}
              </button>
            )}

            {error && <p className="error-message" style={{ marginTop: '0.5rem' }}>{error}</p>}
          </div>

          {/* Texte brut extrait */}
          {resultat && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Texte extrait</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                    {resultat.nb_caracteres} caractères
                  </span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    backgroundColor: resultat.qualite_scan === 'bonne' ? '#D1FAE5' : '#FEF3C7',
                    color: qualiteColor(resultat.qualite_scan)
                  }}>
                    Qualité : {resultat.qualite_scan}
                  </span>
                </div>
              </div>
              <div style={{
                backgroundColor: 'var(--blanc-casse)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                fontFamily: 'Courier New',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                color: 'var(--bleu-nuit)'
              }}>
                {resultat.texte_brut || 'Aucun texte détecté'}
              </div>
            </div>
          )}
        </div>

        {/* Données extraites + formulaire */}
        <div>
          {resultat && (
            <>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>2. Données détectées</h3>

                {/* Montants */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>
                    💰 Montants détectés
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resultat.donnees_extraites.montants_detectes.length > 0 ? (
                      resultat.donnees_extraites.montants_detectes.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setForm({ ...form, montant: m.toString() })}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            border: `2px solid ${form.montant === m.toString() ? 'var(--vert-foret)' : 'var(--gris-clair)'}`,
                            backgroundColor: form.montant === m.toString() ? '#D1FAE5' : 'white',
                            color: form.montant === m.toString() ? 'var(--vert-foret)' : 'var(--bleu-nuit)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          {m.toFixed(2)} €
                        </button>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>Aucun montant détecté</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>
                    📅 Dates détectées
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resultat.donnees_extraites.dates_detectees.length > 0 ? (
                      resultat.donnees_extraites.dates_detectees.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => setForm({ ...form, date: d })}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            border: `2px solid ${form.date === d ? 'var(--vert-foret)' : 'var(--gris-clair)'}`,
                            backgroundColor: form.date === d ? '#D1FAE5' : 'white',
                            color: form.date === d ? 'var(--vert-foret)' : 'var(--bleu-nuit)',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          {d}
                        </button>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>Aucune date détectée</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Formulaire de validation */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>3. Valider et enregistrer</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '1rem' }}>
                  Vérifiez et corrigez si nécessaire avant d'enregistrer
                </p>

                <div className="form-group">
                  <label>Description / Fournisseur</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="EDF, Orange, Syndic..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Montant (€)</label>
                    <input
                      type="number"
                      value={form.montant}
                      onChange={e => setForm({ ...form, montant: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="text"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      placeholder="01/01/2026"
                    />
                  </div>
                </div>

                {!valide ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem' }}
                    onClick={handleValider}
                    disabled={!form.montant}
                  >
                    ✅ Valider et enregistrer la charge
                  </button>
                ) : (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#D1FAE5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: 'var(--vert-foret)', fontWeight: 600, fontSize: '1rem' }}>
                      ✅ Charge enregistrée avec succès !
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#065F46', marginTop: '0.25rem' }}>
                      {form.description} — {parseFloat(form.montant).toFixed(2)} € — {form.date}
                    </p>
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setResultat(null);
                        setValide(false);
                        setForm({ description: '', montant: '', date: '', fournisseur: '' });
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                    >
                      Analyser un nouveau document
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!resultat && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</p>
              <p style={{ fontWeight: 500, color: 'var(--bleu-nuit)', marginBottom: '0.5rem' }}>
                Moteur OCR prêt
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>
                Uploadez une image de facture pour commencer l'extraction automatique
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCR;