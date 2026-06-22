import React, { forwardRef } from 'react';
import './CVTemplateModern.css';

const CVTemplateModern = forwardRef(({ data, forExport = false }, ref) => {
    if (!data) return null;

    // Support both old and new schema
    const personalInfo = data.personalInfo || {
        fullName: data.personal_info?.name || '',
        title: data.personal_info?.title || '',
        email: data.personal_info?.email || '',
        phone: data.personal_info?.phone || '',
        linkedin: data.personal_info?.linkedin || '',
        location: data.personal_info?.location || '',
        website: data.personal_info?.website || '',
    };

    const summary = data.summary || '';
    const skills = data.skills || [];
    const experience = data.experience || [];
    const education = data.education || [];
    const projects = data.projects || [];
    const languages = data.languages || [];

    return (
        <div ref={ref} className={`cv-template-modern ${forExport ? 'cv-export' : ''}`}>
            <header className="cv-header">
                <div className="header-content">
                    <h1 className="cv-name">{personalInfo.fullName || 'Tu Nombre'}</h1>
                    <h2 className="cv-title">{personalInfo.title || 'Título Profesional'}</h2>
                    <div className="cv-contact">
                        {personalInfo.email && <span>{personalInfo.email}</span>}
                        {personalInfo.phone && <span>{personalInfo.phone}</span>}
                        {personalInfo.location && <span>{personalInfo.location}</span>}
                        {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                        {personalInfo.website && <span>{personalInfo.website}</span>}
                    </div>
                </div>
            </header>

            <div className="cv-body">
                <div className="cv-main">
                    {summary && (
                        <section className="cv-section">
                            <h3 className="section-title">Perfil Profesional</h3>
                            <p className="cv-summary">{summary}</p>
                        </section>
                    )}

                    {experience.length > 0 && (
                        <section className="cv-section">
                            <h3 className="section-title">Experiencia Profesional</h3>
                            <div className="experience-list">
                                {experience.map((exp, index) => (
                                    <div key={index} className="experience-item">
                                        <div className="exp-header">
                                            <h4 className="exp-role">{exp.role}</h4>
                                            <span className="exp-duration">
                                                {exp.startDate || exp.duration}
                                                {exp.endDate ? ` - ${exp.current ? 'Presente' : exp.endDate}` : ''}
                                            </span>
                                        </div>
                                        <div className="exp-company">
                                            {exp.company}
                                            {exp.location ? ` · ${exp.location}` : ''}
                                        </div>
                                        {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                                            <ul className="cv-bullets-list" style={{ marginTop: '6px', paddingLeft: '20px', listStyleType: 'square' }}>
                                                {exp.bullets.filter(Boolean).map((bullet, idx) => (
                                                    <li key={idx} className="cv-bullet-item" style={{ marginBottom: '4px', fontSize: '9.5pt' }}>{bullet}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            exp.description && <p className="exp-desc">{exp.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {projects.length > 0 && (
                        <section className="cv-section">
                            <h3 className="section-title">Proyectos</h3>
                            <div className="experience-list">
                                {projects.map((p, index) => (
                                    <div key={index} className="experience-item">
                                        <div className="exp-header">
                                            <h4 className="exp-role">{p.name}</h4>
                                            {p.url && (
                                                <span className="exp-duration">
                                                    <a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#000000', textDecoration: 'underline' }}>
                                                        {p.url}
                                                    </a>
                                                </span>
                                            )}
                                        </div>
                                        <p className="exp-desc">{p.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="cv-sidebar">
                    {skills && (
                        <section className="cv-section">
                            <h3 className="section-title">Habilidades</h3>
                            {Array.isArray(skills) ? (
                                <div className="skills-container" style={{ fontSize: '10pt' }}>
                                    {skills.join(', ')}
                                </div>
                            ) : typeof skills === 'object' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {(() => {
                                        const SKILL_LABELS = {
                                            es: {
                                                languages: 'Lenguajes de Prog.',
                                                frameworks: 'Frameworks / Librerías',
                                                databases: 'Bases de Datos',
                                                tools: 'Herramientas',
                                                practices: 'Prácticas / Metodologías'
                                            },
                                            en: {
                                                languages: 'Languages',
                                                frameworks: 'Frameworks / Libraries',
                                                databases: 'Databases',
                                                tools: 'Tools',
                                                practices: 'Practices / Methodologies'
                                            },
                                            de: {
                                                languages: 'Programmiersprachen',
                                                frameworks: 'Frameworks / Bibliotheken',
                                                databases: 'Datenbanken',
                                                tools: 'Tools / Technologien',
                                                practices: 'Praktiken / Methoden'
                                            },
                                            fr: {
                                                languages: 'Langages de Prog.',
                                                frameworks: 'Frameworks / Bibliothèques',
                                                databases: 'Bases de Données',
                                                tools: 'Outils',
                                                practices: 'Pratiques / Méthodologies'
                                            }
                                        };
                                        const labels = SKILL_LABELS[data.cvLanguage || 'es'] || SKILL_LABELS['es'];
                                        
                                        return Object.entries(skills).map(([cat, items]) => {
                                            if (!Array.isArray(items) || items.length === 0) return null;
                                            return (
                                                <div key={cat} className="skills-list-row" style={{ fontSize: '10pt' }}>
                                                    <strong>{labels[cat] || cat}: </strong>{items.join(', ')}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : null}
                        </section>
                    )}

                    {education.length > 0 && (
                        <section className="cv-section">
                            <h3 className="section-title">Educación</h3>
                            <div className="education-list">
                                {education.map((edu, index) => (
                                    <div key={index} className="education-item">
                                        <h4 className="edu-degree">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h4>
                                        <div className="edu-inst">{edu.institution}</div>
                                        <div className="edu-year">{edu.startDate || edu.year} {edu.endDate ? ` - ${edu.endDate}` : ''}</div>
                                        {Array.isArray(edu.achievements) && edu.achievements.filter(Boolean).length > 0 && (
                                            <ul style={{ marginTop: '4px', paddingLeft: '15px', fontSize: '9pt', listStyleType: 'square' }}>
                                                {edu.achievements.filter(Boolean).map((ach, idx) => (
                                                    <li key={idx} style={{ marginBottom: '2px' }}>{ach}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {languages.length > 0 && (
                        <section className="cv-section">
                            <h3 className="section-title">Idiomas</h3>
                            <div className="education-list">
                                {languages.map((l, index) => (
                                    <div key={index} className="education-item" style={{ gap: '2px' }}>
                                        <h4 className="edu-degree" style={{ fontSize: '10pt' }}>{l.language}</h4>
                                        <div className="edu-year" style={{ fontWeight: 'normal' }}>{l.level}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
});

export default CVTemplateModern;
