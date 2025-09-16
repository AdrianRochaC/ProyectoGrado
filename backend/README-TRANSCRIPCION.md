# 🎬 Sistema de Transcripción de Videos con IA

Este sistema implementa transcripción real de videos (YouTube y MP4) para generar preguntas de evaluación automáticamente.

## 🚀 Características

- **YouTube**: Descarga audio, transcribe y analiza contenido real
- **MP4**: Extrae audio, transcribe y analiza contenido real
- **AssemblyAI**: Transcripción profesional con análisis avanzado
- **OpenAI**: Generación de preguntas basada en contenido real
- **Limpieza automática**: Archivos temporales se eliminan automáticamente

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con:

```env
# OpenAI para generación de preguntas
OPENAI_API_KEY=tu_openai_api_key_aqui

# AssemblyAI para transcripción de videos
ASSEMBLYAI_API_KEY=tu_assemblyai_api_key_aqui

# Otras configuraciones
PORT=3001
JWT_SECRET=tu_clave_secreta_jwt
```

### 2. Obtener API Keys

#### OpenAI API Key
1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" y crea una nueva clave
4. Copia la clave y agrégala a tu `.env`

#### AssemblyAI API Key
1. Ve a [AssemblyAI](https://www.assemblyai.com/)
2. Crea una cuenta gratuita
3. Ve a "API Keys" en tu dashboard
4. Copia la clave y agrégala a tu `.env`

### 3. Instalación de Dependencias

```bash
cd backend
npm install assemblyai fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

## 📋 Flujo de Procesamiento

### Para Videos de YouTube:
1. **Descarga**: Usa `ytdl-core` para descargar el video
2. **Extracción**: Usa `ffmpeg` para extraer el audio
3. **Transcripción**: Usa `AssemblyAI` para transcribir el audio
4. **Análisis**: Identifica puntos clave, entidades y sentimientos
5. **Generación**: Usa `OpenAI` para crear preguntas basadas en la transcripción real

### Para Archivos MP4:
1. **Extracción**: Usa `ffmpeg` para extraer el audio del MP4
2. **Transcripción**: Usa `AssemblyAI` para transcribir el audio
3. **Análisis**: Identifica puntos clave, entidades y sentimientos
4. **Generación**: Usa `OpenAI` para crear preguntas basadas en la transcripción real

## 🎯 Endpoints Disponibles

### 1. Analizar Video de YouTube
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

### 2. Analizar Archivo MP4
```http
POST /api/ai/analyze-video-file
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- videoFile: archivo MP4
- title: título personalizado
- description: descripción personalizada
- numQuestions: 5
```

## 📊 Respuesta de la API

```json
{
  "success": true,
  "message": "Se generaron 5 preguntas para el video",
  "videoInfo": {
    "title": "Título del video",
    "duration": 1800,
    "transcription": "Transcripción completa...",
    "confidence": 0.95,
    "highlights": ["Punto clave 1", "Punto clave 2"],
    "entities": [
      {
        "text": "Concepto importante",
        "entity_type": "CONCEPT"
      }
    ]
  },
  "questions": [
    {
      "question": "¿Cuál es el tema principal?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctIndex": 0,
      "explanation": "Explicación de por qué es correcta"
    }
  ]
}
```

## ⚠️ Consideraciones Importantes

### Limitaciones de AssemblyAI
- **Plan gratuito**: 5 horas de transcripción por mes
- **Plan pago**: Hasta 1000 horas por mes
- **Idiomas**: Soporta múltiples idiomas, configurado para español

### Limitaciones de OpenAI
- **Modelo**: Usa GPT-3.5-turbo (más económico)
- **Tokens**: Máximo 2000 tokens por solicitud
- **Rate limits**: Respeta los límites de la API

### Rendimiento
- **Tiempo de procesamiento**: 2-5 minutos por video (dependiendo de duración)
- **Archivos temporales**: Se eliminan automáticamente después de 1 hora
- **Memoria**: Los archivos grandes pueden consumir más RAM

## 🛠️ Solución de Problemas

### Error: "AssemblyAI API key not found"
- Verifica que `ASSEMBLYAI_API_KEY` esté en tu archivo `.env`
- Reinicia el servidor después de agregar la variable

### Error: "OpenAI API key not found"
- Verifica que `OPENAI_API_KEY` esté en tu archivo `.env`
- Asegúrate de tener créditos en tu cuenta de OpenAI

### Error: "FFmpeg not found"
- Instala FFmpeg en tu sistema
- En Windows: `npm install @ffmpeg-installer/ffmpeg`
- En Linux/Mac: `sudo apt install ffmpeg` o `brew install ffmpeg`

### Videos muy largos no se procesan
- AssemblyAI tiene límites de duración
- Considera dividir videos largos en segmentos más pequeños
- El plan gratuito tiene límites de tiempo

## 📈 Mejoras Futuras

- [ ] Soporte para más formatos de video (AVI, MOV, WMV)
- [ ] Transcripción local con Whisper (sin dependencias externas)
- [ ] Análisis de sentimientos más detallado
- [ ] Generación de resúmenes automáticos
- [ ] Integración con más servicios de transcripción
- [ ] Cache de transcripciones para evitar reprocesamiento

## 🎉 ¡Listo para Usar!

Una vez configurado correctamente, el sistema:

1. **Detecta automáticamente** si es YouTube o MP4
2. **Procesa el video** con transcripción real
3. **Genera preguntas** basadas en el contenido real
4. **Limpia archivos temporales** automáticamente

¡Disfruta de la generación automática de preguntas basada en contenido real de videos! 🚀
