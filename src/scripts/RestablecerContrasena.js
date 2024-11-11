class RestablecerContrasena{
    constructor(){

    }
    ini(){
        _datos = JSON.parse(_datos);
        G.verificarUsuario();

        if(G.mobile == false)$(".card").addClass("w-50")

        //$("[name='email']").val(_datos?.email || "***");

        $("[name='ver']").click(ev=>{
            let inp = $("[name='contrasena']")
            if(inp.attr("type") == "password"){
                inp.attr("type", "text");
            }else{
                inp.attr("type", "password");
            }
        })

        $("[name='guardar']").click(async ev=>{
            const contrasena = $("[name='contrasena']").val();
            if(contrasena.length < 8){
                modal.mensaje("La contraseña debe tener 8 caracteres como mínimo");
                return;
            }
            
            const resp = await modal.pregunta("¿Esta seguro de la contraseña elegida?");
            if(!resp) return;

            let ret = await $.post({
                url: "/usuarios/cambiar-contrasena",
                data: {
                    token: _datos.token,
                    contrasena: contrasena,
                    email: _datos.email,
                }
            })
            if(ret.status){
                modal.mensaje("Contraseña cambiada con éxito", ()=>{
                    window.location.href = "/";
                })
            }else{
                modal.mensaje(ret.message);
            }
        });
    }
}