(function () {
  const $ = (id) => document.getElementById(id);

  // Topbar botones (misma funcionalidad)
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });

  // Sidebar: Historial (placeholder)
  $("btnHistorial").addEventListener("click", () => {
    // ajusta la ruta según tu estructura
    location.href = "/html/HistorialCitas.html";
  });

  // Contacto rápido (se mantiene igual: editable)
  const btnEditarContacto = $("btnEditarContacto");
  const accionesContacto = $("accionesContacto");
  const crEmail = $("cr_email");
  const crTel = $("cr_tel");
  const btnCancelarContacto = $("btnCancelarContacto");
  const btnGuardarContacto = $("btnGuardarContacto");

  let contactoBackup = null;

  btnEditarContacto.addEventListener("click", () => {
    contactoBackup = { email: crEmail.value, tel: crTel.value };
    crEmail.disabled = false;
    crTel.disabled = false;
    accionesContacto.hidden = false;
  });

  btnCancelarContacto.addEventListener("click", () => {
    if (contactoBackup) {
      crEmail.value = contactoBackup.email;
      crTel.value = contactoBackup.tel;
    }
    crEmail.disabled = true;
    crTel.disabled = true;
    accionesContacto.hidden = true;
  });

  btnGuardarContacto.addEventListener("click", () => {
    crEmail.disabled = true;
    crTel.disabled = true;
    accionesContacto.hidden = true;
    toast("Contacto actualizado (demo).");
  });

  // ===== Datos demo (luego vendrán de BD) =====
  const doctor = {
    id: "DOC-001",
    nombre: "Dr. Roberto Martínez",
    curp: "MARR850101HDFXXX01",
    nacimiento: "1985-01-01",
    genero: "Masculino",
    numEmpleado: "EMP-1029",
    cedula: "CED-9876543",
    contacto: { email: "dr.roberto@email.com", tel: "555-0000" },
    citas: [
      {
        mes: "OCT",
        dia: "24",
        badgeColor: "",
        paciente: {
          nombre: "Juan Pérez Martínez",
          curp: "PEMJ850515HDFXXX09",
          tel: "555-0123",
          email: "juan.perez@email.com",
          historial: {
            idHistorial: "HIST-9001",
            usuario: "juanperez01",
            nacimiento: "1985-05-15",
            alergias: "Penicilina, Polen",
            enfermedades: "Hipertensión",
            antecedentes: "Operación de apéndice (2010)"
          }
        },
        horaInicio: "10:00 AM",
        horaFin: "10:30 AM",
      },

      {
        mes: "NOV",
        dia: "05",
        badgeColor: "orange",
        paciente: {
          nombre: "María López García",
          curp: "LOGM900101MDFXXX11",
          tel: "555-0456",
          email: "maria.lopez@email.com",
        },
        horaInicio: "12:00 PM",
        horaFin: "01:00 PM",
      },
    ],
  };

  function renderDoctor(d) {
    $("d_nombre").textContent = d.nombre;
    $("d_id").textContent = d.id;

    $("dp_nombre").value = d.nombre;
    $("dp_curp").value = d.curp;
    $("dp_nacimiento").value = d.nacimiento;
    $("dp_genero").value = d.genero;
    $("dp_numEmpleado").value = d.numEmpleado;
    $("dp_cedula").value = d.cedula;

    crEmail.value = d.contacto.email;
    crTel.value = d.contacto.tel;

    renderCitas(d.citas);
  }

  function renderCitas(citas) {
    const tbody = $("tablaCitasDoctor");
    tbody.innerHTML = "";

    citas.forEach((c, idx) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="cita-cell">
            <div class="date-badge ${c.badgeColor === "orange" ? "badge-orange" : ""}">
              <div class="badge-top">${c.mes}</div>
              <div class="badge-day">${c.dia}</div>
            </div>
            <div class="row-main">
              <div class="row-title">${c.paciente.nombre}</div>
              <div class="row-sub">Paciente</div>
            </div>
          </div>
        </td>
        <td>${c.horaInicio} - ${c.horaFin}</td>
        <td>
          <div class="actions">
          <button class="btn btn-secondary btn-small btnDatos" type="button">Datos Paciente</button>
          <button class="btn btn-soft btn-small btnHistPaciente" type="button">Historial Citas Paciente</button>
            <button class="btn btn-primary btn-small btnAtender" type="button">Atender</button>
            <button class="btn btn-warn btn-small btnSolicitar" type="button">Solicitar Cancelación</button>

          </div>
        </td>
      `;

      // Acciones
      tr.querySelector(".btnDatos").addEventListener("click", () => openPacienteModal(c.paciente));
      tr.querySelector(".btnAtender").addEventListener("click", () => {
        location.href = "/html/Doctor/RecetaMedica.html";
      });
      tr.querySelector(".btnSolicitar").addEventListener("click", () => {
        toast(`Solicitud de cancelación enviada (demo) para: ${c.paciente.nombre}`);
        // location.href = "/html/Doctor/SolicitarCancelacion.html";
      });
      tr.querySelector(".btnHistPaciente").addEventListener("click", () => {
        // Identificador del paciente
        const pid = c.paciente.id || c.paciente.curp || c.paciente.nombre;
        location.href = `/html/HistorialCitas.html?paciente=${encodeURIComponent(pid)}`;
      });

      tbody.appendChild(tr);
    });
  }

  // ===== Modal Paciente =====
  function openPacienteModal(p) {
    // Datos personales
    $("mp_idHistorial").textContent = p?.historial?.idHistorial || "—";
    $("mp_usuario").textContent = p?.historial?.usuario || "—";
    $("mp_nombre").textContent = p?.nombre || "—";
    $("mp_nacimiento").textContent = p?.historial?.nacimiento || "—";

    // Historial médico (recuadros)
    $("mp_alergias").textContent = p?.historial?.alergias || "—";
    $("mp_enfermedades").textContent = p?.historial?.enfermedades || "—";
    $("mp_antecedentes").textContent = p?.historial?.antecedentes || "—";

    $("modalPaciente").hidden = false;
  }


  function closePacienteModal() {
    $("modalPaciente").hidden = true;
  }

  $("btnCerrarModal").addEventListener("click", closePacienteModal);
  $("btnCerrarModalX").addEventListener("click", closePacienteModal);
  document.querySelector("#modalPaciente .modal-backdrop").addEventListener("click", closePacienteModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("modalPaciente").hidden) closePacienteModal();
  });

  // Toast
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 2200);
  }

  // Init
  renderDoctor(doctor);
})();
