import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_id', data.user_id);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Error en inicio de sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginShell}>
        <div className={`${styles.loginBrand} glass`}>
          <div className={styles.kicker}>SaaS Platform</div>
          <h1>
            CVSmartAI<br />
            <span className="gradient-text">Agentic Screening</span>
          </h1>
          <p className={styles.brandCopy}>
            El sistema de evaluación y filtrado de currículums impulsado por Google Document AI y Gemini. Centraliza el feedback evolutivo de los candidatos.
          </p>
          <div className={styles.brandStats}>
            <article>
              <span>98%</span>
              <p>Precisión OCR</p>
            </article>
            <article>
              <span>&lt; 2s</span>
              <p>Análisis Semántico</p>
            </article>
            <article>
              <span>100+</span>
              <p>Skills Detectables</p>
            </article>
          </div>
        </div>

        <div className={`${styles.loginCard} glass`}>
          <header>
            <h2>Bienvenido</h2>
            <p>Inicia sesión para analizar candidatos</p>
          </header>
          {error && <div className={styles.errorMessage} style={{color: '#ff6b6b', background: 'rgba(255, 0, 0, 0.1)', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>{error}</div>}
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="hr@empresa.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <button type="submit" className={`btn-primary ${styles.loginSubmit}`}>Ingresar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
