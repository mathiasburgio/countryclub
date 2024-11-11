class MisTurnos{
    constructor(){
        this.loadTimestamp = new Date().getTime();
    }
    ini(){
        _datos = JSON.parse(_datos);
        G.verificarUsuario();

        $("[name='mis-turnos']").click(ev=>{
            $("[name='mis-turnos']").addClass("btn-primary").removeClass("btn-outline-primary");
            $("[name='reservar-turno']").removeClass("btn-primary").addClass("btn-outline-primary");

            $("[name='tab-mis-turnos']").removeClass("d-none");
            $("[name='tab-reservar-turno']").addClass("d-none");
        })

        $("[name='reservar-turno']").click(ev=>{
            $("[name='mis-turnos']").removeClass("btn-primary").addClass("btn-outline-primary");
            $("[name='reservar-turno']").addClass("btn-primary").removeClass("btn-outline-primary");

            $("[name='tab-mis-turnos']").addClass("d-none");
            $("[name='tab-reservar-turno']").removeClass("d-none");
        })

        this.listarTurnos();

        let opt = G.getOptions({arr: _datos.conf.espacios, value: "nombre", label: "nombre"});
        $("[name='espacio']").append(opt);

        $("[name='espacio']").change(async ev=>{
            const espacio = $("[name='espacio']").val();
            $("[name='tabla-horarios']").addClass("d-none");
            $("[name='esperando']").removeClass("d-none");
            await this.esperar(150);
            this.dibujarDias();
            await this.esperar(150);
            if(espacio) $("[name='tabla-horarios']").removeClass("d-none");
            $("[name='esperando']").addClass("d-none");
        });


        //verifica el tiempo de uso de la pagina para autorecargarse
        const t = setInterval(()=>{
            const currentTime = new Date().getTime();
            const elapsedTime = currentTime - this.loadTimestamp;
            const oneHourInMilliseconds = 60 * 60 * 1000; // 1 hora en milisegundos

            if (elapsedTime > oneHourInMilliseconds) {
                // Recargar la página si ha pasado más de 1 hora desde la carga
                location.reload();
            }
        }, (1000 * 5));
    }
    listarTurnos(){
        let tbody = "";
        if( _datos.misTurnos.length == 0 ) {
            tbody += `<tr>
            <td colspan='100%' class="text-center">NO TIENE NINGUN TURNO ASOCIADOS</td>
            </tr>`
        }else{

            _datos.misTurnos.sort((a,b)=>{
                let fa = fechas.parse2(a.fecha, "USA_FECHA_HORA");
                let fb = fechas.parse2(b.fecha, "USA_FECHA_HORA");
                if(fa > fb) return 1;
                else if(fa < fb) return -1;
                return 0;
            });

            _datos.misTurnos.forEach(t=>{
                let fx = fechas.parse2(t.fecha,"USA_FECHA_HORA");
                let ahora = fechas.parse2(_datos.fecha,"USA_FECHA_HORA");
                
                let ee = "";
                if(t.cancelado) ee = "<span class='badge badge-danger'>Cancelado</span>";
                else if( fx > ahora ) ee = "<span class='badge badge-primary'>Confirmado</span>";
                else if( fx < ahora ) ee = "<span class='badge badge-success'>Finalizado</span>";
                
                let cc = "<span class='badge badge-danger'>No</span>";
                if(t.pago.cobrado) cc = "<span class='badge badge-success'>Si</span>";
                tbody += `<tr tid="${t._id}">
                    <td>${fechas.parse2(t.fecha,"ARG_FECHA_HORA")}</td>
                    <td>${t.espacio}</td>
                    <td class="text-right">${ee}</td>
                    <td class="text-right">${cc}</td>
                </tr>`;
            });
        }
        $("[name='tabla-turnos'] tbody").html(tbody);

        $("[name='tabla-turnos'] tbody tr").click(ev=>{
            let tid = $(ev.currentTarget).attr("tid");
            let tx = _datos.misTurnos.find(t=>t._id == tid);
            if(!tx) return;
            let ahora = fechas.parse2(_datos.fecha, "USA_FECHA_HORA");
            let fechaTurno =  fechas.parse2(tx.fecha, "USA_FECHA_HORA");
            if(tx.cancelado == false &&   fechaTurno >  ahora) this.cancelarTurno(tx._id);
        })
    }
    dibujarDias(){
        //dibju el calendario
        G.crearCalendarioV2(_datos.fecha, $("[name='tabla-horarios'] table"), _datos.conf.horaInicio, _datos.conf.horaFin);
        const espacio = $("[name='espacio']").val();
        const objEspacio = _datos.conf.espacios.find(e=>e.nombre == espacio);

        //agrego los turnos ocupados
        _datos.turnosOcupados.forEach(tx=>{
            if(tx.espacio == espacio){
                let celda = $("[name='tabla-horarios'] tbody [hora='" + tx.hora + "'] [dia='" + tx.dia + "']");
                if(celda.length == 0) return;
                celda.attr("tid", tx._id);
                if(tx.usuario.uid == _datos.usuario._id){
                    celda.addClass("bg-success");
                }else{
                    celda.addClass("bg-secondary");
                }
            }
        });

        $("[name='tabla-horarios'] tbody [fecha]").click(async ev=>{
            let ele = $(ev.currentTarget);
            if(ele.hasClass("bg-secondary")) return;
            let dia = ele.attr("dia");
            let fecha = ele.attr("fecha");


            //borrar turno propio
            if( ele.hasClass("bg-success") ){
                const tid = ele.attr("tid");
                this.cancelarTurno(tid);
                return;
            }


            let resp = await modal.pregunta(`
            <b>Cancha/espacio:</b> ${espacio}
            <br><b>Fecha/Hora:</b> ${fechas.parse2(fecha,"ARG_FECHA_HORA")}
            <br><b>Precio socio:</b> $${objEspacio.precioSocio}
            <br><b>Precio general:</b> $${objEspacio.precioGeneral}
            <h5 class='text-center mt-2'>¿Confirma la reserva del turno?</h5>
            `);
            if(!resp) return;

            let ret = await $.post({
                url: '/mis-turnos/reservar',
                data: {
                    fecha: fecha,
                    espacio: espacio,
                }
            });
            console.log(ret);

            _datos.turnosOcupados = ret.turnosOcupados;
            _datos.misTurnos = ret.misTurnos;
            _datos.fecha = ret.fecha;

            this.listarTurnos();
            this.dibujarDias();

            if(!ret.status) modal.mensaje(ret.message);
        });
    }
    esperar(t){
        return new Promise(resolve=>{
            setTimeout(()=>{
                resolve(true);
            }, t)
        })
    }
    async cancelarTurno(tid){
        let resp = await modal.pregunta(`¿Cancelar el turno?`);
        if(!resp) return;

        let ret = await $.post({
            url: '/mis-turnos/cancelar',
            data: { tid: tid }
        });
        if(ret.status){
            const tx = _datos.misTurnos.find(tx=>tx._id == tid);
            if(!tx) window.reload();
            tx.cancelado = true;
            _datos.turnosOcupados = _datos.turnosOcupados.filter(t=>t._id != tx._id);
    
            this.listarTurnos();
            this.dibujarDias();
        }else{
            modal.mensaje(ret.message);
        }
    }
}