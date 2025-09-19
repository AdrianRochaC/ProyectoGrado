import React, { useState, useEffect } from "react";
import "./Register.css";

const API_URL = 'http://localhost:3001';

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargos, setCargos] = useState([]);
  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cargos/activos`);
      if (response.ok) {
        const data = await response.json();
        setCargos(data.cargos);
        if (data.cargos.length > 0) {
          setSelectedCargoId(data.cargos[0].id);
        }
      } else {
        }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!selectedCargoId) {
      alert("❌ Por favor selecciona un cargo");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: name,
          email: email, 
          password: password, 
          cargo_id: parseInt(selectedCargoId)
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert("✅ " + result.message);
        // Limpiar formulario después del registro exitoso
        setName("");
        setEmail("");
        setPassword("");
        setSelectedCargoId(cargos.length > 0 ? cargos[0].id : "");
      } else {
        alert("❌ " + result.message);
      }
    } catch (error) {
      alert("❌ Error de conexión. Verifica que el servidor esté funcionando.");
    }
  };

  if (loading) {
    return (
      <div className="register-container">
        <div className="loading">Cargando cargos disponibles...</div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-header">
        <h1>🚀 Crear Cuenta</h1>
        <p>Únete a nuestra plataforma de capacitaciones</p>
      </div>
      
      <form className="register-form" onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="name">
            <span className="label-icon">👤</span>
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa tu nombre completo"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            <span className="label-icon">📧</span>
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@empresa.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            <span className="label-icon">🔒</span>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cargo">
            <span className="label-icon">🏢</span>
            Cargo/Departamento
          </label>
          <select 
            id="cargo"
            value={selectedCargoId} 
            onChange={(e) => setSelectedCargoId(e.target.value)}
            required
          >
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nombre} - {cargo.descripcion}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary">
          <span className="btn-icon">✨</span>
          Crear cuenta
        </button>
      </form>
    </div>
  );
};

export default Register;