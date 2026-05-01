import React from 'react';
import styles from './VersionCompare.module.css';

export default function VersionCompare({ v1, v2 }) {
  if (!v1 || !v2) return null;

  // Lógica de Diffing
  // Matched Skills
  const v1Matched = new Set(v1.matched_skills || []);
  const v2Matched = new Set(v2.matched_skills || []);

  const addedMatched = [...v2Matched].filter(x => !v1Matched.has(x));
  const removedMatched = [...v1Matched].filter(x => !v2Matched.has(x));
  const commonMatched = [...v1Matched].filter(x => v2Matched.has(x));

  // Missing Keywords
  const v1Missing = new Set(v1.missing_keywords || []);
  const v2Missing = new Set(v2.missing_keywords || []);

  const addedMissing = [...v2Missing].filter(x => !v1Missing.has(x));
  const removedMissing = [...v1Missing].filter(x => !v2Missing.has(x)); // Estas son mejoras!
  const commonMissing = [...v1Missing].filter(x => v2Missing.has(x));

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffSection}>
        <h3>Skills Encontrados (Comparativa)</h3>
        <div className={styles.tagList}>
          {commonMatched.map((skill, i) => (
            <span key={`cm-${i}`} className={`${styles.tag} ${styles.common}`}>{skill}</span>
          ))}
          {addedMatched.map((skill, i) => (
            <span key={`am-${i}`} className={`${styles.tag} ${styles.added}`}>+ {skill}</span>
          ))}
          {removedMatched.map((skill, i) => (
            <span key={`rm-${i}`} className={`${styles.tag} ${styles.removed}`}>- {skill}</span>
          ))}
        </div>
      </div>

      <div className={styles.diffSection}>
        <h3>Keywords Faltantes (Comparativa)</h3>
        <p className={styles.infoText}>En verde las keywords que has resuelto (eliminado de faltantes).</p>
        <div className={styles.tagList}>
          {commonMissing.map((kw, i) => (
            <span key={`cmi-${i}`} className={`${styles.tag} ${styles.common}`}>{kw}</span>
          ))}
          {addedMissing.map((kw, i) => (
            <span key={`ami-${i}`} className={`${styles.tag} ${styles.removed}`}>+ {kw} (Empeoró)</span>
          ))}
          {removedMissing.map((kw, i) => (
            <span key={`rmi-${i}`} className={`${styles.tag} ${styles.added}`}>- {kw} (Resuelto!)</span>
          ))}
        </div>
      </div>
    </div>
  );
}
