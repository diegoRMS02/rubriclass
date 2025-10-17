import React, { useState } from "react";
import axios from "axios";

function UploadRubricForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecciona un archivo Excel.");
      return;
    }

    const formData = new FormData();
    formData.append("rubricaFile", file);

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("/api/rubricas/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess(response.data.message);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error al subir el archivo.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Subir Nueva Rúbrica</h2>
      <p>Sube un archivo .xlsx con el formato correcto.</p>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? "Subiendo..." : "Subir Rúbrica"}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
}

export default UploadRubricForm;
