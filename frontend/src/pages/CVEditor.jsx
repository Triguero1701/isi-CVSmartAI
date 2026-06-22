import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CVTemplateModern from '../components/templates/CVTemplateModern';
import { EXAMPLE_ANALYSIS } from '../data/exampleAnalysis';
import { fetchWithAuth } from '../utils/api';
import { Save, Download, ArrowLeft, Plus, Trash2, X, Globe, FileText, Upload } from 'lucide-react';
import styles from './CVEditor.module.css';

// 1. Data Schema Defaults
const emptyCV = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
    website: '',
    photoUrl: null,
  },
  skills: {
    languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    practices: [],
  },
  experience: [],
  projects: [],
  education: [],
  languages: [],
  cvLanguage: 'es',
  summary: '',
  atsScore: 78,
};

// 2. Normalization Helper
const SKILL_CATEGORIES_MAP = {
  languages: ['javascript', 'typescript', 'sql', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'html', 'css', 'php', 'bash', 'c'],
  frameworks: ['react', 'node.js', 'next.js', 'vue', 'angular', 'express', 'django', 'flask', 'spring boot', 'laravel', 'nest.js', 'svelte', 'jquery', 'bootstrap', 'tailwind'],
  databases: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'mariadb', 'cassandra', 'dynamodb', 'firebase'],
  tools: ['git', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'jenkins', 'github actions', 'jira', 'figma', 'npm', 'webpack', 'vite', 'postman'],
  practices: ['agile', 'scrum', 'ci/cd', 'tdd', 'clean code', 'rest api', 'graphql', 'devops', 'microservices', 'unit testing', 'testing', 'mocking']
};

