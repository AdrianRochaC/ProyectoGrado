import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaUsers, FaGraduationCap, FaFileAlt } from 'react-icons/fa';
import Modal from '../components/Modal';
import './AdminCargos.css';

const API_URL = 'http://localhost:3001';

const AdminCargos = () => {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [cargoMetrics, setCargoMetrics] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Estados para el formulario de creación
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // Estados para el formulario de edición
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCargos(data.cargos || []);
      } else {
        const errorData = await response.json();
        }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const fetchCargoMetrics = async (cargoId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos/${cargoId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCargoMetrics(data.metrics);
      }
    } catch (error) {
      // Error cargando métricas
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim() || !descripcion.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/cargos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setModalOpen(false);
        resetForm();
        fetchCargos();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error creando cargo');
      }
    } catch (error) {
      alert('Error interno del servidor');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editNombre.trim() || !editDescripcion.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos/${editingCargo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          descripcion: editDescripcion.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setEditModalOpen(false);
        setEditingCargo(null);
        fetchCargos();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error actualizando cargo');
      }
    } catch (error) {
      alert('Error interno del servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres ELIMINAR este cargo? Esta acción no se puede deshacer.')) {
      return;
    }
    if (!confirm('Advertencia: Se desactivarán los usuarios del cargo, se eliminarán cursos/preguntas/progresos asociados, se quitarán asignaciones de documentos por este rol y se borrarán documentos huérfanos no globales. ¿Deseas continuar?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cargos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchCargos();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error eliminando cargo');
      }
    } catch (error) {
      alert('Error interno del servidor');
    }
  };

  const openEditModal = (cargo) => {
    setEditingCargo(cargo);
    setEditNombre(cargo.nombre);
    setEditDescripcion(cargo.descripcion);
    setEditModalOpen(true);
  };

  const openDetailModal = async (cargo) => {
    setSelectedCargo(cargo);
    setDetailModalOpen(true);
    await fetchCargoMetrics(cargo.id);
  };

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
  };

  const downloadCargoReport = async (cargo) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/cargos/${cargo.id}/reporte-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_${cargo.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('✅ Reporte individual generado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'Error generando reporte individual'}`);
      }
    } catch (error) {
      alert('❌ Error generando reporte individual');
    }
  };

  // Función para generar reporte Excel
  const generateExcelReport = async () => {
    try {
      setGeneratingReport(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/cargos/reporte-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Cargos_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('✅ Reporte Excel generado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || 'Error generando reporte'}`);
      }
    } catch (error) {
      alert('❌ Error generando reporte Excel');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-cargos-container">
        <div className="loading">Cargando cargos...</div>
      </div>
    );
  }

  return (
    <div className="admin-cargos-container">
      <div className="admin-cargos-header">
        <h1>Gestión de Cargos</h1>
        <p>Administra los cargos y departamentos de la empresa</p>
      </div>

      <div className="admin-cargos-actions">
        <button 
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          <FaPlus /> Crear Nuevo Cargo
        </button>
        
        <button 
          className="btn-success"
          onClick={generateExcelReport}
          disabled={generatingReport}
          style={{ marginLeft: '10px' }}
        >
          <FaDownload /> 
          {generatingReport ? 'Generando...' : 'Reporte Excel'}
        </button>
      </div>

      <div className="admin-cargos-content">
        {}
        <div className="cargos-grid">
          {cargos.map((cargo) => (
            <div key={cargo.id} className="cargo-card" onClick={() => openDetailModal(cargo)}>
              <div className="cargo-header">
                <h3>{cargo.nombre}</h3>
                <div className="cargo-actions">
                  <button 
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(cargo);
                    }}
                    title="Editar cargo"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cargo.id);
                    }}
                    title="Eliminar cargo"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="cargo-body">
                <p className="cargo-description">{cargo.descripcion}</p>
                <div className="cargo-details">
                  <span className="created-date">
                    Creado: {new Date(cargo.created_at).toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>
              
              <div className="cargo-footer">
                <span className="click-hint">Haz clic para ver detalles</span>
              </div>
            </div>
          ))}
        </div>

        {cargos.length === 0 && (
          <div className="no-cargos">
            <p>No hay cargos configurados</p>
            <button 
              className="btn-primary"
              onClick={() => setModalOpen(true)}
            >
              <FaPlus /> Crear Primer Cargo
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear cargo */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-header">
          <h2>Crear Nuevo Cargo</h2>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre del Cargo *</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Gerente de Ventas"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descripcion">Descripción *</label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe las responsabilidades del cargo"
                rows="3"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Crear Cargo
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal para editar cargo */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="modal-header">
          <h2>Editar Cargo</h2>
        </div>
        <div className="modal-content">
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label htmlFor="editNombre">Nombre del Cargo *</label>
              <input
                type="text"
                id="editNombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Ej: Gerente de Ventas"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="editDescripcion">Descripción *</label>
              <textarea
                id="editDescripcion"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                placeholder="Describe las responsabilidades del cargo"
                rows="3"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Actualizar Cargo
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal para detalles del cargo */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <div className="modal-header">
          <h2>Detalles del Cargo: {selectedCargo?.nombre}</h2>
        </div>
        <div className="modal-content">
          {selectedCargo && (
            <div className="cargo-details-modal">
              <div className="cargo-info">
                <h3>{selectedCargo.nombre}</h3>
                <p className="description">{selectedCargo.descripcion}</p>
                <p className="created-date">
                  <strong>Creado:</strong> {new Date(selectedCargo.created_at).toLocaleDateString('es-CO')}
                </p>
              </div>

              {cargoMetrics && (
                <div className="cargo-metrics">
                  <h4>Métricas del Cargo</h4>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <FaUsers className="metric-icon" />
                      <div className="metric-content">
                        <span className="metric-value">{cargoMetrics.totalUsuarios || 0}</span>
                        <span className="metric-label">Usuarios</span>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <FaGraduationCap className="metric-icon" />
                      <div className="metric-content">
                        <span className="metric-value">{cargoMetrics.totalCursos || 0}</span>
                        <span className="metric-label">Cursos</span>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <FaFileAlt className="metric-icon" />
                      <div className="metric-content">
                        <span className="metric-value">{cargoMetrics.totalDocumentos || 0}</span>
                        <span className="metric-label">Documentos</span>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-content">
                        <span className="metric-value">{cargoMetrics.promedioProgreso || 0}%</span>
                        <span className="metric-label">Progreso Promedio</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="cargo-actions-modal">
                <button 
                  className="btn-primary"
                  onClick={() => downloadCargoReport(selectedCargo)}
                >
                  <FaDownload /> Descargar Reporte
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminCargos;
