import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

function Sidebar({ user, isOpen, onClose, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const menuItems =
    user.rol === "docente"
      ? [{ label: "Dashboard", path: "/" }]
      : [{ label: "Mis Cursos", path: "/" }];

  return (
    <>
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
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userHeader}>
            {/* Lógica para mostrar foto o inicial */}
            {user.foto_url ? (
              <img
                src={user.foto_url}
                alt="Perfil"
                className={styles.avatar}
                referrerPolicy="no-referrer" // Importante para imágenes de Google
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user.nombre_completo.charAt(0).toUpperCase()}
              </div>
            )}

            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user.nombre_completo.split(" ")[0]}
              </span>
              <span className={styles.userRole}>{user.rol}</span>
            </div>
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
