(function () {
  const $ = (id) => document.getElementById(id);

  // Topbar
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });

  // Redirects (según lo que pediste)
  const goHomeDoctor = () => (location.href = "/html/Doctor/HomeDoctor.html");
  $("btnCancelar").addEventListener("click", goHomeDoctor);
  $("btnFinalizar").addEventListener("click", goHomeDoctor);

  // Segmented: asistencia
  const btnAsistio = $("btnAsistio");
  const btnAusente = $("btnAusente");

  function setAsistencia(asistio) {
    btnAsistio.classList.toggle("is-active", asistio);
    btnAusente.classList.toggle("is-active", !asistio);

    // opcional: bloquear inputs si "No, ausente"
    const disabled = !asistio;
    $("txtDiagnostico").disabled = disabled;
    $("txtRecomendaciones").disabled = disabled;
    document.querySelectorAll("#medList input, #servList input, #btnAddMed, #btnAddServ").forEach((el) => {
      el.disabled = disabled;
    });
    toast(asistio ? "Paciente marcado como: asistió" : "Paciente marcado como: ausente");
  }

  btnAsistio.addEventListener("click", () => setAsistencia(true));
  btnAusente.addEventListener("click", () => setAsistencia(false));

  // ===== Medicamentos =====
  const medList = $("medList");
  $("btnAddMed").addEventListener("click", () => addMedRow());

  function addMedRow(preset = {}) {
    const row = document.createElement("div");
    row.className = "med-row";

    row.innerHTML = `
      <input type="text" placeholder="Ej. Amoxicilina" value="${escapeHtml(preset.nombre || "")}">
      <input type="text" placeholder="500" value="${escapeHtml(preset.dosis || "")}">
      <input type="text" placeholder="8" value="${escapeHtml(preset.frecuencia || "")}">
      <input type="text" placeholder="7" value="${escapeHtml(preset.duracion || "")}">
      <input type="number" min="1" value="${Number(preset.cant || 1)}">
      <button class="icon-trash" type="button" title="Eliminar">
        🗑️
      </button>
    `;

    row.querySelector(".icon-trash").addEventListener("click", () => {
      row.remove();
      toast("Medicamento eliminado.");
    });

    medList.appendChild(row);
  }

  // Tratamiento demo
  addMedRow({ nombre: "Amoxicilina", dosis: "500", frecuencia: "8", duracion: "7", cant: 1 });
  
  // ===== Servicios / Proc. =====
  const servList = $("servList");
  $("btnAddServ").addEventListener("click", () => addServiceCard());

  function addServiceCard(preset = {}) {
    const card = document.createElement("div");
    card.className = "serv-card";

    card.innerHTML = `
      <div class="serv-top">
        <div class="serv-title">Nombre del servicio</div>
        <button class="icon-trash" type="button" title="Eliminar">🗑️</button>
      </div>

      <input type="text" placeholder="Ej. Inyección Intramuscular" value="${escapeHtml(preset.nombre || "")}">

      <div class="serv-grid">
        <div class="qty">Cantidad:
          <input type="number" min="1" value="${Number(preset.cant || 1)}" aria-label="Cantidad">
        </div>
      </div>
    `;

    card.querySelector(".icon-trash").addEventListener("click", () => {
      card.remove();
      toast("Servicio eliminado.");
    });

    servList.appendChild(card);
  }

  // Presets demo (como en la imagen)
  addServiceCard({ nombre: "Consulta General", cant: 1 });
  addServiceCard({ nombre: "", cant: 1 });

  // ===== Toast =====
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 1800);
  }

  // Utils
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
