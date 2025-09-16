import OpenAI from 'openai';
import { executeQuery } from '../db-setup/connection-manager.js';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import videoProcessor from './videoProcessor.js';

dotenv.config();

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || OPENAI_API_KEY, // Cambiar por tu API key real
});

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY no configurada. El servicio de IA no funcionará.');
    }
  }

  /**
   * Genera preguntas de evaluación usando IA basándose en el contenido del curso
   * @param {Object} courseData - Datos del curso (título, descripción, contenido)
   * @param {number} numQuestions - Número de preguntas a generar (default: 5)
   * @returns {Array} Array de preguntas con opciones y respuesta correcta
   */
  async generateQuestions(courseData, numQuestions = 5) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY no configurada');
      }

      const { title, description, content, contentType } = courseData;
      
      // Crear prompt contextual para OpenAI
      const prompt = this.createPrompt(title, description, content, contentType, numQuestions);
      
      console.log('🤖 Generando preguntas con IA para:', title);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto en crear evaluaciones educativas. Genera preguntas claras, relevantes y desafiantes basadas en el contenido proporcionado."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      const questions = this.parseAIResponse(response);
      
      console.log(`✅ Generadas ${questions.length} preguntas con IA`);
      return questions;
      
    } catch (error) {
      console.error('❌ Error generando preguntas con IA:', error);
      throw error;
    }
  }

  /**
   * Crea el prompt para OpenAI basándose en el tipo de contenido
   */
  createPrompt(title, description, content, contentType, numQuestions) {
    let contentContext = '';
    let specificInstructions = '';
    
    if (contentType === 'youtube') {
      contentContext = `CONTENIDO DEL VIDEO DE YOUTUBE:
${content}`;
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA VIDEO DE YOUTUBE:
- Analiza el título, descripción y metadatos del video
- Genera preguntas que evalúen la comprensión de los conceptos principales
- Considera la duración y categoría del video para ajustar el nivel de dificultad
- Las preguntas deben ser relevantes para el contenido educativo del video`;
    } else if (contentType === 'video') {
      contentContext = `CONTENIDO DEL ARCHIVO DE VIDEO:
${content}`;
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA ARCHIVO DE VIDEO:
- Basándote en el nombre del archivo y sus metadatos, infiere el contenido educativo
- Genera preguntas que cubran los temas principales que se podrían tratar en el video
- Considera el tipo de archivo (MP4, AVI, etc.) y su tamaño para evaluar la complejidad
- Las preguntas deben ser apropiadas para contenido audiovisual educativo`;
    } else if (contentType === 'file') {
      contentContext = `CONTENIDO DEL DOCUMENTO:
${content}`;
      specificInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA DOCUMENTO:
- Analiza el tipo de documento (PDF, Word, etc.) y su nombre
- Genera preguntas que evalúen la comprensión de los temas del documento
- Considera el formato del archivo para determinar el tipo de contenido educativo`;
    } else {
      contentContext = `CONTENIDO DEL CURSO:
${content}`;
      specificInstructions = `
INSTRUCCIONES GENERALES:
- Genera preguntas basándote en el título y descripción del curso
- Las preguntas deben cubrir los conceptos principales del tema
- Mantén un nivel de dificultad apropiado para el contenido`;
    }

    return `
Eres un experto en crear evaluaciones educativas. Genera ${numQuestions} preguntas de evaluación para el siguiente curso:

TÍTULO DEL CURSO: ${title}
DESCRIPCIÓN DEL CURSO: ${description}

${contentContext}

${specificInstructions}

REQUISITOS GENERALES:
- Cada pregunta debe ser clara, específica y relevante
- Las opciones deben ser plausibles pero solo una correcta
- El nivel de dificultad debe ser apropiado para el contenido
- Las preguntas deben cubrir diferentes aspectos del tema
- Usa un lenguaje claro y profesional
- Evita preguntas demasiado obvias o demasiado complejas

FORMATO DE RESPUESTA (JSON):
[
  {
    "question": "Pregunta aquí",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 0,
    "explanation": "Explicación breve de por qué es correcta"
  }
]

IMPORTANTE: Solo responde con el JSON válido, sin texto adicional. Asegúrate de que el JSON sea válido y que correctIndex sea un número entre 0 y 3.
`;
  }

  /**
   * Parsea la respuesta de OpenAI a un formato utilizable
   */
  parseAIResponse(response) {
    try {
      // Limpiar la respuesta y extraer solo el JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      // Validar y limpiar las preguntas
      return questions.map(q => ({
        question: q.question?.trim() || '',
        options: (q.options || []).map(opt => opt?.trim() || ''),
        correctIndex: parseInt(q.correctIndex) || 0,
        explanation: q.explanation?.trim() || ''
      })).filter(q => 
        q.question && 
        q.options.length === 4 && 
        q.options.every(opt => opt) &&
        q.correctIndex >= 0 && 
        q.correctIndex <= 3
      );
      
    } catch (error) {
      console.error('❌ Error parseando respuesta de IA:', error);
      throw new Error('Respuesta de IA malformada');
    }
  }

  /**
   * Extrae transcripción real de video de YouTube
   */
  async extractYouTubeTranscript(videoUrl) {
    try {
      console.log('📹 Procesando video de YouTube con transcripción real:', videoUrl);
      
      // Usar el procesador de video para obtener transcripción real
      const videoData = await videoProcessor.processYouTubeVideo(videoUrl);
      
      // Crear contenido enriquecido con la transcripción real
      const enrichedContent = `
TÍTULO DEL VIDEO: ${videoData.title}
DURACIÓN: ${Math.floor(videoData.duration / 60)} minutos ${videoData.duration % 60} segundos
CATEGORÍA: ${videoData.category}
VISUALIZACIONES: ${videoData.viewCount}

DESCRIPCIÓN DEL VIDEO:
${videoData.description}

TRANSCRIPCIÓN COMPLETA DEL AUDIO:
${videoData.transcription}

PUNTOS CLAVE IDENTIFICADOS:
${videoData.highlights ? videoData.highlights.map(h => `- ${h.text}`).join('\n') : 'No se identificaron puntos clave específicos'}

ENTIDADES IMPORTANTES MENCIONADAS:
${videoData.entities ? videoData.entities.map(e => `- ${e.text} (${e.entity_type})`).join('\n') : 'No se identificaron entidades específicas'}

INSTRUCCIONES PARA LA IA:
Basándote en la transcripción real del video de YouTube, genera preguntas de evaluación que evalúen la comprensión del contenido específico mencionado en el audio. Las preguntas deben ser relevantes para el material educativo real que se presenta en el video.
      `;
      
      return {
        title: videoData.title,
        content: enrichedContent,
        contentType: 'youtube',
        duration: videoData.duration,
        transcription: videoData.transcription,
        confidence: videoData.confidence,
        metadata: {
          category: videoData.category,
          viewCount: videoData.viewCount,
          description: videoData.description,
          highlights: videoData.highlights,
          entities: videoData.entities,
          sentiment: videoData.sentiment
        }
      };
      
    } catch (error) {
      console.error('❌ Error procesando video de YouTube:', error);
      throw error;
    }
  }

  /**
   * Procesa archivo MP4 con transcripción real
   */
  async processMP4WithTranscription(filePath) {
    try {
      console.log('🎬 Procesando archivo MP4 con transcripción real:', filePath);
      
      // Usar el procesador de video para obtener transcripción real
      const videoData = await videoProcessor.processMP4Video(filePath);
      
      // Crear contenido enriquecido con la transcripción real
      const enrichedContent = `
NOMBRE DEL ARCHIVO: ${videoData.fileName}
TAMAÑO: ${(videoData.fileSize / (1024 * 1024)).toFixed(2)} MB
FECHA DE MODIFICACIÓN: ${videoData.modifiedDate.toLocaleDateString()}

TRANSCRIPCIÓN COMPLETA DEL AUDIO:
${videoData.transcription}

PUNTOS CLAVE IDENTIFICADOS:
${videoData.highlights ? videoData.highlights.map(h => `- ${h.text}`).join('\n') : 'No se identificaron puntos clave específicos'}

ENTIDADES IMPORTANTES MENCIONADAS:
${videoData.entities ? videoData.entities.map(e => `- ${e.text} (${e.entity_type})`).join('\n') : 'No se identificaron entidades específicas'}

INSTRUCCIONES PARA LA IA:
Basándote en la transcripción real del archivo de video, genera preguntas de evaluación que evalúen la comprensión del contenido específico mencionado en el audio. Las preguntas deben ser relevantes para el material educativo real que se presenta en el video.
      `;
      
      return {
        title: videoData.fileName,
        content: enrichedContent,
        contentType: 'video',
        transcription: videoData.transcription,
        confidence: videoData.confidence,
        metadata: {
          fileSize: videoData.fileSize,
          modifiedDate: videoData.modifiedDate,
          highlights: videoData.highlights,
          entities: videoData.entities,
          sentiment: videoData.sentiment
        }
      };
      
    } catch (error) {
      console.error('❌ Error procesando archivo MP4:', error);
      throw error;
    }
  }

  /**
   * Analiza contenido de archivo (PDF, DOC, videos, etc.)
   */
  async analyzeFileContent(filePath) {
    try {
      console.log('📄 Analizando contenido del archivo:', filePath);
      
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      let content = `Archivo: ${fileName}`;
      let contentType = 'file';
      
      // Análisis específico para diferentes tipos de archivo
      if (fileExtension === '.pdf') {
        content += '\nTipo: Documento PDF';
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo PDF, genera preguntas de evaluación que cubran los temas principales que se podrían tratar en un documento de este tipo.';
      } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        content += '\nTipo: Documento Word';
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo Word, genera preguntas de evaluación que cubran los temas principales que se podrían tratar en un documento de este tipo.';
      } else if (['.mp4', '.avi', '.mov', '.wmv', '.mkv'].includes(fileExtension)) {
        content += '\nTipo: Archivo de video';
        contentType = 'video';
        
        // Obtener información básica del archivo
        try {
          const stats = fs.statSync(filePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          const modifiedDate = stats.mtime.toLocaleDateString();
          
          content += `\nTamaño: ${fileSizeMB} MB`;
          content += `\nFecha de modificación: ${modifiedDate}`;
          content += `\nExtensión: ${fileExtension.toUpperCase()}`;
        } catch (statsError) {
          console.warn('⚠️ No se pudo obtener estadísticas del archivo:', statsError.message);
        }
        
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo de video y sus metadatos, genera preguntas de evaluación que cubran los temas principales que se podrían tratar en un video educativo de este tipo. Considera que es contenido audiovisual educativo.';
      } else {
        content += '\nTipo: Archivo desconocido';
        content += '\n\nINSTRUCCIONES PARA LA IA: Basándote en el nombre del archivo, genera preguntas de evaluación generales que podrían ser relevantes para el contenido educativo.';
      }
      
      return {
        title: fileName,
        content: content,
        contentType: contentType,
        fileExtension: fileExtension
      };
      
    } catch (error) {
      console.error('❌ Error analizando archivo:', error);
      throw error;
    }
  }

  /**
   * Genera preguntas automáticamente para un curso existente
   */
  async generateQuestionsForCourse(courseId) {
    try {
      // Obtener datos del curso
      const [courses] = await executeQuery(
        'SELECT * FROM courses WHERE id = ?',
        [courseId]
      );

      if (courses.length === 0) {
        throw new Error('Curso no encontrado');
      }

      const course = courses[0];
      let courseData;

      // Determinar el tipo de contenido y extraer información
      if (course.video_url && course.video_url.includes('youtube.com')) {
        courseData = await this.extractYouTubeTranscript(course.video_url);
      } else if (course.video_url) {
        courseData = await this.analyzeFileContent(course.video_url);
      } else {
        // Solo usar título y descripción
        courseData = {
          title: course.title,
          content: course.description,
          contentType: 'text'
        };
      }

      // Generar preguntas con IA
      const questions = await this.generateQuestions(courseData);
      
      // Guardar las preguntas en la base de datos
      await this.saveQuestionsToDatabase(courseId, questions);
      
      return questions;
      
    } catch (error) {
      console.error('❌ Error generando preguntas para el curso:', error);
      throw error;
    }
  }

  /**
   * Guarda las preguntas generadas en la base de datos
   */
  async saveQuestionsToDatabase(courseId, questions) {
    try {
      // Eliminar preguntas existentes
      await executeQuery('DELETE FROM questions WHERE course_id = ?', [courseId]);
      
      // Insertar nuevas preguntas
      for (const question of questions) {
        await executeQuery(
          `INSERT INTO questions (course_id, question, option_1, option_2, option_3, option_4, correct_index) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            courseId,
            question.question,
            question.options[0],
            question.options[1],
            question.options[2],
            question.options[3],
            question.correctIndex
          ]
        );
      }
      
      console.log(`✅ ${questions.length} preguntas guardadas en la base de datos`);
      
    } catch (error) {
      console.error('❌ Error guardando preguntas en la base de datos:', error);
      throw error;
    }
  }
}

export default new AIService();
