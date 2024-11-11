const { Router } = require("express")
const router = Router()
const path = require("path")
const antispam = require("../helpers/Antispam");
const crypto = require("../helpers/Crypto");
var myMongo = null;

router.get(["/", "/index", "/inicio", "/home"], async(req, res)=>{   
    try{
        let datos = {};
        datos.usuario = req.session.usuario || null;

        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "index", 
            datos: JSON.stringify(datos)
        });
    }catch(err){
        console.log(err);
        res.redirect("404.html?" + err.toString());
    }
});
router.post("/login", async (req, res)=>{
    try {

        if(antispam.validarAccion(antispam.getIp(req), "/login", 5) == false) throw "Spam detectado.";
        
        const email = (req.fields.email || "").toString().toLowerCase();
        const contrasena = (req.fields.contrasena || "").toString();

        let usuario;
        if(email === process.env.ADMIN_EMAIL && contrasena === process.env.ADMIN_PASSWORD){
            usuario = {
                nombre: "admin",
                email: email,
                imagen: null,
                administrador: true,
                socio: true,
                numeroSocio: 1
            };
        }else{
            usuario = await myMongo.model("Usuario").findOne({email: email});
            if(!usuario) throw "Usuario no válido.";
            if(usuario.eliminado) throw "El usuario se encuentra eliminado.";
            let coincide = await crypto.comparePasswordHash( contrasena, usuario.contrasena );
            if(!coincide) throw "Combinación usuario/contraseña no válida.";
        }

        req.session.usuario = {
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            imagen: usuario.imagen,
            administrador: usuario.administrador,
            socio: usuario.socio,
            numeroSocio: usuario.numeroSocio,
        };
        req.session.save();
        res.json({status: 1});
    } catch (err) {
        res.json({status: 0, message: err.toString() });
    }
});
router.post("/logout", async (req, res)=>{
    try {
        req.session.destroy();
        res.json({status: 1});
    } catch (err) {
        res.json({status: 0, message: err.toString() });
    }
});
router.get("/backup", async(req, res)=>{
    try{
        let backup = {};
        backup.TurnoFijo = await myMongo.model("TurnoFijo").find({});
        backup.Turno = await myMongo.model("Turno").find({});
        backup.Usuario = await myMongo.model("Usuario").find({});
    }catch(err){
        
    }
})
module.exports.setMongoose = (conn) =>{ 
    myMongo = conn;
};
module.exports.getRoutes = () => router;