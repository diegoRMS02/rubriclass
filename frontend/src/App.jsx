import { useState, useEffect } from "react";
import axios from "axios";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  // 'user' guardará los datos del usuario si está logueado, o será null si no.
  const [user, setUser] = useState(null);
  // 'loading' nos ayudará a mostrar un mensaje mientras verificamos la sesión.
  const [loading, setLoading] = useState(true);

  // useEffect se ejecuta una sola vez cuando el componente se carga.
  useEffect(() => {
    // Función para verificar si hay una sesión activa en el backend.
    const checkUserSession = async () => {
      try {
        // Hacemos una petición a la ruta que nos devuelve el perfil del usuario.
        const response = await axios.get("/api/auth/profile");
        // Si la petición es exitosa (código 200), guardamos los datos del usuario.
        setUser(response.data);
      } catch (error) {
        // Si hay un error (ej. 401 No Autorizado), significa que no hay sesión activa.
        // No hacemos nada, el estado 'user' seguirá siendo null.
        console.log("No hay una sesión de usuario activa.");
      } finally {
        // Haya o no sesión, marcamos que la verificación ha terminado.
        setLoading(false);
      }
    };

    checkUserSession();
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez.

  // --- Renderizado Condicional ---

  // 1. Mientras estamos verificando, mostramos un mensaje de carga.
  if (loading) {
    return <div>Cargando...</div>;
  }

  // 2. Cuando la verificación termina, decidimos qué página mostrar.
  //    Si 'user' tiene datos, muestra el Dashboard. Si no, muestra el Login.
  return user ? <DashboardPage user={user} /> : <LoginPage />;
}

export default App;
