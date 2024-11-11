const { Router } = require("express")
const router = Router()
const path = require("path")
const mongoose = require("mongoose");
const crypto = require("../helpers/Crypto");
const stringHelpers = require("../helpers/StringHelpers");
const fechas = require("./../resources/Fechas");

const oid = mongoose.Schema.Types.ObjectId;
const mixed = mongoose.Schema.Types.Mixed;

var myMongo = null;

const usuarioSchema = new mongoose.Schema({
    nombre: String,
    email: String,
    contrasena: String,
    direccion: String,
    telefono: String,
    dni: String,
    imagen: String,
    numeroSocio: String,
    administrador: Boolean,
    especial: Boolean,//sirve para seleccion rapida en ciertas partes
    eliminado: Boolean,
    habilitado: Boolean,
    socio: Boolean,
    restablecerContrasena: {
        vencimiento: Date,
        token: String
    }
});

router.get("/usuarios", async(req, res)=>{   
    try{
        let datos = {};
        datos.usuario = req.session.usuario;
        if(datos.usuario?.administrador != true) throw "Usuario no válido.";
        
        datos.usuarios = await myMongo.model("Usuario").find({eliminado: false}, {contrasena: 0});
        datos.usuarios.forEach(ux=>{
            ux.toObject();
            delete ux.contrasena;
            delete ux.restablecerContrasena;
        });

        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "usuarios", 
            datos: JSON.stringify(datos)
        });
    }catch(err){
        console.log(err);
        res.redirect("/");
    }
});
router.get("/restablecer-contrasena/:email/:token", async(req, res)=>{
    try{
        const datos = {
            email: req.params.email,
            token: req.params.token,
        };
        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "restablecer-contrasena", 
            datos: JSON.stringify(datos)
        });   
    }catch(err){
        
    }
});
router.post('/usuarios/nuevo', async (req, res) => {
    try {

        let data = JSON.parse(JSON.stringify(req.fields));
        data.email = data.email.toString().toLowerCase();
        data.administrador = false;
        data.especial = false;
        data.eliminado = false;
        data.habilitado = false;
        data.socio = false;

        

        if(data.nombre.length < 3) throw "Nombre no válida.";
        if(stringHelpers.validateString(data.email, "email") == false) throw "Email no válido.";
        if(data.contrasena.length < 8) throw "Contraseña no válida.";

        const existeEmail = await await myMongo.model("Usuario").findOne({email: data.email});
        if(existeEmail) throw "Ya existe un usuario registrado con este Email";

        data.contrasena = await crypto.getPasswordHash(data.contrasena);

        const usuario = myMongo.model("Usuario")(data);
        await usuario.save();

        req.session.usuario = {
            _id: usuario._id,
            email: usuario.email,
            nombre: usuario.nombre,
            imagen: usuario.imagen,
            administrador: usuario.administrador,
            socio: usuario.socio,
            numeroSocio: usuario.numeroSocio,
        };
        req.session.save();

        res.json({status:1, usuario});

    } catch (err) {
        console.log(err);
        res.json({status: 0, message: err.toString() });
    }
});
router.post('/usuarios/modificar', async (req, res) => {
    try {
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";
        
        let data = JSON.parse(JSON.stringify(req.fields));
        data.email = data.email.toString().toLowerCase();
        delete data.contrasena;
        
        let ret = await myMongo.model("Usuario").updateOne({_id: data._id}, data);
        res.json({status:1, usuario: data});

    } catch (error) {
        console.log(error);
        res.json({status: 0, message: 'Error al guardar usuario' });
    }
});
router.post('/usuarios/eliminar', async (req, res) => {
    try {
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";

        let data = JSON.parse(JSON.stringify(req.fields));
        
        let ret = await myMongo.model("Usuario").updateOne({_id: data._id}, {eliminado: true});
        res.json({status:1, usuario: data});

    } catch (error) {
        console.log(error);
        res.json({status: 0, message: 'Error al eliminar usuario' });
    }
});
router.post('/usuarios/restablecer-contrasena', async (req, res) => {
    try {
        if(req.session?.usuario?.administrador != true) throw "Usuario no válido.";

        let data = JSON.parse(JSON.stringify(req.fields));
        
        let vencimiento = new Date();
        vencimiento.setDate(vencimiento.getDate() + 2);
        const token = stringHelpers.GUID();

        let ret = await myMongo.model("Usuario").updateOne({_id: data._id}, 
            {
                "restablecerContrasena.vencimiento": vencimiento,
                "restablecerContrasena.token": token
            });
        
        res.json({status:1, token: token});

    } catch (error) {
        console.log(error);
        res.json({status: 0, message: 'Error al eliminar usuario' });
    }
});
router.post('/usuarios/cambiar-contrasena', async (req, res) => {
    try {
        const email = (req.fields.email || "").toString().toLowerCase();
        const token = req.fields.token;
        const contrasena = req.fields.contrasena;
        let usuario = await myMongo.model("Usuario").findOne({
            email: email,
            "restablecerContrasena.token": token
        })
        if(!usuario) throw "Combinación email / token no válida.";
        
        let ahora = fechas.parse2(new Date(), "USA_FECHA_HORA");
        let vencimiento = fechas.parse2(usuario.restablecerContrasena.vencimiento, "USA_FECHA_HORA");
        if(ahora > vencimiento) throw "Token vencido, solicite un nuevo token para completar el cambio de contraseña";

        let _contrasena = await crypto.getPasswordHash(contrasena);

        const ret = await myMongo.model("Usuario").updateOne({_id: usuario._id},{
            contrasena: _contrasena,
            "restablecerContrasena.token": "",
        })
        res.json({status: 1, message: "OK"});
    }catch(err){
        console.log(err);
        res.json({status: 0, message: err.toString()});
    }
});
module.exports.setUsuarioSesion = async (req) =>{
    if(req.session?.usuario?._id){
        const usuario = await myMongo.model("Usuario").findOne({_id: req.session.usuario._id});
        req.session.usuario = {
            _id: usuario._id,
            email: usuario.email,
            nombre: usuario.nombre,
            imagen: usuario.imagen,
            administrador: usuario.administrador,
            socio: usuario.socio,
            numeroSocio: usuario.numeroSocio,
        };
        req.session.save();
    }
}
module.exports.setMongoose = (conn) =>{ 
    myMongo = conn;
    myMongo.model("Usuario", usuarioSchema);
};
module.exports.getRoutes = () => router;