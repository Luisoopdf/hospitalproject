(function () {
  const $ = (id) => document.getElementById(id);

  // Topbar botones (funcionalidad exacta)
  $("btnLogout").addEventListener("click", () => {
    location.href = "/index.html";
  });

  $("btnVolverPerfil").addEventListener("click", () => {
    location.href = "/html/Paciente/HomePaciente.html";
  });

  // Botones de volver/cancelar (mejor: volver a la página anterior)
  const goBack = () => window.history.back();

  $("btnCancelar").addEventListener("click", goBack);

  // Selección de método
  const cards = Array.from(document.querySelectorAll(".pay-card"));
  const radios = Array.from(document.querySelectorAll('input[name="metodo"]'));

  function setSelected(method) {
    cards.forEach((c) => c.classList.toggle("is-selected", c.dataset.method === method));
  }

  // Default
  setSelected("card");

  radios.forEach((r) => {
    r.addEventListener("change", () => setSelected(r.value));
  });

  // Mostrar nombre de archivo de comprobante
  const fileProof = $("fileProof");
  const fileName = $("fileName");

  fileProof.addEventListener("change", () => {
    const f = fileProof.files?.[0];
    fileName.textContent = f ? f.name : "No se ha seleccionado archivo";
  });

  // Validación mínima demo
  const btnConfirmar = $("btnConfirmar");
  const toast = $("toast");

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.hidden = true), 2200);
  }

  function getSelectedMethod() {
    const checked = radios.find(r => r.checked);
    return checked ? checked.value : "card";
  }

  function validate() {
    const method = getSelectedMethod();

    if (method === "card") {
      const ok =
        $("cardNumber").value.trim().length >= 12 &&
        $("cardExp").value.trim().length >= 4 &&
        $("cardCvv").value.trim().length >= 3 &&
        $("cardName").value.trim().length >= 3;

      btnConfirmar.disabled = !ok;
      return;
    }

    // transfer
    const f = fileProof.files?.[0];
    btnConfirmar.disabled = !f;
  }

  // Inputs -> validar
  ["cardNumber", "cardExp", "cardCvv", "cardName", "cardBank"].forEach((id) => {
    $(id).addEventListener("input", validate);
    $(id).addEventListener("change", validate);
  });
  fileProof.addEventListener("change", validate);
  radios.forEach((r) => r.addEventListener("change", validate));

  // Confirmar (demo)
  btnConfirmar.addEventListener("click", () => {
    const method = getSelectedMethod();
    showToast(`Pago confirmado (demo) vía: ${method === "card" ? "Tarjeta" : "Transferencia"}.`);
    // Futuro:
    // fetch("/api/pagos/confirmar", { method:"POST", body: ... })
  });

  // Init
  validate();
})();
