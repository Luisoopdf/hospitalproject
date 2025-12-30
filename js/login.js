// Importar dependencias necesarias
import express from "express";
import cors from "cors";
import { getConnection, mssql } from "../server.js";

// Crear aplicación Express
const app = express();
// Habilitar CORS para permitir peticiones desde el navegador
app.use(cors());
// Permitir recibir datos en formato JSON
app.use(express.json());

// Endpoint para iniciar sesión
app.post("/login", async (req, res) => {
  // Obtener correo y contraseña del cuerpo de la petición
  const { correo, password } = req.body;

  try {
    // Conectar a la base de datos
    const pool = await getConnection();

    // Buscar usuario en la base de datos con las credenciales proporcionadas
    const result = await pool.request()
      .input("correo", mssql.VarChar, correo)
      .input("password", mssql.VarChar, password)
      .query(`
        SELECT Id_Usuario, Id_Rol
        FROM Usuario
        WHERE Correo = @correo AND Password = @password
      `);

    // Si no se encontró el usuario, devolver error 401
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Correo o Contraseña Incorrecta" });
    }

    const usuario = result.recordset[0];

    let redirectUrl = "";

    switch (usuario.Id_Rol) {
      case 1:
        redirectUrl = "/html/Doctor/HomeDoctor.html";
        break;
      case 2:
        redirectUrl = "/html/Paciente/HomePaciente.html";
        break;
      case 3:
        redirectUrl = "/html/Recepcionista/HomeRecepcionista.html";
        break;
      case 4:
        redirectUrl = "/html/HomeFarmacia.html";
        break;
      default:
        return res.status(403).json({ message: "Rol no autorizado" });
    }

    return res.json({
      ok: true,
      redirectUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Endpoint que sirve el código JavaScript para el cliente
app.get("/js/login-paciente.js", (req, res) => {
  res.type("application/javascript").send(`
    (function () {
      //* Obtener el formulario de login
      const form = document.getElementById("loginForm");
      if (!form) return;

      //* Escuchar el evento de envío del formulario
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        //* Obtener valores de los campos del formulario
        const correo = document.getElementById("correo").value.trim();
        const password = document.getElementById("password").value;

        try {
          //* Enviar petición POST al servidor with las credenciales
          const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, password })
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            alert(data.message || "Error al iniciar sesión");
            return;
          }

          window.location.href = data.redirectUrl || "/html/Paciente/HomePaciente.html";
        } catch (err) {
          console.error(err);
          alert("No se pudo conectar con el servidor");
        }
      });
    })();
  `);
});

// Iniciar servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Servidor de login activo en http://localhost:3000");
});


