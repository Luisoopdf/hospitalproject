// Datos de selección
const seleccion = {
    especialidadClave: "",
    especialidadNombre: "",
    especialidadPrecio: 0,
    doctorNombre: "",
    consultorio: "",
    fecha: "",
    horario: "",
    folio: ""
};

// Doctores por especialidad (mínimo 4 por cada una)
const doctoresPorEspecialidad = {
    cardiologia: [
        { id: "C1", nombre: "Dr. Cardio 1", consultorio: "101" },
        { id: "C2", nombre: "Dr. Cardio 2", consultorio: "102" },
        { id: "C3", nombre: "Dra. Cardio 3", consultorio: "103" },
        { id: "C4", nombre: "Dra. Cardio 4", consultorio: "104" }
    ],
    dermatologia: [
        { id: "D1", nombre: "Dr. Derma 1", consultorio: "201" },
        { id: "D2", nombre: "Dra. Derma 2", consultorio: "202" },
        { id: "D3", nombre: "Dr. Derma 3", consultorio: "203" },
        { id: "D4", nombre: "Dra. Derma 4", consultorio: "204" }
    ],
    ginecologia: [
        { id: "G1", nombre: "Dra. Gine 1", consultorio: "301" },
        { id: "G2", nombre: "Dra. Gine 2", consultorio: "302" },
        { id: "G3", nombre: "Dra. Gine 3", consultorio: "303" },
        { id: "G4", nombre: "Dra. Gine 4", consultorio: "304" }
    ],
    medicina_general: [
        { id: "M1", nombre: "Dr. Med Gral 1", consultorio: "401" },
        { id: "M2", nombre: "Dra. Med Gral 2", consultorio: "402" },
        { id: "M3", nombre: "Dr. Med Gral 3", consultorio: "403" },
        { id: "M4", nombre: "Dra. Med Gral 4", consultorio: "404" }
    ],
    nefrologia: [
        { id: "N1", nombre: "Dr. Nefro 1", consultorio: "501" },
        { id: "N2", nombre: "Dra. Nefro 2", consultorio: "502" },
        { id: "N3", nombre: "Dr. Nefro 3", consultorio: "503" },
        { id: "N4", nombre: "Dra. Nefro 4", consultorio: "504" }
    ],
    nutriologia: [
        { id: "NU1", nombre: "Lic. Nutri 1", consultorio: "601" },
        { id: "NU2", nombre: "Lic. Nutri 2", consultorio: "602" },
        { id: "NU3", nombre: "Lic. Nutri 3", consultorio: "603" },
        { id: "NU4", nombre: "Lic. Nutri 4", consultorio: "604" }
    ],
    oftalmologia: [
        { id: "O1", nombre: "Dr. Oftalmo 1", consultorio: "701" },
        { id: "O2", nombre: "Dra. Oftalmo 2", consultorio: "702" },
        { id: "O3", nombre: "Dr. Oftalmo 3", consultorio: "703" },
        { id: "O4", nombre: "Dra. Oftalmo 4", consultorio: "704" }
    ],
    oncologia: [
        { id: "ON1", nombre: "Dr. Onco 1", consultorio: "801" },
        { id: "ON2", nombre: "Dra. Onco 2", consultorio: "802" },
        { id: "ON3", nombre: "Dr. Onco 3", consultorio: "803" },
        { id: "ON4", nombre: "Dra. Onco 4", consultorio: "804" }
    ],
    ortopedia: [
        { id: "OR1", nombre: "Dr. Ortopedia 1", consultorio: "901" },
        { id: "OR2", nombre: "Dra. Ortopedia 2", consultorio: "902" },
        { id: "OR3", nombre: "Dr. Ortopedia 3", consultorio: "903" },
        { id: "OR4", nombre: "Dra. Ortopedia 4", consultorio: "904" }
    ],
    pediatria: [
        { id: "P1", nombre: "Dr. Pediatra 1", consultorio: "1001" },
        { id: "P2", nombre: "Dra. Pediatra 2", consultorio: "1002" },
        { id: "P3", nombre: "Dr. Pediatra 3", consultorio: "1003" },
        { id: "P4", nombre: "Dra. Pediatra 4", consultorio: "1004" }
    ]
};

