const { Router } = require("express")
const router = Router()
const path = require("path")
const fechas = require("./../resources/Fechas");
var myMongo = null;

//NOTA===========>> AL CAMBIAR LA CONFIGURACION BORRAR TODOS LOS TURNOS FIJOS
const conf = {
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
    ],
    detalleFijo: [
        {
            detalle: "Profe A",
            uid: "",
            habilitado: true
        },
        {
            detalle: "Profe B",
            uid: "",
            habilitado: true
        },
    ]
};
module.exports.conf = conf;


module.exports.setMongoose = (conn) =>{ 
    myMongo = conn;
};
module.exports.getRoutes = () => router;