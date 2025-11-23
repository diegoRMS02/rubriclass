import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

function Sidebar({ user, isOpen, onClose, onLogout }) {
  const location = useLocation();

  // Función auxiliar para saber si un link está activo
  const isActive = (path) => location.pathname === path;

  // Enlaces según el rol
  const menuItems =
    user.rol === "docente"
      ? [
          { label: "Dashboard", path: "/" },
          // Aquí agregaremos más enlaces después (Rúbricas, Clases, etc)
        ]
      : [{ label: "Mis Evaluaciones", path: "/" }];

  return (
    <>
      {/* Overlay oscuro solo para móvil cuando está abierto */}
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.logoContainer}>EvaluaGO 🚀</div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                isActive(item.path) ? styles.activeLink : ""
              }`}
              onClick={onClose} // Cierra el menú al hacer clic (en móvil)
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            {user.nombre_completo.split(" ")[0]} ({user.rol})
          </div>
          <button onClick={onLogout} className={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