export function normalizeCVData(data) {
  if (!data) return emptyCV;

  // Personal Info mapping (supports legacy format too)
  const p = data.personalInfo || {};
  const oldP = data.personal_info || {};
  const personalInfo = {
    fullName: p.fullName || oldP.name || '',
    title: p.title || oldP.title || '',
    email: p.email || oldP.email || '',
    phone: p.phone || oldP.phone || '',
    linkedin: p.linkedin || oldP.linkedin || '',
    location: p.location || oldP.location || '',
    website: p.website || oldP.website || '',
    photoUrl: p.photoUrl || oldP.photoUrl || null,
  };

  // Skills mapping
  let skills = {
    languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    practices: [],
  };

  if (data.skills && !Array.isArray(data.skills) && typeof data.skills === 'object') {
    skills = {
      languages: Array.isArray(data.skills.languages) ? data.skills.languages : [],
      frameworks: Array.isArray(data.skills.frameworks) ? data.skills.frameworks : [],
      databases: Array.isArray(data.skills.databases) ? data.skills.databases : [],
      tools: Array.isArray(data.skills.tools) ? data.skills.tools : [],
      practices: Array.isArray(data.skills.practices) ? data.skills.practices : [],
    };
  } else if (Array.isArray(data.skills)) {
    // Attempt automatic categorization
    data.skills.forEach(skill => {
      const cleanSkill = skill.toLowerCase().trim();
      let categorized = false;
      for (const [category, keywords] of Object.entries(SKILL_CATEGORIES_MAP)) {
        if (keywords.includes(cleanSkill) || keywords.some(k => cleanSkill.includes(k))) {
          skills[category].push(skill);
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        skills.tools.push(skill);
      }
    });
  }

  // Experience mapping
  const rawExperience = Array.isArray(data.experience) ? data.experience : [];
  const experience = rawExperience.map((exp, index) => {
    let bullets = [];
    if (Array.isArray(exp.bullets)) {
      bullets = exp.bullets;
    } else if (exp.description) {
      bullets = [exp.description];
    }
    if (bullets.length === 0) {
      bullets = [''];
    }
    return {
      id: exp.id || `exp-${index}-${Date.now()}`,
      company: exp.company || '',
      role: exp.role || '',
      startDate: exp.startDate || exp.duration || '',
      endDate: exp.endDate || '',
      current: exp.current || false,
      location: exp.location || '',
      bullets: bullets,
    };
  });

  // Projects mapping
  const rawProjects = Array.isArray(data.projects) ? data.projects : [];
  const projects = rawProjects.map((proj, index) => ({
    id: proj.id || `proj-${index}-${Date.now()}`,
    name: proj.name || '',
    description: proj.description || '',
    url: proj.url || '',
  }));

  // Education mapping
  const rawEducation = Array.isArray(data.education) ? data.education : [];
  const education = rawEducation.map((edu, index) => {
    let achievements = [];
    if (Array.isArray(edu.achievements)) {
      achievements = edu.achievements;
    }
    if (achievements.length === 0) {
      achievements = [''];
    }
    return {
      id: edu.id || `edu-${index}-${Date.now()}`,
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: edu.startDate || edu.year || '',
      endDate: edu.endDate || '',
      achievements: achievements,
    };
  });

  // Languages spoken mapping
  const rawLanguages = Array.isArray(data.languages) ? data.languages : [];
  const cvLanguages = rawLanguages.map((l, index) => ({
    id: l.id || `lang-${index}-${Date.now()}`,
    language: l.language || '',
    level: l.level || '',
  }));

  return {
    personalInfo,
    skills,
    experience,
    projects,
    education,
    languages: cvLanguages,
    summary: data.summary || '',
    cvLanguage: data.cvLanguage || 'es',
    atsScore: data.atsScore || data.compatibility_score || 78,
  };
}

// 3. Word Counter Helper
export function countWords(cvData) {
  if (!cvData) return 0;
  const texts = [
    cvData.personalInfo?.fullName,
    cvData.personalInfo?.title,
    cvData.summary,
    ...(cvData.experience?.flatMap(e => [e.role, e.company, e.location, ...(e.bullets || [])]) || []),
    ...(cvData.projects?.flatMap(p => [p.name, p.description]) || []),
    ...(cvData.education?.flatMap(e => [e.institution, e.degree, e.field, ...(e.achievements || [])]) || []),
    ...(cvData.languages?.map(l => l.language) || [])
  ].filter(Boolean);
  return texts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

// 4. Markdown Generator Helper
export function cvToMarkdown(data) {
  if (!data) return '';
  const { personalInfo, summary, skills, experience, projects, education, languages } = data;
  
  let md = `# ${personalInfo?.fullName || 'Tu Nombre'}\n`;
  if (personalInfo?.title) md += `**${personalInfo.title}**\n\n`;
  
  const contactParts = [
    personalInfo?.email,
    personalInfo?.phone,
    personalInfo?.location,
    personalInfo?.linkedin,
    personalInfo?.website
  ].filter(Boolean);
  
  if (contactParts.length > 0) {
    md += `${contactParts.join(' · ')}\n\n`;
  }
  
  if (summary) {
    md += `## Perfil Profesional\n${summary}\n\n`;
  }
  
  const hasSkills = skills && Object.values(skills).some(arr => Array.isArray(arr) && arr.length > 0);
  if (hasSkills) {
    md += `## Habilidades\n`;
    const SKILL_LABELS_MD = {
      languages: 'Lenguajes de Prog.',
      frameworks: 'Frameworks / Librerías',
      databases: 'Bases de Datos',
      tools: 'Herramientas',
      practices: 'Prácticas / Metodologías'
    };
    for (const [cat, items] of Object.entries(skills)) {
      if (Array.isArray(items) && items.length > 0) {
        md += `**${SKILL_LABELS_MD[cat] || cat}:** ${items.join(', ')}\n\n`;
      }
    }
  }
  
  if (Array.isArray(experience) && experience.length > 0) {
    md += `## Experiencia Profesional\n`;
    experience.forEach(exp => {
      const duration = exp.startDate + (exp.endDate ? ` - ${exp.current ? 'Presente' : exp.endDate}` : '');
      md += `### ${exp.role} — ${exp.company}${exp.location ? ` (${exp.location})` : ''}\n`;
      md += `*${duration}*\n\n`;
      if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
        exp.bullets.filter(Boolean).forEach(bullet => {
          md += `- ${bullet}\n`;
        });
        md += `\n`;
      }
    });
  }
  
  if (Array.isArray(projects) && projects.length > 0) {
    md += `## Proyectos\n`;
    projects.forEach(p => {
      md += `### ${p.name}${p.url ? ` — [Link](${p.url})` : ''}\n`;
      if (p.description) md += `${p.description}\n\n`;
    });
  }
  
  if (Array.isArray(education) && education.length > 0) {
    md += `## Educación\n`;
    education.forEach(edu => {
      const duration = edu.startDate + (edu.endDate ? ` - ${edu.endDate}` : '');
      const fieldText = edu.field ? ` en ${edu.field}` : '';
      md += `### ${edu.degree}${fieldText} — ${edu.institution}\n`;
      md += `*${duration}*\n\n`;
      if (Array.isArray(edu.achievements) && edu.achievements.filter(Boolean).length > 0) {
        edu.achievements.filter(Boolean).forEach(ach => {
          md += `- ${ach}\n`;
        });
        md += `\n`;
      }
    });
  }
  
  if (Array.isArray(languages) && languages.length > 0) {
    md += `## Idiomas\n`;
    languages.forEach(l => {
      md += `- **${l.language}:** ${l.level}\n`;
    });
    md += `\n`;
  }
  
  return md;
}

// 5. Simulated AI Translation Function
function translateCVData(data, targetLang) {
  const tDict = {
    // English -> Spanish
    "senior fullstack developer": "Desarrollador Full Stack Senior",
    "senior frontend developer": "Desarrollador Senior Frontend",
    "junior fullstack developer": "Desarrollador Junior Fullstack",
    "software developer": "Desarrollador de Software",
    "madrid, spain": "Madrid, España",
    "english": "Inglés",
    "spanish": "Español",
    "native": "Nativo",
    "professional": "Profesional",
    "b2": "B2",
    "c1": "C1",
    "c2": "C2",
    "bachelor's degree in computer science": "Grado en Ingeniería Informática",
    "polytechnic university": "Universidad Politécnica",
    "complutense university of madrid": "Universidad Complutense de Madrid",
    "outstanding achievement in the final year project": "Logro destacado en el proyecto de fin de grado",
    "e-commerce saas platform": "Plataforma SaaS de E-commerce",
    "full development of a scalable online store with an integrated payment gateway.": "Desarrollo completo de una tienda en línea escalable con pasarela de pagos integrada.",
    "real-time analytics dashboard": "Dashboard de Analítica en Tiempo Real",
    "interactive panel to visualize system performance metrics.": "Panel interactivo para visualizar métricas de rendimiento del sistema.",
    "development of microservices in node.js and frontend components in react/typescript. 30% improvement in backend api latency.":
      "Desarrollo de microservicios en Node.js y componentes frontend en React/TypeScript. Mejora del 30% en la latencia de APIs backend.",
    "creation of web applications with javascript and postgresql databases. maintenance of integrations with external payment gateways.":
      "Creación de aplicaciones web con JavaScript y bases de datos PostgreSQL. Mantenimiento de integraciones con pasarelas de pago externas.",
    
    // Spanish -> English
    "desarrollador full stack senior": "Senior Fullstack Developer",
    "desarrollador fullstack senior": "Senior Fullstack Developer",
    "desarrollador senior frontend": "Senior Frontend Developer",
    "desarrollador junior fullstack": "Junior Fullstack Developer",
    "desarrollador de software": "Software Developer",
    "madrid, españa": "Madrid, Spain",
    "inglés": "English",
    "español": "Spanish",
    "nativo": "Native",
    "profesional": "Professional",
    "grado en ingeniería informática": "Bachelor's Degree in Computer Science",
    "universidad politécnica": "Polytechnic University",
    "universidad complutense de madrid": "Complutense University of Madrid",
    "logro destacado en el proyecto de fin de grado": "Outstanding achievement in the final year project",
    "plataforma saas de e-commerce": "E-commerce SaaS Platform",
    "desarrollo completo de una tienda en línea escalable con pasarela de pagos integrada.": "Full development of a scalable online store with an integrated payment gateway.",
    "dashboard de analítica en tiempo real": "Real-Time Analytics Dashboard",
    "panel interactivo para visualizar métricas de rendimiento del sistema.": "Interactive panel to visualize system performance metrics.",
    "desarrollo de microservicios en node.js y componentes frontend en react/typescript. mejora del 30% en la latencia de apis backend.":
      "Development of microservices in Node.js and frontend components in React/TypeScript. 30% improvement in backend API latency.",
    "creación de aplicaciones web con javascript y bases de datos postgresql. mantenimiento de integraciones con pasarelas de pago externas.":
      "Creation of web applications with JavaScript and PostgreSQL databases. Maintenance of integrations with external payment gateways.",
  };

  const translateStr = (str) => {
    if (!str) return '';
    const clean = str.trim().toLowerCase();
    
    if (tDict[clean]) return tDict[clean];
    
    // Fallback logic for longer paragraphs
    if (clean.includes("con más de 6 años de experiencia")) {
      return targetLang === 'en' 
        ? "Fullstack Engineer with more than 6 years of experience developing modern and robust web applications, specialized in React and Node.js. Passionate about API optimization and database design."
        : "Ingeniero Fullstack con más de 6 años de experiencia desarrollando aplicaciones web modernas y robustas, especializado en React y Node.js. Apasionado por la optimización de APIs y el diseño de bases de datos.";
    }
    if (clean.includes("fullstack engineer with more than 6 years")) {
      return targetLang === 'es'
        ? "Ingeniero Fullstack con más de 6 años de experiencia desarrollando aplicaciones web modernas y robustas, especializado en React y Node.js. Apasionado por la optimización de APIs y el diseño de bases de datos."
        : "Fullstack Engineer with more than 6 years of experience developing modern and robust web applications, specialized in React and Node.js. Passionate about API optimization and database design.";
    }

    return str;
  };

  const personalInfo = {
    ...data.personalInfo,
    title: translateStr(data.personalInfo.title),
    location: translateStr(data.personalInfo.location)
  };

  const summary = translateStr(data.summary);

  const experience = data.experience.map(exp => ({
    ...exp,
    role: translateStr(exp.role),
    bullets: exp.bullets.map(b => translateStr(b))
  }));

  const projects = data.projects.map(proj => ({
    ...proj,
    name: translateStr(proj.name),
    description: translateStr(proj.description)
  }));

  const education = data.education.map(edu => ({
    ...edu,
    degree: translateStr(edu.degree),
    institution: translateStr(edu.institution),
    achievements: edu.achievements.map(a => translateStr(a))
  }));

  const languages = data.languages.map(l => ({
    ...l,
    language: translateStr(l.language),
    level: translateStr(l.level)
  }));

  return {
    ...data,
    cvLanguage: targetLang,
    personalInfo,
    summary,
    experience,
    projects,
    education,
    languages
  };
}

// 6. TagInput Subcomponent
function TagInput({ onAdd }) {
  const [value, setValue] = useState('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        onAdd(value);
        setValue('');
      }
    }
  };
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
      <input
        type="text"
        className={styles.tagInput}
        placeholder="Añadir y presionar Enter..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button 
        type="button" 
        onClick={() => {
          if (value.trim()) {
            onAdd(value);
            setValue('');
          }
        }} 
        className="btn-secondary"
        style={{ padding: '8px 12px', border: '2px solid #000000', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
      >
        +
      </button>
    </div>
  );
}

