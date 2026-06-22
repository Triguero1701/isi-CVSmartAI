import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Link as LinkIcon, Briefcase, Award, CheckCircle, PlusCircle, Tag, ArrowRight } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';
import styles from './JobOfferAnalyzer.module.css';

export default function JobOfferAnalyzer() {
  const navigate = useNavigate();
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleExtractUrl = async (e) => {
    e.preventDefault();
    if (!jobUrl) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetchWithAuth('/job-offers/extract', {
        method: 'POST',
        body: JSON.stringify({ url: jobUrl })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAnalysis(data.data);
        // Pre-populate the manual text area in case they want to adjust it
        setJobText(data.data.description);
      } else if (res.status === 400 && data.message?.includes('Anti-Bots')) {
        setError(`Protección Anti-Bots detectada. Por favor, copia y pega el texto de la oferta manualmente abajo.`);
      } else {
        setError(data.message || 'Error al extraer la oferta. Inténtalo pegando el texto directamente.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async (e) => {
    e.preventDefault();
    if (!jobText.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // We send the raw text to the backend. We can mock the endpoint or use Gemini directly.
      // Since /api/v1/job-offers/extract expects a URL, let's look at if we have an endpoint for direct text analysis.
      // Wait, let's see. If we send a mock scraper request or we can make a direct call, or we can handle it on the backend?
      // Wait, let's check backend/app/routes.py. /job-offers/extract only extracts from a URL.
      // Wait, can we update routes.py to also accept 'text' instead of 'url' in /job-offers/extract?
      // Yes! If 'text' is sent, it can bypass scraping and call extract_job_offer_data directly. Let's do that or we can just call it with a fake url?
      // Wait, let's check what we did in routes.py. In routes.py, it expects:
      // data = request.json; if not data or 'url' not in data: return 400
      // Let's modify routes.py to also accept 'text'! If 'text' is in data, bypass ScraperAPI and call extract_job_offer_data directly.
      // Wait! Let's check routes.py. I can make an update to routes.py to accept both! That's very robust.
      // Let's implement the frontend call first: if it has URL, call /job-offers/extract with { url }.
      // If it has raw text, call /job-offers/extract with { text }.
      const payload = jobUrl ? { url: jobUrl } : { text: jobText };
      const res = await fetchWithAuth('/job-offers/extract', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAnalysis(data.data);
      } else {
        setError(data.message || 'Error al analizar el texto de la oferta.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareWithCV = () => {
    if (!analysis) return;
    
    // Save structured job offer text to localStorage
    const formattedJobText = `Título: ${analysis.job_title}\nEmpresa: ${analysis.company}\n\nDescripción:\n${analysis.description}\n\nKeywords requeridas: ${(analysis.required_skills || []).join(', ')}`;
    localStorage.setItem('job_offer_text_analyzer', formattedJobText);
    
    navigate('/upload', {
      state: {
        jobOfferText: formattedJobText,
        jobOfferId: analysis.job_offer_id
      }
    });
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Analizador de Ofertas de Trabajo</h1>
          <p>Analiza los requisitos, seniority y palabras clave de cualquier vacante laboral</p>
        </header>

        <div className={styles.analyzerGrid}>
          {/* Inputs Section */}
          <div className="card">
            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>Extraer Información</h2>
            <form onSubmit={handleExtractUrl} className={styles.formSection}>
              <label>Extraer desde URL (LinkedIn, InfoJobs, etc.)</label>
              <div className={styles.inputGroup}>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={jobUrl}
                  onChange={(e) => {
                    setJobUrl(e.target.value);
                    if (e.target.value) setJobText(''); // Clear text if URL entered
                  }}
                  className={styles.textInput}
                />
                <button type="submit" disabled={loading || !jobUrl} className="btn-secondary">
                  <LinkIcon size={16} /> Extraer
                </button>
              </div>
            </form>

            <div className={styles.divider}><span>O</span></div>

            <form onSubmit={handleAnalyzeText} className={styles.formSection}>
              <label>Pegar Descripción de la Oferta (Texto Manual)</label>
              <textarea
                placeholder="Pega el título y toda la descripción de la oferta aquí..."
                value={jobText}
                onChange={(e) => {
                  setJobText(e.target.value);
                  if (e.target.value) setJobUrl(''); // Clear URL if text entered
                }}
                className={styles.textareaInput}
                rows={8}
                required
              />
              <button
                type="submit"
                disabled={loading || (!jobText.trim() && !jobUrl)}
                className="btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                {loading ? 'Analizando oferta con Gemini...' : 'Analizar Texto de la Oferta'}
              </button>
            </form>

            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>

          {/* Results Section */}
          <div className={`${styles.resultsContainer} ${analysis ? '' : styles.emptyState}`}>
            {analysis ? (
              <div className="card">
                <div className={styles.resultHeader}>
                  <div className={styles.brandInfo}>
                    <Briefcase className={styles.headerIcon} />
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{analysis.job_title}</h2>
                      <p className={styles.companyName}>{analysis.company}</p>
                    </div>
                  </div>
                  <div className={styles.seniorityBadge}>
                    <Award size={16} />
                    <span>Seniority: {analysis.seniority?.toUpperCase()}</span>
                  </div>
                </div>

                <div className={styles.skillsGrid}>
                  <div className={styles.skillsColumn}>
                    <h3>
                      <CheckCircle size={18} style={{ color: 'var(--success)', marginRight: '6px' }} />
                      Habilidades Obligatorias
                    </h3>
                    <div className={styles.badgeList}>
                      {analysis.required_skills?.map((skill, i) => (
                        <span key={i} className={`${styles.badge} ${styles.required}`}>{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.skillsColumn}>
                    <h3>
                      <PlusCircle size={18} style={{ color: 'var(--accent)', marginRight: '6px' }} />
                      Habilidades Deseables
                    </h3>
                    <div className={styles.badgeList}>
                      {analysis.nice_to_have_skills?.map((skill, i) => (
                        <span key={i} className={`${styles.badge} ${styles.niceToHave}`}>{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.keywordsSection}>
                  <h3>
                    <Tag size={18} style={{ color: 'var(--warning)', marginRight: '6px' }} />
                    Keywords sugeridas para ATS
                  </h3>
                  <div className={styles.badgeList}>
                    {analysis.keywords_ats?.map((kw, i) => (
                      <span key={i} className={`${styles.badge} ${styles.keyword}`}>{kw}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.descriptionSection}>
                  <h3>Resumen del Puesto</h3>
                  <p>{analysis.description}</p>
                </div>

                <button onClick={handleCompareWithCV} className={`btn-primary ${styles.compareBtn}`}>
                  Comparar con mi CV <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className={styles.emptyCard}>
                <Briefcase size={64} style={{ color: '#000000', marginBottom: '1rem' }} />
                <h3>Esperando Análisis</h3>
                <p>Ingresa una URL o pega el texto de una oferta laboral a la izquierda para ver el desglose estructurado aquí.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
