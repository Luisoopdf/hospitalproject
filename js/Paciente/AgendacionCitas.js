// Este script administra el asistente de cinco pasos que usa el paciente para agendar una cita médica en línea.

// =======================
// CONFIGURACIÓN
// =======================


const API_BASE = "http://localhost:3000";

// Identificador del paciente autenticado; en una integración real debe obtenerse tras iniciar sesión o desde la sesión actual.
const ID_PACIENTE = 2;

// Diccionario que enlaza cada data-clave declarada en las tarjetas HTML con el Id_Especialidad de la base de datos SQL Server.
const ESPECIALIDAD_MAP = {
    cardiologia: 1,
    dermatologia: 2,
    ginecologia: 3,
    medicina_general: 4,
    nefrologia: 5,
    nutriologia: 6,
    oftalmologia: 7,
    oncologia: 8,
    ortopedia: 9,
    pediatria: 10
}; // Si agregas especialidades nuevas en la interfaz, también debes registrarlas aquí para que el backend las reconozca.

// Objeto centralizado donde se van almacenando todas las elecciones del paciente a medida que avanza por el asistente.
const seleccion = {
    especialidadClave: "",
    especialidadNombre: "",
    especialidadPrecio: 0,
    cedProfesional: null,
    doctorNombre: "",
    consultorio: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    horarioTexto: "",
    folio: "",
    idCita: null
}; // Este estado se reutiliza en cada paso para rellenar resúmenes, construir peticiones y validar datos obligatorios.

// Tabla auxiliar que convierte el número de día que maneja la base (1=lunes, 7=domingo) en un texto comprensible para la vista.
const NOMBRE_DIA = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo"
}; // Se usa tanto para mostrar la leyenda de disponibilidad como para validar la fecha antes de solicitar horarios.

// Arreglos auxiliares que conservan la disponibilidad laboral del médico seleccionado y una cadena amigable para desplegar al paciente.
let diasTrabajoDoctor = [];
let textoDiasTrabajoDoctor = ""; // Ejemplo: "Lunes 08:00 - 14:00 | Miércoles 09:00 - 13:00".

// Referencias directas a cada panel del flujo para poder ocultarlos o mostrarlos sin recargar la página.
const panelEspecialidad = document.getElementById("panel-especialidad");
const panelDoctor = document.getElementById("panel-doctor");
const panelFecha = document.getElementById("panel-fecha");
const panelHorario = document.getElementById("panel-horario");
const panelResumen = document.getElementById("panel-resumen");

// Esta utilidad apaga todos los paneles y activa únicamente el que corresponde al paso actual del asistente.
function mostrarPanel(panel) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    panel.classList.remove("hidden");
}

// Colección de tarjetas de especialidad; se usa para resaltar visualmente la opción elegida y recordar cuál está activa.
const tarjetasEspecialidad = document.querySelectorAll(".especialidad-card");
let tarjetaSeleccionada = null;

tarjetasEspecialidad.forEach(card => {
    // Se aplica la clase seleccionada solo a la tarjeta pulsada para evitar confusiones cuando el usuario cambia de opinión.
    card.addEventListener("click", () => {
        tarjetasEspecialidad.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        tarjetaSeleccionada = card;
    });
});

