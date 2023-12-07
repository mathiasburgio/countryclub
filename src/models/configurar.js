const { Router } = require("express")
const router = Router()
const path = require("path")
const fechas = require("./../resources/Fechas");
const fs = require("fs");
var myMongo = null;

//NOTA===========>> AL CAMBIAR LA CONFIGURACION BORRAR TODOS LOS TURNOS FIJOS
let conf = {
    diasDisponibles: "0-6",//domingo a sabado
    horaInicio: "07:00",
    horaFin: "22:00",
    fraccionHoraria: "01:00",
    reservaSoloVerificados: true,
    tiempoCancelacion: 48,//horas antes del turno que se permite para la cancelacion
    espacios: [
        {
            nombre: "Padle 1",
            precioSocio: 1000,
            precioGeneral: 1500,
            habilitado: true
        },
        {
            nombre: "Padle 2",
            precioSocio: 1000,
            precioGeneral: 1500,
            habilitado: true
        },
        {
            nombre: "Tenis 1",
            precioSocio: 1000,
            precioGeneral: 1500,
            habilitado: true
        },
        {
            nombre: "Tenis 2",
            precioSocio: 1000,
            precioGeneral: 1500,
            habilitado: true
        },
    ]
};
module.exports.conf = conf;

module.exports.readConf = () => {
    conf = fs.readFileSync( path.join(__dirname, "..", "..", "configuracion.json"), "utf-8" );
};

module.exports.setMongoose = (conn) =>{ 
    myMongo = conn;
};
module.exports.getRoutes = () => router;