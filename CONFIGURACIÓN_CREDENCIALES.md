
## 👨‍🏫 Instrucciones para la Evaluación (Profesor)

### Evaluación Funcional Completa (Conexión Real en Google Cloud)
Puede encontrar un video describiendo el paso a paso para obtener la credenciales en el siguiente [ENLACE](https://drive.google.com/file/d/1LMhdOqsRmKTuL16RgBebmsaQUMDpLdIj/view?usp=sharing). 

De todas formas, a continuación se detalla el paso a paso para obtenerlas. Si desea probar el flujo real, siga estos pasos detallados:

#### **A. Configurar el Procesador en Document AI**
1. Ve a la **Consola de Google Cloud** e inicia sesión.
2. Cree un **Nuevo Proyecto** y habilite la facturación.
3. Busque **"Cloud Document AI API"** y pulse en **Habilitar**.
4. Ve a **Document AI > Procesadores** y cree uno de tipo **"Document OCR"** (Región: `eu`).
5. Anote el **ID del Proyecto** y el **ID del Procesador**.

#### **B. Obtener credenciales de la Cuenta de Servicio (`service_account.json`)**
1. En la consola, busque **"Cuentas de servicio"** en IAM.
2. Cree una cuenta con el rol **Usuario de Document AI**.
3. Añada una clave **JSON**, descárguela y colóquela en `backend/credentials/service_account.json`.

#### **C. Habilitar Gemini AI y obtener API KEY**
1. Busque **"Generative Language API"** en la consola de Google Cloud y pulse en **Habilitar**.
2. Vaya a **API y servicios > Credenciales**.
3. Pulse en **Crear credenciales > Clave de API**. Esta será su **`GEMINI_API_KEY`**.

#### **D. Habilitar ScraperAPI (Opcional)**
1. Regístrese en [ScraperAPI.com](https://www.scraperapi.com/).
2. Copie su **API Key** y póngala en su `.env`.

#### **E. Configuración del archivo `.env`**
Cree un archivo `.env` en `backend/` con estos valores:

| Variable | Dónde obtenerla |
| :--- | :--- |
| **`PROJECT_ID`** | ID de su proyecto de Google Cloud. |
| **`PROCESSOR_ID`** | ID del procesador OCR creado en el paso A. |
| **`LOCATION`** | Por defecto `eu`. |
| **`GEMINI_API_KEY`** | Clave de API obtenida en el paso C. |
| **`SCRAPERAPI_KEY`** | Clave obtenida en el paso D (Opcional). |
| **`JWT_SECRET_KEY`** | Frase aleatoria para las sesiones. |