// 7. MAIN CV EDITOR COMPONENT
export default function CVEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cvPreviewRef = useRef(null);
  
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');

  // Banner Import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  // IA Translation simulation state
  const [translating, setTranslating] = useState(false);
  const [translationStep, setTranslationStep] = useState('');

  // Markdown Modal state
  const [markdownModalOpen, setMarkdownModalOpen] = useState(false);

  // Language selection modal state
  const [showLanguageSelectModal, setShowLanguageSelectModal] = useState(false);

  // Load CV
  useEffect(() => {
    const loadCV = async () => {
      setLoading(true);
      setError(null);
      
      if (id === 'example') {
        setCvData(normalizeCVData(EXAMPLE_ANALYSIS.extracted_data));
        setLoading(false);
        return;
      }

      try {
        const res = await fetchWithAuth(`/cv-versions/${id}`);
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          if (data.data.structured_data) {
            setCvData(normalizeCVData(data.data.structured_data));
          } else {
            setCvData(normalizeCVData({}));
          }
        } else {
          setError(data.message || 'Error al cargar el CV.');
        }
      } catch (err) {
        setError('Error al cargar la información del CV.');
      } finally {
        setLoading(false);
      }
    };

    loadCV();
  }, [id]);

  // Live page & word counts
  const wordCount = useMemo(() => countWords(cvData), [cvData]);
  const estimatedPages = useMemo(() => Math.max(1, Math.ceil(wordCount / 400)), [wordCount]);

  // Personal info handlers
  const handlePersonalInfoChange = (field, val) => {
    setCvData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: val
      }
    }));
  };

  const handleSummaryChange = (val) => {
    setCvData(prev => ({
      ...prev,
      summary: val
    }));
  };

  // Skills handlers
  const SKILL_CATEGORIES = [
    { key: 'languages', label: 'Lenguajes de Programación' },
    { key: 'frameworks', label: 'Frameworks / Librerías' },
    { key: 'databases', label: 'Bases de Datos' },
    { key: 'tools', label: 'Herramientas / Tecnologías' },
    { key: 'practices', label: 'Prácticas / Metodologías' }
  ];

  const addSkill = (category, value) => {
    if (!value.trim()) return;
    setCvData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...(prev.skills[category] || []), value.trim()]
      }
    }));
  };

  const removeSkill = (category, index) => {
    setCvData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: (prev.skills[category] || []).filter((_, i) => i !== index)
      }
    }));
  };

  // Experience handlers
  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { id: `exp-${Date.now()}`, company: '', role: '', startDate: '', endDate: '', current: false, location: '', bullets: [''] }
      ]
    }));
  };

  const updateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const removeExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addExperienceBullet = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, bullets: [...exp.bullets, ''] } : exp)
    }));
  };

  const updateExperienceBullet = (id, bIdx, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? {
        ...exp,
        bullets: exp.bullets.map((b, i) => i === bIdx ? value : b)
      } : exp)
    }));
  };

  const removeExperienceBullet = (id, bIdx) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? {
        ...exp,
        bullets: exp.bullets.filter((_, i) => i !== bIdx)
      } : exp)
    }));
  };

  // Projects handlers
  const addProject = () => {
    setCvData(prev => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { id: `proj-${Date.now()}`, name: '', description: '', url: '' }
      ]
    }));
  };

  const updateProject = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removeProject = (id) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  // Education handlers
  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { id: `edu-${Date.now()}`, institution: '', degree: '', field: '', startDate: '', endDate: '', achievements: [''] }
      ]
    }));
  };

  const updateEducation = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const removeEducation = (id) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addEducationAchievement = (id) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, achievements: [...edu.achievements, ''] } : edu)
    }));
  };

  const updateEducationAchievement = (id, aIdx, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? {
        ...edu,
        achievements: edu.achievements.map((a, i) => i === aIdx ? value : a)
      } : edu)
    }));
  };

  const removeEducationAchievement = (id, aIdx) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? {
        ...edu,
        achievements: edu.achievements.filter((_, i) => i !== aIdx)
      } : edu)
    }));
  };

  // Languages spoken handlers
  const addLanguage = () => {
    setCvData(prev => ({
      ...prev,
      languages: [
        ...(prev.languages || []),
        { id: `lang-${Date.now()}`, language: '', level: '' }
      ]
    }));
  };

  const updateLanguage = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  const removeLanguage = (id) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l.id !== id)
    }));
  };

  // Save changes
  const handleSave = async () => {
    if (id === 'example') {
      alert('¡Modo de prueba! Los datos no se guardarán en la base de datos real.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAuth(`/cv-versions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ structured_data: cvData })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('¡Cambios guardados con éxito!');
      } else {
        alert('Error al guardar: ' + data.message);
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin:       0,
      filename:     `CV_${(cvData.personalInfo?.fullName || 'CV').replace(/\s+/g, '_')}_Premium.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(cvPreviewRef.current).set(opt).save();
  };

  // SSE File Import Handler
  const handleAnalyzeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setImportProgress('Inicializando carga...');
    
    const formData = new FormData();
    formData.append('cv_file', file);
    
    const storedJobText = localStorage.getItem('job_offer_text_analyzer') || 
      'Buscamos un Ingeniero de Software / Fullstack Developer con experiencia en desarrollo web moderno.';
    formData.append('job_offer_text', storedJobText);

    try {
      const response = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue satisfactoria.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        for (let line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.status === 'progress') {
                  setImportProgress(data.message);
                } else if (data.status === 'success') {
                  if (data.extracted_data) {
                    const normalized = normalizeCVData(data.extracted_data);
                    normalized.atsScore = data.compatibility_score || 78;
                    setCvData(normalized);
                  }
                  alert('¡CV importado y procesado con éxito!');
                } else if (data.status === 'error') {
                  alert('Error al analizar: ' + data.error);
                }
              } catch (e) {
                // Ignore partial JSON parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión al importar el CV: ' + error.message);
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  // Real AI Translation handler using backend Gemini endpoint
  const handleTranslate = async (targetLang) => {
    if (!cvData) return;
    
    setTranslating(true);
    
    const langNames = { es: 'Castellano', en: 'Inglés', de: 'Alemán', fr: 'Francés' };
    const langName = langNames[targetLang] || targetLang;
    setTranslationStep(`Traduciendo contenido del CV al ${langName} con Gemini...`);
    
    try {
      const response = await fetchWithAuth('/translate-cv', {
        method: 'POST',
        body: JSON.stringify({
          cv_data: cvData,
          target_language: targetLang
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setTranslationStep("Traducción completada. Actualizando editor...");
        const normalized = normalizeCVData(data.translated_data);
        normalized.cvLanguage = targetLang;
        setCvData(normalized);
      } else {
        alert('Error al traducir: ' + (data.message || 'Error de traducción.'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar traducir.');
    } finally {
      setTranslating(false);
      setTranslationStep('');
    }
  };

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = () => {
    const md = cvToMarkdown(cvData);
    navigator.clipboard.writeText(md);
    alert('¡Copiado al portapapeles!');
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </main>
      </div>
    );
  }

  if (error || !cvData) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--danger)' }}>{error || 'No se pudieron cargar los datos del CV.'}</p>
            <button onClick={() => navigate('/upload')} className="btn-primary" style={{ marginTop: '1rem' }}>
              Volver a Análisis
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content" style={{ padding: '0', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Controls */}
        <header className={styles.editorHeader}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1>Editor de CV</h1>
                <span className={styles.scoreBadge}>Score ATS: {cvData.atsScore || 78}%</span>
              </div>
              <p className={styles.subtext}>
                <span className={styles.creditText}>Plantilla basada en CV ATS format Harvard</span>
              </p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <div className={styles.headerMeta}>
              <span className={styles.counterBadge}>
                {wordCount} palabras · {estimatedPages} {estimatedPages === 1 ? 'página' : 'páginas'}
              </span>
              
              <button onClick={() => setShowLanguageSelectModal(true)} className={styles.translateBtn}>
                TRADUCIR CON IA
              </button>

              <button onClick={() => setMarkdownModalOpen(true)} className={styles.langBtn}>
                <FileText size={14} /> VER MARKDOWN
              </button>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            
            <button onClick={handleExportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Download size={16} /> PDF
            </button>
          </div>
        </header>

        {/* Split Editor layout */}
        <div className={styles.splitContainer}>
          
          {/* Left Column Form */}
          <div className={styles.leftPanel}>
            
            {/* Import CV Banner */}
            <div style={{ padding: '24px 24px 0 24px' }}>
              <div className={styles.importBanner}>
                <div className={styles.importBannerText}>
                  <strong>¿Tienes un CV existente?</strong>
                  <p>Sube tu archivo PDF y lo procesaremos con Inteligencia Artificial para rellenar el formulario en un instante.</p>
                </div>
                <div className={styles.importActions}>
                  <label className={styles.fileInputLabel}>
                    <Upload size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {importing ? 'Procesando...' : 'Subir PDF'}
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleAnalyzeUpload} 
                      disabled={importing} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  {importing && <span className={styles.importProgress}>{importProgress}</span>}
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <nav className={styles.formNav}>
              <button onClick={() => setActiveSection('personal')} className={activeSection === 'personal' ? styles.activeTab : ''}>Información</button>
              <button onClick={() => setActiveSection('skills')} className={activeSection === 'skills' ? styles.activeTab : ''}>Habilidades</button>
              <button onClick={() => setActiveSection('experience')} className={activeSection === 'experience' ? styles.activeTab : ''}>Experiencia</button>
              <button onClick={() => setActiveSection('projects')} className={activeSection === 'projects' ? styles.activeTab : ''}>Proyectos</button>
              <button onClick={() => setActiveSection('education')} className={activeSection === 'education' ? styles.activeTab : ''}>Educación</button>
              <button onClick={() => setActiveSection('languages')} className={activeSection === 'languages' ? styles.activeTab : ''}>Idiomas</button>
            </nav>

            <div className={styles.formContent}>
              
              {/* Personal Info Form */}
              {activeSection === 'personal' && (
                <div className={styles.formGroup}>
                  <h3>Información Personal</h3>
                  <label>Nombre Completo</label>
                  <input
                    type="text"
                    value={cvData.personalInfo?.fullName || ''}
                    placeholder="Ej: Juan López"
                    onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                  />
                  
                  <label>Título Profesional</label>
                  <input
                    type="text"
                    value={cvData.personalInfo?.title || ''}
                    placeholder="Ej: Senior Fullstack Developer"
                    onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                  />

                  <div className={styles.fieldRow}>
                    <div>
                      <label>Correo Electrónico</label>
                      <input
                        type="email"
                        value={cvData.personalInfo?.email || ''}
                        placeholder="tu@email.com"
                        onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Teléfono</label>
                      <input
                        type="text"
                        value={cvData.personalInfo?.phone || ''}
                        placeholder="+34 600 000 000"
                        onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div>
                      <label>Ubicación</label>
                      <input
                        type="text"
                        value={cvData.personalInfo?.location || ''}
                        placeholder="Ej: Madrid, España"
                        onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>LinkedIn</label>
                      <input
                        type="text"
                        value={cvData.personalInfo?.linkedin || ''}
                        placeholder="linkedin.com/in/usuario"
                        onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      />
                    </div>
                  </div>

                  <label>Sitio Web Personal</label>
                  <input
                    type="text"
                    value={cvData.personalInfo?.website || ''}
                    placeholder="miweb.com"
                    onChange={(e) => handlePersonalInfoChange('website', e.target.value)}
                  />

                  <label>Resumen Profesional</label>
                  <textarea
                    rows={6}
                    value={cvData.summary || ''}
                    placeholder="Escribe un breve resumen de tu trayectoria y metas profesionales..."
                    onChange={(e) => handleSummaryChange(e.target.value)}
                  />
                </div>
              )}

              {/* Skills Form */}
              {activeSection === 'skills' && (
                <div>
                  <h3>Habilidades por Categorías</h3>
                  {SKILL_CATEGORIES.map(cat => (
                    <div key={cat.key} className={styles.skillCategory}>
                      <label>{cat.label}</label>
                      <div className={styles.tagList}>
                        {((cvData.skills || {})[cat.key] || []).map((skill, idx) => (
                          <span key={idx} className={styles.skillTag}>
                            {skill}
                            <button type="button" onClick={() => removeSkill(cat.key, idx)} className={styles.tagRemoveBtn}>×</button>
                          </span>
                        ))}
                      </div>
                      <TagInput onAdd={(value) => addSkill(cat.key, value)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Experience Form */}
              {activeSection === 'experience' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Experiencia Profesional</h3>
                    <button onClick={addExperience} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <Plus size={14} /> Añadir Puesto
                    </button>
                  </div>

                  {cvData.experience?.map((exp, idx) => (
                    <div key={exp.id || idx} className={styles.itemCard}>
                      <div className={styles.cardHeader}>
                        <h4>Posición #{idx + 1}</h4>
                        <button onClick={() => removeExperience(exp.id)} className={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.fieldRow}>
                        <div>
                          <label>Cargo / Rol</label>
                          <input
                            type="text"
                            value={exp.role || ''}
                            placeholder="Ej: Desarrollador Frontend Senior"
                            onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Empresa</label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            placeholder="Ej: Tech Solutions S.L."
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div>
                          <label>Fecha de Inicio</label>
                          <input
                            type="text"
                            value={exp.startDate || ''}
                            placeholder="Ej: Enero 2021"
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Fecha de Fin</label>
                          <input
                            type="text"
                            value={exp.endDate || ''}
                            placeholder="Ej: Presente"
                            disabled={exp.current}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div>
                          <label>Ubicación</label>
                          <input
                            type="text"
                            value={exp.location || ''}
                            placeholder="Ej: Madrid, España"
                            onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={exp.current}
                              className={styles.checkboxInput}
                              onChange={(e) => {
                                updateExperience(exp.id, 'current', e.target.checked);
                                if (e.target.checked) {
                                  updateExperience(exp.id, 'endDate', 'Presente');
                                }
                              }}
                            />
                            Trabajo Actual
                          </label>
                        </div>
                      </div>

                      <label style={{ display: 'block', marginBottom: '8px' }}>Logros y responsabilidades</label>
                      {(exp.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className={styles.bulletRow}>
                          <span className={styles.bulletDot}>•</span>
                          <textarea
                            className={styles.bulletInput}
                            rows={2}
                            value={bullet}
                            placeholder="Ej: Lideré la migración de arquitectura web..."
                            onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                          />
                          <button type="button" onClick={() => removeExperienceBullet(exp.id, bIdx)} className={styles.deleteBtn} style={{ padding: '6px' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className={styles.addLink} onClick={() => addExperienceBullet(exp.id)}>
                        + Añadir logro/responsabilidad
                      </button>
                    </div>
                  ))}

                  {(!cvData.experience || cvData.experience.length === 0) && (
                    <p style={{ fontWeight: 'bold', textAlign: 'center', padding: '2rem' }}>No se ha agregado experiencia laboral.</p>
                  )}
                </div>
              )}

              {/* Projects Form */}
              {activeSection === 'projects' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Proyectos Destacados</h3>
                    <button onClick={addProject} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <Plus size={14} /> Añadir Proyecto
                    </button>
                  </div>

                  {cvData.projects?.map((proj, idx) => (
                    <div key={proj.id || idx} className={styles.itemCard}>
                      <div className={styles.cardHeader}>
                        <h4>Proyecto #{idx + 1}</h4>
                        <button onClick={() => removeProject(proj.id)} className={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <label>Nombre del Proyecto</label>
                      <input
                        type="text"
                        value={proj.name || ''}
                        placeholder="Ej: Portal de E-commerce"
                        onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                      />

                      <label>URL del Proyecto (opcional)</label>
                      <input
                        type="text"
                        value={proj.url || ''}
                        placeholder="Ej: github.com/usuario/proyecto"
                        onChange={(e) => updateProject(proj.id, 'url', e.target.value)}
                      />

                      <label>Descripción</label>
                      <textarea
                        rows={4}
                        value={proj.description || ''}
                        placeholder="Describe las características principales, stack tecnológico y tu contribución..."
                        onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                      />
                    </div>
                  ))}

                  {(!cvData.projects || cvData.projects.length === 0) && (
                    <p style={{ fontWeight: 'bold', textAlign: 'center', padding: '2rem' }}>No se han agregado proyectos.</p>
                  )}
                </div>
              )}

              {/* Education Form */}
              {activeSection === 'education' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Educación y Formación</h3>
                    <button onClick={addEducation} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <Plus size={14} /> Añadir Formación
                    </button>
                  </div>

                  {cvData.education?.map((edu, idx) => (
                    <div key={edu.id || idx} className={styles.itemCard}>
                      <div className={styles.cardHeader}>
                        <h4>Educación #{idx + 1}</h4>
                        <button onClick={() => removeEducation(edu.id)} className={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.fieldRow}>
                        <div>
                          <label>Título / Grado obtenido</label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            placeholder="Ej: Ingeniería en Informática"
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Campo de Estudio / Especialidad</label>
                          <input
                            type="text"
                            value={edu.field || ''}
                            placeholder="Ej: Desarrollo de Software"
                            onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                          />
                        </div>
                      </div>

                      <label>Institución / Universidad</label>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        placeholder="Ej: Universidad Complutense"
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      />

                      <div className={styles.fieldRow}>
                        <div>
                          <label>Fecha de Inicio</label>
                          <input
                            type="text"
                            value={edu.startDate || ''}
                            placeholder="Ej: 2018"
                            onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Fecha de Finalización</label>
                          <input
                            type="text"
                            value={edu.endDate || ''}
                            placeholder="Ej: 2022"
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <label style={{ display: 'block', marginBottom: '8px' }}>Logros destacados (opcional)</label>
                      {(edu.achievements || []).map((achievement, aIdx) => (
                        <div key={aIdx} className={styles.bulletRow}>
                          <span className={styles.bulletDot}>•</span>
                          <textarea
                            className={styles.bulletInput}
                            rows={2}
                            value={achievement}
                            placeholder="Ej: Mención de honor en proyecto de fin de grado..."
                            onChange={(e) => updateEducationAchievement(edu.id, aIdx, e.target.value)}
                          />
                          <button type="button" onClick={() => removeEducationAchievement(edu.id, aIdx)} className={styles.deleteBtn} style={{ padding: '6px' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button type="button" className={styles.addLink} onClick={() => addEducationAchievement(edu.id)}>
                        + Añadir logro
                      </button>
                    </div>
                  ))}

                  {(!cvData.education || cvData.education.length === 0) && (
                    <p style={{ fontWeight: 'bold', textAlign: 'center', padding: '2rem' }}>No se ha agregado educación.</p>
                  )}
                </div>
              )}

              {/* Languages Form */}
              {activeSection === 'languages' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Idiomas</h3>
                    <button onClick={addLanguage} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <Plus size={14} /> Añadir Idioma
                    </button>
                  </div>

                  {cvData.languages?.map((l, idx) => (
                    <div key={l.id || idx} className={styles.itemCard}>
                      <div className={styles.cardHeader}>
                        <h4>Idioma #{idx + 1}</h4>
                        <button onClick={() => removeLanguage(l.id)} className={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.fieldRow}>
                        <div>
                          <label>Idioma</label>
                          <input
                            type="text"
                            value={l.language || ''}
                            placeholder="Ej: Inglés"
                            onChange={(e) => updateLanguage(l.id, 'language', e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Nivel de competencia</label>
                          <input
                            type="text"
                            value={l.level || ''}
                            placeholder="Ej: C1 Profesional / Nativo"
                            onChange={(e) => updateLanguage(l.id, 'level', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!cvData.languages || cvData.languages.length === 0) && (
                    <p style={{ fontWeight: 'bold', textAlign: 'center', padding: '2rem' }}>No se han agregado idiomas.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column Preview */}
          <div className={styles.rightPanel}>
            <div className={styles.previewContainer}>
              <div className={styles.previewPaper}>
                <CVTemplateModern ref={cvPreviewRef} data={cvData} />
              </div>
            </div>
          </div>
        </div>

        {/* 8. IA Translation Loader dialog */}
        {translating && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '400px', textAlign: 'center', padding: '36px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px auto' }}></div>
              <h3 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', marginBottom: '12px' }}>Traduciendo CV</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#000000', fontWeight: 'bold' }}>{translationStep}</p>
            </div>
          </div>
        )}

        {/* 9. Ver Markdown Modal */}
        {markdownModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setMarkdownModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Vista previa Markdown</h3>
                <button className={styles.closeBtn} onClick={() => setMarkdownModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>Copia el código Markdown para usarlo en portales compatibles o repositorios:</p>
                <textarea 
                  className={styles.markdownText} 
                  readOnly 
                  value={cvToMarkdown(cvData)}
                />
              </div>
              <div className={styles.modalActions}>
                <button className="btn-secondary" onClick={handleCopyMarkdown}>Copiar texto</button>
                <button className="btn-primary" onClick={() => setMarkdownModalOpen(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* 10. IA Translation Language Selection Modal */}
        {showLanguageSelectModal && (
          <div className={styles.modalOverlay} onClick={() => setShowLanguageSelectModal(false)}>
            <div className={styles.modalContent} style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Traducir CV con IA</h3>
                <button className={styles.closeBtn} onClick={() => setShowLanguageSelectModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Selecciona el idioma al que quieres traducir tu currículum:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      setShowLanguageSelectModal(false);
                      handleTranslate('es');
                    }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '20px' }}>🇪🇸</span> Castellano
                  </button>
                  <button 
                    onClick={() => {
                      setShowLanguageSelectModal(false);
                      handleTranslate('en');
                    }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '20px' }}>🇬🇧</span> Inglés
                  </button>
                  <button 
                    onClick={() => {
                      setShowLanguageSelectModal(false);
                      handleTranslate('de');
                    }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '20px' }}>🇩🇪</span> Alemán
                  </button>
                  <button 
                    onClick={() => {
                      setShowLanguageSelectModal(false);
                      handleTranslate('fr');
                    }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '20px' }}>🇫🇷</span> Francés
                  </button>
                </div>
              </div>
              <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                <button className="btn-primary" onClick={() => setShowLanguageSelectModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
