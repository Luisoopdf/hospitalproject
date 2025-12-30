(function () {
  const $ = (id) => document.getElementById(id);

  // Topbar botones
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });
/*
  // ========================= DEMO DATA =========================   
  // YA LO DEJE COMENTADO PORQUE HAY UNA FUNCIÓN QUE TOMA LOS DATOS DEL SESSIONSTORAGE, ES DECIR, DE LA PÁGINA DE GESTIONAR USUARIOS.
  // En tu app real: aquí cargarías desde backend según ID (querystring, sesión, etc.)
  const demo = {
    curp: "RODM990101HMCLRR07",
    nombre: "María Rodríguez",
    nacimiento: "1999-01-01",
    genero: "Femenino",
    telefono: "55 1234 5678",
    correo: "maria.rodriguez@correo.com",
    idUsuario: "1001",
    tipoUsuario: "Paciente", // Cambia a Doctor / Recepcionista / Farmaceutico para probar

    // empleado (solo si NO es paciente)
    idEmpleado: "E-7781",

    // doctor (solo si es doctor)
    idEspecialidad: "12",
    idConsultorio: "304",
    piso: "3",
    edificio: "A",
    disponibilidad: "Lun a Vie 09:00 - 14:00",

    // historial medico (solo si es paciente)
    idHistorialMedico: "HM-90021",
    alergias: "Penicilina",
    peso: "62 kg",
    enfermedades: "Asma leve",
    antecedentes: "Hipertensión en familia",
    tipoSangre: "O+",
    estatura: "1.64 m",
  };
  */

  const fromStorage = getUsuarioSeleccionado();
  if (fromStorage) {
    // Mapea lo mínimo que llega de GestionarUsuarios
    demo.idUsuario = String(fromStorage.idUsuario ?? demo.idUsuario);
    demo.nombre = fromStorage.nombre ?? demo.nombre;
    demo.tipoUsuario = fromStorage.tipo ?? demo.tipoUsuario;
  
    // Si luego quieres traer CURP/correo/etc de BD, aquí es donde harías fetch por idUsuario.
    // AQUÍ se limpia el sessionStorage
    sessionStorage.removeItem("usuario_sensible");
  }
  

  function getUsuarioSeleccionado() {
    try {
      const raw = sessionStorage.getItem("usuario_sensible");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  

  // ========================= UTILIDADES =========================
  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function setText(id, value) {
    const el = $(id);
    if (!el) return;
    el.textContent = (value ?? "—").toString();
  }

  // ========================= INIT =========================
  // Permite probar por URL:
  // /html/DatosUsuarioSensibles.html?tipo=Doctor
  const tipoFromQS = getParam("tipo");
  if (tipoFromQS) demo.tipoUsuario = tipoFromQS;

  // Chips
  setText("chipTipo", `Tipo: ${demo.tipoUsuario}`);
  setText("chipId", `ID Usuario: ${demo.idUsuario}`);

  // Datos generales
  setText("vCurp", demo.curp);
  setText("vNombre", demo.nombre);
  setText("vNacimiento", demo.nacimiento);
  setText("vGenero", demo.genero);
  setText("vTelefono", demo.telefono);
  setText("vCorreo", demo.correo);
  setText("vIdUsuario", demo.idUsuario);
  setText("vTipoUsuario", demo.tipoUsuario);

  // Secciones condicionales
  const tipo = (demo.tipoUsuario || "").toLowerCase();

  const isPaciente = tipo === "paciente";
  const isDoctor = tipo === "doctor";
  const isEmpleado = !isPaciente; // recepcionista/farmaceutico/doctor => empleado

  // Empleado
  $("secEmpleado").hidden = !isEmpleado;
  if (isEmpleado) setText("vIdEmpleado", demo.idEmpleado);

  // Doctor
  $("secDoctor").hidden = !isDoctor;
  if (isDoctor) {
    setText("vIdEspecialidad", demo.idEspecialidad);
    setText("vIdConsultorio", demo.idConsultorio);
    setText("vPiso", demo.piso);
    setText("vEdificio", demo.edificio);
    setText("vDisponibilidad", demo.disponibilidad);
  }

  // Historial médico
  $("secHistorial").hidden = !isPaciente;
  if (isPaciente) {
    setText("vIdHistorial", demo.idHistorialMedico);
    setText("vAlergias", demo.alergias);
    setText("vPeso", demo.peso);
    setText("vEnfermedades", demo.enfermedades);
    setText("vAntecedentes", demo.antecedentes);
    setText("vSangre", demo.tipoSangre);
    setText("vEstatura", demo.estatura);
  }
})();
