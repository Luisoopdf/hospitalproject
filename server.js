// Este archivo levanta la API que conecta el frontend de agendación con la base de datos hospitalaria.
const express = require("express");
const cors = require("cors");
const sql = require("mssql");

// La aplicación Express se instancia y se habilitan CORS y el parseo JSON para todas las peticiones.
const app = express();
app.use(cors());
app.use(express.json());

// Este objeto concentra las credenciales y banderas usadas para abrir el pool hacia SQL Server.
const dbConfig = {
    user: "hospital_user",
    password: "Hospital123$",
    server: "localhost",
    database: "HOSPITAL",
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

// El pool compartido evita reconexiones repetidas y se reutiliza en todos los controladores.
const poolPromise = sql.connect(dbConfig);

// Esta utilidad recibe un Date y regresa un string HH:mm para unificar el formato enviado al cliente.
function timeToString(date) {
    const hh = date.getUTCHours().toString().padStart(2, "0");
    const mm = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
}

// Esta ruta obtiene los médicos asociados a la especialidad solicitada y expone nombres legibles.
app.get("/api/especialidades/:id/doctores", async (req, res) => {
    try {
        // Se extrae el identificador de especialidad desde la URL y se prepara la conexión.
        const idEspecialidad = parseInt(req.params.id, 10);
        const pool = await poolPromise;
        // La consulta une Doctor con Empleado, Usuario y Persona para devolver datos completos.
        const query = `
      SELECT 
          d.Ced_Profesional,
          p.Nombre,
          p.Paterno,
          p.Materno,
          d.Id_Consultorio
      FROM Doctor d
      INNER JOIN Empleado emp ON d.Id_Empleado = emp.Id_Empleado
      INNER JOIN Usuario u ON emp.Id_Usuario = u.Id_Usuario
      INNER JOIN Persona p ON u.CURP = p.CURP
      WHERE d.Id_Especialidad = @IdEsp;
    `;
        const result = await pool
            .request()
            .input("IdEsp", sql.Int, idEspecialidad)
            .query(query);
        // Se arma una respuesta en camelCase para que el frontend la consuma con nombres claros.
        const doctores = result.recordset.map((row) => ({
            cedProfesional: row.Ced_Profesional,
            nombreCompleto: `${row.Nombre} ${row.Paterno} ${row.Materno ?? ""}`.trim(),
            consultorio: row.Id_Consultorio,
        }));
        res.json(doctores);
    } catch (err) {
        console.error("Error obteniendo doctores:", err);
        res.status(500).json({ error: "Error obteniendo doctores" });
    }
});

// Esta ruta lista los días activos y el rango horario registrado para un doctor específico.
app.get("/api/doctores/:ced/dias", async (req, res) => {
    try {
        // Se normaliza la cédula profesional y se usa el pool existente para la consulta.
        const cedProfesional = parseInt(req.params.ced, 10);
        const pool = await poolPromise;
        // La consulta agrupa por día de la semana y obtiene el horario mínimo y máximo configurado.
        const query = `
      SELECT 
          DiaSemana,
          MIN(HoraInicio) AS HoraInicio,
          MAX(HoraFin)    AS HoraFin
      FROM HorarioDoctor
      WHERE Ced_Profesional = @Ced
        AND Activo = 1
      GROUP BY DiaSemana
      ORDER BY DiaSemana;
    `;
        const result = await pool
            .request()
            .input("Ced", sql.Int, cedProfesional)
            .query(query);
        // Se devuelve la lista de días con horas formateadas para mostrarla directamente en la vista.
        const dias = result.recordset.map(row => ({
            diaSemana: row.DiaSemana,                // 1 = Lunes ... 7 = Domingo
            horaInicio: timeToString(row.HoraInicio),
            horaFin: timeToString(row.HoraFin)
        }));
        res.json(dias);
    } catch (err) {
        console.error("Error obteniendo días del doctor:", err);
        res.status(500).json({ error: "Error obteniendo días del doctor" });
    }
});

// Esta ruta genera intervalos disponibles de cita para una fecha concreta considerando citas ya ocupadas.
app.get("/api/doctores/:ced/horarios", async (req, res) => {
    try {
        // Se valida que lleguen la cédula y la fecha para evitar consultas incompletas.
        const cedProfesional = parseInt(req.params.ced, 10);
        const fechaStr = req.query.fecha; // "2025-11-20"
        if (!fechaStr) {
            return res
                .status(400)
                .json({ error: "Se requiere parámetro fecha=YYYY-MM-DD" });
        }
        const fecha = new Date(fechaStr + "T00:00:00");
        // Se traduce el día JavaScript (0-6) al formato que usa la base (1-7).
        let diaSemana = fecha.getDay();
        diaSemana = diaSemana === 0 ? 7 : diaSemana;
        const pool = await poolPromise;
        // Se consulta el horario base configurado para ese doctor y ese día específico.
        const horarioQuery = `
      SELECT HoraInicio, HoraFin
      FROM HorarioDoctor
      WHERE Ced_Profesional = @Ced
        AND DiaSemana = @Dia
        AND Activo = 1;
    `;
        const horarioResult = await pool
            .request()
            .input("Ced", sql.Int, cedProfesional)
            .input("Dia", sql.Int, diaSemana)
            .query(horarioQuery);
        if (horarioResult.recordset.length === 0) {
            // Si no existe horario ese día, se responde con arreglo vacío para que el cliente lo maneje.
            return res.json([]);
        }
        const horaIni = horarioResult.recordset[0].HoraInicio; // TIME → Date
        const horaFin = horarioResult.recordset[0].HoraFin;
        // Se buscan citas ya agendadas para bloquear los intervalos ocupados ese día.
        const citasQuery = `
      SELECT Hora_I, Hora_F
      FROM Cita
            WHERE Ced_Profesional = @Ced
                AND CAST(Fecha_Cita AS date) = @Fecha
                AND EstatusCita IN (
                        'AGENDADA PENDIENTE DE PAGO',
                        'AGENDADA',
                        'CONFIRMADA'
                );
    `;
        const citasResult = await pool
            .request()
            .input("Ced", sql.Int, cedProfesional)
            .input("Fecha", sql.Date, fechaStr)
            .query(citasQuery);
        const ocupados = citasResult.recordset.map((row) => ({
            ini: row.Hora_I,
            fin: row.Hora_F,
        }));
        const duracionMin = 60;
        const base = new Date("2000-01-01T00:00:00"); // base ficticia


        function addMinutes(date, minutes) {
            return new Date(date.getTime() + minutes * 60000);
        }
        let cur = new Date(base);
        cur.setHours(horaIni.getHours(), horaIni.getMinutes(), 0, 0);
        const end = new Date(base);
        end.setHours(horaFin.getHours(), horaFin.getMinutes(), 0, 0);
        const slots = [];
        while (cur < end) {
            // Se arma el intervalo candidato y se compara contra cada cita ocupada para descartar traslapes.
            const slotIni = new Date(cur);
            const slotFin = addMinutes(slotIni, duracionMin);
            const ocupado = ocupados.some((o) => {
                const oIni = new Date(base);
                oIni.setHours(o.ini.getHours(), o.ini.getMinutes(), 0, 0);
                const oFin = new Date(base);
                oFin.setHours(o.fin.getHours(), o.fin.getMinutes(), 0, 0);
                // Se traslapan?
                return slotIni < oFin && slotFin > oIni;
            });
            // Cada slot se etiqueta como disponible u ocupado para que el frontend lo pinte en consecuencia.
            slots.push({
                horaInicio: timeToString(slotIni),
                horaFin: timeToString(slotFin),
                ocupado,
            });
            cur = slotFin;
        }
        res.json(slots);
    } catch (err) {
        console.error("Error obteniendo horarios:", err);
        res.status(500).json({ error: "Error obteniendo horarios" });
    }
});

// Este endpoint inserta una nueva cita protegida contra duplicados pendientes para el mismo doctor y paciente.
app.post("/api/citas", async (req, res) => {
    try {
        // Se extraen los campos esenciales enviados por el frontend y se valida que ninguno falte.
        const { cedProfesional, idPaciente, fechaCita, horaInicio, horaFin } =
            req.body;
        if (!cedProfesional || !idPaciente || !fechaCita || !horaInicio || !horaFin) {
            return res.status(400).json({ error: "Datos incompletos para la cita" });
        }
        // Se registra la carga recibida para facilitar depuración en consola.
        console.log("CrearCita BODY:", {
            cedProfesional,
            idPaciente,
            fechaCita,
            horaInicio,
            horaFin
        });
        // Esta función transforma una cadena HH:mm en un Date válido para el tipo TIME de SQL Server.
        function parseHoraToDate(horaStr) {
            if (!horaStr) throw new Error("Hora vacía");
            const limpia = horaStr.toString().trim();
            const partes = limpia.split(":");
            if (partes.length < 2) {
                throw new Error("Formato de hora inválido: " + horaStr);
            }

            const h = Number(partes[0]);
            const m = Number(partes[1]);

            if (
                Number.isNaN(h) ||
                Number.isNaN(m) ||
                h < 0 || h > 23 ||
                m < 0 || m > 59
            ) {
                throw new Error("Valores de hora/minuto inválidos: " + horaStr);
            }

            // Crear hora en UTC para evitar +6h al guardar
            return new Date(Date.UTC(2000, 0, 1, h, m, 0, 0));
        }

        const fechaObj = new Date(fechaCita + "T00:00:00");
        const horaI = parseHoraToDate(horaInicio);
        const horaF = parseHoraToDate(horaFin);
        const pool = await poolPromise;
        // Antes de crear la cita se busca si existe otra pendiente de pago con el mismo doctor.
        const validaPendienteQuery = `
    SELECT TOP 1 Id_Cita
    FROM Cita
    WHERE Ced_Profesional = @Ced
      AND Id_Paciente = @Pac
      AND EstatusCita = 'AGENDADA PENDIENTE DE PAGO'
      AND Fecha_Cita >= CAST(GETDATE() AS date);
`;
        const pendienteResult = await pool
            .request()
            .input("Ced", sql.Int, cedProfesional)
            .input("Pac", sql.Int, idPaciente)
            .query(validaPendienteQuery);
        if (pendienteResult.recordset.length > 0) {
            // Si se detecta un pendiente, se evita el duplicado y se informa la razón al cliente.
            return res.status(400).json({
                error:
                    "Ya tienes una cita pendiente de pago con este doctor. " +
                    "No puedes agendar otra hasta que se pague o se cancele la anterior."
            });
        }
        // Si no hay conflictos, se inserta la cita dejando constancia de la fecha de registro y el estatus inicial.
        const insertQuery = `
    INSERT INTO Cita
    (Ced_Profesional, Id_Paciente, Fecha_Agendada, Fecha_Cita, Hora_I, Hora_F, EstatusCita)
    OUTPUT INSERTED.Id_Cita
    VALUES
    (@Ced, @Pac, GETDATE(), @FechaCita, @HoraI, @HoraF, 'AGENDADA PENDIENTE DE PAGO');
`;
        const result = await pool
            .request()
            .input("Ced", sql.Int, cedProfesional)
            .input("Pac", sql.Int, idPaciente)
            .input("FechaCita", sql.Date, fechaCita)
            .input("HoraI", sql.Time, horaI)
            .input("HoraF", sql.Time, horaF)
            .query(insertQuery);
        // Se responde con el identificador generado para que el frontend muestre el folio real.
        const idCita = result.recordset[0].Id_Cita;
        res.json({ idCita });
    } catch (err) {
        console.error("Error creando cita:", err);
        res.status(500).json({ error: err.message }); // deja el mensaje para depurar
    }
});

// El servidor arranca escuchando el puerto 3000, quedando listo para recibir solicitudes del frontend.
const PORT = 3000;
app.listen(PORT, () => {
    console.log("API escuchando en http://localhost:" + PORT);
});
