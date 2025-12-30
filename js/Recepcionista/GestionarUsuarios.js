(function () {
  const $ = (id) => document.getElementById(id);

  // ========================= DATA (DEMO) =========================
  // Tipos soportados: Paciente | Doctor | Recepcionista | Farmaceutico
  let usuarios = [
    { idUsuario: 1001, nombre: "María Rodríguez", tipo: "Paciente" },
    { idUsuario: 2001, nombre: "Dr. Roberto García", tipo: "Doctor" },
    { idUsuario: 3001, nombre: "Laura Pérez", tipo: "Recepcionista" },
    { idUsuario: 4001, nombre: "Daniel Núñez", tipo: "Farmaceutico" },
    { idUsuario: 1002, nombre: "Juan Pérez", tipo: "Paciente" },
    { idUsuario: 2002, nombre: "Dra. Ana López", tipo: "Doctor" },
  ];

  // ========================= STATE =========================
  let deleteMode = false;
  let usuariosFiltrados = null; // null => sin filtro


  // ========================= TOPBAR =========================
  $("btnLogout").addEventListener("click", () => (location.href = "/index.html"));
  $("btnVolverPerfil").addEventListener("click", () => (location.href = "/html/Recepcionista/HomeRecepcionista.html"));

  // ========================= MODAL + TOAST =========================
  function openModal(title, bodyHtml) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    $("modal").hidden = false;
  }
  function closeModal() { $("modal").hidden = true; }

  $("btnCloseModal").addEventListener("click", closeModal);
  $("btnCloseModalX").addEventListener("click", closeModal);
  document.querySelector("#modal .modal-backdrop").addEventListener("click", closeModal);

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 2200);
  }

  // ========================= DELETE MODE =========================
  function selectedIds() {
    const checks = document.querySelectorAll('input[data-rowcheck="1"]:checked');
    return Array.from(checks).map(ch => Number(ch.dataset.id));
  }

  function updateDeleteButtons() {
    const ids = selectedIds();
    $("btnEliminarSeleccionados").disabled = ids.length === 0;

    const allChecks = document.querySelectorAll('input[data-rowcheck="1"]');
    $("checkAll").checked = allChecks.length > 0 && ids.length === allChecks.length;
  }

  function setDeleteMode(on) {
    deleteMode = on;

    $("deleteActions").hidden = !on;
    $("checkAll").hidden = !on;

    $("btnModoEliminar").classList.toggle("btn-danger", on);
    $("btnModoEliminar").classList.toggle("btn-outline", !on);

    render();
    if (on) toast("Modo eliminar activado.");
  }

    // ========================= FILTRO =========================
  function normalizar(str) {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quita acentos
  }
  
  function aplicarFiltroUsuarios() {
    const nombre = normalizar($("f_nombre").value);
    const tipo = ($("f_tipo").value || "").trim();
  
    if (!nombre && !tipo) {
      usuariosFiltrados = null;
      render();
      return;
    }
  
    usuariosFiltrados = usuarios.filter(u => {
      const okNombre = !nombre || normalizar(u.nombre).includes(nombre);
      const okTipo = !tipo || u.tipo === tipo;
      return okNombre && okTipo;
    });
  
    render();
  }
  
  function limpiarFiltroUsuarios() {
    $("f_nombre").value = "";
    $("f_tipo").value = "";
    usuariosFiltrados = null;
    render();
  }
  



  // ========================= NAV: VER DATOS =========================
  function irADatosSensibles(usuario) {
    // Guarda el usuario seleccionado para que la otra vista lo lea
    sessionStorage.setItem("usuario_sensible", JSON.stringify(usuario));
  
    // Redirige a la vista única de datos sensibles
    location.href = "/html/Recepcionista/DatosSensibles.html";
  }
  

  // ========================= RENDER =========================
  function render() {
    $("txtConteo").textContent = `Mostrando ${usuarios.length} resultados`;

    const tbody = $("tbodyUsuarios");
    tbody.innerHTML = "";

    const fuente = usuariosFiltrados ?? usuarios;
    $("txtConteo").textContent = `Mostrando ${fuente.length} resultados`;
    fuente.forEach((u) => {
      const tr = document.createElement("tr");

      const checkTd = document.createElement("td");
      checkTd.className = "col-check";
      checkTd.innerHTML = deleteMode
        ? `<input class="chk" type="checkbox" data-rowcheck="1" data-id="${u.idUsuario}" />`
        : "";

      tr.appendChild(checkTd);

      tr.innerHTML += `
        <td>${u.idUsuario}</td>
        <td>${u.nombre}</td>
        <td><span class="type-pill">${u.tipo}</span></td>
        <td>
          <button class="action-btn" type="button" data-action="ver" data-id="${u.idUsuario}">
            Ver datos
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // checks (modo eliminar)
    if (deleteMode) {
      document.querySelectorAll('input[data-rowcheck="1"]').forEach((ch) => {
        ch.addEventListener("change", updateDeleteButtons);
      });

      $("checkAll").onchange = () => {
        const all = $("checkAll").checked;
        document.querySelectorAll('input[data-rowcheck="1"]').forEach((ch) => (ch.checked = all));
        updateDeleteButtons();
      };

      updateDeleteButtons();
    }

    // Ver datos
    tbody.querySelectorAll('[data-action="ver"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const user = usuarios.find(x => x.idUsuario === id);
        if (!user) return;

        // Aquí puedes enriquecer el objeto con más campos si los tienes
        irADatosSensibles(user);
      });
    });

  }

  // ========================= EVENTOS =========================
  $("btnRegistrar").addEventListener("click", () => (location.href = "/html/CrearCuenta.html"));

  $("btnModoEliminar").addEventListener("click", () => setDeleteMode(!deleteMode));
  $("btnSalirEliminar").addEventListener("click", () => setDeleteMode(false));

  $("btnEliminarSeleccionados").addEventListener("click", () => {
    const ids = selectedIds();
    if (ids.length === 0) return;

    // Requisito: ya NO hay modal de políticas, ahora se redirige a EliminarCuenta
    // Si quieres pasar IDs, usualmente se mandan por querystring:
    // /html/EliminarCuenta.html?ids=1001,2001
    const qs = encodeURIComponent(ids.join(","));
    location.href = `/html/EliminarCuenta.html?ids=${qs}`;
  });

  // Escape cierra modal
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("modal").hidden) closeModal();
  });

  // Filtro usuarios
    $("btnFiltrarUsuarios").addEventListener("click", () => {
    aplicarFiltroUsuarios();
    toast("Filtro aplicado.");
  });
  
  $("btnLimpiarFiltroUsuarios").addEventListener("click", () => {
    limpiarFiltroUsuarios();
    toast("Filtro limpiado.");
  });
  

  // ========================= INIT =========================
  render();
})();
