const http = require("http");//necesario para SSL
const https = require("https");
const express = require("express");
const server = express();
const path = require("path");
const fs = require("fs");
const formidableMiddleware = require("express-formidable");
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const cors = require("cors");
const morgan = require("morgan");
const favicon = require('serve-favicon');
const fechas = require("./src/resources/Fechas");
const myMongo = require("./src/helpers/MyMongo");
const crypto = require("./src/helpers/Crypto");

require('dotenv').config({path:'./.env'});

//console.log(process.env);

var fileStoreOptions = {};

//middlewares
server.use(cors())
if(process.env.NODE_ENV == 'development') server.use(morgan("dev"))
server.use(formidableMiddleware())
//SESIONES
server.use(session({
    secret: 'country-carolina-herrera',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge : (86400 * 1000 * 7),//la sesion dura 7 días
        secure : !(process.env.NODE_ENV == 'development') // true ssl
    },
    store: new FileStore({logFn: function(){}})//loFn: ... es para q no joda buscando sessiones q han sido cerradas
}));

//redirecciona HTTPS
/*
server.use(function(request, response, next) {
    if (process.env.NODE_ENV != 'development' && !request.secure) {
       return response.redirect("https://" + request.headers.host + request.url);
    }
    next();
})*/

server.use( favicon(__dirname + "/src/resources/favicon.ico") )

//MODELOS
const index = require("./src/models/index");
const configurar = require("./src/models/configurar");
const turnos = require("./src/models/turnos");
const usuarios = require("./src/models/usuarios");
const nuestroClub = require("./src/models/nuestroClub");
const reservarFijos = require("./src/models/reservarFijos");


//CONEXION
myMongo.getConnection()
.then(async conn=>{
    //ASIGNO CONEXION
    index.setMongoose( conn );
    configurar.setMongoose( conn );
    turnos.setMongoose( conn );
    usuarios.setMongoose( conn );
    reservarFijos.setMongoose( conn );

    //verifico los turnos fijos
    reservarFijos.reservarFijos();
    
});


//CARGO RUTAS DE LOS MODELOS
server.use( index.getRoutes() );
server.use( configurar.getRoutes() );
server.use( turnos.getRoutes() );
server.use( usuarios.getRoutes() );
server.use( nuestroClub.getRoutes() );

    
server.set("view engine", "ejs");

//static content
server.use("/resources", express.static(__dirname + "/src/resources"));
server.use("/scripts", express.static(__dirname + "/src/scripts"));
server.use("/styles", express.static(__dirname + "/src/styles"));
server.use("/imgs", express.static(__dirname + "/src/imgs"));

server.get("/ping", (req, res)=>{
    res.send("pong");
    res.end();
})

server.get("/precios", (req, res)=>{
    res.sendFile( path.join(__dirname, "src", "views", "precios.html") );
})


server.use((req, res, next) => {
    res.status(404).sendFile(__dirname + "/src/resources/404.html")
})

const httpServer = http.createServer(server);

//INICIA el servidor
const port = Number(process.env?.PORT || 6000);
httpServer.listen(port, ()=>{
    console.log(`Escuchando -> http://localhost:${port} # ${fechas.getNow(true)}`);
});