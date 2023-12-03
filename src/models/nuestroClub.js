const { Router } = require("express")
const router = Router()
const path = require("path")

router.get("/nuestro-club", async (req, res)=>{
    try{
        let datos = {};
        datos.usuario = req.session.usuario || null;

        res.render( path.join(__dirname, "..", "views" ,"template.ejs"), 
        {
            cuerpo: "nuestro-club", 
            datos: JSON.stringify(datos)
        });
    }catch(err){
        console.log(err);
        res.redirect("404.html?" + err.toString());
    }
})
module.exports.getRoutes = () => router;