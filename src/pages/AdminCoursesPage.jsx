import React, { useState, useEffect } from "react";
import "./AdminCoursesPage.css";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck, ClipboardList, Users2, BarChart3, User } from "lucide-react";

// Constantes para la API
const API_URL = 'http://localhost:3001';

const AdminCoursesPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [cargoId, setCargoId] = useState(1);
  const [cargos, setCargos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCourses, setShowCourses] = useState(false); // NUEVO
  const [videoFile, setVideoFile] = useState(null); // Nuevo estado para archivo
  const [useFile, setUseFile] = useState(false); // Nuevo estado para alternar entre link y archivo
  const [loading, setLoading] = useState(false); // Estado para IA
  const [aiStatus, setAiStatus] = useState({}); // Estado para IA

  const API_URL = "http://localhost:3001/api";
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const response = await fetch(`${API_URL}/cargos/para-cursos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCargos(data.cargos);
          // Establecer el primer cargo como seleccionado por defecto
          if (data.cargos.length > 0) {
            setCargoId(data.cargos[0].id);
          }
        }
      }
    } catch (error) {
      }
  };

  const fetchCourses = () => {
    fetch(`${API_URL}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          alert("Sesión expirada. Inicia sesión nuevamente.");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) setCourses(data.courses);
      })
      .catch(console.error);
  };

  const convertToEmbedUrl = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const convertToWatchUrl = (embedUrl) => {
    if (!embedUrl) return null;
    const match = embedUrl.match(/youtube\.com\/embed\/([^?&]+)/);
    return match ? `https://www.youtube.com/watch?v=${match[1]}` : embedUrl;
  };

  const ensureEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    return convertToEmbedUrl(url);
  };

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  // Nuevo handler para alternar entre enlace y archivo
  const handleUseFileChange = (value) => {
    setUseFile(value);
    if (value) {
      setVideoUrl(""); // Limpiar enlace si se va a usar archivo
    } else {
      setVideoFile(null); // Limpiar archivo si se va a usar enlace
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || (!videoUrl && !videoFile)) {
      alert("Completa todos los campos y elige un link o archivo de video.");
      return;
    }

    let formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("cargoId", cargoId);
    formData.append("attempts", attempts);
    formData.append("timeLimit", timeLimit);
    formData.append("evaluation", JSON.stringify(questions));

    if (useFile && videoFile) {
      formData.append("videoFile", videoFile);
    } else if (videoUrl) {
      // Si es link de YouTube, convertir a embed
      const embed = convertToEmbedUrl(videoUrl);
      if (!embed) {
        alert("Enlace YouTube inválido.");
        return;
      }
      formData.append("videoUrl", embed);
    }

    try {
      const url = editingCourse ? `${API_URL}/courses/${editingCourse}` : `${API_URL}/courses`;
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        fetchCourses();
        resetForm();
        alert(editingCourse ? "Curso actualizado exitosamente" : "Curso creado exitosamente");
      } else {
        alert(data.message);
      }
    } catch (err) {
      }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setVideoFile(null);
    setUseFile(false);
    setCargoId(1); // Cambiar a setCargoId y usar el ID del primer cargo por defecto
    setQuestions([]);
    setAttempts(1);
    setTimeLimit(30);
    setShowEvaluation(false);
    setEditingCourse(null);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  const updateQuestionText = (i, val) => {
    const cp = [...questions];
    cp[i].question = val;
    setQuestions(cp);
  };

  const updateOption = (qi, oi, val) => {
    const cp = [...questions];
    cp[qi].options[oi] = val;
    setQuestions(cp);
  };

  const updateCorrectIndex = (qi, val) => {
    const cp = [...questions];
    cp[qi].correctIndex = parseInt(val);
    setQuestions(cp);
  };

  // Función para generar preguntas con IA antes de crear el curso
  const generateQuestionsForNewCourse = async () => {
    try {
      if (!title || !description) {
        alert('⚠️ Primero completa el título y descripción del curso');
        return;
      }

      setLoading(true);
      
      const token = localStorage.getItem("authToken");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user || user.rol !== 'Admin') {
        alert('⚠️ Solo los administradores pueden generar preguntas con IA');
        return;
      }

      // Preparar datos del curso para la IA
      let courseData = {
        title: title,
        description: description,
        contentType: 'text'
      };

      // Si hay video de YouTube, analizarlo
      if (videoUrl && !useFile) {
        try {
          const response = await fetch(`${API_URL}/ai/analyze-youtube`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              videoUrl: videoUrl, 
              title: title, 
              description: description,
              numQuestions: 5 
            })
          });

          if (response.ok) {
            const data = await response.json();
            // Convertir las preguntas al formato del formulario
            const formattedQuestions = data.questions.map(q => ({
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex
            }));
            
            setQuestions(formattedQuestions);
            setShowEvaluation(true);
            alert(`🎉 Se generaron ${data.questions.length} preguntas automáticamente basándose en el video de YouTube`);
            return;
          }
        } catch (error) {
          }
      }

      // Si es archivo de video, usar análisis específico
      if (useFile && videoFile) {
        try {
          // Determinar si es un archivo de video
          const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
          const fileExtension = videoFile.name.toLowerCase().substring(videoFile.name.lastIndexOf('.'));
          
          if (videoExtensions.includes(fileExtension)) {
            // Crear FormData para subir el archivo
            const formData = new FormData();
            formData.append('videoFile', videoFile);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('numQuestions', '5');
            
            const response = await fetch(`${API_URL}/ai/analyze-video-file`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            
            if (response.ok) {
              const data = await response.json();
              const formattedQuestions = data.questions.map(q => ({
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex
              }));
              
              setQuestions(formattedQuestions);
              setShowEvaluation(true);
              alert(`🎉 Se generaron ${data.questions.length} preguntas automáticamente basándose en el archivo de video`);
              return;
            }
          }
        } catch (error) {
          }
      }

      // Si es archivo de documento o solo texto, usar el endpoint general
      const response = await fetch(`${API_URL}/ai/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: title, 
          description: description,
          content: useFile && videoFile ? `Archivo: ${videoFile.name}` : '',
          contentType: useFile ? 'file' : 'text',
          numQuestions: 5 
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Convertir las preguntas al formato del formulario
        const formattedQuestions = data.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex
        }));
        
        setQuestions(formattedQuestions);
        setShowEvaluation(true);
        alert(`🎉 Se generaron ${data.questions.length} preguntas automáticamente basándose en el título y descripción`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error generando preguntas');
      }
      
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este curso?");
    if (!confirmDelete) return;

    if (!token) {
      alert("⚠️ Token no encontrado. Inicia sesión nuevamente.");
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/courses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("⚠️ Sesión expirada. Inicia sesión nuevamente.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert("✅ Curso eliminado exitosamente.");
        fetchCourses();
      } else {
        alert(`❌ Error: ${data.message || "No se pudo eliminar el curso."}`);
      }
    } catch (error) {
      alert("❌ Error al eliminar el curso. Intenta nuevamente.");
    }
  };

  const handleEditCourse = async (course) => {
    setTitle(course.title);
    setDescription(course.description);

    const videoUrl = course.videoUrl || course.video_url;
    const watchUrl = convertToWatchUrl(videoUrl);
    setVideoUrl(watchUrl);

    // Buscar el cargo por nombre para obtener su ID
    const cargo = cargos.find(c => c.nombre === course.role);
    setCargoId(cargo ? cargo.id : 1);
    setAttempts(course.attempts || 1);
    setTimeLimit(course.timeLimit || course.time_limit || 30);
    setEditingCourse(course.id);
    setShowEvaluation(true);

    if (course.evaluation && course.evaluation.length > 0) {
      setQuestions(course.evaluation);
    } else {
      try {
        const res = await fetch(`${API_URL}/courses/${course.id}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions);
        } else {
          setQuestions([]);
        }
      } catch (err) {
        setQuestions([]);
      }
    }

    setShowModal(true);
  };

  // --- DASHBOARD VISUAL ---
  const dashboardCards = [
    {
      title: "Gestión de Cursos",
      icon: <BookOpenCheck size={36} color="#2962ff" />,
      description: "Crea, edita y elimina cursos y evaluaciones.",
      route: "/admin-courses",
      enabled: true,
    },
    {
      title: "Bitácora",
      icon: <ClipboardList size={36} color="#43e97b" />,
      description: "Gestiona tareas y seguimiento de actividades.",
      route: "/AdminBitacora",
      enabled: true,
    },
    {
      title: "Cuentas",
      icon: <Users2 size={36} color="#ff9800" />,
      description: "Administra usuarios y permisos.",
      route: "/cuentas",
      enabled: true,
    },
    {
      title: "Dashboard",
      icon: <BarChart3 size={36} color="#00bcd4" />,
      description: "Visualiza el progreso general de la plataforma.",
      route: "/dashboard",
      enabled: true,
    },
    {
      title: "Perfil",
      icon: <User size={36} color="#607d8b" />,
      description: "Ver y editar tu perfil de administrador.",
      route: "/perfil",
      enabled: true,
    },
  ];

  return (
    <div className="admin-page-container">
      <div className="admin-main-container">
        <h1>Panel Admini {editingCourse ? "(Editando)" : ""}</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <label>Título:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Descripción:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        {/* Selector para elegir entre link o archivo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            padding: "1rem 1.5rem",
            margin: "1.2rem 0 1.5rem 0",
            border: "1px solid #333",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}
        >
          <label style={{ display: "flex", alignItems: "center", fontWeight: 600, color: "#43e97b", cursor: "pointer" }}>
            <input
              type="radio"
              checked={!useFile}
              onChange={() => handleUseFileChange(false)}
              style={{ marginRight: "0.6rem", accentColor: "#43e97b", width: 18, height: 18 }}
            />
            Usar enlace de YouTube
          </label>
          <label style={{ display: "flex", alignItems: "center", fontWeight: 600, color: "#43e97b", cursor: "pointer" }}>
            <input
              type="radio"
              checked={useFile}
              onChange={() => handleUseFileChange(true)}
              style={{ marginRight: "0.6rem", accentColor: "#43e97b", width: 18, height: 18 }}
            />
            Subir archivo de video
          </label>
        </div>

        {/* Ambos inputs, solo uno visible */}
        <div style={{ display: useFile ? "none" : "block" }}>
          <label style={{ color: "#43e97b", fontWeight: 600, marginBottom: 6 }}>Enlace del Video (YouTube):</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            style={{
              background: "#23243a",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "0.5rem",
              marginBottom: "1rem"
            }}
          />
        </div>
        <div style={{ display: useFile ? "block" : "none" }}>
          <label style={{ color: "#43e97b", fontWeight: 600, marginBottom: 6 }}>Archivo de Video:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            style={{
              background: "#23243a",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "0.5rem",
              marginBottom: "1rem"
            }}
          />
          {videoFile && <p style={{ color: '#2962ff', marginTop: 0 }}>Archivo seleccionado: {videoFile.name}</p>}
        </div>

        <label>Cargo/Departamento:</label>
        <select value={cargoId} onChange={(e) => setCargoId(parseInt(e.target.value))} required>
          {cargos.map((cargo) => (
            <option key={cargo.id} value={cargo.id}>
              {cargo.nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowEvaluation(!showEvaluation)}
          className="create-eval-button"
        >
          {showEvaluation ? "Ocultar Evaluación" : "Crear Evaluación"}
        </button>

        {/* 🤖 Botón para generar preguntas con IA antes de crear el curso */}
        <div style={{
          background: 'rgba(46, 204, 113, 0.1)',
          border: '1px solid #43e97b',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem 0',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#43e97b', 
            margin: '0 0 0.5rem 0', 
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            🤖 Generación Automática de Preguntas con IA
          </p>
          <p style={{ 
            color: '#fff', 
            margin: '0', 
            fontSize: '0.8rem',
            opacity: 0.8
          }}>
            Completa el título y descripción, luego haz clic en el botón para generar preguntas automáticamente.
            <br />
            <strong>🎬 Videos de YouTube:</strong> Descarga, transcribe y analiza el contenido real
            <br />
            <strong>📁 Archivos MP4:</strong> Extrae audio, transcribe y analiza el contenido real
            <br />
            <em>⚠️ El procesamiento puede tomar varios minutos dependiendo de la duración del video</em>
          </p>
        </div>
        
        <button
          type="button"
          onClick={generateQuestionsForNewCourse}
          disabled={loading || !title || !description}
          className="ai-generate-btn"
          style={{
            background: 'var(--gradient-success)',
            color: 'white',
            marginTop: '1rem',
            marginBottom: '1rem'
          }}
        >
          {loading ? '🤖 Procesando video y generando preguntas...' : '🤖 Generar preguntas con IA'}
        </button>

        {showEvaluation && (
          <div className="evaluation-section">
            <h3>
              Evaluación 
              {questions.length > 0 && (
                <span style={{ 
                  color: '#43e97b', 
                  fontSize: '0.9rem', 
                  marginLeft: '1rem',
                  fontWeight: 'normal'
                }}>
                  📝 {questions.length} preguntas generadas
                </span>
              )}
            </h3>

            <label>Intentos permitidos:</label>
            <input
              type="number"
              value={attempts}
              onChange={(e) => setAttempts(parseInt(e.target.value))}
              min={1}
              required
            />

            <label>Tiempo límite (minutos):</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              min={1}
              required
            />

            {questions.map((q, i) => (
              <div key={i} className="question-block">
                <label>Pregunta {i + 1}:</label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestionText(i, e.target.value)}
                  required
                />
                {q.options.map((opt, j) => (
                  <input
                    key={j}
                    type="text"
                    placeholder={`Opción ${j + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, j, e.target.value)}
                    required
                  />
                ))}
                <label>Respuesta correcta:</label>
                <select
                  value={q.correctIndex}
                  onChange={(e) => updateCorrectIndex(i, e.target.value)}
                >
                  {[0, 1, 2, 3].map((idx) => (
                    <option key={idx} value={idx}>
                      Opción {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button type="button" onClick={handleAddQuestion}>
              + Agregar Pregunta
            </button>
          </div>
        )}

        <button type="submit">
          {editingCourse ? "Guardar Cambios" : "Agregar Curso"}
        </button>

        {editingCourse && (
          <button type="button" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>

      <button
        type="button"
        onClick={() => setShowCourses(!showCourses)}
        className="toggle-courses-button"
      >
        {showCourses ? "Ocultar cursos creados" : "Mostrar cursos creados"}
      </button>

      {showCourses && (
        <div className="admin-course-list">
          {courses.map((course) => (
            <div key={course.id} className="admin-course-card">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <p>👥 Rol: {course.role}</p>
              <p>⏳ Tiempo límite: {course.timeLimit || course.time_limit} min</p>
              <p>🔁 Intentos: {course.attempts}</p>

              {/* Mostrar video según tipo en la lista de cursos */}
              <div className="video-container">
                {(course.videoUrl || course.video_url) && (course.videoUrl || course.video_url).trim() !== '' ? (
                  (course.videoUrl || course.video_url).includes('youtube.com/embed/') ? (
                    <iframe
                      src={course.videoUrl || course.video_url}
                      title={course.title}
                      width="100%"
                      height="315"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={`http://localhost:3001${course.videoUrl || course.video_url}`}
                      controls
                      width="100%"
                      height="315"
                      style={{ background: '#000' }}
                    >
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  )
                ) : (
                  <div className="no-video">
                    <p>⚠️ No hay video disponible</p>
                    <p>La URL del video está vacía en la base de datos</p>
                  </div>
                )}
              </div>

              <div className="course-actions">
                <button onClick={() => handleEditCourse(course)}>✏️ Editar</button>
                <button onClick={() => handleDeleteCourse(course.id)}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminCoursesPage;
