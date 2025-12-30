import mssql from "mssql";

// Configuración CORREGIDA con lo que funciona
const connectionSettings = {
    server: "127.0.0.1",
    port: 1433,
    database: "HOSPITAL",
    user: "hospital_user",
    password: "Hospital123$",
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let poolConnection = null;

export async function getConnection() {
    try {
        if (poolConnection && poolConnection.connected) {
            console.log("✅ Conexión reutilizada");
            return poolConnection;
        }
        
        console.log("🔄 Conectando a SQL Server...");
        poolConnection = await mssql.connect(connectionSettings);
        console.log("✅ Conexión exitosa a SQL Server");
        return poolConnection;
        
    } catch (error) {
        console.error("❌ Error de conexión:", error.message);
        poolConnection = null;
        throw error;
    }
}

export { mssql };

