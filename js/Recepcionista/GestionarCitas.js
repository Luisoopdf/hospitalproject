(function () {
  const $ = (id) => document.getElementById(id);

  // ========================= DATOS (DEMO) =========================
  // Mapeo de Pago:
  // - Confirmada -> Pagado
  // - Pendiente de Pago -> No pagado
  // - Por Confirmar Pago -> Revisar Pago (botón)
  // Otros: Atendida / Cancelada -> N/A
  let citas = [
    { id: 1, fecha: "12 Oct 2023", hora: "09:30 AM", especialidad: "Cardiología", consultorio: "304", doctor: "Dr. Roberto G.", paciente: "María Rodríguez", estatus: "Por Confirmar Pago" },
    { id: 2, fecha: "12 Oct 2023", hora: "10:00 AM", especialidad: "Pediatría", consultorio: "201", doctor: "Dra. Ana López", paciente: "Juan Pérez", estatus: "Confirmada" },
    { id: 3, fecha: "12 Oct 2023", hora: "10:45 AM", especialidad: "Dermatología", consultorio: "105", doctor: "Dr. Luis M.", paciente: "Sofía Díaz", estatus: "Pendiente de Pago" },
    { id: 4, fecha: "12 Oct 2023", hora: "11:30 AM", especialidad: "Cardiología", consultorio: "304", doctor: "Dr. Roberto G.", paciente: "Carlos Ruiz", estatus: "Cancelada" },
    { id: 5, fecha: "12 Oct 2023", hora: "12:15 PM", especialidad: "Ginecología", consultorio: "402", doctor: "Dra. Elena T.", paciente: "Lucía Fernández", estatus: "Atendida" },
    { id: 6, fecha: "13 Oct 2023", hora: "09:00 AM", especialidad: "Neurología", consultorio: "210", doctor: "Dr. Miguel S.", paciente: "Pedro Ramos", estatus: "Confirmada" },
    { id: 7, fecha: "13 Oct 2023", hora: "10:00 AM", especialidad: "Ortopedia", consultorio: "118", doctor: "Dra. Karla P.", paciente: "Valeria Soto", estatus: "Por Confirmar Pago" },
    { id: 8, fecha: "13 Oct 2023", hora: "11:00 AM", especialidad: "Oftalmología", consultorio: "222", doctor: "Dr. Raúl N.", paciente: "Diego Luna", estatus: "Pendiente de Pago" },
  ];

  // ========================= HELPERS FECHA (para filtro) =========================
  // Convierte "12 Oct 2023" -> "2023-10-12"
  function toISOFromLabel(label) {
    if (!label) return "";
    const parts = label.trim().split(/\s+/); // ["12","Oct","2023"]
    if (parts.length < 3) return "";

    const d = Number(parts[0]);
    const mon = (parts[1] || "").toLowerCase();
    const y = Number(parts[2]);

    const map = {
      jan: 1, ene: 1,
      feb: 2,
      mar: 3,
      apr: 4, abr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8, ago: 8,
      sep: 9, sept: 9,
      oct: 10,
      nov: 11,
      dec: 12, dic: 12,
    };

    const m = map[mon.slice(0, 3)];
    if (!y || !m || !d) return "";

    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  // Normaliza citas para que SIEMPRE tengan fechaISO
  function hydrateFechasISO() {
    citas = citas.map(c => ({
      ...c,
      fechaISO: c.fechaISO || toISOFromLabel(c.fecha),
    }));
  }

  // ========================= ESTADO UI =========================
  let cancelMode = false;
  let cancelType = null;        // "paciente" | "doctor"
  let citasFiltradas = null;    // null => sin filtro

  // ========================= TOPBAR =========================
  $("btnLogout").addEventListener("click", () => (location.href = "/index.html"));
  $("btnVolverPerfil").addEventListener("click", () => (location.href = "/html/Recepcionista/HomeRecepcionista.html"));

  // ========================= BADGE SOLICITUDES =========================
  function updateSolicitudesBadge() {
    const count = citas.filter(c => c.estatus === "Solicitud de Cancelación").length;
    $("badgeSolicitudes").textContent = String(count);
  }

  // ========================= ESTILOS CELDAS =========================
  function statusClass(estatus) {
    switch (estatus) {
      case "Confirmada": return "st-ok";
      case "Atendida": return "st-muted";
      case "Pendiente de Pago":
      case "Por Confirmar Pago":
      case "Solicitud de Cancelación": return "st-warn";
      case "Cancelada": return "st-danger";
      default: return "st-muted";
    }
  }

  function paymentCell(estatus, citaId) {
    if (estatus === "Confirmada") {
      return `<span class="pay-text">Pagado</span>`;
    }
    if (estatus === "Pendiente de Pago") {
      return `<span class="pay-text">No pagado</span>`;
    }
    if (estatus === "Por Confirmar Pago") {
      return `<button class="pay-link" type="button" data-action="revisar" data-id="${citaId}">Revisar Pago</button>`;
    }
    return `<span class="pay-text">N/A</span>`;
  }

  // ========================= MODAL GENÉRICO =========================
  function openModal(title, bodyHtml) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    $("modal").hidden = false;
  }
  function closeModal() { $("modal").hidden = true; }

  $("btnCloseModal").addEventListener("click", closeModal);
  $("btnCloseModalX").addEventListener("click", closeModal);
  document.querySelector("#modal .modal-backdrop").addEventListener("click", closeModal);

  // ========================= TOAST =========================
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 2200);
  }

  // ========================= MODO CANCELAR =========================
  function selectedIds() {
    const checks = document.querySelectorAll('input[data-rowcheck="1"]:checked');
    return Array.from(checks).map(ch => Number(ch.dataset.id));
  }

  function updateCancelButtons() {
    const ids = selectedIds();
    $("btnConfirmarCancelacion").disabled = ids.length === 0;

    const allChecks = document.querySelectorAll('input[data-rowcheck="1"]');
    $("checkAll").checked = allChecks.length > 0 && ids.length === allChecks.length;
  }

  function setCancelMode(on) {
    cancelMode = on;
    $("cancelActions").hidden = !on;
    $("checkAll").hidden = !on;

    $("btnModoCancelar").classList.toggle("btn-danger", on);
    $("btnModoCancelar").classList.toggle("btn-outline", !on);

    render();
    if (on) toast("Modo cancelar activado.");
  }

  // ========================= MODAL CANCELACIÓN =========================
  function openCancelModal() {
    cancelType = null;
    $("btnConfirmCancelType").disabled = true;
    $("optPaciente").classList.remove("selected");
    $("optDoctor").classList.remove("selected");
    $("cancelModal").hidden = false;
  }

  function closeCancelModal() {
    $("cancelModal").hidden = true;
  }

  function selectCancelType(type) {
    cancelType = type;
    $("optPaciente").classList.toggle("selected", type === "paciente");
    $("optDoctor").classList.toggle("selected", type === "doctor");
    $("btnConfirmCancelType").disabled = !cancelType;
  }

  // ========================= FILTRO (ARREGLADO) =========================
  function aplicarFiltro() {
    const dia = Number($("f_dia").value) || 0;
    const mes = Number($("f_mes").value) || 0;
    const anio = Number($("f_anio").value) || 0;

    if (!dia && !mes && !anio) {
      citasFiltradas = null;
      render();
      return;
    }

    citasFiltradas = citas.filter((c) => {
      if (!c.fechaISO) return false;
      const [y, m, d] = c.fechaISO.split("-").map(Number);
      if (anio && y !== anio) return false;
      if (mes && m !== mes) return false;
      if (dia && d !== dia) return false;
      return true;
    });

    render();
  }

  function limpiarFiltro() {
    $("f_dia").value = "";
    $("f_mes").value = "";
    $("f_anio").value = "";
    citasFiltradas = null;
    render();
  }

  // ========================= RENDER (SIN PAGINACIÓN) =========================
  function render() {
    updateSolicitudesBadge();

    const fuente = citasFiltradas ?? citas;
    $("txtConteo").textContent = `Mostrando ${fuente.length} resultados`;

    const tbody = $("tbodyCitas");
    tbody.innerHTML = "";

    fuente.forEach((c) => {
      const tr = document.createElement("tr");

      const checkTd = document.createElement("td");
      checkTd.className = "col-check";
      checkTd.innerHTML = cancelMode
        ? `<input class="chk" type="checkbox" data-rowcheck="1" data-id="${c.id}" />`
        : "";

      const status = `
        <span class="status ${statusClass(c.estatus)}">
          <span class="dot" aria-hidden="true"></span>
          ${c.estatus}
        </span>
      `;

      const doctorCell = `
        <div class="doc-cell">
          <span class="doc-name">${c.doctor}</span>
        </div>
      `;

      tr.appendChild(checkTd);
      tr.innerHTML += `
        <td>${c.fecha}</td>
        <td>${c.hora}</td>
        <td>${c.especialidad}</td>
        <td>${c.consultorio}</td>
        <td>${doctorCell}</td>
        <td>${c.paciente}</td>
        <td>${status}</td>
        <td>${paymentCell(c.estatus, c.id)}</td>
      `;

      tbody.appendChild(tr);
    });

    // Checks (modo cancelar)
    if (cancelMode) {
      document.querySelectorAll('input[data-rowcheck="1"]').forEach((ch) => {
        ch.addEventListener("change", updateCancelButtons);
      });

      $("checkAll").onchange = () => {
        const all = $("checkAll").checked;
        document.querySelectorAll('input[data-rowcheck="1"]').forEach((ch) => (ch.checked = all));
        updateCancelButtons();
      };

      updateCancelButtons();
    }

    // Revisar pago
    tbody.querySelectorAll('[data-action="revisar"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const cita = citas.find(x => x.id === id);

        openModal(
          "Revisar pago",
          `
            <div><b>Cita:</b> #${id}</div>
            <div><b>Paciente:</b> ${cita?.paciente || "—"}</div>
            <div><b>Doctor:</b> ${cita?.doctor || "—"}</div>
            <div style="margin-top:10px;color:#475569;">
              (Demo) Aquí se verá el archivo subido por el paciente y la recepcionista va a validar/confirmar el pago.
            </div>
            <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
              <button class="pay-link" id="btnConfirmarPago" type="button">Marcar como Confirmada</button>
            </div>
          `
        );

        setTimeout(() => {
          const b = document.getElementById("btnConfirmarPago");
          if (!b) return;
          b.onclick = () => {
            cita.estatus = "Confirmada";
            closeModal();
            toast("Pago confirmado (demo).");
            render();
          };
        }, 0);
      });
    });
  }

  // ========================= EVENTOS =========================
  $("btnAgendar").addEventListener("click", () => { (location.href = "/html/AgendacionCitas.html"); });

  $("btnSolicitudes").addEventListener("click", () => {
    openModal("Solicitudes de cancelación", `<div>(Demo) Aquí muestras la lista de solicitudes pendientes.</div>`);
  });

  $("btnFiltrar").addEventListener("click", () => {
    aplicarFiltro();
    toast("Filtro aplicado.");
  });

  $("btnLimpiarFiltro").addEventListener("click", () => {
    limpiarFiltro();
    toast("Filtro limpiado.");
  });

  $("btnModoCancelar").addEventListener("click", () => setCancelMode(!cancelMode));
  $("btnSalirCancelar").addEventListener("click", () => setCancelMode(false));

  // Cancelar seleccionadas -> abre modal
  $("btnConfirmarCancelacion").addEventListener("click", () => {
    const ids = selectedIds();
    if (ids.length === 0) return;
    openCancelModal();
  });

  // Modal cancelar: cerrar + seleccionar tipo
  $("btnCloseCancel").addEventListener("click", closeCancelModal);
  $("btnCloseCancelX").addEventListener("click", closeCancelModal);
  $("cancelBackdrop").addEventListener("click", closeCancelModal);

  $("optPaciente").addEventListener("click", () => selectCancelType("paciente"));
  $("optDoctor").addEventListener("click", () => selectCancelType("doctor"));

  // Confirmar cancelación con tipo elegido
  $("btnConfirmCancelType").addEventListener("click", () => {
    const ids = selectedIds();
    if (!cancelType || ids.length === 0) return;

    citas = citas.map(c => {
      if (!ids.includes(c.id)) return c;
      return { ...c, estatus: "Cancelada", motivoCancelacion: cancelType };
    });

    // Si hay filtro activo, lo reaplicamos para que no “reviva” citas
    if (citasFiltradas) aplicarFiltro();

    closeCancelModal();
    setCancelMode(false);
    toast(`Canceladas (${cancelType}): ${ids.join(", ")}`);
    render();
  });

  // Escape cierra modales
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("modal").hidden) closeModal();
    if (!$("cancelModal").hidden) closeCancelModal();
  });

  // ========================= INIT =========================
  hydrateFechasISO();
  updateSolicitudesBadge();
  render();
})();
