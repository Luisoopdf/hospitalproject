CREATE DATABASE HOSPITAL;
GO
USE HOSPITAL

CREATE TABLE Persona
(
    CURP VARCHAR(18) PRIMARY KEY NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Paterno VARCHAR(100) NOT NULL,
    Materno VARCHAR(100) NULL,
    Nacimiento DATE NOT NULL,
    Genero BIT NOT NULL
)

CREATE TABLE Telefono
(
    NoTelefono VARCHAR(15) PRIMARY KEY NOT NULL,
    CURP VARCHAR(18) NOT NULL,
    CONSTRAINT FK_Telefono_Persona FOREIGN KEY (CURP) REFERENCES Persona(CURP) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT UQ_Telefono_Numero UNIQUE (NoTelefono)
)

CREATE TABLE RolUsuario
(
    Id_Rol INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Rol VARCHAR(50) NOT NULL
)

CREATE TABLE Usuario
(
    Id_Usuario INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    CURP VARCHAR(18) NOT NULL,
    Id_Rol INT NOT NULL,
    Correo VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    CONSTRAINT FK_Usuario_Persona FOREIGN KEY (CURP) REFERENCES Persona(CURP)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT FK_Usuario_RolUsuario FOREIGN KEY (Id_Rol) REFERENCES RolUsuario(Id_Rol)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT UQ_Usuario_CURP UNIQUE (CURP),
    CONSTRAINT UQ_Usuario_Correo UNIQUE (Correo)
)

