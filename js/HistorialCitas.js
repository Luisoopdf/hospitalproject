(() => {
  const $ = (id) => document.getElementById(id);

  // ============ DATOS (MOCK / BD) ============
  const MOCK_DATA = {
    nombre: "Juan Pérez",
    historial: [
      {
        fechaISO: "2023-10-12",
        hora: "10:30 AM",
        especialidad: "Cardiología",
        doctor: "Dr. Roberto Gomez",
        estatus: "Atendida",
        receta: {
          folioCita: "F#4592-RM",
          folioReceta: "RX-10293",
          consultorio: "C-12",
          cedulaProfesional: "12345678",
          doctor: "Dr. Roberto Gomez",
          fechaEmision: "12 de Octubre, 2023",
          paciente: "Juan Pérez",
          edad: 31,
          diagnostico:
            "Infección respiratoria aguda de las vías superiores (J06.9). Paciente presenta cuadro febril moderado, tos seca persistente y congestión nasal severa desde hace 3 días.",
          tratamiento: [
            "Amoxicilina 50mg: Tomar 1 cápsula cada 8 horas durante 7 días.",
            "Paracetamol 500mg: Tomar 1 tableta cada 6 horas en caso de fiebre superior a 38°C o dolor generalizado.",
          ],
          servicios: ["Aplicación de inyección intramuscular (IM)", "Nebulización"],
        },
      },
      {
        fechaISO: "2023-09-28",
        hora: "09:00 AM",
        especialidad: "Dermatología",
        doctor: "Dra. Ana Torres",
        estatus: "Cancelada",
        receta: null,
      },
      {
        fechaISO: "2023-08-15",
        hora: "03:45 PM",
        especialidad: "Medicina General",
        doctor: "Dr. Carlos Ruiz",
        estatus: "Cancelada",
        receta: null,
      },
    ],
  };

  const state = {
    paciente: MOCK_DATA,
    historial: MOCK_DATA.historial.slice(),
  };

  // ========================= UTILIDADES =========================
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  function statusClass(estatus = "") {
    const e = estatus.toLowerCase();
    if (e.includes("atendida")) return "status-ok";
    if (e.includes("cancel")) return "status-bad";
    return "status-pending";
  }

  function formatFecha(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${String(d).padStart(2, "0")} ${meses[m - 1]}, ${y}`;
  }

  function setText(id, value, fallback = "—") {
    const el = $(id);
    if (el) el.textContent = value ?? fallback;
  }

  function fillList(id, items, { tag = "li", emptyText = "—" } = {}) {
    const el = $(id);
    if (!el) return;

    el.innerHTML = "";
    const arr = Array.isArray(items) ? items : [];

    if (!arr.length) {
      const node = document.createElement(tag);
      node.textContent = emptyText;
      el.appendChild(node);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const text of arr) {
      const node = document.createElement(tag);
      node.textContent = text;
      frag.appendChild(node);
    }
    el.appendChild(frag);
  }

  // ========================= MODAL RECETA =========================
  function openRecetaModal(rx) {
    setText("rx_folio_cita", rx?.folioCita);
    setText("rx_folio_receta", rx?.folioReceta);
    setText("rx_consultorio", rx?.consultorio);
    setText("rx_cedula", rx?.cedulaProfesional);

    setText("rx_doctor", rx?.doctor);
    setText("rx_fecha_emision", rx?.fechaEmision);

    setText("rx_paciente", rx?.paciente ?? state.paciente?.nombre);
    setText("rx_edad", rx?.edad);

    setText("rx_diagnostico", rx?.diagnostico);

    fillList("rx_tratamiento", rx?.tratamiento, { tag: "li" });
    fillList("rx_servicios", rx?.servicios, { tag: "li" });

    $("modalReceta").hidden = false;
  }

  function closeRecetaModal() {
    $("modalReceta").hidden = true;
  }

  // ========================= RENDER TABLA =========================
  function render(lista) {
    setText("pacienteNombre", state.paciente?.nombre);

    const tbody = $("tablaHistorial");
    tbody.innerHTML = "";

    const frag = document.createDocumentFragment();

    for (const c of lista) {
      const tr = document.createElement("tr");
      const tieneReceta = Boolean(c.receta);

      tr.innerHTML = `
        <td>${formatFecha(c.fechaISO)}</td>
        <td>${c.hora}</td>
        <td>${c.especialidad}</td>
        <td>${c.doctor}</td>
        <td><span class="status ${statusClass(c.estatus)}">${c.estatus}</span></td>
        <td>
          <button class="btn-recipe" type="button" ${tieneReceta ? "" : "disabled"}>
            Ver receta
          </button>
        </td>
      `;

      if (tieneReceta) {
        tr.querySelector(".btn-recipe").addEventListener("click", () => openRecetaModal(c.receta));
      }

      frag.appendChild(tr);
    }

    tbody.appendChild(frag);
  }

  // ========================= FILTRO =========================
  function aplicarFiltro() {
    const dia = Number($("f_dia").value) || 0;
    const mes = Number($("f_mes").value) || 0;
    const anio = Number($("f_anio").value) || 0;

    const filtrado = state.historial.filter(({ fechaISO }) => {
      const [y, m, d] = fechaISO.split("-").map(Number);
      if (anio && y !== anio) return false;
      if (mes && m !== mes) return false;
      if (dia && d !== dia) return false;
      return true;
    });

    render(filtrado);
  }

  function limpiarFiltro() {
    $("f_dia").value = "";
    $("f_mes").value = "";
    $("f_anio").value = "";
    render(state.historial);
  }

  // ========================= EVENTOS =========================
  $("btnLogout").addEventListener("click", () => (location.href = "/index.html"));
  $("btnVolverPerfil").addEventListener("click", () => window.history.back());

  $("btnFiltrar").addEventListener("click", aplicarFiltro);
  $("btnLimpiarFiltro").addEventListener("click", limpiarFiltro);

  $("btnCerrarModal").addEventListener("click", closeRecetaModal);
  $("btnCerrarModalX").addEventListener("click", closeRecetaModal);

  document.querySelector("#modalReceta .modal-backdrop")
    .addEventListener("click", closeRecetaModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("modalReceta").hidden) closeRecetaModal();
  });

  // ========================= INIT =========================
  render(state.historial);
})();
