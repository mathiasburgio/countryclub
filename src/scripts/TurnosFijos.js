class TurnosFijos{
    constructor(){
    }
    ini(){
        _datos = JSON.parse(_datos);
        G.verificarUsuario();

        let opt1 = G.getOptions({arr: _datos.usuariosEspeciales, value: "_id", label: "nombre"});
        let opt2 = G.getOptions({arr: _datos.conf.espacios, value: "nombre", label: "nombre"});
        $("[name='turnos-fijos'] [name='detalleFijo']").append(opt1);
        $("[name='turnos-fijos'] [name='espacio']").append(opt2);

        $("[name='turnos-fijos'] [name='espacio'], [name='turnos-fijos'] [name='detalleFijo']").change(ev=>{
            this.dibujarTurnosFijos();
        });
    }
    dibujarTurnosFijos(){
        let ex = $("[name='turnos-fijos'] [name='espacio']").val();
        if(ex == "0"){
            $("[name='turnos-fijos'] tbody").html("");
            return;
        }

        let hactual = _datos.conf.horaInicio;
        let termino = false;
        let cc = 0;
        let tbody = "";
        while(termino == false){
            tbody += `<tr f='${cc}' h='${hactual}'>
                <td>${hactual}</td>
                <td c='1'></td>
                <td c='2'></td>
                <td c='3'></td>
                <td c='4'></td>
                <td c='5'></td>
                <td c='6'></td>
                <td c='0'></td>
            </tr>`;

            hactual = G.sumarHoras(hactual, _datos.conf.fraccionHoraria)
            if(hactual >= _datos.conf.horaFin) termino = true;

            //evita overflow
            cc++;
            if(cc > 100) return;
        }

        $("[name='turnos-fijos'] tbody").html(tbody);

        $("[name='turnos-fijos'] tbody td").click(async ev=>{

            let detalle = $("[name='turnos-fijos'] [name='detalleFijo']").val();
            if(!detalle || detalle == "0"){
                modal.mensaje("Seleccione un DETALLE para agregar un turno fijo");
                return;
            }

            let espacio = $("[name='turnos-fijos'] [name='espacio']").val();
            if(!espacio || espacio == "0"){
                modal.mensaje("Seleccione un ESPACIO para agregar un turno fijo");
                return;
            }

            let ele = $(ev.currentTarget);
            let c = Number(ele.attr("c"));//coincide con el indice del dia (0-dom, 1-lun, 2-mar)
            let h = ele.parent().attr("h");
            if(isNaN(c)) return;//hizo click en la hora
            let existe = _datos.turnosFijos.find(t=>t.dia === c && t.hora === h && t.espacio == espacio);
            if(existe){
                let resp = await modal.pregunta("¿Borrar turno fijo?");
                if(!resp) return;

                _datos.turnosFijos = _datos.turnosFijos.filter(t=>t._id != existe._id);
                let ret = await $.post({
                    url: '/turno-fijo/eliminar',
                    data: {_id: existe._id}
                });
                
            }else{
                let resp = await modal.pregunta("Confirma agregar turno fijo?");
                if(!resp) return;

                let usuario = _datos.usuariosEspeciales.find(u=>u._id == detalle);
                console.log(detalle, espacio, c, h)

                let ret = await $.post({
                    url: '/turno-fijo/nuevo',
                    data: {
                        uid: usuario._id,
                        nombre: usuario.nombre,
                        espacio,
                        dia: c,
                        hora: h
                    }
                })
                _datos.turnosFijos.push(ret.turnoFijo);
            }
            this.dibujarTurnosFijos();
        });

        this.listarTurnosFijos();
    }
    listarTurnosFijos(){
        let espacio = $("[name='turnos-fijos'] [name='espacio']").val();
        let detalle = $("[name='turnos-fijos'] [name='detalleFijo']").val();
        _datos.turnosFijos.forEach(fx=>{
            if(espacio == fx.espacio){
                let celda = $("[name='turnos-fijos'] tbody [h='" + fx.hora + "'] [c='" + fx.dia + "']");
                if(celda.length == 0) return;
                if(fx.uid == detalle){
                    celda.attr("_id", fx._id);
                    celda.addClass("bg-primary");
                }else{
                    celda.addClass("bg-secondary");
                }
            }
        });
    }
}