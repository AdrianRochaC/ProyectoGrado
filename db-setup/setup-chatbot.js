const mysql = require('mysql2/promise');

const setupChatbotTable = async () => {
  const connection = await mysql.createConnection({
     host: 'centerbeam.proxy.rlwy.net',
     port: 22529,
     user: 'root',
     password: 'EeSWeqlWTixXiKkLThtMFATmirIsSFmS',
     database: 'railway'
  });

  try {
    console.log('🤖 Configurando tabla del chatbot...');

    // Crear tabla para historial del chatbot
    const createChatbotTable = `
      CREATE TABLE IF NOT EXISTS chatbot_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_user_timestamp (user_id, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createChatbotTable);
    console.log('✅ Tabla "chatbot_history" creada exitosamente');

    // Mostrar estructura de la tabla
    const [tableStructure] = await connection.execute('DESCRIBE chatbot_history');
    console.log('\n📋 Estructura de la tabla chatbot_history:');
    tableStructure.forEach(field => {
      console.log(`  - ${field.Field}: ${field.Type} ${field.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${field.Default ? `DEFAULT '${field.Default}'` : ''}`);
    });

    console.log('\n🎉 Configuración del chatbot completada');
    console.log('\n✨ Características:');
    console.log('  - Historial de conversaciones por usuario');
    console.log('  - Respuestas inteligentes con OpenAI');
    console.log('  - Interfaz accesible desde todas las páginas');
    console.log('  - Guardado automático de conversaciones');

  } catch (error) {
    console.error('❌ Error configurando tabla del chatbot:', error);
  } finally {
    await connection.end();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  setupChatbotTable();
}

module.exports = setupChatbotTable;
