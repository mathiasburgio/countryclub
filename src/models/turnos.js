const { Router } = require("express")
const router = Router()
const path = require("path")
const mongoose = require("mongoose");
const antispam = require("../helpers/Antispam");
const fechas = require("./../resources/Fechas");
const configurar = require("./configurar");

const oid = mongoose.Schema.Types.ObjectId;
const mixed = mongoose.Schema.Types.Mixed;

var myMongo = null;

const turnoSchema = new mongoose.Schema({
    fx: Date,//fecha en la que se genera el registro
    fecha: Date,//fecha alquilada
    dia: Number,// 0-6 dom-sab
    hora: String,// 11:00
    cancelado: Boolean,
    esFijo: Boolean,
    espacio: String,//nombre
    usuario: {
        uid: oid,
        nombre: String
    },
    pago:{
        medio: String,
        monto: Number,
        detalle: String,
        cobrado: Boolean
    },
});
const turnoFijoSchema = new mongoose.Schema({
    uid: oid,//detalle del fijo
    nombre: String,
    espacio: String,//nombre del espacio
    dia: Number,//domingo 0, lunes 1, ...
    hora: String//formato 24:00
});

router.get("/gestionar-turnos", async(req, res)=>{   
    try{
        let datos = {};
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";
        datos.conf = configurar.conf;
        datos.fecha = fechas.getNow(true);
        datos.usuario = req.session.usuario;

        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "gestionar-turnos", 
            datos: JSON.stringify(datos)
        });
    }catch(err){
        console.log(err);
        res.redirect("/");
    }
});
router.get("/turnos-fijos", async(req, res)=>{   
    try{
        let datos = {};
        datos.usuario = req.session.usuario;
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";

        datos.conf = configurar.conf;
        datos.turnosFijos = (await myMongo.model("TurnoFijo").find());
        datos.usuariosEspeciales = (await myMongo.model("Usuario").find({especial: true})).map(ux=>{
            return { _id: ux._id, nombre: ux.nombre, };
        });
        datos.fecha = fechas.getNow(true);

        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "turnos-fijos", 
            datos: JSON.stringify(datos)
        });
    }catch(err){
        console.log(err);
        res.redirect("/");
    }
});
router.post("/turnos/obtener-semana", async(req, res)=>{   
    try{
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";
        let turnos = await myMongo.model("Turno").find({
            fecha: {
                $gte: req.fields.desde,
                $lte: req.fields.hasta
            }
        })
        res.json({status:1, registros: turnos});
    }catch(err){
        console.log(err);
        res.json({status:0, message: err.toString()});
    }
});

//cancela turno desde admin
router.post("/turnos/cancelar", async(req, res)=>{   
    try{
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";

        let fechaAhora = fechas.parse2(new Date(), "USA_FECHA_HORA");
        const turno = await myMongo.model("Turno").findOne({_id: req.fields._id});
        let fechaTurno = fechas.parse2(turno.fecha, "USA_FECHA_HORA");
        if(fechaAhora > fechaTurno) throw "No se puede cancelar un turno pasado.";

        let ret = await myMongo.model("Turno").updateOne({ _id: req.fields._id },{ cancelado: true });
        res.json({status:1});
    }catch(err){
        console.log(err);
        res.json({status:0, message: err.toString()});
    }
});
router.post("/turnos/cobrar", async(req, res)=>{   
    try{
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";
        let turnos = await myMongo.model("Turno").updateOne({
            _id: req.fields._id,
        },{
            "pago.medio": req.fields.medio,
            "pago.detalle": req.fields.detalle,
            "pago.monto": req.fields.monto,
            "pago.cobrado": true,
        })
        res.json({status:1});
    }catch(err){
        console.log(err);
        res.json({status:0, message: err.toString()});
    }
});

