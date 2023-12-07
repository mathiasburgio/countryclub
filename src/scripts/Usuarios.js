class Usuarios{
    constructor(){
    }
    ini(){
        _datos = JSON.parse(_datos);
        G.verificarUsuario();

        _datos.usuarios.sort((a,b)=>{
            if(a.nombre > b.nombre) return 1;
            else if(a.nombre < b.nombre) return -1;
            return 0;
        });
        
        $("[name='buscar']").keyup(ev=>{
            let v = $(ev.currentTarget).val().toString().trim();
            if(ev.keyCode == 13 || v == "") this.buscarListar(v);
        })

        
        this.buscarListar();
        $("[name='cantidad-registros']").html("Registros totales: " + _datos.usuarios.length);
    }
    buscarListar(p = ""){
        
        
        //BUSCO
        p = p.toLowerCase();
        let encontrados = [];
        _datos.usuarios.forEach(ux=>{
            if(p == "" || ux.nombre?.toLowerCase().indexOf(p) > -1 || ux.telefono?.indexOf(p) > -1 || ux.email?.toLowerCase().indexOf(p) > -1){
                encontrados.push(ux);
            }
        })

        //LISTO
        let tbody = "";
        encontrados.forEach((ux, ind)=>{
            if(ind < 100){
                let span = `<span class="badge badge-danger">No</span>`;
                if(ux.habilitado) span = `<span class="badge badge-success">Si</span>`;
                tbody += `<tr _id="${ux._id}" class="cp">
                    <td>${ux.nombre}</td>
                    <td class="text-right">${span}</td>
                </tr>`
            }
        })
        $("[name='tabla-usuarios'] tbody").html(tbody);
        
        $("[name='tabla-usuarios'] tbody tr").click(ev=>{
            let row = $(ev.currentTarget);
            let _id = row.attr("_id");
            const usuario = _datos.usuarios.find(u=>u._id == _id);
            this.modalUsuario(usuario);
        })
    }
    modalUsuario(usuario){
        let foo = $("#modal_usuario").html();
        modal.mostrar({
            titulo: "Usuario",
            cuerpo: foo,
            botones: "volver"
        });

        $("#modal [name='nombre']").val(usuario.nombre);
        $("#modal [name='email']").val(usuario.email);
        $("#modal [name='direccion']").val(usuario.direccion);
        $("#modal [name='telefono']").val(usuario.telefono);
        $("#modal [name='dni']").val(usuario.dni);
        $("#modal [name='numeroSocio']").val(usuario.numeroSocio);
        $("#modal [name='administrador']").prop("checked", usuario.administrador);
        $("#modal [name='habilitado']").prop("checked", usuario.habilitado);
        $("#modal [name='socio']").prop("checked", usuario.socio);
        $("#modal [name='especial']").prop("checked", usuario.especial);

        $("#modal [name='guardar']").click(async ev=>{
            const ele = $(ev.currentTarget);
            let data = {
                _id: usuario._id,
                nombre: $("#modal [name='nombre']").val().toString().trim(),
                email: $("#modal [name='email']").val().toString().trim().toLowerCase(),
                direccion: $("#modal [name='direccion']").val(),
                telefono: $("#modal [name='telefono']").val(),
                dni: $("#modal [name='dni']").val(),
                numeroSocio: $("#modal [name='numeroSocio']").val(),
                administrador: $("#modal [name='administrador']").prop("checked"),
                habilitado: $("#modal [name='habilitado']").prop("checked"),
                socio: $("#modal [name='socio']").prop("checked"),
                especial: $("#modal [name='especial']").prop("checked"),
            };

            if(data.nombre.length < 3){
                modal.addPopover({querySelector: ele, message: "Nombre no válido"})
                return;
            }
            if(data.email.length < 3){
                modal.addPopover({querySelector: ele, message: "Email no válido"})
                return;
            }

            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "¿Confirma el guardado del usuario?"});
            if(!resp) return;

            let ret = await $.post({
                url: "/usuarios/modificar",
                data: data
            });
            
            console.log(ret);
            if(ret.status){
                Object.assign(usuario, data);
                let v = $("[name='buscar']").val();
                this.buscarListar(v);
                modal.ocultar();
            }else{
                modal.addPopover({querySelector: ele, message: ret.message})
            }
        })

        $("#modal [name='eliminar']").click(async ev=>{
            const ele = $(ev.currentTarget);

            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "¿Confirma ELIMINAR al usuario?"});
            if(!resp) return;

            let ret = await $.post({
                url: "/usuarios/eliminar",
                data: {_id: usuario._id}
            });

            _datos.usuarios = _datos.usuarios.filter(u=>u._id != usuario._id);
            let v = $("[name='buscar']").val();
            this.buscarListar(v);
            modal.ocultar();

        });

        $("#modal [name='restablecer-contrasena']").click(async ev=>{
            const ele = $(ev.currentTarget);

            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "¿Confirma acción?"});
            if(!resp) return;

            let ret = await $.post({
                url: "/usuarios/restablecer-contrasena",
                data: {_id: usuario._id}
            });
            console.log(ret);
            modal.config.fnOcultar2 = () =>{
                this.modalRestablecerContrasena(usuario, ret.token);
            }
            modal.ocultar();
        })
    }
    modalRestablecerContrasena(usuario, token){
        let foo = $("#modal_restablecer_contrasena").html()
        modal.mostrar({
            titulo: "Restablecer",
            cuerpo: foo,
            botones: "volver"
        });

        const url = `https://countryclub.com.ar/restablecer-contrasena/${usuario.email}/${token}`;

        $("#modal [name='email']").val(usuario.email);
        $("#modal [name='token']").val(token);
        $("#modal [name='url']").val(url);


        $("#modal [name='copiar']").click(async ()=>{
            let ret = await navigator.clipboard.writeText(url);
            alert("Copiado al portapapeles");
        });
        $("#modal [name='enviar']").click(async ()=>{
            let tel = usuario.telefono.replaceAll(" ", "").replaceAll("+", "").replaceAll("#", "").replaceAll("(", "").replaceAll(")", "");
            let text = encodeURI("Restablecer contraseña en *COUNTRY CLUB*\n" + url);
            window.open("https://wa.me/" + tel + "?text=" + text);
        });
    }
}