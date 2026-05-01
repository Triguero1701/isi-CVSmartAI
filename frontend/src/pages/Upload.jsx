import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, FileText } from 'lucide-react';
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
        if (data.status === 'success') {
            setJobText(`Título: ${data.data.title}\nEmpresa: ${data.data.company}\n\nDescripción:\n${data.data.description}\n\nKeywords requeridas: ${data.data.keywords.join(', ')}`);
        } else {
            alert('Error al extraer: ' + data.message);
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
                      </>
                  )}
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
