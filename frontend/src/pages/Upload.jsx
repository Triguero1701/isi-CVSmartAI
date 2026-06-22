import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import CVTemplateModern from '../components/templates/CVTemplateModern';
import { UploadCloud, Link as LinkIcon, Edit, Award, Settings, Check, HelpCircle } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';
import Sidebar from '../components/Sidebar';
import { EXAMPLE_ANALYSIS } from '../data/exampleAnalysis';
import styles from './Upload.module.css';

export default function Upload() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Check router state or localStorage for incoming job offer text
  useEffect(() => {
    if (location.state?.jobOfferText) {
      setJobText(location.state.jobOfferText);
    } else {
      const stored = localStorage.getItem('job_offer_text_analyzer');
      if (stored) {
        setJobText(stored);
        localStorage.removeItem('job_offer_text_analyzer');
      }
    }
  }, [location.state]);

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
            setJobText(`Título: ${data.data.job_title}\nEmpresa: ${data.data.company}\n\nDescripción:\n${data.data.description}\n\nKeywords requeridas: ${(data.data.required_skills || []).join(', ')}`);
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
      let buffer = '';
      
      while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf('\n');
          
          while (boundary !== -1) {
              const line = buffer.substring(0, boundary).trim();
              buffer = buffer.substring(boundary + 1);
              
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
                          // Ignore partial lines if any
                      }
                  }
              }
              boundary = buffer.indexOf('\n');
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

  const handleLoadDemo = () => {
    setResults(EXAMPLE_ANALYSIS);
    setFile({ name: 'CV_Juan_Lopez.pdf' });
    setJobText('Buscamos un Ingeniero Fullstack Senior con experiencia en React, Node.js y bases de datos PostgreSQL. Valorable conocimientos en Docker, AWS y flujos CI/CD.');
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Análisis de CV</h1>
          <p>Sube un currículum para compararlo contra una oferta laboral</p>
        </header>

        <div className={styles.uploadGrid}>
          {/* Form Area */}
          <div className="card">
            <form onSubmit={handleAnalyze}>
              <div className={styles.formGroup}>
                <label>Extraer Oferta desde URL (LinkedIn, InfoJobs)</label>
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      style={{flex: 1}}
                    />
                    <button type="button" onClick={handleExtract} disabled={extracting || !jobUrl} className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <LinkIcon size={16} />
                        {extracting ? 'Extrayendo...' : 'Extraer'}
                    </button>
                </div>
                <small style={{display: 'block', marginBottom: '15px', fontWeight: 'bold'}}>
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
                        <div className="spinner" style={{width: '20px', height: '20px', display: 'inline-block'}}></div>
                        {progressMessage}
                    </span>
                ) : 'Iniciar Análisis'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button type="button" onClick={handleLoadDemo} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                ¿No tienes un CV a mano? Ver demo interactiva →
              </button>
            </div>
          </div>

          {/* Results Area */}
          {results && (
              <div className={`card ${styles.resultsArea}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0 }}>Resultado del Análisis</h2>
                    {results.cv_version_id && (
                      <button 
                        onClick={() => navigate(`/editor/${results.cv_version_id}`)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Edit size={14} /> Editar CV
                      </button>
                    )}
                  </div>

                  <div className={styles.scoreContainer}>
                      <div className={styles.scoreValue}>{results.compatibility_score}%</div>
                      <span className={`${styles.scoreBadge} ${
                          results.compatibility_score >= 75 ? styles.scoreHigh :
                          results.compatibility_score >= 50 ? styles.scoreMedium :
                          styles.scoreLow
                      }`}>
                          {results.compatibility_score >= 75 ? 'Excelente Match' :
                           results.compatibility_score >= 50 ? 'Match Medio' :
                           'Match Bajo'}
                      </span>
                  </div>

                  {/* Category Breakdown Progress Bars */}
                  {results.category_breakdown && (
                    <div className={styles.categoryBreakdown}>
                      <div className={styles.breakdownItem}>
                        <div className={styles.breakdownInfo}>
                          <span>Palabras Clave (Keywords)</span>
                          <span>{results.category_breakdown.keywords}%</span>
                        </div>
                        <div className={styles.progressBarContainer}>
                          <div className={styles.progressBar} style={{ width: `${results.category_breakdown.keywords}%`, backgroundColor: 'var(--accent)' }}></div>
                        </div>
                      </div>

                      <div className={styles.breakdownItem}>
                        <div className={styles.breakdownInfo}>
                          <span>Ajuste de Experiencia</span>
                          <span>{results.category_breakdown.experience}%</span>
                        </div>
                        <div className={styles.progressBarContainer}>
                          <div className={styles.progressBar} style={{ width: `${results.category_breakdown.experience}%`, backgroundColor: 'var(--warning)' }}></div>
                        </div>
                      </div>

                      <div className={styles.breakdownItem}>
                        <div className={styles.breakdownInfo}>
                          <span>Ajuste de Seniority</span>
                          <span>{results.category_breakdown.seniority_fit}%</span>
                        </div>
                        <div className={styles.progressBarContainer}>
                          <div className={styles.progressBar} style={{ width: `${results.category_breakdown.seniority_fit}%`, backgroundColor: 'var(--success)' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills lists */}
                  <div className={styles.feedbackSection}>
                      <h3>Habilidades Encontradas</h3>
                      <div className={styles.tagList}>
                          {results.matched_skills?.map((skill, i) => (
                              <span key={i} className={`${styles.tag} ${styles.success}`}>{skill}</span>
                          ))}
                          {(!results.matched_skills || results.matched_skills.length === 0) && (
                            <span style={{ color: '#000000', fontWeight: 'bold', fontSize: '0.9rem' }}>Ninguna coincidencia detectada.</span>
                          )}
                      </div>
                  </div>

                  <div className={styles.feedbackSection}>
                      <h3>Keywords Faltantes</h3>
                      <div className={styles.tagList}>
                          {results.missing_skills?.map((kw, i) => (
                              <span key={i} className={`${styles.tag} ${styles.danger}`}>{kw}</span>
                          ))}
                          {(!results.missing_skills || results.missing_skills.length === 0) && (
                            <span style={{ color: '#000000', fontWeight: 'bold', fontSize: '0.9rem' }}>No se han detectado faltantes críticas.</span>
                          )}
                      </div>
                  </div>

                  {results.recommendations && (
                      <div className={styles.feedbackSection}>
                          <h3>Mejoras Recomendadas</h3>
                          <ul className={styles.priorityList}>
                              {results.recommendations.map((imp, i) => (
                                  <li key={i}>{imp}</li>
                              ))}
                          </ul>
                      </div>
                  )}

                  {results.missing_skills && results.missing_skills.length > 0 && (
                      <div style={{marginTop: '1rem', textAlign: 'center'}}>
                          <button onClick={() => {
                            setSelectedSkills([]);
                            setShowImproveModal(true);
                          }} className="btn-primary" style={{padding: '0.8rem 2rem', fontSize: '1.1rem', width: '100%'}}>✨ Mejorar CV Automáticamente</button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </main>

      {/* Modal Mejorar CV */}
      {showImproveModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 style={{marginBottom: '0.5rem', fontSize: '18px', fontWeight: 900}}>Selecciona habilidades a añadir</h2>
                <p style={{marginBottom: '1.5rem', fontSize: '13px', fontWeight: 'bold'}}>
                    El análisis detectó que faltan estas keywords en tu CV. Selecciona las que deseas que la IA incorpore de forma orgánica en tu nuevo currículum.
                </p>
                <div className={styles.skillCheckboxes}>
                    {results.missing_skills?.length > 0 ? (
                        results.missing_skills.map((kw, i) => (
                            <label key={i} className={styles.checkboxLabel}>
                                <input type="checkbox" checked={selectedSkills.includes(kw)} onChange={() => toggleSkill(kw)} />
                                {kw}
                            </label>
                        ))
                    ) : (
                        <p>No se detectaron keywords faltantes.</p>
                    )}
                </div>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '2rem'}}>
                    <button onClick={() => setShowImproveModal(false)} className="btn-secondary" style={{padding: '8px 14px'}}>Cancelar</button>
                    <button onClick={handleImproveCV} className="btn-primary" disabled={improving} style={{padding: '8px 14px'}}>
                        {improving ? 'Generando PDF...' : 'Confirmar y Descargar'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