// Este manejador responde al botón "Continuar" del paso de especialidad: verifica que haya selección, consulta doctores y cambia al panel siguiente.
document.getElementById("btn-especialidad").addEventListener("click", async () => {
    // Antes de consultar la base se obliga al paciente a elegir una tarjeta para evitar solicitudes incompletas.
    if (!tarjetaSeleccionada) {
        alert("Por favor selecciona una especialidad.");
        return;
    }

    // Se guardan la clave, el nombre y el precio de la especialidad, ya que se reutilizarán en el resumen y en validaciones posteriores.
    seleccion.especialidadClave = tarjetaSeleccionada.dataset.clave;
    seleccion.especialidadNombre =
        tarjetaSeleccionada.dataset.nombrenombre || tarjetaSeleccionada.dataset.nombre;
    seleccion.especialidadPrecio =
        parseFloat(tarjetaSeleccionada.dataset.precio || "0");

    // Con la clave HTML se busca el identificador numérico que espera el backend; si no existe, hay un desfase en el mapa.
    const idEspecialidad = ESPECIALIDAD_MAP[seleccion.especialidadClave];
    if (!idEspecialidad) {
        alert("No se encontró el Id de especialidad en el mapa. Revísalo en AgendacionCitas.js");
        return;
    }

    try {
        // Se llama al endpoint de Node que devuelve los doctores pertenecientes a la especialidad elegida.
        const resp = await fetch(`${API_BASE}/api/especialidades/${idEspecialidad}/doctores`);
        if (!resp.ok) throw new Error("Error al obtener los doctores");

        // El resultado se transforma en opciones del elemento select, eliminando previamente cualquier dato de una selección anterior.
        const doctores = await resp.json();
        const selectDoctor = document.getElementById("select-doctor");
        selectDoctor.innerHTML = '<option value="">Seleccione un doctor</option>';

        if (doctores.length === 0) {
            // Si la base no tiene médicos asociados, se avisa al paciente para que pruebe con otra especialidad.
            alert("No hay doctores registrados para esta especialidad.");
        }

        doctores.forEach(doc => {
            // Cada opción incluye la cédula profesional (para consultas futuras), el nombre completo y el consultorio para mostrarlo en pantalla.
            const opt = document.createElement("option");
            opt.value = doc.cedProfesional;
            opt.dataset.nombre = doc.nombreCompleto;
            opt.dataset.consultorio = doc.consultorio;
            opt.textContent = `${doc.nombreCompleto} - Consultorio ${doc.consultorio}`;
            selectDoctor.appendChild(opt);
        });

        // Después de poblar el listado se avanza al segundo paso del asistente.
        mostrarPanel(panelDoctor);
    } catch (err) {
        console.error(err);
        alert("No se pudieron cargar los doctores desde el servidor.");
    }
});

document.getElementById("back-to-especialidad").addEventListener("click", () => {
    // Permite retroceder al paso anterior si el paciente desea cambiar de especialidad.
    mostrarPanel(panelEspecialidad);
});

// Este manejador procesa la selección del doctor, obtiene sus días laborales y prepara el panel de fechas.
document.getElementById("btn-doctor").addEventListener("click", async () => {
    const selectDoctor = document.getElementById("select-doctor");
    const opcion = selectDoctor.options[selectDoctor.selectedIndex];

    if (!opcion || !opcion.value) {
        alert("Selecciona un doctor.");
        return;
    }

    // Se guarda la cédula y el consultorio para construir después la cita y el comprobante.
    seleccion.cedProfesional = parseInt(opcion.value);
    seleccion.doctorNombre = opcion.dataset.nombre;
    seleccion.consultorio = opcion.dataset.consultorio;

    try {
        // Se consulta al backend para conocer los días y rangos horarios en los que el doctor atiende pacientes.
        const resp = await fetch(`${API_BASE}/api/doctores/${seleccion.cedProfesional}/dias`);
        if (!resp.ok) throw new Error("Error al obtener días del doctor");

        const dias = await resp.json();
        if (dias.length === 0) {
            // Sin días registrados se limpia el estado y se muestra un mensaje descriptivo bajo el selector de fecha.
            diasTrabajoDoctor = [];
            textoDiasTrabajoDoctor = "";
            document.getElementById("info-dias-doctor").textContent =
                "Este doctor no tiene días de atención registrados.";
        } else {
            // Se almacenan los números de día para validar la fecha y se construye un texto legible para la guía del paciente.
            diasTrabajoDoctor = dias.map(d => d.diaSemana);
            textoDiasTrabajoDoctor = dias
                .map(d => `${NOMBRE_DIA[d.diaSemana]} ${d.horaInicio} - ${d.horaFin}`)
                .join(" | ");

            document.getElementById("info-dias-doctor").textContent =
                "Este doctor atiende: " + textoDiasTrabajoDoctor;
        }
    } catch (err) {
        // Cualquier error en la consulta se registra en consola y se comunica al paciente con una frase clara.
        console.error(err);
        diasTrabajoDoctor = [];
        textoDiasTrabajoDoctor = "";
        document.getElementById("info-dias-doctor").textContent =
            "No se pudieron cargar los días de atención del doctor.";
    }

    // Con la información del médico lista, se pasa al panel donde se elige la fecha exacta.
    mostrarPanel(panelFecha);
});

document.getElementById("back-to-doctor").addEventListener("click", () => {
    // Permite regresar al listado de doctores para corregir la selección antes de fijar una fecha.
    mostrarPanel(panelDoctor);
});

