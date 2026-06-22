export const EXAMPLE_ANALYSIS = {
  compatibility_score: 78,
  matched_skills: ["React", "JavaScript", "TypeScript", "SQL", "PostgreSQL", "Git"],
  missing_skills: ["Python", "Docker", "CI/CD", "AWS"],
  category_breakdown: {
    keywords: 80,
    experience: 75,
    seniority_fit: 80
  },
  recommendations: [
    "Añade proyectos personales o profesionales donde utilices Python para alinear tu perfil con el stack backend requerido.",
    "Menciona tu experiencia con contenedores Docker y flujos de CI/CD para complementar tu perfil DevOps.",
    "Destaca logros cuantitativos en bases de datos PostgreSQL y optimización backend para reforzar tu seniority."
  ],
  extracted_data: {
    personal_info: {
      name: "Juan López",
      email: "juan.lopez@example.com",
      phone: "+34 612 987 654",
      title: "Senior Fullstack Developer"
    },
    summary: "Ingeniero Fullstack con más de 6 años de experiencia desarrollando aplicaciones web modernas y robustas, especializado en React y Node.js. Apasionado por la optimización de APIs y el diseño de bases de datos.",
    experience: [
      {
        role: "Desarrollador Fullstack Senior",
        company: "Tech Startups S.L.",
        duration: "2021 - Presente",
        description: "Desarrollo de microservicios en Node.js y componentes frontend en React/TypeScript. Mejora del 30% en la latencia de APIs backend."
      },
      {
        role: "Software Developer",
        company: "Innovación Digital",
        duration: "2018 - 2021",
        description: "Creación de aplicaciones web con JavaScript y bases de datos PostgreSQL. Mantenimiento de integraciones con pasarelas de pago externas."
      }
    ],
    education: [
      {
        degree: "Grado en Ingeniería Informática",
        institution: "Universidad Politécnica",
        year: "2018"
      }
    ],
    skills: ["React", "Node.js", "TypeScript", "JavaScript", "SQL", "PostgreSQL", "Git"]
  }
};
