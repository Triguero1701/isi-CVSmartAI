import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchWithAuth } from '../utils/api';
import { UploadCloud, FileText } from 'lucide-react';
import styles from './Upload.module.css';

export default function DirectEdit() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else {
      alert('Por favor, selecciona un archivo PDF válido.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      alert('Por favor, suelta un archivo PDF válido.');
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!file) return alert('Por favor, sube un CV primero.');

    setLoading(true);
    setProgressMessage('Inicializando carga...');

    const formData = new FormData();
    formData.append('cv_file', file);
    formData.append('job_offer_text', 'Buscamos un perfil tecnológico general para extraer habilidades, experiencia y educación de manera estructurada.');

    try {
      const response = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue satisfactoria.');
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
                  navigate(`/editor/${data.cv_version_id}`);
                  return;
                } else if (data.status === 'error') {
                  alert('Error al procesar: ' + data.error);
                  setLoading(false);
                  setProgressMessage('');
                  return;
                }
              } catch (e) {
                // Ignore partial lines if any, though buffer ensures completeness
              }
            }
          }
          boundary = buffer.indexOf('\n');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión al procesar el CV: ' + error.message);
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
          <h1>Editar CV Directamente</h1>
          <p>Sube tu currículum para analizarlo con IA y cargarlo instantáneamente en el editor ATS Harvard</p>
        </header>

        <div style={{ maxWidth: '600px', margin: '2rem 0' }}>
          <form onSubmit={handleProcess} className="card">
            <div className={styles.formGroup}>
              <label>Archivo del Currículum (PDF)</label>
              <div 
                className={styles.fileDropZone}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('direct-cv-file').click()}
                style={{ borderStyle: file ? 'solid' : 'dashed', background: file ? '#F4F4F4' : '#FFFFFF' }}
              >
                <UploadCloud size={32} className={styles.uploadIcon} />
                {file ? (
                  <p>Archivo seleccionado: <span>{file.name}</span></p>
                ) : (
                  <p>Arrastra tu CV aquí o <span>haz clic para buscar</span> (PDF)</p>
                )}
                <input 
                  id="direct-cv-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px auto' }}></div>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' }}>
                  {progressMessage}
                </p>
              </div>
            ) : (
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                disabled={!file}
              >
                <FileText size={18} /> Procesar y Abrir en Editor
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
