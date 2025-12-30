import { error } from "node:console"
import { getConnection, mssql } from "./server.js"

const getUser =async () => {
    try{
        const pool= await getConnection();
        const result = await pool.request().query("SELECT * FROM USUARIO;")
        console.log(result);
    } catch (error){
        console.log(error)
    }
}

getUser();