// Paneles
const panelEspecialidad = document.getElementById("panel-especialidad");
const panelDoctor = document.getElementById("panel-doctor");
const panelFecha = document.getElementById("panel-fecha");
const panelHorario = document.getElementById("panel-horario");
const panelResumen = document.getElementById("panel-resumen");

// Cambiar panel visible
function mostrarPanel(panel) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    panel.classList.remove("hidden");
}

// Selección de especialidad
const tarjetasEspecialidad = document.querySelectorAll(".especialidad-card");
let tarjetaSeleccionada = null;

tarjetasEspecialidad.forEach(card => {
    card.addEventListener("click", () => {
        tarjetasEspecialidad.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        tarjetaSeleccionada = card;
    });
});

// Paso 1: Especialidad → Doctores
document.getElementById("btn-especialidad").addEventListener("click", () => {
    if (!tarjetaSeleccionada) {
        alert("Por favor selecciona una especialidad.");
        return;
    }

    seleccion.especialidadClave = tarjetaSeleccionada.dataset.clave;
    seleccion.especialidadNombre = tarjetaSeleccionada.dataset.nombrenombre || tarjetaSeleccionada.dataset.nombre;
    seleccion.especialidadPrecio = parseFloat(tarjetaSeleccionada.dataset.precio || "0");

    const listaDoctores = doctoresPorEspecialidad[seleccion.especialidadClave] || [];

    const selectDoctor = document.getElementById("select-doctor");
    selectDoctor.innerHTML = '<option value="">Seleccione un doctor</option>';

    listaDoctores.forEach(doc => {
        const opt = document.createElement("option");
        opt.value = doc.id;
        opt.dataset.nombre = doc.nombre;
        opt.dataset.consultorio = doc.consultorio;
        opt.textContent = `${doc.nombre} - Consultorio ${doc.consultorio}`;
        selectDoctor.appendChild(opt);
    });

    mostrarPanel(panelDoctor);
});

document.getElementById("back-to-especialidad").addEventListener("click", () => {
    mostrarPanel(panelEspecialidad);
});

// Paso 2: Doctor → Fecha
document.getElementById("btn-doctor").addEventListener("click", () => {
    const selectDoctor = document.getElementById("select-doctor");
    const opcion = selectDoctor.options[selectDoctor.selectedIndex];

    if (!opcion.value) {
        alert("Selecciona un doctor.");
        return;
    }

    seleccion.doctorNombre = opcion.dataset.nombre;
    seleccion.consultorio = opcion.dataset.consultorio;

    mostrarPanel(panelFecha);
});

document.getElementById("back-to-doctor").addEventListener("click", () => {
    mostrarPanel(panelDoctor);
});

// Paso 3: Fecha → Horario
document.getElementById("btn-fecha").addEventListener("click", () => {
    const fechaInput = document.getElementById("fecha-cita");
    if (!fechaInput.value) {
        alert("Selecciona una fecha disponible.");
        return;
    }

    seleccion.fecha = fechaInput.value;

    mostrarPanel(panelHorario);
});

document.getElementById("back-to-fecha").addEventListener("click", () => {
    mostrarPanel(panelFecha);
});

// Paso 4: Horario → Comprobante
document.getElementById("btn-horario").addEventListener("click", () => {
    const horarioSel = document.querySelector('input[name="horario"]:checked');
    if (!horarioSel) {
        alert("Selecciona un horario disponible.");
        return;
    }

    seleccion.horario = horarioSel.dataset.rango;

    const now = new Date();
    seleccion.folio =
        "FOL-" +
        now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        "-" +
        now.getTime().toString().slice(-4);

    document.getElementById("res-folio").textContent = seleccion.folio;
    document.getElementById("res-especialidad").textContent = seleccion.especialidadNombre;
    document.getElementById("res-doctor").textContent = seleccion.doctorNombre;
    document.getElementById("res-consultorio").textContent = seleccion.consultorio;
    document.getElementById("res-fecha").textContent = seleccion.fecha;
    document.getElementById("res-horario").textContent = seleccion.horario;
    document.getElementById("res-monto").value = seleccion.especialidadPrecio.toFixed(2) + " MXN";

    mostrarPanel(panelResumen);
});

document.getElementById("back-to-horario").addEventListener("click", () => {
    mostrarPanel(panelHorario);
});

// Paso 5: Confirmar cita
document.getElementById("btn-confirmar").addEventListener("click", () => {
    alert("Cita confirmada correctamente.");
});
