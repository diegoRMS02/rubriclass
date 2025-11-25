import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import "moment/locale/es";
import styles from "./AnnouncementFeed.module.css";

moment.locale("es");

function AnnouncementFeed({ classId, user, isTeacher }) {
  const [anuncios, setAnuncios] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnuncios();
  }, [classId]);

  const fetchAnuncios = async () => {
    try {
      const res = await axios.get(`/api/anuncios/clase/${classId}`);
      setAnuncios(res.data);
    } catch (error) {
      console.error("Error cargando anuncios");
    }
  };

  const handlePublicar = async () => {
    if (!nuevoMensaje.trim()) return;
    setLoading(true);
    try {
      await axios.post("/api/anuncios", {
        clase_id: classId,
        contenido: nuevoMensaje,
      });
      setNuevoMensaje("");
      fetchAnuncios(); // Recargar lista
    } catch (error) {
      alert("Error al publicar");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Borrar anuncio?")) return;
    try {
      await axios.delete(`/api/anuncios/${id}`);
      fetchAnuncios();
    } catch (error) {
      alert("Error al borrar");
    }
  };

  // Función auxiliar para determinar la imagen
  const getAvatarSrc = (url) => {
    return url || "https://via.placeholder.com/40?text=?";
  };

  return (
    <div className={styles.feedContainer}>
      {/* CAJA DE CREACIÓN (Solo Docentes) */}
      {isTeacher && user && (
        <div className={styles.createPostBox}>
          <img
            src={getAvatarSrc(user.foto_url)}
            alt="Perfil"
            className={styles.avatar}
            referrerPolicy="no-referrer" // 👈 CRUCIAL PARA FOTOS DE GOOGLE
          />
          <div className={styles.inputWrapper}>
            <textarea
              className={styles.textArea}
              placeholder="Anuncia algo a tu clase..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
            />
            <button
              className={styles.postBtn}
              onClick={handlePublicar}
              disabled={!nuevoMensaje.trim() || loading}
            >
              {loading ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE ANUNCIOS */}
      {anuncios.length === 0 ? (
        <div className={styles.empty}>Aún no hay anuncios en esta clase.</div>
      ) : (
        anuncios.map((anuncio) => (
          <div key={anuncio.id} className={styles.postCard}>
            <div className={styles.postHeader}>
              <img
                src={getAvatarSrc(anuncio.foto_url)}
                alt="Avatar"
                className={styles.avatar}
                referrerPolicy="no-referrer" // 👈 CRUCIAL PARA FOTOS DE GOOGLE
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/40?text=?"; // Fallback si falla
                }}
              />
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>
                  {anuncio.nombre_completo}
                </span>
                <span className={styles.postDate}>
                  {moment(anuncio.fecha_creacion).fromNow()}
                </span>
              </div>
            </div>
            <div className={styles.postContent}>{anuncio.contenido}</div>

            {isTeacher && (
              <button
                className={styles.deletePostBtn}
                onClick={() => handleEliminar(anuncio.id)}
                title="Eliminar anuncio"
              >
                &times;
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AnnouncementFeed;
