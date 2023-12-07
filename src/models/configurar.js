const { Router } = require("express")
const router = Router()
const path = require("path")
const fechas = require("./../resources/Fechas");
const fs = require("fs");
var myMongo = null;

//NOTA===========>> AL CAMBIAR LA CONFIGURACION BORRAR TODOS LOS TURNOS FIJOS
const conf = JSON.parse( fs.readFileSync( path.join(__dirname, "..", "..", "configuracion.json"), "utf-8" ) );
module.exports.conf = conf;


module.exports.setMongoose = (conn) =>{ 
    myMongo = conn;
};
module.exports.getRoutes = () => router;