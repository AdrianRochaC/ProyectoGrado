const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'trolley.proxy.rlwy.net',
  port: 17594,
  user: 'root',
  password: 'CEgMeCUPsqySFOidbBiATJoUvEbEdEyZ',
  database: 'railway'
};

async function checkCargosStatus() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔍 Verificando estado de cargos...\n');

    // 1. Verificar estructura de la tabla cargos
    console.log('📋 1. ESTRUCTURA DE LA TABLA CARGOS:');
    console.log('-'.repeat(50));
    
    const [columns] = await connection.execute('DESCRIBE cargos');
    console.log('Columnas disponibles:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // 2. Verificar datos de cargos
    console.log('\n📊 2. DATOS DE CARGOS:');
    console.log('-'.repeat(50));
    
    const [cargos] = await connection.execute(`
      SELECT 
        c.*,
        COUNT(u.id) as usuarios_count,
        COUNT(CASE WHEN u.activo = 1 THEN 1 END) as usuarios_activos,
        COUNT(CASE WHEN u.activo = 0 THEN 1 END) as usuarios_inactivos
      FROM cargos c
      LEFT JOIN usuarios u ON u.cargo_id = c.id
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `);
    
    console.log(`Total de cargos: ${cargos.length}\n`);
    
    cargos.forEach(cargo => {
      console.log(`📋 ${cargo.nombre}`);
      console.log(`   ID: ${cargo.id}`);
      console.log(`   Descripción: ${cargo.descripcion}`);
      console.log(`   Creado: ${cargo.created_at}`);
      console.log(`   Usuarios totales: ${cargo.usuarios_count}`);
      console.log(`   Usuarios activos: ${cargo.usuarios_activos}`);
      console.log(`   Usuarios inactivos: ${cargo.usuarios_inactivos}`);
      console.log('');
    });

    // 3. Verificar si existe columna estado
    console.log('🔍 3. VERIFICACIÓN DE COLUMNA ESTADO:');
    console.log('-'.repeat(50));
    
    const hasEstadoColumn = columns.some(col => col.Field === 'estado');
    if (hasEstadoColumn) {
      console.log('✅ La columna "estado" SÍ existe en la tabla cargos');
    } else {
      console.log('❌ La columna "estado" NO existe en la tabla cargos');
      console.log('💡 Por eso todos los cargos aparecen como "Activo" por defecto');
    }

    // 4. Recomendaciones
    console.log('\n💡 4. RECOMENDACIONES:');
    console.log('-'.repeat(50));
    
    if (!hasEstadoColumn) {
      console.log('Para agregar funcionalidad de estado activo/inactivo:');
      console.log('1. Agregar columna estado a la tabla cargos:');
      console.log('   ALTER TABLE cargos ADD COLUMN estado TINYINT(1) DEFAULT 1;');
      console.log('2. Actualizar el código para usar esta columna');
      console.log('3. Crear interfaz para activar/desactivar cargos');
    } else {
      console.log('La columna estado existe, verificar los datos en la tabla');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkCargosStatus();
