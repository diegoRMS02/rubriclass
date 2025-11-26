import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./UserManagementPage.module.css";
import CreateUserModal from "../components/CreateUserModal";

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Control del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Nuevo estado

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/usuarios");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Abrir modal para CREAR
  const handleOpenCreate = () => {
    setEditingUser(null); // Aseguramos que no hay usuario seleccionado
    setIsModalOpen(true);
  };

  // Abrir modal para EDITAR
  const handleOpenEdit = (user) => {
    setEditingUser(user); // Pasamos los datos del usuario al estado
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    fetchData(); // Recargamos la tabla
    alert(editingUser ? "Usuario actualizado" : "Usuario creado");
  };

  const handleToggleActive = async (user) => {
    const nuevoEstado = !user.activo;
    const action = user.activo ? "desactivar" : "activar";
    if (
      !window.confirm(`¿Estás seguro de que deseas ${action} a este usuario?`)
    )
      return;

    try {
      await axios.put(`/api/usuarios/${user.id}`, { activo: nuevoEstado });
      const updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, activo: nuevoEstado } : u
      );
      setUsers(updatedUsers);
    } catch (error) {
      alert("Error al actualizar");
    }
  };

  if (loading)
    return <div style={{ padding: "2rem" }}>Cargando usuarios...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
        <button className={styles.createBtn} onClick={handleOpenCreate}>
          <span>➕</span> Nuevo Usuario
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ opacity: user.activo ? 1 : 0.6 }}>
                <td>
                  <div className={styles.userInfo}>
                    <h4>{user.nombre_completo}</h4>
                    <span>{user.email}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.roleBadge}>
                    {user.rol ? user.rol.toUpperCase() : "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      user.activo ? styles.active : styles.inactive
                    }`}
                  >
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  {" "}
                  {/* Clase nueva para alinear */}
                  {/* BOTÓN EDITAR */}
                  <button
                    className={`${styles.actionBtn} ${styles.btnEdit}`}
                    onClick={() => handleOpenEdit(user)}
                    title="Editar datos"
                  >
                    ✏️ Editar
                  </button>
                  {/* BOTÓN ACTIVAR/DESACTIVAR */}
                  <button
                    className={`${styles.actionBtn} ${
                      user.activo ? styles.btnDeactivate : styles.btnActivate
                    }`}
                    onClick={() => handleToggleActive(user)}
                    title={
                      user.activo ? "Desactivar usuario" : "Activar usuario"
                    }
                  >
                    {user.activo ? "⛔ Desactivar" : "✅ Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateUserModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          userToEdit={editingUser} // Pasamos el usuario a editar (o null)
        />
      )}
    </div>
  );
}

export default UserManagementPage;
