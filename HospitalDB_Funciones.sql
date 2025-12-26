-- =============================================
-- FUNCIONES PARA BD HOSPITAL
-- =============================================

USE HOSPITAL;
GO

/* ============================================================
   1. FN_Calcular_Edad
   ------------------------------------------------------------
   ¿Qué hace?
   - Calcula la edad (en años) a partir de una fecha de nacimiento.

   ¿Por qué?
   - Es útil cuando quieres mostrar la edad del paciente o validar
     reglas (ej. mayor de edad) sin guardar la edad fija.

   Parámetros:
   - @Fecha_Nacimiento DATE

   Devuelve:
   - INT (años cumplidos)

   Ejemplo de uso:
   SELECT dbo.FN_Calcular_Edad('2000-05-10');
   ============================================================ */
IF OBJECT_ID('dbo.FN_Calcular_Edad', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_Calcular_Edad;
GO

CREATE FUNCTION dbo.FN_Calcular_Edad (@Fecha_Nacimiento DATE)
RETURNS INT
AS
BEGIN
    DECLARE @Edad INT;

    SELECT @Edad = DATEDIFF(YEAR, @Fecha_Nacimiento, GETDATE()) -
                   CASE 
                       WHEN (MONTH(@Fecha_Nacimiento) > MONTH(GETDATE()))
                            OR (MONTH(@Fecha_Nacimiento) = MONTH(GETDATE())
                                AND DAY(@Fecha_Nacimiento) > DAY(GETDATE()))
                       THEN 1
                       ELSE 0
                   END;

    RETURN @Edad;
END;
GO

--
   SELECT dbo.FN_Calcular_Edad('2000-05-10');


/* ============================================================
   2. FN_Obtener_Costo_Cancelacion
   ------------------------------------------------------------
   ¿Qué hace?
   - Calcula el monto que se le devuelve al paciente al cancelar
     una cita, dependiendo de cuántas horas antes de la cita
     está haciendo la cancelación.

   ¿Por qué?
   - Implementa una política de cancelación:
        >= 48 horas antes  -> 100% del costo
        >= 24 y < 48 horas -> 50% del costo
        < 24 horas         -> 0%

   Parámetros:
   - @Id_Cita INT:      Cita que se quiere cancelar.
   - @Fecha_Cancelacion DATETIME: Momento en que se cancela.

   Devuelve:
   - DECIMAL(10,2): Monto a devolver al paciente.

   Notas:
   - Usa la tabla Cita + Doctor + Especialidad.
   - Especialidad.Costo es el costo base de la consulta.

   Ejemplo de uso:
   SELECT dbo.FN_Obtener_Costo_Cancelacion(1, GETDATE());
   ============================================================ */
IF OBJECT_ID('dbo.FN_Obtener_Costo_Cancelacion', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_Obtener_Costo_Cancelacion;
GO

CREATE FUNCTION dbo.FN_Obtener_Costo_Cancelacion
(
    @Id_Cita INT,
    @Fecha_Cancelacion DATETIME
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @Fecha_Cita DATETIME;
    DECLARE @Costo_Especialidad DECIMAL(10, 2);
    DECLARE @Horas_Anticipacion INT;
    DECLARE @Monto_Devuelto DECIMAL(10, 2);

    -- 1. Obtener datos de la cita y el costo de la especialidad
    SELECT 
        @Fecha_Cita = C.Fecha_Cita,          -- Se asume que Fecha_Cita ya tiene fecha y hora
        @Costo_Especialidad = E.Costo
    FROM Cita C
    JOIN Doctor D       ON C.Ced_Profesional = D.Ced_Profesional
    JOIN Especialidad E ON D.Id_Especialidad = E.Id_Especialidad
    WHERE C.Id_Cita = @Id_Cita;

    -- 2. Calcular horas de anticipación de la cancelación
    SET @Horas_Anticipacion = DATEDIFF(HOUR, @Fecha_Cancelacion, @Fecha_Cita);

    -- 3. Aplicar política de cancelación
    IF @Horas_Anticipacion >= 48
        SET @Monto_Devuelto = @Costo_Especialidad * 1.00;  -- 100%
    ELSE IF @Horas_Anticipacion >= 24
        SET @Monto_Devuelto = @Costo_Especialidad * 0.50;  -- 50%
    ELSE
        SET @Monto_Devuelto = 0.00;                        -- 0%

    RETURN @Monto_Devuelto;
END;
GO

--
SELECT dbo.FN_Obtener_Costo_Cancelacion(1, GETDATE());


/* ============================================================
   3. FN_Consultar_Ventas_Farmaceutico
   ------------------------------------------------------------
   ¿Qué hace?
   - Devuelve, como tabla, todas las ventas (tickets) atendidas
     por un farmacéutico, tanto de:
       * Productos (Inventario)
       * Servicios (Servicio)

   ¿Por qué?
   - Sirve para reportes de ventas, comisiones, auditorías, etc.
   - Es equivalente a la función FN_Consultar_Ventas_Farmaceutico
     del script original, pero usando:
        Ticket, TicketProducto, TicketServicio, Inventario, Servicio.

   Parámetros:
   - @Id_Farmaceutico INT

   Devuelve (TABLE):
   - Id_Ticket
   - Fecha_Pago
   - Hora_Pago
   - Nombre_Cliente
   - Tipo_Item   ('Producto' / 'Servicio')
   - Nombre_Item
   - Cantidad
   - Precio_Unitario
   - Subtotal

   Ejemplo de uso:
   SELECT *
   FROM dbo.FN_Consultar_Ventas_Farmaceutico(1);
   ============================================================ */
IF OBJECT_ID('dbo.FN_Consultar_Ventas_Farmaceutico', 'IF') IS NOT NULL
    DROP FUNCTION dbo.FN_Consultar_Ventas_Farmaceutico;
GO

CREATE FUNCTION dbo.FN_Consultar_Ventas_Farmaceutico
(
    @Id_Farmaceutico INT
)
RETURNS TABLE
AS
RETURN
(
    -- Ventas de productos (Inventario)
    SELECT
        T.Id_Ticket,
        T.Fecha_Pago,
        T.Hora_Pago,
        T.Nombre_Cliente,
        'Producto' AS Tipo_Item,
        I.Nombre_Producto AS Nombre_Item,
        TP.Cantidad,
        TP.Precio_Unitario,
        TP.Subtotal
    FROM Ticket T
    JOIN TicketProducto TP ON T.Id_Ticket = TP.Id_Ticket
    JOIN Inventario I      ON TP.Id_Producto = I.Id_Producto
    WHERE T.Id_Farmaceutico = @Id_Farmaceutico

    UNION ALL

    -- Ventas de servicios
    SELECT
        T.Id_Ticket,
        T.Fecha_Pago,
        T.Hora_Pago,
        T.Nombre_Cliente,
        'Servicio' AS Tipo_Item,
        S.Nombre_Servicio AS Nombre_Item,
        TS.Cantidad,
        TS.Precio_Unitario,
        TS.Subtotal
    FROM Ticket T
    JOIN TicketServicio TS ON T.Id_Ticket = TS.Id_Ticket
    JOIN Servicio S        ON TS.Id_Servicio = S.Id_Servicio
    WHERE T.Id_Farmaceutico = @Id_Farmaceutico
);
GO

--
SELECT * FROM dbo.FN_Consultar_Ventas_Farmaceutico(1);
   


/* ============================================================
   4. FN_Validar_Login
   ------------------------------------------------------------
   ¿Qué hace?
   - Valida el login a partir de Correo y Password en la tabla Usuario.
   - Devuelve el Id_Rol del usuario si las credenciales son válidas;
     en caso contrario, devuelve NULL.

   ¿Por qué?
   - Equivalente a FN_Validar_Login del script original (que devolvía
     el tipo de usuario). Aquí usamos Id_Rol para saber si es
     Paciente, Doctor, Recepcionista, Farmacéutico, etc.

   Parámetros:
   - @Correo   VARCHAR(100)
   - @Password VARCHAR(255)

   Devuelve:
   - INT (Id_Rol) o NULL si el login falla.

   Ejemplo de uso:
   SELECT dbo.FN_Validar_Login('correo@ejemplo.com', 'mipassword');
   ============================================================ */
IF OBJECT_ID('dbo.FN_Validar_Login', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_Validar_Login;
GO

CREATE FUNCTION dbo.FN_Validar_Login
(
    @Correo   VARCHAR(100),
    @Password VARCHAR(255)
)
RETURNS INT
AS
BEGIN
    DECLARE @Id_Rol INT;

    SELECT 
        @Id_Rol = U.Id_Rol
    FROM Usuario U
    WHERE 
        U.Correo   = @Correo
        AND U.Password = @Password;

    -- Si no hay coincidencia, @Id_Rol quedará NULL
    RETURN @Id_Rol;
END;
GO

--
SELECT dbo.FN_Validar_Login('correo@ejemplo.com', 'mipassword');


/* ============================================================
   5. FN_ExisteCitaPendiente
   ------------------------------------------------------------
   ¿Qué hace?
   - Indica si un paciente tiene al menos UNA cita pendiente o activa
     con un doctor específico.

   ¿Por qué?
   - Sirve para evitar que un paciente agende múltiples citas
     pendientes con el mismo doctor (lógica de negocio).

   Parámetros:
   - @Id_Paciente     INT
   - @Ced_Profesional INT  (del doctor)

   Devuelve:
   - BIT
       1 = Sí existe una cita pendiente
       0 = No existe

   Nota importante:
   - Aquí se asume que la columna Cita.EstatusCita puede tener
     valores tipo 'Pendiente' o 'Confirmada' para citas activas.
   - AJUSTA el IN (...) a los valores reales que uses en tu BD.

   Ejemplo de uso:
   SELECT dbo.FN_ExisteCitaPendiente(3, 12345);
   ============================================================ */
IF OBJECT_ID('dbo.FN_ExisteCitaPendiente', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_ExisteCitaPendiente;
GO

CREATE FUNCTION dbo.FN_ExisteCitaPendiente
(
    @Id_Paciente     INT,
    @Ced_Profesional INT
)
RETURNS BIT
AS
BEGIN
    IF EXISTS
    (
        SELECT 1
        FROM Cita
        WHERE Id_Paciente     = @Id_Paciente
          AND Ced_Profesional = @Ced_Profesional
          AND EstatusCita IN ('Pendiente', 'Confirmada')  -- AJUSTAR A TUS VALORES REALES
    )
        RETURN 1;

    RETURN 0;
END;
GO

--
SELECT dbo.FN_ExisteCitaPendiente(3, 12345);


-----------------------------------------------------------------------------------------------

/* ============================================================
   1. FN_ProximaCitaPaciente
   ------------------------------------------------------------
   ¿Qué hace?
   - Devuelve la FECHA y HORA de la próxima cita futura
     de un paciente específico.

   ¿Por qué?
   - Sirve para mostrar en el perfil del paciente:
       "Tu próxima cita es el día X a las Y horas"
   - También es útil para validaciones (ej. evitar que
     agende más si ya tiene una próxima cita pendiente).

   Parámetros:
   - @Id_Paciente INT

   Devuelve:
   - DATETIME (fecha y hora de la próxima cita)
     o NULL si no tiene citas futuras.

   Criterios:
   - Solo se consideran citas cuya Fecha_Cita sea
     MAYOR a GETDATE() (futuras).
   - Opcionalmente se filtra por estatus "activos"
     (ajusta a los valores REALES que uses):
          'Pendiente', 'Confirmada'

   Ejemplo de uso:
   SELECT dbo.FN_ProximaCitaPaciente(3);
   ============================================================ */
IF OBJECT_ID('dbo.FN_ProximaCitaPaciente', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_ProximaCitaPaciente;
GO

CREATE FUNCTION dbo.FN_ProximaCitaPaciente
(
    @Id_Paciente INT
)
RETURNS DATETIME
AS
BEGIN
    DECLARE @ProximaCita DATETIME;

    /* 
       NOTA:
       - Se usa Fecha_Cita directamente. Si en tu sistema
         la hora real está en Hora_I, podrías hacer:
         @FechaCompleta = CAST(CONVERT(date, Fecha_Cita) AS DATETIME) + CAST(Hora_I AS DATETIME)
       - Aquí asumimos que Fecha_Cita ya representa
         la fecha y la hora de la cita.
    */
    SELECT TOP 1
        @ProximaCita = C.Fecha_Cita
    FROM Cita C
    WHERE 
        C.Id_Paciente = @Id_Paciente
        AND C.Fecha_Cita IS NOT NULL
        AND C.Fecha_Cita > GETDATE()
        -- Ajusta los estatus a los que uses en tu BD
        AND C.EstatusCita IN ('Pendiente', 'Confirmada')
    ORDER BY 
        C.Fecha_Cita ASC;   -- La más cercana en el futuro

    RETURN @ProximaCita;    -- Puede ser NULL si no hay citas futuras
END;
GO

--
SELECT dbo.FN_ProximaCitaPaciente(3);


/* ============================================================
   2. FN_CitasDelDia
   ------------------------------------------------------------
   ¿Qué hace?
   - Devuelve el NÚMERO de citas que tiene un doctor
     en el día de HOY.

   ¿Por qué?
   - Útil para que el doctor vea su carga de trabajo diaria.
   - También sirve para la recepcionista o indicadores
     administrativos (agenda diaria del médico).

   Parámetros:
   - @Ced_Profesional INT

   Devuelve:
   - INT: cantidad de citas programadas para HOY
     con ese doctor.

   Criterios:
   - Fecha_Cita corresponde al día actual
      (CONVERT(date, Fecha_Cita) = CONVERT(date, GETDATE()))
   - Se pueden filtrar solo estatus "activos"
     (ajusta EstatusCita según tus valores):

       Ejemplo: 'Pendiente', 'Confirmada', 'En progreso'

   Ejemplo de uso:
   SELECT dbo.FN_CitasDelDia(12345);
   ============================================================ */
IF OBJECT_ID('dbo.FN_CitasDelDia', 'FN') IS NOT NULL
    DROP FUNCTION dbo.FN_CitasDelDia;
GO

CREATE FUNCTION dbo.FN_CitasDelDia
(
    @Ced_Profesional INT
)
RETURNS INT
AS
BEGIN
    DECLARE @TotalCitas INT;

    SELECT 
        @TotalCitas = COUNT(*)
    FROM Cita C
    WHERE 
        C.Ced_Profesional = @Ced_Profesional
        AND C.Fecha_Cita IS NOT NULL
        AND CONVERT(date, C.Fecha_Cita) = CONVERT(date, GETDATE())
        -- Ajusta a los estatus que uses realmente
        AND C.EstatusCita IN ('Pendiente', 'Confirmada', 'En progreso');

    RETURN @TotalCitas;
END;
GO

--
SELECT dbo.FN_CitasDelDia(12345);