class Turnos{
    constructor(){
        this.loadTimestamp = new Date().getTime();
        this.lunesActual = null;
    }
    ini(){
        _datos = JSON.parse(_datos);
        G.verificarUsuario();

        let f = new Date();
        if(f.getDay() === 1){
            this.lunesActual = f;
            $("[name='semana']").val(f.getDate() + "-" + fechas.MONTH_NAME[f.getMonth()]);
            this.listarSemana();
        }else{
            this.getPrevMonday()
        }

        $("[name='vista']").change(ev=>{
            let v = $(ev.currentTarget).val();
            $("[name='listado']").addClass("d-none");
            $("[name='grilla']").addClass("d-none");
            $("[name='" + v + "']").removeClass("d-none");
        })

        $("[name='semana-anterior']").click(ev=>{
            this.getPrevMonday();
        })
        $("[name='semana-siguiente']").click(ev=>{
            this.getNextMonday();
        })
    }
    getPrevMonday(){
        let clon = fechas.parse2(this.lunesActual, "USA_FECHA_HORA");
        clon = new Date(clon);
        let encontro = false;
        while(encontro == false){
            clon.setDate(clon.getDate() -1);
            if(clon.getDay() === 1) encontro = true;
        }
        this.lunesActual = clon;
        $("[name='semana']").val(clon.getDate() + "-" + fechas.MONTH_NAME[clon.getMonth()]);
        this.listarSemana();
    }
    getNextMonday(){
        let clon = fechas.parse2(this.lunesActual, "USA_FECHA_HORA");
        clon = new Date(clon);
        let encontro = false;
        while(encontro == false){
            clon.setDate(clon.getDate() +1);
            if(clon.getDay() === 1) encontro = true;
        }
        this.lunesActual = clon;

        $("[name='semana']").val(clon.getDate() + "-" + fechas.MONTH_NAME[clon.getMonth()]);
        this.listarSemana();
    }
    async listarSemana(){
        const desde = fechas.parse2(this.lunesActual, "USA_FECHA") + "T00:01";
        const clon = new Date(desde);
        clon.setDate(clon.getDate() + 6);
        const hasta = fechas.parse2(clon, "USA_FECHA") + "T00:01";

        let datos = await $.post({
            url: "/turnos/obtener-semana",
            data: {desde, hasta}
        });

        datos.registros.sort((a,b)=>{
            let fa = fechas.parse2(a.fecha, "USA_FECHA_HORA");
            let fb = fechas.parse2(b.fecha, "USA_FECHA_HORA");
            if(fa > fb) return 1;
            else if(fa < fb) return -1;
            return 0;
        })

        let ahora = fechas.parse2(new Date(), "USA_FECHA_HORA")

        let tbody = "";
        datos.registros.forEach(tx=>{
            let fx = fechas.parse2(tx.fecha, "USA_FECHA_HORA")

            let est = "";
            if(tx.cancelado) est = "<span class='badge badge-danger'>Cancelado</span>";
            else if( fx > ahora ) est = "<span class='badge badge-primary'>Confirmado</span>";
            else if( fx < ahora ) est = "<span class='badge badge-success'>Finalizado</span>";

            let cob = "<span class='badge badge-danger'>NO<span>";
            if(tx.pago.cobrado) cob = "<span class='badge badge-success'>SI<span>";

            tbody += `<tr _id="${tx._id}" class="cp">
                <td style="width:150px !important;">${fechas.parse2(tx.fecha, "ARG_FECHA_HORA")}</td>
                <td>${tx.espacio}</td>
                <td>${tx.usuario.nombre}</td>
                <td class="text-right">${est}</td>
                <td class="text-right">${cob}</td>
            </tr>`
        })
        $("[name='listado'] tbody").html(tbody);
        $("[name='listado'] tbody tr").click(ev=>{
            let row = $(ev.currentTarget);
            let _id = row.attr("_id");
            let tx = datos.registros.find(t=>t._id == _id);
            this.modalTurno(tx);
        })
    }
    modalTurno(turno){
        let foo = $("#modal_cobrar").html();
        modal.mostrar({
            titulo: "Cobrar",
            cuerpo: foo,
            botones: "volver"
        })

        if(turno.pago.cobrado){
            $("#modal input, #modal select, #modal .modal-body button").prop("disabled", true)
            $("#modal [name='monto']").val(turno.pago.monto);
            $("#modal [name='medio']").val(turno.pago.medio);
            $("#modal [name='detalle']").val(turno.pago.detalle);
        }

        $("#modal [name='cobrar']").click(async ev=>{
            const ele = $(ev.currentTarget)
            try{
                let data = {
                    _id: turno._id,
                    monto: Number($("#modal [name='monto']").val()),
                    medio: $("#modal [name='medio']").val(),
                    detalle: $("#modal [name='detalle']").val().toString().trim(),
                };
    
                if(isNaN(data.monto) || data.monto <= 0) throw "Monto no válido.";
                if(!data.medio) throw "Medio de pago no válido";
                //if(data.detalle.length == 0) throw "Detalle no válido";
                
                let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "¿Confirma el cobro?"});
                if(!resp) return;
    
                let ret = await $.post({
                    url: "/turnos/cobrar",
                    data
                });
                
                if(!ret.status) throw ret.message;

                modal.config.fnOcultar2 = () =>{
                    modal.mensaje("COBRO realizado con éxito", ()=>{
                        this.listarSemana();
                    });
                }
                modal.ocultar();
            }catch(err){
                console.log(err);
                modal.addPopover({ querySelector: ele, message: err.toString() })
            }
        })

        $("#modal [name='cancelar']").click(async ev=>{
            const ele = $(ev.currentTarget)
            try{

                let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "¿Confirma la cancelación del turno?"});
                if(!resp) return;

                let ret = await $.post({
                    url: "/turnos/cancelar",
                    data: {_id: turno._id}
                });

                if(!ret.status) throw ret.message;

                modal.config.fnOcultar2 = () =>{
                    modal.mensaje("Turno CANCELADO con éxito", ()=>{
                        this.listarSemana();
                    });
                }
                modal.ocultar();

            }catch(err){
                console.log(err);
                modal.addPopover({ querySelector: ele, message: err.toString() })
            }
        });

    }
}