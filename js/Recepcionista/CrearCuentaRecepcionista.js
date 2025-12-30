(() => {
  "use strict";

  const formEl = document.querySelector("form");
  const toastContainer = document.getElementById("toast-container");

  // Steps
  const step1El = document.getElementById("step1");
  const pacienteInfo = document.getElementById("pacienteInfo");
  const doctorInfo = document.getElementById("doctorInfo");
  const simpleInfo = document.getElementById("simpleInfo");

  // Buttons
  const siguienteBtn = document.getElementById("siguienteBtn");
  const btnRegresar = document.getElementById("btnRegresar");
  const btnRegresarDoc = document.getElementById("btnRegresarDoc");
  const btnRegresarSimple = document.getElementById("btnRegresarSimple");

  // Step1 fields
  const curpEl = document.getElementById("curp");
  const nombresEl = document.getElementById("nombres");
  const apPaternoEl = document.getElementById("apPaterno");
  const fechaEl = document.getElementById("fechaNac");
  const generoEl = document.getElementById("genero");
  const telefonoEl = document.getElementById("telefono");
  const legendEl = document.querySelector("form fieldset legend");

  // Dropdown user type
  const tipoUsuarioEl = document.getElementById("tipoUsuario");
  const dd = document.getElementById("tipoUsuarioDropdown");
  const ddBtn = document.getElementById("tipoUsuarioBtn");
  const ddMenu = document.getElementById("tipoUsuarioMenu");
  const ddHint = document.getElementById("tipoUsuarioHint");

  // Paciente (obligatorios)
  const pesoEl = document.getElementById("peso");
  const estaturaEl = document.getElementById("estatura");
  const tipoSangreEl = document.getElementById("tipoSangre");

  // Doctor (obligatorios)
  const especialidadEl = document.getElementById("especialidad");
  const consultorioEl = document.getElementById("consultorio");
  const cedulaProfesionalEl = document.getElementById("cedulaProfesional");

  let step = 1;

  /* ===================== Helpers ===================== */

  function showToast(message) {
    if (!toastContainer) return alert(message);

    const toast = document.createElement("div");
    toast.className = "toast error";
    toast.innerHTML = `
      <div class="toast-msg">${message}</div>
      <button class="toast-close" aria-label="Cerrar">✕</button>
    `;

    const close = () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 200);
    };

    toast.querySelector(".toast-close").addEventListener("click", close);
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(close, 3500);
  }

  function markInvalid(el) {
    if (!el) return;
    el.classList.add("invalid");
    el.setAttribute("aria-invalid", "true");
  }

  function clearInvalid(el) {
    if (!el) return;
    el.classList.remove("invalid");
    el.removeAttribute("aria-invalid");
  }

  function getTipoUsuario() {
    return (tipoUsuarioEl?.value || "").trim() || null;
  }

  /* ===================== Dropdown ===================== */

  function openDropdown() {
    ddMenu.classList.remove("hidden");
    ddBtn.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    ddMenu.classList.add("hidden");
    ddBtn.setAttribute("aria-expanded", "false");
  }

  function setTipoUsuario(value) {
    tipoUsuarioEl.value = value;
    ddBtn.firstChild.textContent = value + " ";
    ddHint.textContent = `Seleccionado: ${value}`;
    clearInvalid(ddBtn);
    closeDropdown();
  }

  ddBtn.addEventListener("click", () => {
    ddMenu.classList.contains("hidden") ? openDropdown() : closeDropdown();
  });

  ddMenu.querySelectorAll(".dropdown-item").forEach((btn) => {
    btn.addEventListener("click", () => setTipoUsuario(btn.dataset.value));
  });

  document.addEventListener("click", (e) => {
    if (!dd.contains(e.target)) closeDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  /* ===================== Step control ===================== */

  function updateRequiredFields() {
    const tipo = getTipoUsuario();
    const pacienteVisible = !pacienteInfo.classList.contains("hidden");
    const doctorVisible = !doctorInfo.classList.contains("hidden");

    // Paciente
    pesoEl.required = pacienteVisible && tipo === "Paciente";
    estaturaEl.required = pacienteVisible && tipo === "Paciente";
    tipoSangreEl.required = pacienteVisible && tipo === "Paciente";

    // Doctor
    especialidadEl.required = doctorVisible && tipo === "Doctor";
    consultorioEl.required = doctorVisible && tipo === "Doctor";
    cedulaProfesionalEl.required = doctorVisible && tipo === "Doctor";
  }

  function showStepSections() {
    const tipo = getTipoUsuario();

    legendEl.classList.toggle("hidden", step !== 1);

    if (step === 1) {
      step1El.classList.remove("hidden");
      pacienteInfo.classList.add("hidden");
      doctorInfo.classList.add("hidden");
      simpleInfo.classList.add("hidden");
      updateRequiredFields();
      return;
    }

    step1El.classList.add("hidden");

    pacienteInfo.classList.toggle("hidden", tipo !== "Paciente");
    doctorInfo.classList.toggle("hidden", tipo !== "Doctor");

    const isSimple = tipo === "Recepcionista" || tipo === "Farmaceutico";
    simpleInfo.classList.toggle("hidden", !isSimple);

    updateRequiredFields();
  }

  /* ===================== Validations ===================== */

  function validateStep1() {
    if (!curpEl.value.trim()) { showToast("Ingresa tu CURP."); markInvalid(curpEl); curpEl.focus(); return false; }
    if (!nombresEl.value.trim()) { showToast("Ingresa tu nombre."); markInvalid(nombresEl); nombresEl.focus(); return false; }
    if (!apPaternoEl.value.trim()) { showToast("Ingresa tu apellido paterno."); markInvalid(apPaternoEl); apPaternoEl.focus(); return false; }
    if (!fechaEl.value) { showToast("Ingresa tu fecha de nacimiento."); markInvalid(fechaEl); fechaEl.focus(); return false; }

    const fechaSel = new Date(fechaEl.value);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (isNaN(fechaSel) || fechaSel > hoy) {
      showToast("La fecha de nacimiento no es válida.");
      markInvalid(fechaEl);
      fechaEl.focus();
      return false;
    }

    if (!generoEl.value) { showToast("Selecciona un género."); markInvalid(generoEl); generoEl.focus(); return false; }
    if (!telefonoEl.value.trim()) { showToast("Ingresa un número de teléfono."); markInvalid(telefonoEl); telefonoEl.focus(); return false; }

    if (!getTipoUsuario()) {
      showToast("Selecciona un tipo de usuario.");
      markInvalid(ddBtn);
      ddBtn.focus();
      return false;
    }

    return true;
  }

  function validatePaciente() {
    let ok = true;

    if (!pesoEl.value.trim()) { markInvalid(pesoEl); ok = false; }
    if (!estaturaEl.value.trim()) { markInvalid(estaturaEl); ok = false; }
    if (!tipoSangreEl.value) { markInvalid(tipoSangreEl); ok = false; }

    if (!ok) showToast("Completa los campos obligatorios del paciente.");
    return ok;
  }

  function validateDoctor() {
    let ok = true;

    if (!especialidadEl.value) { markInvalid(especialidadEl); ok = false; }
    if (!consultorioEl.value.trim()) { markInvalid(consultorioEl); ok = false; }
    if (!cedulaProfesionalEl.value.trim()) { markInvalid(cedulaProfesionalEl); ok = false; }

    if (!ok) showToast("Completa la información del doctor.");
    return ok;
  }

  /* ===================== Flow ===================== */

  function goNextFromStep1() {
    if (!validateStep1()) return;

    step = 2;
    showStepSections();

    const tipo = getTipoUsuario();
    const target = (tipo === "Paciente") ? pacienteInfo : (tipo === "Doctor") ? doctorInfo : simpleInfo;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function goBackToStep1() {
    step = 1;
    showStepSections();
    step1El.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ===================== Events ===================== */

  siguienteBtn.addEventListener("click", goNextFromStep1);
  btnRegresar?.addEventListener("click", goBackToStep1);
  btnRegresarDoc?.addEventListener("click", goBackToStep1);
  btnRegresarSimple?.addEventListener("click", goBackToStep1);

  // Limpieza de invalid
  const clearIds = [
    "curp", "nombres", "apPaterno", "apMaterno",
    "fechaNac", "genero", "telefono",
    "peso", "estatura", "tipoSangre",
    "especialidad", "consultorio", "cedulaProfesional"
  ];

  clearIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => clearInvalid(el));
      el.addEventListener("change", () => clearInvalid(el));
    });
  
    // Submit final
    formEl.addEventListener("submit", (ev) => {
    ev.preventDefault(); // ⬅️ evita envío real del form
  
    const tipo = getTipoUsuario();
        
    if (!tipo) {
      showToast("Selecciona un tipo de usuario.");
      markInvalid(ddBtn);
      return;
    }
  
    if (tipo === "Paciente" && !validatePaciente()) return;
    if (tipo === "Doctor" && !validateDoctor()) return;
  
    // ✅ TODO OK → REDIRECCIÓN
    window.location.href = "/html/Recepcionista/HomeRecepcionista.html";
  });
  

  // Init
  showStepSections();
})();
