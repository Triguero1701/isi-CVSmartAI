import React, { forwardRef } from 'react';
import './CVTemplateModern.css';

const CVTemplateModern = forwardRef(({ data }, ref) => {
    if (!data) return null;

    const { personal_info, summary, experience, education, skills } = data;

    return (
        <div ref={ref} className="cv-template-modern">
            <header className="cv-header">
                <div className="header-content">
                    <h1 className="cv-name">{personal_info?.name || 'Nombre'}</h1>
                    <h2 className="cv-title">{personal_info?.title || 'Título Profesional'}</h2>
                    <div className="cv-contact">
                        {personal_info?.email && <span>{personal_info.email}</span>}
                        {personal_info?.phone && <span>{personal_info.phone}</span>}
                    </div>
                </div>
            </header>

            <div className="cv-body">
                <div className="cv-main">
                    <section className="cv-section">
                        <h3 className="section-title">Perfil Profesional</h3>
                        <p className="cv-summary">{summary}</p>
                    </section>

                    <section className="cv-section">
                        <h3 className="section-title">Experiencia Profesional</h3>
                        <div className="experience-list">
                            {experience?.map((exp, index) => (
                                <div key={index} className="experience-item">
                                    <div className="exp-header">
                                        <h4 className="exp-role">{exp.role}</h4>
                                        <span className="exp-duration">{exp.duration}</span>
                                    </div>
                                    <div className="exp-company">{exp.company}</div>
                                    <p className="exp-desc">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="cv-sidebar">
                    <section className="cv-section">
                        <h3 className="section-title">Educación</h3>
                        <div className="education-list">
                            {education?.map((edu, index) => (
                                <div key={index} className="education-item">
                                    <h4 className="edu-degree">{edu.degree}</h4>
                                    <div className="edu-inst">{edu.institution}</div>
                                    <div className="edu-year">{edu.year}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="cv-section">
                        <h3 className="section-title">Habilidades</h3>
                        <div className="skills-container">
                            {skills?.map((skill, index) => (
                                <span key={index} className="skill-tag">{skill}</span>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
});

export default CVTemplateModern;
