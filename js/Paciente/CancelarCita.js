(function () {
  const $ = (id) => document.getElementById(id);

  // ====== Datos demo (luego vendrá de BD) ======
  // Importante: aquí NO hay lógica de avisos 24h/48h en la lista (solo cálculo para info en modal).
  const citas = [
    {
      id: 101,
      especialidad: "Consulta Cardiología",
      doctor: "Dr. Ricardo Silva",
      fechaCitaISO: "2023-10-25",
      horaInicio: "09:00",
      horaFin: "09:30",
      agendadoISO: "2023-10-10",
      costo: 500
    },
    {
      id: 102,
      especialidad: "Limpieza Dental",
      doctor: "Dra. Ana Lopez",
      fechaCitaISO: "2023-10-27",
      horaInicio: "14:00",
      horaFin: "15:00",
      agendadoISO: "2023-10-12",
      costo: 350
    },
    {
      id: 103,
      especialidad: "Revisión Oftalmológica",
      doctor: "Dr. Carlos Ruiz",
      fechaCitaISO: "2023-10-20",
      horaInicio: "10:00",
      horaFin: "10:30",
      agendadoISO: "2023-09-15",
      costo: 450
    }
  ];

  // ===== Helpers =====
  function formatFecha(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${d} ${meses[date.getMonth()]}, ${y}`;
  }

  function formatHora(hhmm) {
    const [h, min] = hhmm.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ampm}`;
  }

  function hoursUntilCita(cita) {
    const [y, m, d] = cita.fechaCitaISO.split("-").map(Number);
    const [hh, mm] = cita.horaInicio.split(":").map(Number);
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    return (dt.getTime() - Date.now()) / (1000 * 60 * 60);
  }

  // Política (solo para mostrar estimación dentro del modal; NO es aviso visual en la lista)
  function refundPercent(hoursLeft) {
    if (hoursLeft > 48) return 1.0;
    if (hoursLeft >= 24) return 0.5;
    return 0.0;
  }
  function refundLabel(p) {
    if (p === 1) return "Reembolso total (100%)";
    if (p === 0.5) return "Reembolso parcial (50%)";
    return "Sin reembolso (0%)";
  }

  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => (t.hidden = true), 2200);
  }

  // ===== Render citas =====
  const lista = $("listaCitas");

  function render() {
    lista.innerHTML = "";

    if (!citas.length) {
      const empty = document.createElement("div");
      empty.textContent = "No tienes citas programadas.";
      empty.style.padding = "12px";
      empty.style.color = "#374151";
      lista.appendChild(empty);
      return;
    }

    citas.forEach((cita) => {
      const row = document.createElement("div");
      row.className = "appointment";
      row.dataset.id = String(cita.id);

      row.innerHTML = `
        <div class="app-main">
          <div class="app-title">${cita.especialidad}</div>
          <div class="app-sub">${cita.doctor}</div>

          <div class="app-meta">
            <span class="meta-item">
              <span class="meta-ic">📅</span>
              ${formatFecha(cita.fechaCitaISO)}
            </span>
            <span class="meta-item">
              <span class="meta-ic">🕒</span>
              ${formatHora(cita.horaInicio)} - ${formatHora(cita.horaFin)}
            </span>
            <span class="meta-item" title="Fecha en que se agendó">
              <span class="meta-ic">🧾</span>
              Agendada el ${formatFecha(cita.agendadoISO)}
            </span>
          </div>
        </div>

        <div class="app-actions">
          <button class="btn btn-danger" type="button" data-cancel="1">✕ Cancelar Cita</button>
        </div>
      `;

      lista.appendChild(row);
    });
  }

  // ===== Modal =====
  const modal = $("modal");
  const inputPassword = $("inputPassword");
  const helpPassword = $("helpPassword");
  const infoReembolso = $("infoReembolso");

  const btnCerrarModal = $("btnCerrarModal");
  const btnCancelarModal = $("btnCancelarModal");
  const btnConfirmar = $("btnConfirmarCancelacion");

  let citaSeleccionada = null;

  function openModal(cita) {
    citaSeleccionada = cita;
    helpPassword.hidden = true;
    inputPassword.value = "";
    modal.hidden = false;

    const hrs = hoursUntilCita(cita);
    const p = refundPercent(hrs);
    const monto = Math.round((cita.costo * p) * 100) / 100;

    infoReembolso.innerHTML = `
      <div><strong>${refundLabel(p)}</strong></div>
      <div>Horas restantes aprox.: <strong>${Math.max(0, Math.floor(hrs))}</strong></div>
      <div>Monto estimado a reembolsar: <strong>$${monto.toFixed(2)}</strong></div>
    `;

    setTimeout(() => inputPassword.focus(), 30);
  }

  function closeModal() {
    modal.hidden = true;
    citaSeleccionada = null;
  }

  // Validación demo (después será backend)
  const DEMO_PASSWORD = "1234";

  function confirmarCancelacion() {
    if (!citaSeleccionada) return;

    const pass = (inputPassword.value || "").trim();
    if (pass !== DEMO_PASSWORD) {
      helpPassword.hidden = false;
      return;
    }

    const idx = citas.findIndex((c) => c.id === citaSeleccionada.id);
    if (idx >= 0) citas.splice(idx, 1);

    closeModal();
    render();
    showToast("Cita cancelada correctamente (demo).");
  }

  // ===== Eventos =====
  lista.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cancel]");
    if (!btn) return;

    const card = e.target.closest(".appointment");
    if (!card) return;

    const id = Number(card.dataset.id);
    const cita = citas.find((c) => c.id === id);
    if (!cita) return;

    openModal(cita);
  });

  btnCerrarModal.addEventListener("click", closeModal);
  btnCancelarModal.addEventListener("click", closeModal);
  btnConfirmar.addEventListener("click", confirmarCancelacion);

  modal.addEventListener("click", (e) => {
    const backdrop = e.target.closest("[data-close]");
    if (backdrop) closeModal();
  });

  inputPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirmarCancelacion();
    if (e.key === "Escape") closeModal();
  });

  // Topbar botones
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });

  $("btnVolverPerfil").addEventListener("click", () => {
    location.href = "./HomePaciente.html";
  });

  // Init
  render();
})();
