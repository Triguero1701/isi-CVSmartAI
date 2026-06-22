import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchWithAuth } from '../utils/api';
import styles from './UserEvolution.module.css';

export default function UserEvolution() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [evolutionData, setEvolutionData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user list on mount
    fetchWithAuth('/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
      })
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setEvolutionData([]);
      return;
    }

    setLoading(true);
    fetchWithAuth(`/users/${selectedUserId}/evolution`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort by version_id (or date) to ensure strict sequential order
          const sortedData = [...data].sort((a, b) => a.version_id - b.version_id);
          const chartData = sortedData.map((item, index) => ({
            name: `V${index + 1}`,
            score: item.compatibility_score,
            date: new Date(item.created_at).toLocaleDateString()
          }));
          setEvolutionData(chartData);
        } else {
          setEvolutionData([]);
        }
      })
      .catch(err => {
        console.error("Error fetching user evolution:", err);
        setEvolutionData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedUserId]);

  const handleUserChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  const latestScore = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1].score : null;

  return (
    <div className={styles.evolutionContainer}>
      <div className={styles.selectorContainer}>
        <label htmlFor="user-select" className={styles.selectorLabel}>Analizar Evolución de Usuario:</label>
        <select 
          id="user-select" 
          className={styles.userSelect} 
          value={selectedUserId} 
          onChange={handleUserChange}
        >
          <option value="">-- Seleccionar Usuario --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} (ID: {user.id})
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Evolución del Score de Compatibilidad</h3>
            {latestScore !== null && (
              <div className={styles.glowingValue}>
                {latestScore}%
              </div>
            )}
          </div>
          
          {loading ? (
            <div className={styles.noData}>Cargando datos...</div>
          ) : evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          ) : (
            <div className={styles.noData}>El usuario no tiene historial de CVs evaluados.</div>
          )}
        </div>
      )}
    </div>
  );
}
