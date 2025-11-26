import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CreateUserModal.module.css";

// Aceptamos una nueva prop: userToEdit
function CreateUserModal({ onClose, onSuccess, userToEdit = null }) {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    password: "", // La contraseña no se muestra al editar
    rol: "estudiante",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AL MONTAR: Si hay userToEdit, llenamos el formulario
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nombre_completo: userToEdit.nombre_completo,
        email: userToEdit.email,
        rol: userToEdit.rol,
        password: "", // Dejar vacía para no sobrescribir si no se toca
      });
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (userToEdit) {
        // --- MODO EDICIÓN (PUT) ---
        // Enviamos los datos al endpoint actualizado
        await axios.put(`/api/usuarios/${userToEdit.id}`, {
          nombre_completo: formData.nombre_completo,
          email: formData.email,
          rol: formData.rol,
          // No enviamos password aquí por seguridad en este flujo simple
        });
      } else {
        // --- MODO CREACIÓN (POST) ---
        await axios.post("/api/usuarios", formData);
      }

      onSuccess(); // Cerrar y refrescar
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al procesar la solicitud."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          {/* Título dinámico */}
          <h2 className={styles.title}>
            {userToEdit ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label className={styles.label}>Nombre Completo</label>
            <input
              name="nombre_completo"
              type="text"
              className={styles.input}
              required
              value={formData.nombre_completo}
              onChange={handleChange}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              className={styles.input}
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Ocultamos el campo password si estamos editando (para simplificar) */}
          {!userToEdit && (
            <div className={styles.group}>
              <label className={styles.label}>Contraseña</label>
              <input
                name="password"
                type="password"
                className={styles.input}
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          )}

          <div className={styles.group}>
            <label className={styles.label}>Rol</label>
            <select
              name="rol"
              className={styles.select}
              value={formData.rol}
              onChange={handleChange}
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.btnSave}>
              {loading
                ? "Guardando..."
                : userToEdit
                ? "Guardar Cambios"
                : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;
