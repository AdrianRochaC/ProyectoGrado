import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const config = {
  // Configuración del servidor
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'trolley.proxy.rlwy.net',
    port: process.env.DB_PORT || 17594,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'CEgMeCUPsqySFOidbBiATJoUvEbEdEyZ',
    database: process.env.DB_NAME || 'railway'
  },
  
  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_clave_secreta_jwt',
    expiresIn: '24h'
  },
  
  // Configuración de OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || null,
    model: 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.7
  },
  
  // Configuración de AssemblyAI para transcripción
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY || null,
    language: 'es',
    speakerLabels: true,
    autoHighlights: true,
    sentimentAnalysis: true,
    entityDetection: true
  },
  
  // Configuración de archivos
  uploads: {
    videos: 'uploads/videos',
    documents: 'uploads/documents',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  
  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

// Función para validar la configuración
export function validateConfig() {
  const required = ['openai.apiKey'];
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });
  
  if (missing.length > 0) {
    missing.forEach(key => );
    }
  
  return missing.length === 0;
}

// Función para obtener la configuración de la base de datos en formato mysql2
export function getDbConfig() {
  return {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  };
}

export default config;
