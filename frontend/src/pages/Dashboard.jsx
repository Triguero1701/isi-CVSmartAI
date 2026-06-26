import React, { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { fetchWithAuth } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
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
                name: `V${index + 1}`,
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
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Score Actual</span>
              <div className={`${styles.metricValue} ${styles.glowing}`}>
                {latestScore}%
              </div>
              <span className={styles.metricSub}>Último CV analizado</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricTitle}>Versiones Evaluadas</span>
              <div className={styles.metricValue}>
                {history.length}
              </div>
              <span className={styles.metricSub}>Iteraciones totales</span>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h2>Evolución del Score de Compatibilidad</h2>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#000000" 
                  fontSize={12} 
                  tickLine={true} 
                  axisLine={{ stroke: '#000000', strokeWidth: 3 }} 
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }} 
                />
                <YAxis 
                  stroke="#000000" 
                  fontSize={12} 
                  tickLine={true} 
                  axisLine={{ stroke: '#000000', strokeWidth: 3 }} 
                  domain={[0, 100]} 
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }} 
                />
                <CartesianGrid strokeDasharray="4 4" stroke="#000000" strokeWidth={1.5} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#FFFFFF', 
                    border: '3px solid #000000', 
                    fontSize: 13, 
                    boxShadow: 'none',
                    color: '#000000',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#000000' }}
                />
                <Line 
                  type="linear" 
                  dataKey="score" 
                  stroke="#000000" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#00FF00', stroke: '#000000', strokeWidth: 3 }} 
                  activeDot={{ r: 8, fill: '#00FF00', stroke: '#000000', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
