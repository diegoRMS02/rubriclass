import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./CalendarPage.module.css";

// Configurar idioma español para moment
moment.locale("es");
const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const [events, setEvents] = useState([]);

  // --- ESTADO PARA CONTROLAR LA NAVEGACIÓN ---
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("/api/evaluaciones/calendario");
      const data = response.data;

      const formattedEvents = data
        .map((ev) => {
          if (!ev.fecha_fin) return null;

          const fechaInicio = new Date(ev.fecha_fin);

          // Clonamos para duración visual de 1 hora
          const fechaFinVisual = new Date(fechaInicio);
          fechaFinVisual.setHours(fechaInicio.getHours() + 1);

          const tieneHora =
            fechaInicio.getHours() !== 0 || fechaInicio.getMinutes() !== 0;

          // Título con hora
          let tituloDisplay = `${ev.nombre_clase} - ${ev.nombre_evaluacion}`;
          if (tieneHora) {
            const hora = moment(fechaInicio).format("HH:mm");
            tituloDisplay = `⏰ ${hora} ${tituloDisplay}`;
          }

          return {
            id: ev.id,
            title: tituloDisplay,
            start: fechaInicio,
            end: fechaFinVisual,
            allDay: !tieneHora,
            resource: {
              entregado: ev.entregado,
              clase: ev.nombre_clase,
            },
          };
        })
        .filter((ev) => ev !== null);

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error cargando el calendario:", error);
    }
  };

  const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
  const onView = useCallback((newView) => setView(newView), [setView]);

  // --- 🎨 ESTILOS DINÁMICOS ---
  const eventStyleGetter = (event) => {
    let colorBase = "#1A73E8"; // Azul (Pendiente)
    const now = new Date();
    const isPast = new Date(event.start) < now;

    if (event.resource.entregado) {
      colorBase = "#34A853"; // Verde (Entregado)
    } else if (isPast) {
      colorBase = "#EA4335"; // Rojo (Vencido)
    }

    // DISEÑO ESPECÍFICO PARA VISTA AGENDA
    if (view === "agenda") {
      return {
        style: {
          backgroundColor: "transparent", // Fondo transparente
          color: "#333", // Texto oscuro
          borderLeft: `6px solid ${colorBase}`, // Borde de color a la izquierda
          borderRadius: "0px",
          padding: "5px",
          fontSize: "0.9rem",
        },
      };
    }

    // DISEÑO PARA MES / SEMANA / DÍA (Bloques sólidos)
    return {
      style: {
        backgroundColor: colorBase,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "0.85rem",
      },
    };
  };

  // --- 📅 FORMATOS DE FECHA (Para que salga en Español y 24h) ---
  const formats = {
    // Formato de fecha en la columna izquierda de la agenda (Ej: "Mié 05 Nov")
    agendaDateFormat: (date, culture, localizer) =>
      localizer.format(date, "ddd DD MMM", culture).charAt(0).toUpperCase() +
      localizer.format(date, "ddd DD MMM", culture).slice(1),

    // Formato de hora (Ej: "13:00 - 14:00")
    agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
      localizer.format(start, "HH:mm", culture) +
      " - " +
      localizer.format(end, "HH:mm", culture),

    // Formato de hora simple
    timeGutterFormat: (date, culture, localizer) =>
      localizer.format(date, "HH:mm", culture),
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendario Académico 📅</h1>
      </header>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div
            className={styles.dot}
            style={{ backgroundColor: "#1A73E8" }}
          ></div>{" "}
          Pendiente
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.dot}
            style={{ backgroundColor: "#34A853" }}
          ></div>{" "}
          Entregado
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.dot}
            style={{ backgroundColor: "#EA4335" }}
          ></div>{" "}
          Vencido
        </div>
      </div>

      <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={events}
          date={date}
          view={view}
          onNavigate={onNavigate}
          onView={onView}
          startAccessor="start"
          endAccessor="end"
          formats={formats} // 👈 APLICAMOS LOS FORMATOS AQUÍ
          style={{ height: "100%" }}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evaluación",
            noEventsInRange: "No hay evaluaciones en este periodo.",
          }}
          eventPropGetter={eventStyleGetter}
          popup
        />
      </div>
    </div>
  );
};

export default CalendarPage;