router.get("/mis-turnos", async(req, res)=>{   
    try{

        if(!req.session?.usuario?._id){ 
            res.redirect("/index");
            return;
        }

        let datos = {};
        datos.usuario = req.session.usuario;
        datos.conf = configurar.conf;
        datos.misTurnos = await myMongo.model("Turno").find({"usuario.uid": datos.usuario._id}).sort({_id: -1}).limit(20);
        datos.fecha = fechas.parse2(new Date(), "USA_FECHA_HORA");

        let hoy = new Date();
        hoy.setHours(0);
        datos.turnosOcupados = await myMongo.model("Turno").find({cancelado: false, fecha: { $gte: hoy } });

        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "mis-turnos", 
            datos: JSON.stringify(datos)
        });
    }catch(err){
        console.log(err);
        res.redirect("https://countryclub.com.ar");
    }
});
router.post('/mis-turnos/reservar', async (req, res) => {
    let hasError = false;
    let usuario = null;
    try {
        if(!req?.session?.usuario) throw "Usuario no válido.";
        usuario = await myMongo.model("Usuario").findOne({_id: req.session.usuario._id});
        if(!usuario) throw "Usuario no válido (err code 2)";
        if(usuario.habilitado != true) throw "Solo usuarios habilitados pueden registrar turnos.";


        const objAhora = new Date();
        const strAhora = fechas.parse2(objAhora, "USA_FECHA_HORA");
        
        const strFecha = fechas.parse2(req.fields.fecha, "USA_FECHA_HORA");
        const hora = strHora = strFecha.split(" ")[1];
        const objFecha = new Date(strFecha);

        let limiteFuturo = new Date();
        limiteFuturo.setDate(limiteFuturo.getDate() + 6);//notese que sumo 6
        const strLimiteFuturo = fechas.parse2(limiteFuturo, "USA_FECHA") + "T23:59";//notese que adoso la hora limite

        if(objFecha.toString() == "Invalid Date") throw "Fecha no válida.";

        if(strFecha < strAhora) throw "La fecha que intenta reservar ya esta vencida";
        if(strFecha > strLimiteFuturo) throw "Límite de fecha superado.";


        const objEspacio = configurar.conf.espacios.find(e=>e.nombre === req.fields.espacio);
        if(!objEspacio) throw "Espacio / Cancha no válida.";

        const turnosFijos = await myMongo.model("TurnoFijo").find();
        let existe1 = turnosFijos.find(tf=>Number(tf.dia) == objFecha.getDay() && tf.hora == hora && tf.espacio == objEspacio.nombre && tf.cancelado == false);
        if(existe1) throw "Upsss, parece que existe un turno fijo aquí.";

        let existe2 = await myMongo.model("Turno").findOne({
            fecha: objFecha,
            espacio: objEspacio.nombre,
            cancelado: false
        });
        if(existe2) throw "Upsss, parece que este turno ya esta reservado."; 

        const turno = await myMongo.model("Turno")({
            fx: new Date(),
            espacio: objEspacio.nombre,
            fecha: objFecha,
            dia: objFecha.getDay(),
            hora: hora,
            usuario: {
                uid: usuario._id,
                nombre: usuario.nombre
            },
            cancelado: false,
            pago: {
                cobrado: false
            }
        }).save();
    } catch (err) {
        hasError = err.toString();
    } finally {

        let hoy = new Date();
        hoy.setHours(0);
        const turnosOcupados = await myMongo.model("Turno").find({cancelado: false, fecha: { $gte: hoy } });
        const misTurnos = usuario ? ( await myMongo.model("Turno").find({"usuario.uid": usuario._id}).sort({_id: -1}).limit(20) ) : [];
        //console.log(misTurnos);
        res.json({
            status: (hasError == false ? 1 : 0),
            message: hasError,
            conf: configurar.conf,
            misTurnos: misTurnos,
            turnosOcupados: turnosOcupados,
            fecha: fechas.parse2(new Date(), "USA_FECHA_HORA"),
        });
    }
});

//cancela turno propio
router.post('/mis-turnos/cancelar', async (req, res) => {
    try {
        if(!req?.session?.usuario) throw "Usuario no válido.";

        let tiempoCancelacion = Number(configurar.conf.tiempoCancelacion);
        let turno = await myMongo.model("Turno")
        .findOne({ _id: req.fields.tid, "usuario.uid": req.session.usuario._id });
        if(!turno) throw "Turno no válido.";

        let fechaLimite = new Date(turno.fecha);
        fechaLimite.setHours(fechaLimite.getHours() - tiempoCancelacion);
        const fechaLimite2 = fechas.parse2(fechaLimite, "USA_FECHA_HORA");
        const ahora = fechas.parse2(new Date(), "USA_FECHA_HORA");
        if(ahora > fechaLimite2) throw `Solo puede cancelar turnos ${tiempoCancelacion}hs antes del mismo`;

        let resp = await myMongo.model("Turno")
        .updateOne({
            _id: req.fields.tid, 
            "usuario.uid": req.session.usuario._id,
        },{
            cancelado: true
        })
        res.json({status:1, message: "Turno cancelado"})
    }catch(err){
        console.log(err);
        res.json({status: 0, message: err.toString() });
    }
});
router.post('/turno-fijo/nuevo', async (req, res) => {
    try {
        if(req?.session?.usuario?.administrador != true) throw "Usuario no válido.";
        let data = req.fields;

        const turnoFijo = myMongo.model("TurnoFijo")(data);
        await turnoFijo.save();
        res.json({status:1, turnoFijo});

    } catch (err) {
        console.log(err);
        res.json({status: 0, message: err.toString() });
    }
});
router.post('/turno-fijo/eliminar', async (req, res) => {
    try {
        if(req?.session?.usuario?.administrador != true) throw "Usuario no válido.";
        let data = req.fields;

        await myMongo.model("TurnoFijo").deleteOne({_id: data._id});
        res.json({status:1});

    } catch (err) {
        console.log(err);
        res.json({status: 0, message: err.toString() });
    }
});

module.exports.setMongoose = (conn) =>{ 
    myMongo = conn;
    myMongo.model("TurnoFijo", turnoFijoSchema);
    myMongo.model("Turno", turnoSchema);
};
module.exports.getRoutes = () => router;
