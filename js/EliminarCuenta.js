(function () {
  const $ = (id) => document.getElementById(id);

  // Topbar botones (funcionalidad EXACTA que indicaste)
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });

  // UI Eliminar
  const pass1 = $("pass1");
  const pass2 = $("pass2");
  const err = $("err");

  const btnCancelar = $("btnCancelar");
  const btnEliminar = $("btnEliminar");
  const form = $("formEliminar");

  const toggle1 = $("toggle1");
  const toggle2 = $("toggle2");

  function toggleVisibility(input) {
    input.type = input.type === "password" ? "text" : "password";
  }

  toggle1.addEventListener("click", () => toggleVisibility(pass1));
  toggle2.addEventListener("click", () => toggleVisibility(pass2));

  function validar() {
    const a = (pass1.value || "").trim();
    const b = (pass2.value || "").trim();

    const ok = a.length > 0 && b.length > 0 && a === b;
    err.hidden = ok || (a.length === 0 && b.length === 0);
    btnEliminar.disabled = !ok;
  }

  pass1.addEventListener("input", validar);
  pass2.addEventListener("input", validar);

  btnCancelar.addEventListener("click", () => {             
    window.history.back();
  });

  // Demo: aquí luego será fetch al backend
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Si no coincide, no deja
    validar();
    if (btnEliminar.disabled) return;

    // Demo visual:
    const toast = $("toast");
    toast.textContent = "Solicitud de eliminación enviada (demo).";
    toast.hidden = false;
    setTimeout(() => (toast.hidden = true), 2200);

    // En el futuro:
    // fetch("/api/paciente/eliminar", { method:"POST", body: JSON.stringify({ password: pass1.value }) })
  });

  validar();
})();
