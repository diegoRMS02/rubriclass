import React from "react";

function RubricList({ rubrics }) {
  if (rubrics.length === 0) {
    return <p>Aún no has subido ninguna rúbrica.</p>;
  }

  return (
    <div className="rubric-list-container">
      <h2>Mis Rúbricas</h2>
      <ul className="rubric-list">
        {rubrics.map((rubrica) => (
          <li key={rubrica.id} className="rubric-item">
            <h3 className="rubric-title">{rubrica.titulo}</h3>
            <p className="rubric-description">{rubrica.descripcion}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RubricList;