// Este manejador toma la fecha ingresada, valida reglas de negocio, verifica que el doctor trabaje ese día y obtiene los horarios libres.
document.getElementById("btn-fecha").addEventListener("click", async () => {
    const fechaInput = document.getElementById("fecha-cita");

    if (!fechaInput.value) {
        alert("Selecciona una fecha.");
        return;
    }

    if (!seleccion.cedProfesional) {
        alert("Falta seleccionar un doctor.");
        return;
    }

    // Este bloque normaliza la fecha actual y la seleccionada para comparar solo días (sin horas) y evitar falsos positivos por zonas horarias.
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSel = new Date(fechaInput.value + "T00:00:00");

    // Regla 1: impedir agendar en fechas que ya pasaron.
    if (fechaSel < hoy) {
        alert("No puedes agendar citas en fechas pasadas.");
        return;
    }

    const MS_POR_DIA = 24 * 60 * 60 * 1000;
    const difDias = Math.round((fechaSel - hoy) / MS_POR_DIA);

    // Regla 2: exigir al menos dos días de anticipación para que el hospital procese el trámite.
    if (difDias < 2) {
        alert("La cita debe agendarse con al menos 2 días de anticipación.");
        return;
    }

    // Regla 3: limitar la ventana de agendación a los próximos tres meses para mantener actualizada la agenda médica.
    const maxFecha = new Date(hoy);
    maxFecha.setMonth(maxFecha.getMonth() + 3);
    if (fechaSel > maxFecha) {
        const maxStr = maxFecha.toISOString().slice(0, 10); // yyyy-mm-dd
        alert(
            "La cita no puede agendarse a más de 3 meses de la fecha actual.\n" +
            "Fecha máxima permitida: " + maxStr
        );
        return;
    }

    // Regla 4: asegurar que el día elegido coincida con alguno de los días laborales previamente reportados por el backend.
    if (diasTrabajoDoctor.length > 0) {
        let diaJs = fechaSel.getDay(); // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
        const diaSemana = (diaJs === 0) ? 7 : diaJs; // La base maneja 1=Lunes ... 7=Domingo

        if (!diasTrabajoDoctor.includes(diaSemana)) {
            alert(
                "El doctor no atiende el día seleccionado.\n\n" +
                "Días de atención: " + textoDiasTrabajoDoctor
            );
            return;
        }
    }

    // se almacena la fecha para utilizarla en la consulta de horarios y en el resumen final.
    seleccion.fecha = fechaInput.value;

    try {
        // Se llama al endpoint que genera bloques de 60 minutos marcando cuáles están ocupados por otras citas confirmadas o agendadas.
        const resp = await fetch(
            `${API_BASE}/api/doctores/${seleccion.cedProfesional}/horarios?fecha=${seleccion.fecha}`
        );
        if (!resp.ok) throw new Error("Error al obtener horarios");

        const horarios = await resp.json();
        const contHorarios = document.querySelector(".tabla-horarios");
        contHorarios.innerHTML = "";

        if (horarios.length === 0) {
            // Si el doctor no atiende ese día (por ejemplo, vacaciones sin registrar en HorarioDoctor) se muestra un aviso simple.
            const p = document.createElement("p");
            p.textContent = "El doctor no atiende en esta fecha.";
            contHorarios.appendChild(p);
        } else {
            horarios.forEach(h => {
                // Por cada intervalo recibido se construye una etiqueta con un radio button; si el bloque está ocupado, se deshabilita.
                const label = document.createElement("label");
                label.classList.add("slot");
                if (h.ocupado) {
                    label.classList.add("ocupado-slot");
                } else {
                    label.classList.add("disponible-slot");
                }

                const input = document.createElement("input");
                input.type = "radio";
                input.name = "horario";
                input.dataset.inicio = h.horaInicio;
                input.dataset.fin = h.horaFin;
                if (h.ocupado) {
                    input.disabled = true;
                }

                label.appendChild(input);
                label.append(
                    ` ${h.horaInicio} - ${h.horaFin}${h.ocupado ? " (Ocupado)" : ""}`
                );

                contHorarios.appendChild(label);
            });
        }

        // Cuando los horarios están listos, el asistente avanza al panel donde el paciente selecciona un bloque específico.
        mostrarPanel(panelHorario);
    } catch (err) {
        console.error(err);
        alert("No se pudieron cargar los horarios desde el servidor.");
    }
});

document.getElementById("back-to-fecha").addEventListener("click", () => {
    // Permite volver al paso de fecha para corregir la elección antes de reservar un horario.
    mostrarPanel(panelFecha);
});

