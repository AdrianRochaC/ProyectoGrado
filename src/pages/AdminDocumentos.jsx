import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import './AdminDocumentos.css'; // Asegúrate de crear este archivo para los estilos
import { FaEdit, FaTrash } from 'react-icons/fa';

const API_URL = 'http://localhost:3001';

const AdminDocumentos = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  // Estados para cargos (roles)
  const [roles, setRoles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Estados para selección
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isGlobal, setIsGlobal] = useState(false);

  // Estados para edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSelectedRoles, setEditSelectedRoles] = useState([]);
  const [editIsGlobal, setEditIsGlobal] = useState(false);

  // Cargar documentos al montar
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Cargar cargos al abrir el modal
  useEffect(() => {
    if (modalOpen) {
      fetchCargos();
    }
  }, [modalOpen]);

  const fetchCargos = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Obtener cargos de la base de datos
      const cargosRes = await fetch(`${API_URL}/api/cargos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cargosData = await cargosRes.json();
      
      if (cargosData.success) {
        // Extraer solo los nombres de los cargos
        const rolesFromDB = cargosData.cargos.map(cargo => cargo.nombre);
        setRoles(rolesFromDB);
      }
    } catch (err) {
      setRoles([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    setUploadError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setDocuments(data.documents);
      else setUploadError('No se pudieron cargar los documentos');
    } catch (err) {
      setUploadError('Error al cargar documentos');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };
  const handleGlobalChange = (e) => {
    setIsGlobal(e.target.checked);
    if (e.target.checked) {
      setSelectedRoles([]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Selecciona un archivo');
      return;
    }
    if (!isGlobal && selectedRoles.length === 0) {
      setUploadError('Selecciona al menos un cargo o marca "Para todos"');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('is_global', isGlobal);
      formData.append('roles', JSON.stringify(selectedRoles));
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess('Documento subido exitosamente');
        setFile(null);
        setSelectedRoles([]);
        setIsGlobal(false);
        fetchDocuments();
        setTimeout(() => {
          setModalOpen(false);
          setUploadSuccess('');
        }, 1200);
      } else {
        setUploadError(data.message || 'Error al subir documento');
      }
    } catch (err) {
      setUploadError('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = async (doc) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditFile(null);
    setEditIsGlobal(doc.is_global === 1 || doc.is_global === true);
    // Cargar destinatarios actuales
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents/${doc.id}/targets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Esperar a que roles estén cargados
        if (roles.length === 0) {
          await fetchCargos();
        }
        // Normalizar tipos y valores
        const normalizedRoles = (data.roles || []).map(r => String(r).trim());
        setEditSelectedRoles(roles.filter(r => normalizedRoles.includes(r)));
      } else {
        setEditSelectedRoles([]);
      }
    } catch {
      setEditSelectedRoles([]);
    }
    setEditModalOpen(true);
  };
  const handleEditRoleToggle = (role) => {
    setEditSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };
  const handleEditGlobalChange = (e) => {
    setEditIsGlobal(e.target.checked);
    if (e.target.checked) {
      setEditSelectedRoles([]);
    }
  };
  const handleEditFileChange = (e) => {
    setEditFile(e.target.files[0]);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName) return;
    if (!editIsGlobal && editSelectedRoles.length === 0) {
      setUploadError('Selecciona al menos un cargo o marca "Para todos"');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('is_global', editIsGlobal);
      formData.append('roles', JSON.stringify(editSelectedRoles));
      if (editFile) formData.append('document', editFile);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess('Documento actualizado exitosamente');
        fetchDocuments();
        setTimeout(() => {
          setEditModalOpen(false);
          setUploadSuccess('');
        }, 1200);
      } else {
        setUploadError(data.message || 'Error al actualizar documento');
      }
    } catch (err) {
      setUploadError('Error al actualizar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el documento "${docName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess('Documento eliminado exitosamente');
        fetchDocuments();
        setTimeout(() => {
          setUploadSuccess('');
        }, 2000);
      } else {
        setUploadError(data.message || 'Error al eliminar documento');
        setTimeout(() => {
          setUploadError('');
        }, 3000);
      }
    } catch (err) {
      setUploadError('Error al eliminar documento');
      setTimeout(() => {
        setUploadError('');
      }, 3000);
    }
  };

  return (
    <div className="admin-documentos-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        width: '100%',
        maxWidth: 1200,
        margin: '56px auto',
        background: 'rgba(30,32,44,0.92)',
        borderRadius: 22,
        boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
        padding: '44px 36px 48px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }}>
        <div className="header-row" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 24,
          paddingBottom: '20px',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            margin: 0,
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(167,139,250,0.3)'
          }}>
            📚 Gestión de Documentos
          </h1>
          <button 
            className="btn-primary" 
            onClick={() => setModalOpen(true)}
            style={{
              background: 'var(--gradient-primary)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(167,139,250,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(167,139,250,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(167,139,250,0.3)';
            }}
          >
            📁 + Agregar archivo
          </button>
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Subir documento">
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Selecciona un archivo (PDF, Word, Excel):
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            {/* Checkbox para todos */}
            <div className="doc-checkbox-row" style={{ marginBottom: 18 }}>
              <label htmlFor="global-doc" style={{
                display: 'flex', alignItems: 'center',
                background: isGlobal ? 'var(--gradient-primary, #a78bfa)' : 'var(--bg-secondary, #23232b)',
                color: isGlobal ? 'var(--text-white, #fff)' : 'var(--text-primary, #fff)',
                border: isGlobal ? '2px solid var(--gradient-primary, #a78bfa)' : '2px solid var(--border-color, #333)',
                borderRadius: 16,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: isGlobal ? '0 2px 12px rgba(167,139,250,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.18s'
              }}>
                <input type="checkbox" id="global-doc" checked={isGlobal} onChange={handleGlobalChange} style={{ marginRight: 10, width: 20, height: 20, accentColor: '#a78bfa' }} />
                Para todos
              </label>
            </div>
            {/* Multi-select visual de roles */}
            <div className="doc-multiselect-section">
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Asignar a roles:
              </label>
              <div className="doc-multiselect-list">
                {roles.map(role => (
                  <span
                    key={role}
                    className={`doc-pill ${selectedRoles.includes(role) ? 'selected' : ''}`}
                    onClick={() => !isGlobal && handleRoleToggle(role)}
                    style={{ cursor: isGlobal ? 'not-allowed' : 'pointer' }}
                  >
                    {role}
                  </span>
                ))}
                {roles.length === 0 && (
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    background: 'var(--bg-card-hover)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-secondary)'
                  }}>
                    No hay roles disponibles
                  </span>
                )}
              </div>
            </div>
            {uploadError && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ❌ {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div style={{ 
                color: '#16a34a', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ✅ {uploadSuccess}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={uploading} style={{ width: '100%' }}>
              {uploading ? 'Subiendo...' : 'Subir documento'}
            </button>
          </form>
        </Modal>

        {/* Modal de edición */}
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar documento">
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Nombre del documento:
              </label>
              <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                style={{ 
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }} 
              />
            </div>
            
            <div>
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Reemplazar archivo (opcional):
              </label>
              <input 
                type="file" 
                onChange={handleEditFileChange} 
                style={{ 
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }} 
              />
            </div>
            <div className="doc-checkbox-row" style={{ marginBottom: 18 }}>
              <label htmlFor="edit-global-doc" style={{
                display: 'flex', alignItems: 'center',
                background: editIsGlobal ? 'var(--gradient-primary, #a78bfa)' : 'var(--bg-secondary, #23232b)',
                color: editIsGlobal ? 'var(--text-white, #fff)' : 'var(--text-primary, #fff)',
                border: editIsGlobal ? '2px solid var(--gradient-primary, #a78bfa)' : '2px solid var(--border-color, #333)',
                borderRadius: 16,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: editIsGlobal ? '0 2px 12px rgba(167,139,250,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.18s'
              }}>
                <input type="checkbox" id="edit-global-doc" checked={editIsGlobal} onChange={handleEditGlobalChange} style={{ marginRight: 10, width: 20, height: 20, accentColor: '#a78bfa' }} />
                Para todos
              </label>
            </div>
            <div className="doc-multiselect-section">
              <label style={{ 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: '8px',
                display: 'block',
                fontSize: '0.95rem'
              }}>
                Asignar a roles:
              </label>
              <div className="doc-multiselect-list">
                {roles.map(role => (
                  <span
                    key={role}
                    className={`doc-pill ${editSelectedRoles.includes(role) ? 'selected' : ''}`}
                    onClick={() => !editIsGlobal && handleEditRoleToggle(role)}
                    style={{ cursor: editIsGlobal ? 'not-allowed' : 'pointer' }}
                  >
                    {role}
                  </span>
                ))}
                {roles.length === 0 && (
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    background: 'var(--bg-card-hover)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-secondary)'
                  }}>
                    No hay roles disponibles
                  </span>
                )}
              </div>
            </div>
            
            {uploadError && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ❌ {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div style={{ 
                color: '#16a34a', 
                marginBottom: 8,
                padding: '12px',
                background: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ✅ {uploadSuccess}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={uploading} style={{ width: '100%' }}>
              {uploading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </Modal>

        {/* Mensajes globales de éxito/error */}
        {uploadSuccess && (
          <div style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#16a34a',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
            zIndex: 1000,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ✅ {uploadSuccess}
          </div>
        )}
        {uploadError && (
          <div style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#dc2626',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            zIndex: 1000,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ❌ {uploadError}
          </div>
        )}

        <div className="document-list-section">
          <h2 style={{ 
            marginBottom: 24, 
            fontSize: 24, 
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📋 Documentos subidos
            <span style={{
              background: 'var(--gradient-secondary)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              {documents.length} documento{documents.length !== 1 ? 's' : ''}
            </span>
          </h2>
          {loadingDocs ? (
            <div style={{ 
              padding: 48, 
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border-color)',
                borderTop: '3px solid var(--gradient-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Cargando documentos...
            </div>
          ) : documents.length === 0 ? (
            <div style={{ 
              padding: 48, 
              textAlign: 'center', 
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                fontSize: '3rem',
                opacity: 0.5
              }}>
                📁
              </div>
              <p style={{ margin: 0 }}>No hay documentos subidos</p>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem',
                opacity: 0.7
              }}>
                Comienza subiendo tu primer documento
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="document-table" style={{ 
                width: '100%', 
                borderCollapse: 'separate', 
                borderSpacing: 0, 
                background: 'var(--bg-primary, #18181b)', 
                borderRadius: 16, 
                overflow: 'hidden', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
                border: '1px solid var(--border-color, #333)' 
              }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary, #23232b)' }}>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      borderBottom: '2px solid var(--border-color)'
                    }}>
                      Nombre
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      borderBottom: '2px solid var(--border-color)'
                    }}>
                      Tipo
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      borderBottom: '2px solid var(--border-color)'
                    }}>
                      Tamaño
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      borderBottom: '2px solid var(--border-color)'
                    }}>
                      Fecha
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      borderBottom: '2px solid var(--border-color)'
                    }}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={doc.id} style={{ 
                      borderBottom: '1px solid var(--border-color, #333)',
                      background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      transition: 'background-color 0.2s ease'
                    }}>
                      <td style={{ 
                        padding: '14px 12px',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {doc.name}
                      </td>
                      <td style={{ 
                        padding: '14px 12px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                      }}>
                        {doc.mimetype.split('/')[1].toUpperCase()}
                      </td>
                      <td style={{ 
                        padding: '14px 12px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                      }}>
                        {(doc.size / 1024).toFixed(1)} KB
                      </td>
                      <td style={{ 
                        padding: '14px 12px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem'
                      }}>
                        {new Date(doc.created_at).toLocaleString('es-CO', { 
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false 
                        })}
                      </td>
                      <td style={{ 
                        padding: '14px 12px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <a
                          href={`${API_URL}/uploads/documents/${doc.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ 
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          📄 Ver/Descargar
                        </a>
                        <button 
                          className="btn-edit" 
                          title="Editar" 
                          onClick={() => openEditModal(doc)}
                          style={{
                            padding: '8px',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-delete" 
                          title="Eliminar" 
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                          style={{
                            padding: '8px',
                            background: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentos;
