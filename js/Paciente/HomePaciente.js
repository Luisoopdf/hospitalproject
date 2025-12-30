(() => {
  const $ = (id) => document.getElementById(id);

  // Helpers mínimos
  const setDisabled = (els, disabled) => els.forEach(el => el && (el.disabled = disabled));
  const show = (el, visible) => el && (el.hidden = !visible);

  // Crea un bloque "editable" genérico: Editar / Cancelar / Guardar
  function makeEditableSection({
    editBtnId,
    actionsId,
    cancelBtnId,
    saveBtnId,      // puede ser null si el guardado lo maneja un <form>
    fields,
    onSave,
  }) {
    const btnEdit = $(editBtnId);
    const actions = $(actionsId);
    const btnCancel = $(cancelBtnId);
    const btnSave = saveBtnId ? $(saveBtnId) : null;

    let backup = null;

    // estado inicial
    setDisabled(fields, true);
    show(actions, false);

    const startEdit = () => {
      backup = fields.map(f => (f ? f.value : ""));
      setDisabled(fields, false);
      show(actions, true);
    };

    const cancelEdit = () => {
      fields.forEach((f, i) => f && (f.value = backup?.[i] ?? f.value));
      setDisabled(fields, true);
      show(actions, false);
    };

    const saveEdit = () => {
      setDisabled(fields, true);
      show(actions, false);
      onSave?.();
      alert("Guardado (demo).");
    };

    btnEdit?.addEventListener("click", startEdit);
    btnCancel?.addEventListener("click", cancelEdit);
    btnSave?.addEventListener("click", saveEdit);

    return { startEdit, cancelEdit, saveEdit };
  }

  // ===== Topbar =====
  $("btnLogout")?.addEventListener("click", () => (location.href = "/index.html"));

  // ===== Acciones rápidas =====
  $("btnHistorial")?.addEventListener("click", () => (location.href = "/html/HistorialCitas.html"));
  $("btnCancelarRapido")?.addEventListener("click", () => (location.href = "./CancelarCita.html"));
  $("btnEliminarPerfil")?.addEventListener("click", () => (location.href = "/html/EliminarCuenta.html"));

  // ===== Datos Personales (form submit) =====
  const dpFields = [$("dp_nombre"), $("dp_curp"), $("dp_nacimiento"), $("dp_genero")];

  makeEditableSection({
    editBtnId: "btnEditarDatos",
    actionsId: "accionesDatos",
    cancelBtnId: "btnCancelarEdicionDatos",
    saveBtnId: null, // aquí guarda el form
    fields: dpFields,
  });

  $("formDatos")?.addEventListener("submit", (e) => {
    e.preventDefault();

    // demo: reflejar nombre en el perfil
    const nombrePerfil = $("p_nombre");
    const nombreInput = $("dp_nombre");
    if (nombrePerfil && nombreInput) nombrePerfil.textContent = nombreInput.value;

    setDisabled(dpFields, true);
    show($("accionesDatos"), false);
    alert("Datos personales guardados (demo).");
  });

  // ===== Historial Médico =====
  const hmFields = [
    $("hm_sangre"),
    $("hm_peso"),
    $("hm_estatura"),
    $("hm_alergias"),
    $("hm_enfermedades"),
    $("hm_antecedentes"),
  ];

  makeEditableSection({
    editBtnId: "btnEditarMed",
    actionsId: "accionesMed",
    cancelBtnId: "btnCancelarEdicionMed",
    saveBtnId: "btnGuardarMed",
    fields: hmFields,
  });

  // ===== Contacto Rápido =====
  const contactoFields = [$("cr_email"), $("cr_tel")];

  makeEditableSection({
    editBtnId: "btnEditarContacto",
    actionsId: "accionesContacto",
    cancelBtnId: "btnCancelarContacto",
    saveBtnId: "btnGuardarContacto",
    fields: contactoFields,
  });

  // ===== Citas (DEMO) =====
  function renderCitas(citas) {
    const tbody = $("tablaCitas");
    if (!tbody) return;

    tbody.innerHTML = citas
      .map((c) => {
        const pendiente = c.estatus === "Pendiente de Pago";
        return `
          <tr>
            <td>
              <div class="date-badge ${c.badgeColor === "orange" ? "badge-orange" : ""}">
                <div class="badge-top">${c.mes}</div>
                <div class="badge-day">${c.dia}</div>
              </div>
              <div class="row-main">
                <div class="row-title">${c.especialidad}</div>
                <div class="row-sub">${c.doctor}</div>
              </div>
            </td>
            <td>${c.horaInicio} - ${c.horaFin}</td>
            <td>${c.agendadoEl}</td>
            <td>
              <span class="status ${pendiente ? "status-warn" : "status-ok"}">${c.estatus}</span>
            </td>
            <td>
              <button class="btn btn-primary btn-pay" type="button" data-pay="${pendiente ? "1" : "0"}" ${pendiente ? "" : "disabled"}>
                ${pendiente ? "Pagar" : "Pagada"}
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  const citasDemo = [
    {
      mes: "OCT",
      dia: "24",
      especialidad: "Consulta General",
      doctor: "Dr. Ricardo M.",
      horaInicio: "10:00 AM",
      horaFin: "10:30 AM",
      agendadoEl: "15 Oct 2023",
      estatus: "Confirmada",
      badgeColor: "",
    },
    {
      mes: "NOV",
      dia: "05",
      especialidad: "Cardiología",
      doctor: "Dra. Ana S.",
      horaInicio: "12:00 PM",
      horaFin: "01:00 PM",
      agendadoEl: "20 Oct 2023",
      estatus: "Pendiente de Pago",
      badgeColor: "orange",
    },
  ];

  renderCitas(citasDemo);

  // Delegación de eventos (1 listener en vez de muchos)
  $("tablaCitas")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pay='1']");
    if (!btn) return;
    location.href = "/html/Paciente/PagarCita.html";
  });
})();
