(function () {
    'use strict';

    /* ---- Referencias a elementos y estados básicos ---- */
    const MAX_PHONES = 5;

    const formEl = document.querySelector('form');
    const toastContainer = document.getElementById('toast-container');

    const step1El = document.getElementById('step1');
    const medInfo = document.getElementById('medInfo');
    const extraInfo = document.getElementById('extraInfo');
    const recepInfo = document.getElementById('recepInfo');

    const siguienteBtn = document.getElementById('siguienteBtn');
    const medNextBtn = document.getElementById('medNextBtn');

    const telefonosEl = document.getElementById('telefonos');
    const agregarBtn = document.getElementById('agregarTelefonoBtn');

    const curpEl = document.getElementById('curp');
    const nombresEl = document.getElementById('nombres');
    const apPaternoEl = document.getElementById('apPaterno');
    const apMaternoEl = document.getElementById('apMaterno');
    const fechaEl = document.getElementById('fechaNac');
    const generoEl = document.getElementById('genero');
    const legendEl = document.querySelector('form fieldset legend');

    const pesoEl = document.getElementById('peso');
    const estaturaEl = document.getElementById('estatura');
    const tipoSangreEl = document.getElementById('tipoSangre');

    const claveRegistroEl = document.getElementById('claveRegistro');

    const btnRegresar = document.getElementById('btnRegresar');
    const btnRegresar2 = document.getElementById('btnRegresar2');

    let step = 1;
    const warnedDuplicates = new Set();



    /* ---- Funciones de UI: toasts, errores y rol ---- */

    function showToast(message, type = 'error') {
        const container = toastContainer || document.body;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-msg">${message}</div>
            <button class="toast-close" aria-label="Cerrar">✕</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            hideToast(toast);
        });

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => hideToast(toast), 4200);
    }

    function hideToast(toast) {
        if (!toast || !toast.parentElement) return;
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    function markInvalid(el) {
        if (!el) return;
        el.classList.add('invalid');
        el.setAttribute('aria-invalid', 'true');
    }

    function clearInvalid(el) {
        if (!el) return;
        el.classList.remove('invalid');
        el.removeAttribute('aria-invalid');
    }

    function getRole() {
        const checked = document.querySelector('input[name="rol"]:checked');
        return checked ? checked.value : null;
    }



    /* ---- Teléfonos: agregar, validar y duplicados ---- */

    function getPhoneInputs() {
        return Array.from(telefonosEl.querySelectorAll('input[name="telefono[]"]'));
    }

    function updatePhonesUI() {
        const inputs = getPhoneInputs();
        const counts = new Map();

        inputs.forEach(input => {
            input.classList.remove('duplicate');
            input.setCustomValidity('');
            clearInvalid(input);

            const value = input.value.trim();
            if (value) counts.set(value, (counts.get(value) || 0) + 1);
        });

        const duplicates = Array.from(counts.entries())
            .filter(([_, count]) => count > 1)
            .map(([value]) => value);

        duplicates.forEach(value => {
            if (!warnedDuplicates.has(value)) {
                showToast('Número de teléfono ya ingresado', 'error');
                warnedDuplicates.add(value);
            }
        });

        Array.from(warnedDuplicates).forEach(value => {
            if (!duplicates.includes(value)) warnedDuplicates.delete(value);
        });

        inputs.forEach(input => {
            const value = input.value.trim();
            if (value && counts.get(value) > 1) {
                input.classList.add('duplicate');
                markInvalid(input);
                input.setCustomValidity('Número repetido');
            }
        });

        if (agregarBtn) {
            agregarBtn.disabled = duplicates.length > 0 || inputs.length >= MAX_PHONES;
        }

        return duplicates.length === 0;
    }

    function validatePhonesBeforeContinue() {
        const inputs = getPhoneInputs();
        const hasAnyPhone = inputs.some(i => i.value.trim() !== '');

        if (!hasAnyPhone) {
            showToast('Ingresa al menos un número de teléfono.', 'error');
            markInvalid(inputs[0]);
            inputs[0].focus();
            return false;
        }

        if (!updatePhonesUI()) {
            showToast('Corrige los teléfonos antes de continuar.', 'error');
            return false;
        }

        return true;
    }

    function addPhone() {
        const inputs = getPhoneInputs();

        if (inputs.length >= MAX_PHONES) {
            showToast(`Máximo ${MAX_PHONES} teléfonos.`, 'error');
            return;
        }

        const firstEmpty = inputs.find(i => i.value.trim() === '');
        if (firstEmpty) {
            showToast('Completa el teléfono pendiente antes de agregar otro.', 'error');
            markInvalid(firstEmpty);
            firstEmpty.focus();
            return;
        }

        if (!updatePhonesUI()) {
            showToast('Corrige los teléfonos antes de agregar otro.', 'error');
            return;
        }

        const row = document.createElement('div');
        row.className = 'telefono-input';
        row.innerHTML = `
            <input type="text" name="telefono[]" placeholder="Número de teléfono" required>
            <button type="button" class="btn-icon" onclick="eliminar(this)">×</button>
        `;

        telefonosEl.appendChild(row);
        row.querySelector('input').focus();
        updatePhonesUI();
    }

    function removePhoneRow(rowEl) {
        const rows = telefonosEl.querySelectorAll('.telefono-input');

        if (rows.length <= 1) {
            const input = rowEl.querySelector('input');
            input.value = '';
            clearInvalid(input);
            input.setCustomValidity('');
            input.focus();
        } else {
            rowEl.remove();
        }

        updatePhonesUI();
    }



    /* ---- Mostrar/Ocultar secciones según paso y rol ---- */

    function updateRequiredFields() {
        const medVisible = medInfo && !medInfo.classList.contains('hidden');
        const recepVisible = recepInfo && !recepInfo.classList.contains('hidden');

        if (pesoEl) pesoEl.required = medVisible;
        if (estaturaEl) estaturaEl.required = medVisible;
        if (tipoSangreEl) tipoSangreEl.required = medVisible;

        if (claveRegistroEl) claveRegistroEl.required = recepVisible;
    }

    function showStepSections() {
        const role = getRole();

        if (legendEl) legendEl.classList.toggle('hidden', step !== 1);

        if (step === 1) {
            step1El.classList.remove('hidden');
            medInfo.classList.add('hidden');
            extraInfo.classList.add('hidden');
            recepInfo.classList.add('hidden');
        }

        if (step === 2) {
            step1El.classList.add('hidden');

            if (role === 'Paciente') {
                medInfo.classList.remove('hidden');
                extraInfo.classList.add('hidden');
                recepInfo.classList.add('hidden');
            }

            if (role === 'Recepcion') {
                medInfo.classList.add('hidden');
                extraInfo.classList.add('hidden');
                recepInfo.classList.remove('hidden');
            }
        }

        if (step === 3) {
            step1El.classList.add('hidden');
            medInfo.classList.add('hidden');
            recepInfo.classList.add('hidden');
            extraInfo.classList.remove('hidden');
        }

        btnRegresar.classList.toggle('hidden', step !== 2);
        btnRegresar2.classList.toggle('hidden', step !== 3);

        updateRequiredFields();
    }



    /* ---- Validaciones por paso ---- */

    function validateStep1() {
        if (!curpEl.value.trim()) {
            showToast('Ingresa tu CURP.', 'error');
            markInvalid(curpEl);
            curpEl.focus();
            return false;
        }

        if (!nombresEl.value.trim()) {
            showToast('Ingresa tu nombre.', 'error');
            markInvalid(nombresEl);
            nombresEl.focus();
            return false;
        }

        if (!apPaternoEl.value.trim()) {
            showToast('Ingresa tu apellido paterno.', 'error');
            markInvalid(apPaternoEl);
            apPaternoEl.focus();
            return false;
        }

        if (!fechaEl.value) {
            showToast('Ingresa tu fecha de nacimiento.', 'error');
            markInvalid(fechaEl);
            fechaEl.focus();
            return false;
        }

        const fechaSel = new Date(fechaEl.value);
        const hoy = new Date(); hoy.setHours(0,0,0,0);

        if (fechaSel > hoy || isNaN(fechaSel)) {
            showToast('La fecha de nacimiento no es válida.', 'error');
            markInvalid(fechaEl);
            fechaEl.focus();
            return false;
        }

        if (!generoEl.value) {
            showToast('Selecciona un género.', 'error');
            markInvalid(generoEl);
            generoEl.focus();
            return false;
        }

        if (!validatePhonesBeforeContinue()) return false;

        if (!getRole()) {
            showToast('Selecciona Paciente o Recepción.', 'error');
            return false;
        }

        return true;
    }

    function validateMedInfo() {
        if (!pesoEl.value.trim() || !estaturaEl.value.trim() || !tipoSangreEl.value) {
            showToast('Completa la información médica.', 'error');

            if (!pesoEl.value.trim()) markInvalid(pesoEl);
            if (!estaturaEl.value.trim()) markInvalid(estaturaEl);
            if (!tipoSangreEl.value) markInvalid(tipoSangreEl);

            return false;
        }

        return true;
    }

    function validateRecepInfo() {
        if (!claveRegistroEl) return true;

        if (!claveRegistroEl.value.trim()) {
            showToast('Ingresa la clave de autorización dada por la institución.', 'error');
            markInvalid(claveRegistroEl);
            claveRegistroEl.focus();
            return false;
        }

        return true;
    }



    /* ---- Flujo entre pasos (Siguiente, Regresar, Enviar) ---- */

    function goNextFromStep1() {
        if (!validateStep1()) return;

        step = 2;
        const role = getRole();

        showStepSections();

        const target = role === 'Paciente' ? medInfo : recepInfo;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function goNextFromStep2() {
        const role = getRole();

        if (role === 'Paciente') {
            if (!validateMedInfo()) return;

            step = 3;
            showStepSections();
            extraInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (role === 'Recepcion') {
            if (!validateRecepInfo()) return;

            formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
        }
    }

    function sendFormIfPossible() {
        if (!updatePhonesUI()) {
            showToast('Corrige los teléfonos antes de enviar.', 'error');
            return;
        }

        if (!getRole()) {
            showToast('Selecciona Paciente o Recepción.', 'error');
            return;
        }

        formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
    }

    function goBack() {
        if (step === 2) {
            step = 1;
            showStepSections();
            step1El.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (step === 3) {
            step = 2;
            showStepSections();

            const role = getRole();
            const target = role === 'Paciente' ? medInfo : recepInfo;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }



    /* ---- Eventos principales ---- */

    if (siguienteBtn) {
        siguienteBtn.addEventListener('click', () => {
            if (step === 1) goNextFromStep1();
            else if (step === 2) goNextFromStep2();
            else sendFormIfPossible();
        });
    }

    if (medNextBtn) {
        medNextBtn.addEventListener('click', () => {
            if (getRole() !== 'Paciente') return;
            if (!validateMedInfo()) return;

            step = 3;
            showStepSections();
            extraInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    document.querySelectorAll('input[name="rol"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (step === 1) {
                medInfo.classList.add('hidden');
                extraInfo.classList.add('hidden');
                recepInfo.classList.add('hidden');
                step1El.classList.remove('hidden');
            }
            showStepSections();
        });
    });



    /* ---- Limpieza de errores al escribir ---- */

    const clearIds = [
        'curp', 'nombres', 'apPaterno', 'apMaterno',
        'fechaNac', 'genero', 'peso', 'estatura',
        'tipoSangre', 'claveRegistro'
    ];

    clearIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => clearInvalid(el));
        el.addEventListener('change', () => clearInvalid(el));
    });

    document.addEventListener('input', (e) => {
        const t = e.target;

        if (t.matches('input[name="alergias[]"], input[name="antecedentes[]"]')) {
            clearInvalid(t);
        }

        if (t.matches('input[name="telefono[]"]')) {
            t.value = t.value.replace(/\s+/g, ' ').trimStart();
            clearInvalid(t);
            updatePhonesUI();
        }
    });



    /* ---- Envío final del formulario ---- */

    if (formEl) {
        formEl.addEventListener('submit', (ev) => {
            const role = getRole();

            if (!role) {
                ev.preventDefault();
                showToast('Selecciona Paciente o Recepción.', 'error');
                return;
            }

            if (role === 'Recepcion') {
                if (!validateRecepInfo()) ev.preventDefault();
                return;
            }

            if (!updatePhonesUI()) {
                ev.preventDefault();
                showToast('Corrige los teléfonos antes de enviar.', 'error');
                return;
            }
        });
    }



    /* ---- Listas dinámicas: agregar y eliminar ---- */

    function addListItem(listId, placeholder) {
        const list = document.getElementById(listId);
        if (!list) return;

        const baseName = listId.replace('-list', '');
        const inputName = `${baseName}[]`;

        const div = document.createElement('div');
        div.className = 'list-input';
        div.innerHTML = `
            <input type="text" name="${inputName}" placeholder="${placeholder}">
            <button type="button" class="btn-icon" aria-label="Eliminar">×</button>
        `;

        list.appendChild(div);

        div.querySelector('button').addEventListener('click', () => {
            removeListItem(listId, div);
        });

        div.querySelector('input').focus();
    }

    function removeListItem(listId, itemEl) {
        const list = document.getElementById(listId);
        const items = list.querySelectorAll('.list-input');

        if (items.length <= 1) {
            const input = itemEl.querySelector('input');
            input.value = '';
        } else {
            itemEl.remove();
        }
    }



    /* ---- Funciones globales para onclick del HTML ---- */

    window.agregar = () => addPhone();
    window.eliminar = btn => removePhoneRow(btn.closest('.telefono-input'));

    window.agregarAlergia = () => addListItem('alergias-list', 'Alergia');
    window.eliminarAlergia = btn => removeListItem('alergias-list', btn.closest('.list-input'));

    window.agregarAntecedente = () => addListItem('antecedentes-list', 'Antecedente médico');
    window.eliminarAntecedente = btn => removeListItem('antecedentes-list', btn.closest('.list-input'));

    window.agregarEnfermedad = () => addListItem('enfermedades-list', 'Enfermedad');
    window.eliminarEnfermedad = btn => removeListItem('enfermedades-list', btn.closest('.list-input'));



    /* ---- Inicialización al cargar la página ---- */

    document.addEventListener('DOMContentLoaded', () => {
        updatePhonesUI();
        showStepSections();
    });

    if (btnRegresar) btnRegresar.addEventListener('click', goBack);
    if (btnRegresar2) btnRegresar2.addEventListener('click', goBack);

})();
