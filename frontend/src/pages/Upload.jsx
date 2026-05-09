import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import CVTemplateModern from '../components/templates/CVTemplateModern';
import { UploadCloud, Link as LinkIcon } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';
import Sidebar from '../components/Sidebar';
import styles from './Upload.module.css';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);
  
  // Modal states
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [improving, setImproving] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const toggleSkill = (skill) => {
      setSelectedSkills(prev => 
          prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
      );
  };

  const handleImproveCV = async () => {
      setImproving(true);
      try {
          const res = await fetchWithAuth('/improve-cv', {
              method: 'POST',
              body: JSON.stringify({
                  cv_version_id: results.cv_version_id,
                  skills_to_add: selectedSkills
              })
          });
          const data = await res.json();
          if (data.status === 'success') {
              // Generate PDF using React component template
              const html2pdf = (await import('html2pdf.js')).default;
              
              const container = document.createElement('div');
              container.style.position = 'absolute';
              container.style.left = '-9999px';
              document.body.appendChild(container);
              
              const root = createRoot(container);
              root.render(<CVTemplateModern data={data.optimized_json} />);
              
              // Wait a bit for React to render
              setTimeout(() => {
                  const opt = {
                      margin:       0,
                      filename:     'CV_Optimizado_Premium.pdf',
                      image:        { type: 'jpeg', quality: 1 },
                      html2canvas:  { scale: 2, useCORS: true },
                      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                  };
                  
                  html2pdf().from(container.firstChild).set(opt).save().then(() => {
                      root.unmount();
                      document.body.removeChild(container);
                  });
                  setShowImproveModal(false);
                  setImproving(false);
              }, 500);
          } else {
              alert('Error al mejorar CV: ' + data.message);
              setImproving(false);
          }
      } catch (e) {
          alert('Error de conexión al mejorar CV.');
          setImproving(false);
      }
  };

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!jobUrl) return;
    setExtracting(true);
    try {
        const res = await fetchWithAuth('/job-offers/extract', {
            method: 'POST',
            body: JSON.stringify({ url: jobUrl })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            setJobText(`Título: ${data.data.title}\nEmpresa: ${data.data.company}\n\nDescripción:\n${data.data.description}\n\nKeywords requeridas: ${data.data.keywords.join(', ')}`);
        } else if (res.status === 400 && data.message?.includes('Anti-Bots')) {
            alert(`⚠️ Protección Anti-Bots Detectada:\n\n${data.message}\n\nUsa el cuadro de texto de abajo para pegar la información directamente.`);
        } else {
            alert('Error al extraer: ' + (data.message || 'Error desconocido'));
        }
    } catch(err) {
        alert('Error de conexión');
    } finally {
        setExtracting(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !jobText) return alert('Sube un CV y pega la oferta');

    setLoading(true);
    setResults(null);
    setProgressMessage('Inicializando...');
    
    const formData = new FormData();
    formData.append('cv_file', file);
    formData.append('job_offer_text', jobText);

    try {
      const response = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (let line of lines) {
              if (line.startsWith('data: ')) {
                  const dataStr = line.substring(6);
                  if (dataStr) {
                      try {
                          const data = JSON.parse(dataStr);
                          if (data.status === 'progress') {
                              setProgressMessage(data.message);
                          } else if (data.status === 'success') {
                              setResults(data);
                          } else if (data.status === 'error') {
                              alert('Error: ' + data.error);
                          }
                      } catch (e) {
                          // partial chunk could cause JSON error, ideally we buffer it
                      }
                  }
              }
          }
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Análisis de CV</h1>
          <p style={{color: 'var(--text-muted)'}}>Sube un currículum para compararlo contra una oferta laboral</p>
        </header>

        <div className={styles.uploadGrid}>
          {/* Form Area */}
          <div className="card glass">
            <form onSubmit={handleAnalyze}>
              <div className={styles.formGroup}>
                <label>Extraer Oferta desde URL (LinkedIn, InfoJobs)</label>
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white'}}
                    />
                    <button type="button" onClick={handleExtract} disabled={extracting || !jobUrl} className="btn-secondary" style={{padding: '0 20px', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <LinkIcon size={16} />
                        {extracting ? 'Extrayendo...' : 'Extraer'}
                    </button>
                </div>
                <small style={{display: 'block', marginBottom: '15px', color: 'var(--text-muted)'}}>
                    * Si la extracción automática falla por bloqueos (ej. InfoJobs, LinkedIn), puedes copiar y pegar el texto de la oferta manualmente en el cuadro inferior.
                </small>
                
                <label>Descripción de la Oferta (Manual o Extraída)</label>
                <textarea 
                  placeholder="Pega aquí los requerimientos del puesto..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Currículum del Candidato (PDF)</label>
                <div 
                    className={styles.fileDropZone}
                    onClick={() => fileInputRef.current.click()}
                >
                    <UploadCloud size={48} className={styles.uploadIcon} />
                    {file ? (
                        <p>Archivo seleccionado: <span>{file.name}</span></p>
                    ) : (
                        <p>Haz clic o arrastra tu archivo PDF aquí</p>
                    )}
                </div>
                <input 
                    type="file" 
                    accept=".pdf" 
                    ref={fileInputRef} 
                    style={{display: 'none'}} 
                    onChange={handleFileChange}
                />
              </div>

              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? (
                    <span style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>
                        <div className="spinner" style={{width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                        {progressMessage}
                    </span>
                ) : 'Iniciar Análisis'}
              </button>
            </form>
          </div>

          {/* Results Area */}
          {results && (
              <div className={`card glass ${styles.resultsArea}`}>
                  <div className={styles.scoreCircle}>
                      <h2>{results.compatibility_score}%</h2>
                      <span>Match</span>
                  </div>

                  {results.analysis && (
                      <>
                          <div className={styles.feedbackSection}>
                              <h3>Skills Detectados</h3>
                              <div className={styles.tagList}>
                                  {results.analysis.matched_skills?.map((skill, i) => (
                                      <span key={i} className={`${styles.tag} ${styles.success}`}>{skill}</span>
                                  ))}
                              </div>
                          </div>

                          <div className={styles.feedbackSection}>
                              <h3>Keywords Faltantes</h3>
                              <div className={styles.tagList}>
                                  {results.analysis.missing_keywords?.map((kw, i) => (
                                      <span key={i} className={`${styles.tag} ${styles.danger}`}>{kw}</span>
                                  ))}
                              </div>
                          </div>

                          <div className={styles.feedbackSection}>
                              <h3>Mejoras Sugeridas</h3>
                              <ul className={styles.priorityList}>
                                  {results.analysis.priority_improvements?.map((imp, i) => (
                                      <li key={i}>{imp}</li>
                                  ))}
                              </ul>
                          </div>

                          <div style={{marginTop: '2rem', textAlign: 'center'}}>
                              <button onClick={() => setShowImproveModal(true)} className="btn-primary" style={{padding: '0.8rem 2rem', fontSize: '1.1rem'}}>✨ Mejorar CV Automáticamente</button>
                          </div>
                      </>
                  )}
              </div>
          )}
        </div>
      </main>

      {/* Modal Mejorar CV */}
      {showImproveModal && (
        <div className={styles.modalOverlay}>
            <div className={`card glass ${styles.modalContent}`}>
                <h2 style={{color: 'var(--text-main)', marginBottom: '0.5rem'}}>Selecciona tus habilidades</h2>
                <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
                    El análisis detectó que faltan estas keywords en tu CV. Selecciona las que realmente dominas para que la IA las incorpore de forma natural en tu nuevo currículum.
                </p>
                <div className={styles.skillCheckboxes}>
                    {results.analysis?.missing_keywords?.length > 0 ? (
                        results.analysis.missing_keywords.map((kw, i) => (
                            <label key={i} className={styles.checkboxLabel}>
                                <input type="checkbox" checked={selectedSkills.includes(kw)} onChange={() => toggleSkill(kw)} />
                                {kw}
                            </label>
                        ))
                    ) : (
                        <p style={{color: 'var(--text-muted)'}}>No se detectaron keywords faltantes.</p>
                    )}
                </div>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '2rem'}}>
                    <button onClick={() => setShowImproveModal(false)} className="btn-secondary" style={{padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer'}}>Cancelar</button>
                    <button onClick={handleImproveCV} className="btn-primary" disabled={improving} style={{padding: '0.5rem 1rem'}}>
                        {improving ? 'Generando PDF...' : 'Confirmar y Descargar'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
