class Index{
    constructor(){

    }
    ini(){
        _datos = JSON.parse(_datos);
        G.verificarUsuario();

        $('[name="iniciar-session"]').click(ev=>{
            this.iniciarSesion();
        })

        $('[name="registrarse"]').click(ev=>{
            this.registrarse();
        });
    }
    iniciarSesion(){

        let foo = $("#modal_iniciar_sesion").html();
        modal.mostrar({
            titulo: "Iniciar sesión",
            cuerpo: foo,
            botones: "volver"
        })

        $("#modal [name='iniciar']").click(async ev=>{
            let ele = $(ev.currentTarget);
            modal.setEsperando3(true, "Iniciando");
            let data = {
                email: $("#modal [name='email']").val(),
                contrasena: $("#modal [name='contrasena']").val(),
            }
            let ret = await $.post({
                url: "/login",
                data: data
            });
    
            if(ret.status){
                window.location.reload()
            }else{
                modal.setEsperando3(false, "Iniciando");
                modal.addPopover({querySelector: ele, message: ret.message});
            }
        })
    }
    registrarse(){

        let foo = $("#modal_registrarse").html();
        modal.mostrar({
            titulo: "Registrarse",
            cuerpo: foo,
            botones: "volver"
        })

        $("#modal [name='registrarse']").click(async ev=>{
            let ele = $(ev.currentTarget);
            modal.setEsperando3(true, "Registrando");
            let data = {
                nombre: $("#modal [name='nombre']").val(),
                direccion: $("#modal [name='direccion']").val(),
                telefono: $("#modal [name='telefono']").val(),
                dni: $("#modal [name='dni']").val(),
                numeroSocio: $("#modal [name='numeroSocio']").val(),
                email: $("#modal [name='email']").val(),
                contrasena: $("#modal [name='contrasena']").val(),
            }
            let ret = await $.post({
                url: "/usuarios/nuevo",
                data: data
            });
    
            if(ret.status){
                window.location.reload()
            }else{
                modal.setEsperando3(false, "Registrando");
                modal.addPopover({querySelector: ele, message: ret.message});
            }
        })
    }
    
}