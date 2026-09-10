import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

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
  bien_id: string;
}

interface Bien {
  id: number;
  adresse: string;
  ville: string;
}

interface Charge {
  id: number;
  bien_id: number;
  description: string;
  fournisseur: string | null;
  montant: number;
  date_charge: string | null;
  fichier_nom: string | null;
  created_at: string;
}

const OCR: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<ResultatOCR | null>(null);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [form, setForm] = useState<FormCharge>({
    description: '',
    montant: '',
    date: '',
    fournisseur: '',
    bien_id: ''
  });
  const [valide, setValide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [biensRes, chargesRes] = await Promise.all([
          api.get('/biens/'),
          api.get('/charges/')
        ]);
        setBiens(biensRes.data);
        setCharges(chargesRes.data);
        if (biensRes.data.length > 0) {
          setForm(f => ({ ...f, bien_id: biensRes.data[0].id.toString() }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

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
      setForm(f => ({
        ...f,
        description: data.donnees_extraites.fournisseur || '',
        montant: data.donnees_extraites.montant_suggere?.toString() || '',
        date: data.donnees_extraites.date_suggeree || '',
        fournisseur: data.donnees_extraites.fournisseur || ''
      }));
    } catch {
      setError('Erreur lors de l\'extraction OCR.');
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async () => {
    if (!form.montant || !form.bien_id) return;
    setSaving(true);
    try {
      await api.post('/charges/', {
        bien_id: parseInt(form.bien_id),
        description: form.description || 'Charge importée via OCR',
        fournisseur: form.fournisseur,
        montant: parseFloat(form.montant),
        date_charge: form.date,
        texte_ocr: resultat?.texte_brut,
        fichier_nom: file?.name
      });
      setValide(true);
      const chargesRes = await api.get('/charges/');
      setCharges(chargesRes.data);
    } catch {
      setError('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const getBienAdresse = (bien_id: number) => {
    const bien = biens.find(b => b.id === bien_id);
    return bien ? `${bien.adresse}, ${bien.ville}` : 'Inconnu';
  };

  const qualiteColor = (qualite: string) => {
    if (qualite === 'bonne') return 'var(--vert-foret)';
    return 'var(--dore)';
  };

  const totalCharges = charges.reduce((sum, c) => sum + c.montant, 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Reconnaissance automatique de documents</h2>
          <p>Uploadez une facture — l'IA extrait automatiquement les données</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>Total charges enregistrées</p>
          <p style={{ fontFamily: 'var(--font-titre)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--dore)' }}>
            {totalCharges.toFixed(2)} €
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Colonne gauche — Upload + texte extrait */}
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
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            {preview && (
              <img src={preview} alt="Aperçu" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--gris-clair)', marginTop: '1rem' }} />
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

          {resultat && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Texte extrait</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>{resultat.nb_caracteres} caractères</span>
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

          {/* Historique des charges */}
          {charges.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Charges enregistrées ({charges.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {charges.slice(0, 5).map(c => (
                    <div key={c.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: 'var(--blanc-casse)',
                        borderRadius: '8px',
                        alignItems: 'center'
                    }}>
                        <div>
                        <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.description}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gris-ardoise)' }}>
                            🏠 {getBienAdresse(c.bien_id)}
                            {c.date_charge && ` — ${c.date_charge}`}
                        </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <p style={{ fontFamily: 'var(--font-titre)', fontWeight: 600, color: 'var(--dore)' }}>
                            {c.montant.toFixed(2)} €
                        </p>
                        <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={async () => {
                            if (!window.confirm('Supprimer cette charge ?')) return;
                            try {
                                await api.delete(`/charges/${c.id}`);
                                const chargesRes = await api.get('/charges/');
                                setCharges(chargesRes.data);
                            } catch {
                                alert('Erreur lors de la suppression.');
                            }
                            }}
                        >
                            🗑️
                        </button>
                        </div>
                    </div>
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — Données extraites + formulaire */}
        <div>
          {resultat && (
            <>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>2. Données détectées</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>💰 Montants détectés</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resultat.donnees_extraites.montants_detectes.length > 0 ? (
                      resultat.donnees_extraites.montants_detectes.map((m, i) => (
                        <button key={i} onClick={() => setForm({ ...form, montant: m.toString() })}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            border: `2px solid ${form.montant === m.toString() ? 'var(--vert-foret)' : 'var(--gris-clair)'}`,
                            backgroundColor: form.montant === m.toString() ? '#D1FAE5' : 'white',
                            color: form.montant === m.toString() ? 'var(--vert-foret)' : 'var(--bleu-nuit)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                          }}>
                          {m.toFixed(2)} €
                        </button>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>Aucun montant détecté</p>
                    )}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '0.5rem' }}>📅 Dates détectées</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resultat.donnees_extraites.dates_detectees.length > 0 ? (
                      resultat.donnees_extraites.dates_detectees.map((d, i) => (
                        <button key={i} onClick={() => setForm({ ...form, date: d })}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            border: `2px solid ${form.date === d ? 'var(--vert-foret)' : 'var(--gris-clair)'}`,
                            backgroundColor: form.date === d ? '#D1FAE5' : 'white',
                            color: form.date === d ? 'var(--vert-foret)' : 'var(--bleu-nuit)',
                            cursor: 'pointer', fontSize: '0.85rem'
                          }}>
                          {d}
                        </button>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>Aucune date détectée</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>3. Valider et enregistrer</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)', marginBottom: '1rem' }}>
                  Vérifiez et corrigez si nécessaire
                </p>

                {!valide ? (
                  <>
                    <div className="form-group">
                      <label>Bien concerné</label>
                      <select value={form.bien_id} onChange={e => setForm({ ...form, bien_id: e.target.value })} required>
                        {biens.map(b => (
                          <option key={b.id} value={b.id}>{b.adresse}, {b.ville}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Description / Fournisseur</label>
                      <input type="text" value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="EDF, Orange, Syndic..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Montant (€)</label>
                        <input type="number" value={form.montant}
                          onChange={e => setForm({ ...form, montant: e.target.value })}
                          placeholder="0.00" required />
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input type="text" value={form.date}
                          onChange={e => setForm({ ...form, date: e.target.value })}
                          placeholder="01/01/2026" />
                      </div>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    {(!form.montant || !form.bien_id) && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#FEF3C7',
                            borderRadius: '8px',
                            marginBottom: '0.75rem',
                            fontSize: '0.85rem',
                            color: '#92400E'
                        }}>
                            ⚠️ Veuillez renseigner :
                            {!form.bien_id && <p style={{ margin: '0.25rem 0 0 0.5rem' }}>• Le bien concerné</p>}
                            {!form.montant && <p style={{ margin: '0.25rem 0 0 0.5rem' }}>• Le montant</p>}
                        </div>
                    )}
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.75rem' }}
                      onClick={handleValider}
                      disabled={!form.montant || saving}
                    >
                      {saving ? '⏳ Enregistrement...' : '✅ Valider et enregistrer la charge'}
                    </button>
                  </>
                ) : (
                  <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--vert-foret)', fontWeight: 600, fontSize: '1rem' }}>
                      ✅ Charge enregistrée avec succès !
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#065F46', marginTop: '0.25rem' }}>
                      {form.description} — {parseFloat(form.montant).toFixed(2)} € — {form.date}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#065F46', marginTop: '0.25rem' }}>
                      🏠 {getBienAdresse(parseInt(form.bien_id))}
                    </p>
                    <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }}
                      onClick={() => {
                        setFile(null); setPreview(null); setResultat(null);
                        setValide(false);
                        setForm({ description: '', montant: '', date: '', fournisseur: '', bien_id: biens[0]?.id.toString() || '' });
                        if (fileRef.current) fileRef.current.value = '';
                      }}>
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
              <p style={{ fontWeight: 500, color: 'var(--bleu-nuit)', marginBottom: '0.5rem' }}>Moteur OCR prêt</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gris-ardoise)' }}>
                Uploadez une image de facture pour commencer l'extraction automatique
              </p>
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--blanc-casse)', borderRadius: '8px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Comment ça fonctionne :</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>1. 📄 Uploadez une photo de facture</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>2. 🤖 L'IA extrait automatiquement les montants et dates</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>3. ✏️ Vérifiez et corrigez si nécessaire</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gris-ardoise)' }}>4. ✅ Validez pour enregistrer la charge</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCR;