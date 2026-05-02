import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
        <div className={`card glass ${styles.chartCard}`}>
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
              <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEvolutionScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3fb950" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3fb950" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#8b949e" />
                <YAxis stroke="#8b949e" domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                  itemStyle={{ color: '#3fb950' }}
                  labelStyle={{ color: '#e6edf3', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3fb950" fillOpacity={1} fill="url(#colorEvolutionScore)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noData}>El usuario no tiene historial de CVs evaluados.</div>
          )}
        </div>
      )}
    </div>
  );
}
