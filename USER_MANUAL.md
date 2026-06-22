# 📖 Manual de Usuario - CVSmartAI

Bienvenido a **CVSmartAI**, tu plataforma SaaS inteligente para la optimización de currículums de cara a los sistemas automáticos de cribado de talento (ATS). Esta guía detalla paso a paso el funcionamiento de la aplicación y sus características principales.

---

## 🚀 1. Registro e Inicio de Sesión
Para acceder a la plataforma y mantener un registro de tus currículums, debes autenticarte:
1. Abre tu navegador y accede a la URL local de la aplicación: **`http://localhost:5174`**.
2. Si no tienes cuenta, haz clic en **"Registrarse"** e introduce tu nombre, correo electrónico y contraseña.
3. Si ya estás registrado, introduce tus credenciales en el formulario de inicio de sesión.
4. El sistema validará tu identidad mediante un token de sesión seguro (**JWT**), redirigiéndote al Dashboard.

---

## 📊 2. El Dashboard Principal
El Dashboard es tu panel de control central, diseñado para hacer un seguimiento a largo plazo de tus postulaciones:
* **Gráfico de Evolución Temporal:** Un gráfico de líneas interactivo (*desarrollado con Recharts*) que muestra cómo ha progresado tu puntuación de compatibilidad con cada versión sucesiva de tu CV. El objetivo es ver una curva ascendente a medida que optimizas tu currículum.
* **Historial de Versiones:** Una cuadrícula interactiva que lista de manera ordenada todos los currículums procesados, la fecha de creación, la oferta objetivo evaluada, y el score obtenido.
* **Comparador de Versiones (CV Diffing):** Permite contrastar dos versiones de tu CV. Selecciona dos elementos del historial y haz clic en **"Comparar"** para visualizar de manera gráfica qué habilidades técnicas se añadieron y cómo mejoró tu afinidad semántica.

---

## 📝 3. Analizar CV contra Oferta de Empleo
Esta funcionalidad te permite auditar tu CV actual frente a una posición específica antes de enviarla:
1. Haz clic en **"Subir CV"** en la barra lateral de navegación.
2. **Carga tu CV:** Arrastra o selecciona tu documento en formato PDF.
3. **Especifica la Oferta de Trabajo:**
   * **Opción Manual:** Pega el texto descriptivo de la oferta en el cuadro de texto.
   * **Opción Automática (Scraping):** Pega la URL de la oferta (LinkedIn, InfoJobs, etc.) y haz clic en el botón de extraer. La plataforma usará proxies de **ScraperAPI** y parsing semántico para rellenar la descripción y título del puesto automáticamente.
4. Haz clic en **"Iniciar Análisis"**.
5. **Progreso en Tiempo Real:** El sistema activará un flujo asíncrono (*Server-Sent Events*), mostrando notificaciones de progreso en pantalla (*OCR Document AI, Análisis semántico Gemini, etc.*) hasta que se completen los resultados y seas redirigido al editor interactivo.

---

## ✍️ 4. Editor de CV Harvard ATS e IA Integrada
El editor de CVSmartAI es la herramienta clave para dar forma legible y óptima a tu currículum:

### 4.1 Pantalla Dividida de Edición
* **Columna de Formulario (Izquierda):** Contiene campos interactivos organizados en pestañas para modificar de manera dinámica tus datos de contacto, resumen profesional, experiencias de trabajo (viñetas), educación y lista de tecnologías.
* **Visor de Plantilla Harvard (Derecha):** Renderiza en tiempo real tu CV en el formato académico clásico de Harvard (diseño centrado, tipografía serif Garamond, separaciones finas, sin tablas ni elementos gráficos que bloqueen los ATS).

### 4.2 Control de Página Única A4 (Cero Hojas en Blanco)
El visor del documento cuenta con límites verticales estrictos y ocultación de desbordamiento (`overflow: hidden`). Esto garantiza que el CV final ocupe **exactamente una página física A4**, evitando el problema común de generar páginas adicionales en blanco que penalicen tu criba.

### 4.3 Traducción Inteligente con IA
1. Haz clic en el botón **"Traducir con IA"** en la barra superior del editor.
2. Se abrirá un modal con las banderas de **Castellano, Inglés, Alemán y Francés**.
3. Haz clic en el idioma deseado. La IA de Gemini traducirá de forma contextual tu perfil (resumen profesional, viñetas de experiencia y títulos académicos) sin corromper la estructura JSON ni alterar nombres propios de tecnologías.

### 4.4 Descarga Directa a PDF
Una vez que el currículum esté listo y tu puntuación de afinidad sea óptima, haz clic en el botón **"PDF"**. La librería del navegador generará un documento PDF nítido y vectorizado listo para enviar a los reclutadores.

---

## 📂 5. Editar CV Directamente (Sin Oferta)
Si no deseas contrastar tu CV con una oferta de empleo y solo quieres editar su diseño o traducirlo:
1. Haz clic en **"Editar CV"** en el menú de navegación lateral.
2. Sube tu currículum PDF.
3. El sistema llamará al servicio OCR de Document AI para estructurar el contenido de tu PDF y lo verterá directamente en el Editor de Plantilla Harvard para que puedas trabajar sobre él al instante.

---

## 🛠️ Solución de Problemas Comunes

* **El PDF descargado tiene dos páginas o corta el texto:**
  * El editor está optimizado para exactamente una página A4. Si tienes demasiada información, reduce el tamaño del resumen o haz que tus viñetas de experiencia sean más concisas. El visor recortará el contenido sobrante para evitar descargas defectuosas.
* **Error de Conexión al Traducir o Analizar:**
  * Asegúrate de tener una clave de API válida en tu archivo `backend/.env`. Al depender de servicios externos de Google Cloud, una mala configuración de red o falta de cuota puede devolver un error de conexión temporal.
* **La extracción de URL no funciona en portales específicos:**
  * Algunos sitios web de empleo tienen protecciones agresivas contra rastreadores. Si ScraperAPI falla al obtener la información, copia y pega el texto de la oferta manualmente en el campo correspondiente.
