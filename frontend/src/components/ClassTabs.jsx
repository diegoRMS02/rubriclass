import React from "react";
import styles from "./ClassTabs.module.css";

function ClassTabs({ activeTab, onTabChange }) {
  return (
    <div className={styles.tabsContainer}>
      <button
        className={`${styles.tab} ${
          activeTab === "novedades" ? styles.active : ""
        }`}
        onClick={() => onTabChange("novedades")}
      >
        📢 Novedades
      </button>
      <button
        className={`${styles.tab} ${
          activeTab === "contenido" ? styles.active : ""
        }`}
        onClick={() => onTabChange("contenido")}
      >
        📚 Trabajo de Clase
      </button>
      <button
        className={`${styles.tab} ${
          activeTab === "personas" ? styles.active : ""
        }`}
        onClick={() => onTabChange("personas")}
      >
        👥 Personas
      </button>
    </div>
  );
}

export default ClassTabs;
