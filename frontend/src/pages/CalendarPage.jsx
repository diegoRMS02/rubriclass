import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./CalendarPage.module.css";

moment.locale("es");
const localizer = momentLocalizer(moment);

// Mapeo de días para generar recurrencia
const DAY_MAP = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/evaluaciones/calendario");
      const { evaluaciones, clases } = response.data;

      const allEvents = [];

      // 1. PROCESAR EVALUACIONES (Eventos Únicos)
      evaluaciones.forEach((ev) => {
        if (!ev.fecha_fin) return;
        const start = new Date(ev.fecha_fin);

        // Duración visual de 1 hora
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;
        let title = `${ev.nombre_clase} - ${ev.nombre_evaluacion}`;
        if (hasTime) title = `⏰ ${moment(start).format("HH:mm")} ${title}`;

        allEvents.push({
          id: `eval-${ev.id}`,
          title,
          start,
          end,
          allDay: !hasTime,
          type: "evaluation", // Tipo para colorear
          status: ev.entregado ? "submitted" : "pending",
        });
      });

      // 2. PROCESAR CLASES (Eventos Recurrentes)
      // Generamos eventos para el año actual
      const currentYear = new Date().getFullYear();

      clases.forEach((clase) => {
        if (!clase.dias || !clase.hora_inicio) return;

        // Convertir "Lunes, Miércoles" -> [1, 3]
        const targetDays = clase.dias
          .split(", ")
          .map((d) => DAY_MAP[d.trim()])
          .filter((d) => d !== undefined);

        // Parsear horas (Ej: "08:00:00")
        const [hInicio, mInicio] = clase.hora_inicio.split(":").map(Number);
        const [hFin, mFin] = clase.hora_fin
          ? clase.hora_fin.split(":").map(Number)
          : [hInicio + 1, mInicio];

        // Generar eventos para cada día del año que coincida
        // (Optimización: Podríamos generar solo el mes visible, pero por ahora hacemos el año simple)
        let cursor = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        while (cursor <= endOfYear) {
          if (targetDays.includes(cursor.getDay())) {
            // Crear fecha inicio
            const start = new Date(cursor);
            start.setHours(hInicio, mInicio, 0);

            // Crear fecha fin
            const end = new Date(cursor);
            end.setHours(hFin, mFin, 0);

            allEvents.push({
              id: `class-${clase.id}-${cursor.getTime()}`, // ID único
              title: `📚 ${clase.nombre_clase}`,
              start,
              end,
              allDay: false,
              type: "class", // Tipo especial
            });
          }
          // Avanzar al siguiente día
          cursor.setDate(cursor.getDate() + 1);
        }
      });

      setEvents(allEvents);
    } catch (error) {
      console.error("Error cargando calendario:", error);
    }
  };

  const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
  const onView = useCallback((newView) => setView(newView), [setView]);

  // --- ESTILOS ---
  const eventStyleGetter = (event) => {
    // 1. ESTILO PARA CLASES (Horario Recurrente)
    if (event.type === "class") {
      return {
        style: {
          backgroundColor: "#673AB7", // Morado Académico
          borderLeft: view === "agenda" ? "6px solid #673AB7" : "0px",
          backgroundColor: view === "agenda" ? "transparent" : "#673AB7",
          color: view === "agenda" ? "#333" : "white",
          borderRadius: "4px",
          opacity: 0.8, // Un poco transparente para no tapar evaluaciones urgentes
          fontSize: "0.85rem",
        },
      };
    }

    // 2. ESTILO PARA EVALUACIONES
    let colorBase = "#1A73E8"; // Azul
    const now = new Date();
    const isPast = new Date(event.start) < now;

    if (event.status === "submitted") colorBase = "#34A853"; // Verde
    else if (isPast) colorBase = "#EA4335"; // Rojo

    if (view === "agenda") {
      return {
        style: {
          backgroundColor: "transparent",
          color: "#333",
          borderLeft: `6px solid ${colorBase}`,
          padding: "5px",
        },
      };
    }

    return {
      style: {
        backgroundColor: colorBase,
        borderRadius: "6px",
        color: "white",
        display: "block",
        fontSize: "0.85rem",
      },
    };
  };

  const formats = {
    agendaDateFormat: (date, culture, localizer) =>
      localizer.format(date, "ddd DD MMM", culture),
    agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
      localizer.format(start, "HH:mm", culture) +
      " - " +
      localizer.format(end, "HH:mm", culture),
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
            style={{ backgroundColor: "#673AB7" }}
          ></div>{" "}
          Clases
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.dot}
            style={{ backgroundColor: "#1A73E8" }}
          ></div>{" "}
          Tarea Pendiente
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.dot}
            style={{ backgroundColor: "#34A853" }}
          ></div>{" "}
          Tarea Entregada
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.dot}
            style={{ backgroundColor: "#EA4335" }}
          ></div>{" "}
          Tarea Vencida
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
          formats={formats}
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
            event: "Evento",
            noEventsInRange: "Sin actividades.",
          }}
          eventPropGetter={eventStyleGetter}
          popup
        />
      </div>
    </div>
  );
};

export default CalendarPage;