CREATE TABLE Empleado
(
    Id_Empleado INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Usuario INT NOT NULL,
    Salario DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_Empleado_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Paciente
(
    Id_Paciente INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Usuario INT NOT NULL,
    CONSTRAINT FK_Paciente_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Farmaceutico
(
    Id_Farmaceutico INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Empleado INT NOT NULL,
    CONSTRAINT FK_Farmaceutico_Empleado FOREIGN KEY (Id_Empleado) REFERENCES Empleado(Id_Empleado)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Recepcionista
(
    Id_Recepcionista INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Empleado INT NOT NULL,
    CONSTRAINT FK_Recepcionista_Empleado FOREIGN KEY (Id_Empleado) REFERENCES Empleado(Id_Empleado)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE HistorialMedico
(
    Id_HistorialMedico INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Paciente INT NOT NULL,
    Peso DECIMAL(5,2) NOT NULL,
    TipoSangre VARCHAR(15) NOT NULL,
    Estatura DECIMAL(4,2) NOT NULL,
    CONSTRAINT FK_HistorialMedico_Paciente FOREIGN KEY (Id_Paciente) REFERENCES Paciente(Id_Paciente)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT UQ_Historial_Paciente UNIQUE (Id_Paciente)
)

CREATE TABLE Alergias
(
    Id_Alergia INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_HistorialMedico INT NOT NULL,
    TipoAlergia VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Alergias_HistorialMedico FOREIGN KEY (Id_HistorialMedico) REFERENCES HistorialMedico(Id_HistorialMedico)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Enfermedades
(
    Id_Enfermedad INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_HistorialMedico INT NOT NULL,
    DescripcionEnfermedad VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Enfermedades_HistorialMedico FOREIGN KEY (Id_HistorialMedico) REFERENCES HistorialMedico(Id_HistorialMedico)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Antecedentes
(
    Id_Antecedente INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_HistorialMedico INT NOT NULL,
    DescripcionAntecedente VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Antecedentes_HistorialMedico FOREIGN KEY (Id_HistorialMedico) REFERENCES HistorialMedico(Id_HistorialMedico)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Consultorio
(
    Id_Consultorio INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Piso INT NOT NULL,
    Edificio VARCHAR(50) NOT NULL,
    Disponibilidad BIT NOT NULL
)

CREATE TABLE Especialidad
(
    Id_Especialidad INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    NombreEspecialidad VARCHAR(100) NOT NULL,
    Costo DECIMAL(10,2) NOT NULL
)

CREATE TABLE Doctor
(
    Ced_Profesional INT  PRIMARY KEY NOT NULL,
    Id_Especialidad INT NOT NULL,
    Id_Empleado INT NOT NULL,
    Id_Consultorio INT NOT NULL,
    CONSTRAINT FK_Doctor_Especialidad FOREIGN KEY (Id_Especialidad) REFERENCES Especialidad(Id_Especialidad),
    CONSTRAINT FK_Doctor_Empleado FOREIGN KEY (Id_Empleado) REFERENCES Empleado(Id_Empleado)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT FK_Doctor_Consultorio FOREIGN KEY (Id_Consultorio) REFERENCES Consultorio(Id_Consultorio)
)

CREATE TABLE HorarioDoctor
(
    Id_Horario INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Ced_Profesional INT NOT NULL,
    DiaSemana INT NOT NULL, -- 1=Lunes, 2=Martes, ..., 7=Domingo
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_HorarioDoctor_Doctor FOREIGN KEY (Ced_Profesional) REFERENCES Doctor(Ced_Profesional)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT CHK_DiaSemana CHECK (DiaSemana BETWEEN 1 AND 7),
    CONSTRAINT CHK_HorarioValido CHECK (HoraInicio < HoraFin)
)

CREATE TABLE Cita
(
    Id_Cita INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Ced_Profesional INT NOT NULL,
    Id_Paciente INT NOT NULL,
    Fecha_Agendada DATETIME NOT NULL,
    Fecha_Cita DATETIME NULL,
    Hora_I TIME NOT NULL,
    Hora_F TIME NOT NULL,
    EstatusCita VARCHAR(50) NOT NULL,
    CONSTRAINT FK_Cita_Paciente FOREIGN KEY (Id_Paciente) REFERENCES Paciente(Id_Paciente),
    CONSTRAINT FK_Cita_Doctor FOREIGN KEY (Ced_Profesional) REFERENCES Doctor(Ced_Profesional)
)

CREATE TABLE PagoCita
(
    Id_PagoCita INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Cita INT NOT NULL,
    Monto DECIMAL(10,2) NOT NULL,
    Hora_pago TIME NOT NULL,
    Fecha_Pago DATETIME NOT NULL,
    CONSTRAINT FK_PagoCita_Cita FOREIGN KEY (Id_Cita) REFERENCES Cita(Id_Cita)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Receta
(
    Id_Receta INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Cita INT NOT NULL,
    Fecha_Receta DATETIME NOT NULL,
    CONSTRAINT FK_Receta_Cita FOREIGN KEY (Id_Cita) REFERENCES Cita(Id_Cita)
)

CREATE TABLE Recomendaciones
(
    Id_Receta INT PRIMARY KEY NOT NULL,
    Recomendacion VARCHAR(255) NOT NULL,
    CONSTRAINT FK_Recomendaciones_Receta FOREIGN KEY (Id_Receta) REFERENCES Receta(Id_Receta)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Diagnostico
(
    Id_Receta INT PRIMARY KEY NOT NULL,
    Diagnostico VARCHAR(255) NOT NULL,
    CONSTRAINT FK_Diagnostico_Receta FOREIGN KEY (Id_Receta) REFERENCES Receta(Id_Receta)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE Ticket
(
    Id_Ticket INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Farmaceutico INT NOT NULL,
    Nombre_Cliente VARCHAR(100) NOT NULL,
    Fecha_Pago DATETIME NOT NULL,
    Hora_Pago TIME NOT NULL,
    Monto_Total DECIMAL(10,2) NOT NULL,
    Estatus_Ticket BIT NOT NULL,
    CONSTRAINT FK_Ticket_Farmaceutico FOREIGN KEY (Id_Farmaceutico) REFERENCES Farmaceutico(Id_Farmaceutico)
)

CREATE TABLE Inventario
(
    Id_Producto INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Nombre_Producto VARCHAR(100) NOT NULL,
    Stock INT NOT NULL,
    Disponibilidad BIT NOT NULL,
    Precio_Producto DECIMAL(10,2) NOT NULL,
    Status_Receta BIT NOT NULL
)

CREATE TABLE Servicio
(
    Id_Servicio INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Nombre_Servicio VARCHAR(100) NOT NULL,
    Precio_Servicio DECIMAL(10,2) NOT NULL,
    Requerimientos_Previos VARCHAR(255) NOT NULL
)

CREATE TABLE TicketProducto
(
    Id_TicketProducto INT IDENTITY(1,1) PRIMARY KEY,
    Id_Ticket INT NOT NULL,
    Id_Producto INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio_Unitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_TicketProducto_Ticket FOREIGN KEY (Id_Ticket) REFERENCES Ticket(Id_Ticket) 
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT FK_TicketProducto_Producto FOREIGN KEY (Id_Producto) REFERENCES Inventario(Id_Producto),
    CONSTRAINT UQ_Ticket_Producto UNIQUE (Id_Ticket, Id_Producto) 
)

CREATE TABLE TicketServicio
(
    Id_TicketServicio INT IDENTITY(1,1) PRIMARY KEY NOT NULL,  
    Id_Ticket INT NOT NULL,                                    
    Id_Servicio INT NOT NULL,                                  
    Cantidad INT NOT NULL,
    Precio_Unitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_TicketServicio_Servicio FOREIGN KEY (Id_Servicio) REFERENCES Servicio(Id_Servicio),
    CONSTRAINT FK_TicketServicio_Ticket FOREIGN KEY (Id_Ticket) REFERENCES Ticket(Id_Ticket)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT UQ_Ticket_Servicio UNIQUE (Id_Ticket, Id_Servicio)  
)

CREATE TABLE PagoTicket
(
    Id_PagoTicket INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Ticket INT NOT NULL,
    Monto DECIMAL(10,2) NOT NULL,
    Hora_pago TIME NOT NULL,
    Fecha_Pago DATETIME NOT NULL,
    Metodo_Pago VARCHAR(50) NOT NULL,
    Estatus_Pago BIT NOT NULL,
    CONSTRAINT FK_PagoTicket_Ticket FOREIGN KEY (Id_Ticket) REFERENCES Ticket(Id_Ticket)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

CREATE TABLE DetalleTratamiento
(
    Id_DetalleTratamiento INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Receta INT NOT NULL,
    Id_Producto INT NOT NULL,
    Dosis_Cantidad INT NOT NULL,
    Dosis_Unidad VARCHAR(50) NOT NULL,
    Frecuencia VARCHAR(50) NOT NULL,
    Duracion VARCHAR(50) NOT NULL,
    CONSTRAINT FK_DetalleTratamiento_Receta FOREIGN KEY (Id_Receta) REFERENCES Receta(Id_Receta)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT FK_DetalleTratamiento_Producto FOREIGN KEY (Id_Producto) REFERENCES Inventario(Id_Producto)
)

CREATE TABLE BitacoraCita
(
    Id_BitacoraCita INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Cita INT NOT NULL,
    Id_Especialidad INT NOT NULL,
    Fecha_Confirmacion DATETIME NOT NULL,
    CONSTRAINT FK_BitacoraCita_Cita FOREIGN KEY (Id_Cita) REFERENCES Cita(Id_Cita)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT FK_BitacoraCita_Especialidad FOREIGN KEY (Id_Especialidad) REFERENCES Especialidad(Id_Especialidad)
)

CREATE TABLE BitacoraHistorial
(
    Id_BitHistorial INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    Id_Cita INT NOT NULL,  
    Id_Usuario INT NOT NULL,
    Ced_Profesional INT NOT NULL,
    Fecha_Registro DATETIME NOT NULL DEFAULT GETDATE(),  
    Accion VARCHAR(50) NOT NULL, 
    CONSTRAINT FK_BitacoraHistorial_Cita FOREIGN KEY (Id_Cita) REFERENCES Cita(Id_Cita),
    CONSTRAINT FK_BitacoraHistorial_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario),
    CONSTRAINT FK_BitacoraHistorial_Doctor FOREIGN KEY (Ced_Profesional) REFERENCES Doctor(Ced_Profesional)
)