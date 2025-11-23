import React, { useState } from "react";
import Sidebar from "./Sidebar";
import styles from "./MainLayout.module.css";

function MainLayout({ children, user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className={styles.layout}>
      {/* Barra superior solo móvil */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={() => setIsSidebarOpen(true)}
        >
          ☰
        </button>
        <span className={styles.mobileLogo}>EvaluaGO</span>
        <div style={{ width: "24px" }}></div>{" "}
        {/* Espaciador para centrar logo */}
      </header>

      {/* Sidebar Inteligente */}
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Contenido de la página */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}

export default MainLayout;
