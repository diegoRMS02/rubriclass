import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./AdminLayout.module.css";

function AdminLayout({ children, user }) {
  const location = useLocation();

  const handleLogout = () => {
    window.location.href = "http://localhost:3001/api/auth/logout";
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: "📊" },
    { label: "Usuarios", path: "/admin/usuarios", icon: "👥" },
    { label: "Clases", path: "/admin/clases", icon: "🏫" },
  ];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo}>
          <span>🛡️</span> EvaluaGO Admin
        </div>

        {/* Navegación */}
        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                location.pathname === item.path ? styles.activeLink : ""
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        {/* Perfil Admin (Abajo) */}
        <div className={styles.adminProfile}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {user?.nombre_completo
                ? user.nombre_completo.charAt(0).toUpperCase()
                : "A"}
            </div>
            <div className={styles.adminInfo}>
              <span className={styles.adminName}>Admin</span>
              <span className={styles.adminEmail}>
                {user?.email || "admin@evaluago.com"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Cerrar Sesión"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}

export default AdminLayout;
