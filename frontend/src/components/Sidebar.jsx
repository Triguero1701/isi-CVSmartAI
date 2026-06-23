import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, LogOut, Briefcase, FileText } from 'lucide-react';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { icon: UploadCloud, label: 'Subir CV', path: '/upload' },
  { icon: FileText, label: 'Editar CV', path: '/direct-edit' },
  { icon: Briefcase, label: 'Analizar Oferta', path: '/oferta' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
];

export default function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>CVSmartAI</div>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            isActive ? `${styles.sidebarItem} ${styles.sidebarItemActive}` : styles.sidebarItem
          }
        >
          <item.icon size={16} strokeWidth={1.75} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div style={{ flexGrow: 1 }}></div>
      <NavLink
        to="/login"
        className={styles.sidebarItem}
        style={{ marginTop: 'auto' }}
      >
        <LogOut size={16} strokeWidth={1.75} />
        <span>Salir</span>
      </NavLink>
    </nav>
  );
}
