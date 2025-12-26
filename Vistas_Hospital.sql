USE HOSPITAL

/* Vista general para LOGIN (todos los roles)
Esto sirve para que, después de validar correo + password, saber quién es y qué rol tienen*/

IF OBJECT_ID('VW_Usuario_Login', 'V') IS NOT NULL
    DROP VIEW VW_Usuario_Login;
GO

CREATE VIEW VW_Usuario_Login AS
SELECT
    U.Id_Usuario,
    U.CURP,
    U.Correo,
    U.Password,
    R.Id_Rol,
    R.Rol,
    P.Nombre,
    P.Paterno,
    P.Materno,
    P.Nacimiento,
    P.Genero
FROM Usuario U
JOIN RolUsuario R  ON U.Id_Rol = R.Id_Rol
JOIN Persona P     ON U.CURP    = P.CURP;
GO

--Invocación
SELECT * from VW_Usuario_Login 

/*  VISTAS PARA PACIENTE
El paciente debe poder:
Ver sus datos personales
Ver su historial médico
Ver su historial de citas

1.1 Datos personales del paciente
Usa Paciente → Usuario → Persona → Telefono.*/
IF OBJECT_ID('VW_Paciente_DatosPersonales', 'V') IS NOT NULL
    DROP VIEW VW_Paciente_DatosPersonales;
GO

CREATE VIEW VW_Paciente_DatosPersonales AS
SELECT
    Pa.Id_Paciente,
    U.Id_Usuario,
    P.CURP,
    P.Nombre,
    P.Paterno,
    P.Materno,
    P.Nacimiento,
    P.Genero,
    U.Correo,
    T.NoTelefono
FROM Paciente Pa
JOIN Usuario U   ON Pa.Id_Usuario = U.Id_Usuario
JOIN Persona P   ON U.CURP        = P.CURP
LEFT JOIN Telefono T ON P.CURP    = T.CURP;
GO

--Uso típico
SELECT * FROM VW_Paciente_DatosPersonales WHERE Id_Usuario = 1;



/*  1.2 Historial médico del paciente
Usa HistorialMedico, Alergias, Enfermedades, Antecedentes.
Concateno cada lista en una sola columna con STUFF(... FOR XML PATH('')).   */
IF OBJECT_ID('VW_Paciente_HistorialMedico', 'V') IS NOT NULL
    DROP VIEW VW_Paciente_HistorialMedico;
GO

