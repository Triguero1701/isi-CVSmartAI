import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={`${styles.logo} gradient-text`}>CVSmartAI</div>
      <nav className={styles.navMenu}>
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink 
          to="/upload" 
          className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <UploadCloud size={20} /> Subir CV
        </NavLink>
        <div style={{flexGrow: 1}}></div>
        <NavLink to="/login" className={styles.navItem} style={{marginTop: 'auto'}}>
          <LogOut size={20} /> Salir
        </NavLink>
      </nav>
    </aside>
  );
}
