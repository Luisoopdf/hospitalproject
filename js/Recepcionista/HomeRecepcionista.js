(function () {
  const $ = (id) => document.getElementById(id);

  // Topbar: cerrar sesión
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });

  // Botones nuevos del perfil
  $("btnGestionCitas").addEventListener("click", () => {
    location.href = "/html/Recepcionista/GestionarCitas.html";
  });

  $("btnGestionUsuarios").addEventListener("click", () => {
    location.href = "/html/Recepcionista/GestionarUsuarios.html";
  });

  // Contacto rápido (editable)
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
  const recepcionista = {
    id: "REC-001",
    nombre: "Claudia Sheinbaum Pardo",
    curp: "CURP900101MDFXXX01",
    nacimiento: "2005-01-01",
    genero: "Femenino",
    numEmpleado: "EMP-2044",
    contacto: { email: "recepcion@hospitalSanMungoDeEnfermedadesYHeridasMágicas.com", tel: "555-1111" }
  };

  function renderRecepcionista(r) {
    $("r_nombre").textContent = r.nombre;
    $("r_id").textContent = r.id;

    $("dp_nombre").value = r.nombre;
    $("dp_curp").value = r.curp;
    $("dp_nacimiento").value = r.nacimiento;
    $("dp_genero").value = r.genero;
    $("dp_numEmpleado").value = r.numEmpleado;

    crEmail.value = r.contacto.email;
    crTel.value = r.contacto.tel;
  }

  // Toast
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 2200);
  }

  // Init
  renderRecepcionista(recepcionista);
})();
