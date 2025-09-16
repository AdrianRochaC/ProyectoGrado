# 🤖 Sistema de IA para Generación de Preguntas - Backend

## 📋 Descripción

Este sistema implementa funcionalidades de Inteligencia Artificial para generar automáticamente preguntas de evaluación para cursos de capacitación. Utiliza OpenAI GPT para analizar contenido de videos de YouTube y archivos, generando preguntas contextuales y relevantes.

## 🚀 Funcionalidades

### ✅ Generación Automática de Preguntas
- **Para cursos existentes**: Genera preguntas basándose en el contenido del curso
- **Para videos de YouTube**: Analiza transcripciones y genera preguntas contextuales
- **Para archivos**: Analiza documentos y genera preguntas relevantes
- **Personalizadas**: Permite crear preguntas con contenido personalizado

### ✅ Integración con OpenAI
- Usa GPT-3.5-turbo para generación de preguntas
- Prompts optimizados para evaluaciones educativas
- Validación y limpieza automática de respuestas

### ✅ Gestión de Estado
- Indicadores visuales de progreso
- Manejo de errores robusto
- Logs detallados para debugging

## 🛠️ Instalación

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
Crear archivo `.env` en la carpeta `backend/`:

```env
# Configuración de OpenAI (REQUERIDA)
OPENAI_API_KEY=tu-api-key-de-openai-aqui

# Configuración de la base de datos
DB_HOST=trolley.proxy.rlwy.net
DB_PORT=17594
DB_USER=root
DB_PASSWORD=CEgMeCUPsqySFOidbBiATJoUvEbEdEyZ
DB_NAME=railway

# Configuración del servidor
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=tu-jwt-secret-super-seguro-aqui
```

### 3. Obtener API Key de OpenAI
1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en tu dashboard
4. Crea una nueva API key
5. Copia la key y pégala en tu archivo `.env`

## 🔧 Configuración

### Validar Configuración
El sistema valida automáticamente la configuración al iniciar:

```javascript
import { validateConfig } from './config.js';

// Validar al inicio del servidor
if (!validateConfig()) {
  console.warn('⚠️ El servicio de IA no funcionará correctamente');
}
```

### Configuración de OpenAI
```javascript
// En config.js
openai: {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
  maxTokens: 2000,
  temperature: 0.7
}
```

## 📡 Endpoints de IA

### 1. Generar Preguntas para Curso Existente
```http
POST /api/courses/:id/generate-questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "numQuestions": 5
}
```

### 2. Generar Preguntas Personalizadas
```http
POST /api/ai/generate-questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Título del curso",
  "description": "Descripción del curso",
  "content": "Contenido adicional",
  "contentType": "text",
  "numQuestions": 5
}
```

### 3. Analizar Video de YouTube
```http
POST /api/ai/analyze-youtube
Authorization: Bearer <token>
Content-Type: application/json

{
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "title": "Título personalizado (opcional)",
  "description": "Descripción personalizada (opcional)",
  "numQuestions": 5
}
```

### 4. Analizar Archivo
```http
POST /api/ai/analyze-file
Authorization: Bearer <token>
Content-Type: application/json

{
  "filePath": "/ruta/al/archivo.pdf",
  "title": "Título personalizado (opcional)",
  "description": "Descripción personalizada (opcional)",
  "numQuestions": 5
}
```

## 🔍 Uso del Servicio de IA

### Generación de Preguntas
```javascript
import aiService from './aiService.js';

// Generar preguntas para un curso existente
const questions = await aiService.generateQuestionsForCourse(courseId);

// Generar preguntas personalizadas
const questions = await aiService.generateQuestions({
  title: "Mi Curso",
  description: "Descripción del curso",
  content: "Contenido adicional",
  contentType: "text"
}, 5);
```

### Análisis de Contenido
```javascript
// Analizar video de YouTube
const videoData = await aiService.extractYouTubeTranscript(videoUrl);

// Analizar archivo
const fileData = await aiService.analyzeFileContent(filePath);
```

## 📊 Estructura de Respuesta

### Preguntas Generadas
```json
{
  "success": true,
  "message": "Se generaron 5 preguntas automáticamente",
  "questions": [
    {
      "question": "¿Cuál es la principal ventaja de...?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 0,
      "explanation": "Explicación de por qué es correcta"
    }
  ],
  "courseId": 123
}
```

## 🎯 Características de las Preguntas

### ✅ Calidad
- Preguntas claras y específicas
- Opciones plausibles pero solo una correcta
- Nivel de dificultad apropiado
- Cobertura de diferentes aspectos del tema

### ✅ Formato
- 4 opciones de respuesta (A, B, C, D)
- Índice de respuesta correcta (0-3)
- Explicación de la respuesta correcta
- Validación automática de formato

## 🚨 Manejo de Errores

### Errores Comunes
- **API Key no configurada**: El servicio no funcionará
- **Video no encontrado**: Error al extraer información de YouTube
- **Archivo no accesible**: Error al leer contenido del archivo
- **Respuesta malformada**: Error al parsear respuesta de OpenAI

### Logs de Debugging
```javascript
console.log('🤖 Generando preguntas con IA para:', title);
console.log('✅ PREGUNTAS GENERADAS CON IA:', questions.length);
console.error('❌ Error generando preguntas con IA:', error);
```

## 🔒 Seguridad

### Autenticación
- Todas las rutas requieren JWT válido
- Solo administradores pueden usar el servicio de IA
- Validación de roles en cada endpoint

### Rate Limiting
- Considerar implementar rate limiting para OpenAI API
- Monitorear uso de tokens para control de costos

## 📈 Monitoreo y Mantenimiento

### Logs Importantes
- Solicitudes de generación de preguntas
- Respuestas exitosas de OpenAI
- Errores y fallos del servicio
- Uso de API y costos

### Métricas Recomendadas
- Número de preguntas generadas por día
- Tasa de éxito en generación
- Tiempo promedio de respuesta
- Costos de API de OpenAI

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Soporte para más modelos de OpenAI
- [ ] Análisis de PDF con librerías especializadas
- [ ] Extracción de subtítulos de YouTube
- [ ] Cache de preguntas generadas
- [ ] Personalización de prompts por tipo de curso

### Optimizaciones
- [ ] Batch processing para múltiples cursos
- [ ] Compresión de respuestas de OpenAI
- [ ] Sistema de fallback para errores de API
- [ ] Queue de trabajos para procesamiento asíncrono

## 📞 Soporte

### Problemas Comunes
1. **"OPENAI_API_KEY no configurada"**: Verificar archivo `.env`
2. **"Error al extraer transcripción"**: Verificar URL de YouTube
3. **"Respuesta de IA malformada"**: Revisar logs de OpenAI

### Debugging
- Verificar configuración con `validateConfig()`
- Revisar logs del servidor
- Probar endpoints individualmente
- Verificar conectividad con OpenAI

---

**¡El sistema de IA está listo para generar preguntas inteligentes para tus cursos de capacitación! 🎉**
