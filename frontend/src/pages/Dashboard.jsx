import React, { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { fetchWithAuth } from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
import UserEvolution from '../components/UserEvolution';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const userId = localStorage.getItem('user_id') || '1';

  const dashboardRef = useRef(null);

  useEffect(() => {
    // Fetch history from backend with auth
    fetchWithAuth(`/users/${userId}/history`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) {
            // Format data for chart
            const chartData = data.map((item, index) => ({
                name: `V${item.version_number}`,
                score: item.compatibility_score,
                date: new Date(item.created_at).toLocaleDateString()
            }));
            setHistory(chartData);
        }
      })
      .catch(err => console.error(err));
  }, [userId]);

  const handleExportPDF = () => {
    const element = dashboardRef.current;
    const opt = {
      margin:       10,
      filename:     `CVSmartAI_Reporte_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Hide sidebar for print is handled by classes usually, but html2pdf captures the element we pass.
    html2pdf().set(opt).from(element).save();
  };

  const latestScore = history.length > 0 ? history[history.length - 1].score : 0;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Dashboard Analítico</h1>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <button onClick={handleExportPDF} className="btn-secondary" style={{padding: '5px 15px', fontSize: '0.9rem'}}>
              Exportar Informe
            </button>
            <div className="status-indicator">
              <span className="dot"></span> Sistema Activo
            </div>
          </div>
        </header>

        <div ref={dashboardRef} style={{padding: '10px'}}>
          <div className={styles.metricsGrid}>
          <div className={`card glass ${styles.metricCard}`}>
            <span className={styles.metricTitle}>Score Actual</span>
            <div className={`${styles.metricValue} ${styles.glowing}`}>
              {latestScore}%
            </div>
            <span className={styles.metricSub}>Último CV analizado</span>
          </div>
          <div className={`card glass ${styles.metricCard}`}>
            <span className={styles.metricTitle}>Versiones Evaluadas</span>
            <div className={styles.metricValue}>
              {history.length}
            </div>
            <span className={styles.metricSub}>Iteraciones totales</span>
          </div>
        </div>

        <div className={`card glass ${styles.chartCard}`}>
            <h2 style={{marginBottom: '1rem'}}>Evolución del Score de Compatibilidad</h2>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#8b949e" />
                    <YAxis stroke="#8b949e" domain={[0, 100]} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                        itemStyle={{ color: '#58a6ff' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#58a6ff" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{marginBottom: '1rem', color: '#e6edf3'}}>Análisis Global de Usuarios</h2>
          <UserEvolution />
        </div>
        </div>
      </main>
    </div>
  );
}