// Este manejador guarda el bloque horario elegido, genera un folio temporal y prepara el comprobante que se mostrará antes de confirmar.
document.getElementById("btn-horario").addEventListener("click", () => {
    const horarioSel = document.querySelector('input[name="horario"]:checked');

    if (!horarioSel || horarioSel.disabled) {
        alert("Selecciona un horario disponible.");
        return;
    }

    // Se registran las horas exactas que formarán parte de la cita y se construye una cadena para el comprobante.
    seleccion.horaInicio = horarioSel.dataset.inicio;
    seleccion.horaFin = horarioSel.dataset.fin;
    seleccion.horarioTexto = `${seleccion.horaInicio} - ${seleccion.horaFin}`;

    // Se crea un folio visual con fecha y timestamp para enseñar al paciente un identificador inmediato antes de llamar al backend.
    const now = new Date();
    seleccion.folio =
        "FOL-" +
        now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        "-" +
        now.getTime().toString().slice(-4);

    // Todos los datos recopilados se ponen en el resumen para que el paciente confirme que la información es correcta.
    document.getElementById("res-folio").textContent = seleccion.folio;
    document.getElementById("res-especialidad").textContent = seleccion.especialidadNombre;
    document.getElementById("res-doctor").textContent = seleccion.doctorNombre;
    document.getElementById("res-consultorio").textContent = seleccion.consultorio;
    document.getElementById("res-fecha").textContent = seleccion.fecha;
    document.getElementById("res-horario").textContent = seleccion.horarioTexto;
    document.getElementById("res-monto").value =
        seleccion.especialidadPrecio.toFixed(2) + " MXN";

    mostrarPanel(panelResumen);
});

document.getElementById("back-to-horario").addEventListener("click", () => {
    // Botón de retroceso para cambiar de horario antes de efectuar la confirmación final.
    mostrarPanel(panelHorario);
});

// Este manejador envía los datos definitivos al backend para crear la cita en SQL Server y gestiona la respuesta del servidor.
document.getElementById("btn-confirmar").addEventListener("click", async () => {
    if (
        !seleccion.cedProfesional ||
        !seleccion.fecha ||
        !seleccion.horaInicio ||
        !seleccion.horaFin
    ) {
        alert("Faltan datos de la cita.");
        return;
    }

    // Se arma el cuerpo de la solicitud exactamente como lo espera el endpoint de creación de citas.
    const body = {
        cedProfesional: seleccion.cedProfesional,
        idPaciente: ID_PACIENTE,
        fechaCita: seleccion.fecha,
        horaInicio: seleccion.horaInicio,
        horaFin: seleccion.horaFin
    };

    try {
        const resp = await fetch(`${API_BASE}/api/citas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            // Si el servidor responde con error, se intenta mostrar el mensaje detallado.
            let msg = "Error al guardar la cita";
            try {
                const errData = await resp.json();
                if (errData && errData.error) {
                    msg = errData.error;
                }
            } catch (_) { }
            throw new Error(msg);
        }

        const data = await resp.json();
        seleccion.idCita = data.idCita;

        // Se actualiza el folio del comprobante con el Id real generado en la base para que el paciente pueda rastrear su cita posteriormente.
        document.getElementById("res-folio").textContent =
            `CITA-${seleccion.idCita}`;

        alert("Cita confirmada correctamente. Folio: " + seleccion.idCita);

        // Tras confirmar se redirige al panel principal del paciente; ajusta la ruta si tu archivo de destino se llama distinto.
        window.location.href = "HomePaciente.html";

    } catch (err) {
        console.error(err);
        alert(err.message || "Ocurrió un error al confirmar la cita en el servidor.");
    }
});

// Al cargar la página se establecen dinámicamente los límites mínimo y máximo del selector de fecha según las reglas de anticipación.
document.addEventListener("DOMContentLoaded", () => {
    const fechaInput = document.getElementById("fecha-cita");
    if (!fechaInput) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // La fecha mínima se fija en dos días después de la actual para respetar la regla de anticipación.
    const minFecha = new Date(hoy);
    minFecha.setDate(minFecha.getDate() + 2);

    // La fecha máxima se fija tres meses adelante para evitar agendar con demasiado tiempo de antelación.
    const maxFecha = new Date(hoy);
    maxFecha.setMonth(maxFecha.getMonth() + 3);

    const formatea = (d) => d.toISOString().slice(0, 10); // Función auxiliar para convertir Date a formato yyyy-mm-dd compatible con inputs tipo date.

    fechaInput.min = formatea(minFecha);
    fechaInput.max = formatea(maxFecha);
});