CREATE VIEW VW_Paciente_HistorialMedico AS
SELECT
    Pa.Id_Paciente,
    P.Nombre + ' ' + P.Paterno AS Nombre_Paciente,
    HM.Id_HistorialMedico,
    HM.Peso,
    HM.TipoSangre,
    HM.Estatura,
    -- Alergias en una sola cadena
    Alergias = STUFF((
        SELECT ', ' + A.TipoAlergia
        FROM Alergias A
        WHERE A.Id_HistorialMedico = HM.Id_HistorialMedico
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''),
    -- Enfermedades
    Enfermedades = STUFF((
        SELECT ', ' + E.EnfermedadDescripcion
        FROM (
            SELECT DescripcionEnfermedad AS EnfermedadDescripcion
            FROM Enfermedades E2
            WHERE E2.Id_HistorialMedico = HM.Id_HistorialMedico
        ) E
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''),
    -- Antecedentes
    Antecedentes = STUFF((
        SELECT ', ' + AN.DescripcionAntecedente
        FROM Antecedentes AN
        WHERE AN.Id_HistorialMedico = HM.Id_HistorialMedico
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, '')
FROM HistorialMedico HM
JOIN Paciente Pa ON HM.Id_Paciente = Pa.Id_Paciente
JOIN Usuario U   ON Pa.Id_Usuario  = U.Id_Usuario
JOIN Persona P   ON U.CURP         = P.CURP;
GO


SELECT * FROM VW_Paciente_HistorialMedico;
SELECT * FROM VW_Paciente_HistorialMedico WHERE Id_Paciente = 3;



/*  1.3 Historial de citas del paciente
Usa Cita, Doctor, Especialidad, Consultorio, PagoCita, etc.*/
IF OBJECT_ID('VW_Paciente_HistorialCitas', 'V') IS NOT NULL
    DROP VIEW VW_Paciente_HistorialCitas;
GO

CREATE VIEW VW_Paciente_HistorialCitas AS
SELECT
    C.Id_Cita,
    Pa.Id_Paciente,
    P.Nombre + ' ' + P.Paterno AS Nombre_Paciente,
    C.Fecha_Agendada,
    C.Fecha_Cita,
    C.Hora_I,
    C.Hora_F,
    C.EstatusCita,
    D.Ced_Profesional,
    PD.Nombre + ' ' + PD.Paterno AS Nombre_Doctor,
    E.NombreEspecialidad,
    E.Costo      AS Costo_Especialidad,
    Con.Piso,
    Con.Edificio,
    PC.Monto     AS Monto_Pagado,
    PC.Fecha_Pago
FROM Cita C
JOIN Paciente Pa     ON C.Id_Paciente      = Pa.Id_Paciente
JOIN Usuario U       ON Pa.Id_Usuario      = U.Id_Usuario
JOIN Persona P       ON U.CURP             = P.CURP
JOIN Doctor D        ON C.Ced_Profesional  = D.Ced_Profesional
JOIN Empleado ED     ON D.Id_Empleado      = ED.Id_Empleado
JOIN Usuario UD      ON ED.Id_Usuario      = UD.Id_Usuario
JOIN Persona PD      ON UD.CURP            = PD.CURP
JOIN Especialidad E  ON D.Id_Especialidad  = E.Id_Especialidad
JOIN Consultorio Con ON D.Id_Consultorio   = Con.Id_Consultorio
LEFT JOIN PagoCita PC ON C.Id_Cita         = PC.Id_Cita;
GO

SELECT * FROM VW_Paciente_HistorialCitas;
SELECT * FROM VW_Paciente_HistorialCitas WHERE Id_Paciente = 3;


/*  2️. VISTAS PARA RECEPCIONISTA
Recepcionista puede:
Crear cuentas de Pacientes, Doctores, Recepcionistas y Farmacéuticos
Ver citas, estatus y bitácoras de cita

2.1 Listado de Pacientes*/

IF OBJECT_ID('VW_Recepcionista_Pacientes', 'V') IS NOT NULL
    DROP VIEW VW_Recepcionista_Pacientes;
GO

CREATE VIEW VW_Recepcionista_Pacientes AS
SELECT
    Pa.Id_Paciente,
    U.Id_Usuario,
    P.CURP,
    P.Nombre,
    P.Paterno,
    P.Materno,
    P.Nacimiento,
    P.Genero,
    U.Correo
FROM Paciente Pa
JOIN Usuario U ON Pa.Id_Usuario = U.Id_Usuario
JOIN Persona P ON U.CURP        = P.CURP;
GO

SELECT * FROM VW_Recepcionista_Pacientes;



--2.2 Listado de Empleados por Rol (Doctores, Recepcionistas, Farmacéuticos)
IF OBJECT_ID('VW_Recepcionista_Empleados', 'V') IS NOT NULL
    DROP VIEW VW_Recepcionista_Empleados;
GO

CREATE VIEW VW_Recepcionista_Empleados AS
SELECT
    E.Id_Empleado,
    U.Id_Usuario,
    R.Rol,
    P.CURP,
    P.Nombre,
    P.Paterno,
    P.Materno,
    E.Salario
FROM Empleado E
JOIN Usuario U     ON E.Id_Usuario = U.Id_Usuario
JOIN RolUsuario R  ON U.Id_Rol     = R.Id_Rol
JOIN Persona P     ON U.CURP       = P.CURP;
GO

SELECT * FROM VW_Recepcionista_Empleados;
SELECT * FROM VW_Recepcionista_Empleados WHERE Rol = 'Doctor';



--2.3 Citas completas (para agendar / cancelar / revisar)
--Muy parecida a la del paciente, pero sin filtrar por paciente:
IF OBJECT_ID('VW_Recepcionista_CitasDetalle', 'V') IS NOT NULL
    DROP VIEW VW_Recepcionista_CitasDetalle;
GO

CREATE VIEW VW_Recepcionista_CitasDetalle AS
SELECT
    C.Id_Cita,
    Pa.Id_Paciente,
    P.Nombre + ' ' + P.Paterno AS Nombre_Paciente,
    D.Ced_Profesional,
    PD.Nombre + ' ' + PD.Paterno AS Nombre_Doctor,
    E.NombreEspecialidad,
    C.Fecha_Agendada,
    C.Fecha_Cita,
    C.Hora_I,
    C.Hora_F,
    C.EstatusCita
FROM Cita C
JOIN Paciente Pa     ON C.Id_Paciente     = Pa.Id_Paciente
JOIN Usuario U       ON Pa.Id_Usuario     = U.Id_Usuario
JOIN Persona P       ON U.CURP            = P.CURP
JOIN Doctor D        ON C.Ced_Profesional = D.Ced_Profesional
JOIN Empleado ED     ON D.Id_Empleado     = ED.Id_Empleado
JOIN Usuario UD      ON ED.Id_Usuario     = UD.Id_Usuario
JOIN Persona PD      ON UD.CURP           = PD.CURP
JOIN Especialidad E  ON D.Id_Especialidad = E.Id_Especialidad;
GO

SELECT * FROM VW_Recepcionista_CitasDetalle;
SELECT * FROM VW_Recepcionista_CitasDetalle WHERE Fecha_Cita = '2025-02-19';



/*  2.4 Bitácora de Cita
Usa BitacoraCita + Cita + Paciente + Doctor + Especialidad.*/
IF OBJECT_ID('VW_Recepcionista_BitacoraCita', 'V') IS NOT NULL
    DROP VIEW VW_Recepcionista_BitacoraCita;
GO

CREATE VIEW VW_Recepcionista_BitacoraCita AS
SELECT
    BC.Id_BitacoraCita,
    BC.Fecha_Confirmacion,
    C.Id_Cita,
    C.EstatusCita,
    Pa.Id_Paciente,
    P.Nombre + ' ' + P.Paterno AS Nombre_Paciente,
    D.Ced_Profesional,
    PD.Nombre + ' ' + PD.Paterno AS Nombre_Doctor,
    E.NombreEspecialidad
FROM BitacoraCita BC
JOIN Cita C        ON BC.Id_Cita        = C.Id_Cita
JOIN Paciente Pa   ON C.Id_Paciente     = Pa.Id_Paciente
JOIN Usuario U     ON Pa.Id_Usuario     = U.Id_Usuario
JOIN Persona P     ON U.CURP            = P.CURP
JOIN Doctor D      ON C.Ced_Profesional = D.Ced_Profesional
JOIN Empleado ED   ON D.Id_Empleado     = ED.Id_Empleado
JOIN Usuario UD    ON ED.Id_Usuario     = UD.Id_Usuario
JOIN Persona PD    ON UD.CURP           = PD.CURP
JOIN Especialidad E ON BC.Id_Especialidad = E.Id_Especialidad;
GO

SELECT * FROM VW_Recepcionista_BitacoraCita;
SELECT * FROM VW_Recepcionista_BitacoraCita WHERE Id_Cita = 12;




/*  3. VISTAS PARA DOCTOR
Doctor puede:
Ver sus citas
Ver estatus y bitácora de sus citas
Ver historial médico de sus pacientes

3.1 Mis citas (del doctor)*/
IF OBJECT_ID('VW_Doctor_MisCitas', 'V') IS NOT NULL
    DROP VIEW VW_Doctor_MisCitas;
GO

CREATE VIEW VW_Doctor_MisCitas AS
SELECT
    C.Id_Cita,
    D.Ced_Profesional,
    PD.Nombre + ' ' + PD.Paterno AS Nombre_Doctor,
    Pa.Id_Paciente,
    P.Nombre + ' ' + P.Paterno AS Nombre_Paciente,
    C.Fecha_Cita,
    C.Hora_I,
    C.Hora_F,
    C.EstatusCita
FROM Cita C
JOIN Doctor D        ON C.Ced_Profesional = D.Ced_Profesional
JOIN Empleado ED     ON D.Id_Empleado     = ED.Id_Empleado
JOIN Usuario UD      ON ED.Id_Usuario     = UD.Id_Usuario
JOIN Persona PD      ON UD.CURP           = PD.CURP
JOIN Paciente Pa     ON C.Id_Paciente     = Pa.Id_Paciente
JOIN Usuario U       ON Pa.Id_Usuario     = U.Id_Usuario
JOIN Persona P       ON U.CURP            = P.CURP;
GO

SELECT * FROM VW_Doctor_MisCitas;
SELECT * FROM VW_Doctor_MisCitas WHERE Ced_Profesional = '345';




/*3.2 Bitácora de citas de mis pacientes
Reutiliza BitacoraCita, pero "vista desde el doctor".*/
IF OBJECT_ID('VW_Doctor_BitacoraCitas', 'V') IS NOT NULL
    DROP VIEW VW_Doctor_BitacoraCitas;
GO

CREATE VIEW VW_Doctor_BitacoraCitas AS
SELECT
    BC.Id_BitacoraCita,
    BC.Fecha_Confirmacion,
    C.Id_Cita,
    C.EstatusCita,
    D.Ced_Profesional,
    PD.Nombre + ' ' + PD.Paterno AS Nombre_Doctor,
    Pa.Id_Paciente,
    P.Nombre + ' ' + P.Paterno AS Nombre_Paciente,
    E.NombreEspecialidad
FROM BitacoraCita BC
JOIN Cita C        ON BC.Id_Cita        = C.Id_Cita
JOIN Doctor D      ON C.Ced_Profesional = D.Ced_Profesional
JOIN Empleado ED   ON D.Id_Empleado     = ED.Id_Empleado
JOIN Usuario UD    ON ED.Id_Usuario     = UD.Id_Usuario
JOIN Persona PD    ON UD.CURP           = PD.CURP
JOIN Paciente Pa   ON C.Id_Paciente     = Pa.Id_Paciente
JOIN Usuario U     ON Pa.Id_Usuario     = U.Id_Usuario
JOIN Persona P     ON U.CURP            = P.CURP
JOIN Especialidad E ON BC.Id_Especialidad = E.Id_Especialidad;
GO

SELECT * FROM VW_Doctor_BitacoraCitas;
SELECT * FROM VW_Doctor_BitacoraCitas WHERE Ced_Profesional = '12345';


/*  3.3 Historial médico de mis pacientes
Aquí el doctor puede reutilizar la vista de paciente:*/
-- No hace falta nueva vista: el Doctor consulta
SELECT * FROM VW_Paciente_HistorialMedico WHERE Id_Paciente = 1;


/*  4️. VISTAS PARA FARMACÉUTICO

Farmacéutico puede:
Ver stock
Ver ticket y su detalle

4.1 Inventario para farmacia
Usa Inventario.*/
IF OBJECT_ID('VW_Farmaceutico_Inventario', 'V') IS NOT NULL
    DROP VIEW VW_Farmaceutico_Inventario;
GO

CREATE VIEW VW_Farmaceutico_Inventario AS
SELECT
    I.Id_Producto,
    I.Nombre_Producto,
    I.Stock,
    I.Disponibilidad,
    I.Precio_Producto,
    I.Status_Receta,
    CASE 
        WHEN I.Stock <= 0 THEN 'Sin stock'
        WHEN I.Stock <= 10 THEN 'Stock bajo'
        ELSE 'Stock suficiente'
    END AS Estado_Stock
FROM Inventario I;
GO


SELECT * FROM VW_Farmaceutico_Inventario;
SELECT * FROM VW_Farmaceutico_Inventario WHERE Estado_Stock = 'Stock bajo';



/*4.2 Tickets (cabecera)
Usa Ticket + Farmaceutico + Empleado + Usuario + Persona.*/
IF OBJECT_ID('VW_Farmaceutico_Tickets', 'V') IS NOT NULL
    DROP VIEW VW_Farmaceutico_Tickets;
GO

CREATE VIEW VW_Farmaceutico_Tickets AS
SELECT
    T.Id_Ticket,
    T.Id_Farmaceutico,
    P.Nombre + ' ' + P.Paterno AS Nombre_Farmaceutico,
    T.Nombre_Cliente,
    T.Fecha_Pago,
    T.Hora_Pago,
    T.Monto_Total,
    T.Estatus_Ticket
FROM Ticket T
JOIN Farmaceutico F ON T.Id_Farmaceutico = F.Id_Farmaceutico
JOIN Empleado E     ON F.Id_Empleado     = E.Id_Empleado
JOIN Usuario U      ON E.Id_Usuario      = U.Id_Usuario
JOIN Persona P      ON U.CURP            = P.CURP;
GO

SELECT * FROM VW_Farmaceutico_Tickets;
SELECT * FROM VW_Farmaceutico_Tickets WHERE Id_Farmaceutico = 3;



/*4.3 Detalle del ticket (productos + servicios)
Unimos TicketProducto+Inventario con TicketServicio+Servicio en una sola vista.     */
IF OBJECT_ID('VW_Farmaceutico_DetalleTicket', 'V') IS NOT NULL
    DROP VIEW VW_Farmaceutico_DetalleTicket;
GO

CREATE VIEW VW_Farmaceutico_DetalleTicket AS
SELECT
    TP.Id_Ticket,
    'PRODUCTO'       AS TipoItem,
    I.Nombre_Producto AS Nombre_Item,
    TP.Cantidad,
    TP.Precio_Unitario,
    TP.Subtotal
FROM TicketProducto TP
JOIN Inventario I ON TP.Id_Producto = I.Id_Producto

UNION ALL

SELECT
    TS.Id_Ticket,
    'SERVICIO'       AS TipoItem,
    S.Nombre_Servicio AS Nombre_Item,
    TS.Cantidad,
    TS.Precio_Unitario,
    TS.Subtotal
FROM TicketServicio TS
JOIN Servicio S ON TS.Id_Servicio = S.Id_Servicio;
GO



SELECT * FROM VW_Farmaceutico_DetalleTicket order by Id_Ticket;
SELECT * FROM VW_Farmaceutico_DetalleTicket WHERE Id_Ticket = 42;





