class Globals{
    constructor(){
        this.bandera_menu = false;
        this.menu_open = false;
        this.mobile = (window.screen.width < 1024);
        this.menuSize = this.mobile ? "80vw" : "400px";
        $(".menu").css("width", this.menuSize).css("left", "-" + this.menuSize);
        if(this.mobile){
            $("#btMenu span").html("");//remuevo el texto "Menú"
        }

        $("#btMenu").click(ev=>{
            this.toggleMenu();
        });
        $(".menu [name='btCerrarMenu']").click(ev=>{
            this.toggleMenu();
        });

        $(".menu-backdrop").click(ev=>{
            this.toggleMenu();
        });
        
        $(".menu [name='btCerrarSesion']").click(()=>{
            this.cerrarSesion();
        })
        
        $(".menu li").click(ev=>{
            let href = $(ev.currentTarget).find("[href]");  
            if(href.length == 1){ window.location.href = href.attr("href"); }
            return false;
        });
        
        $(".menu").click(ev=>{
            return false;
        })
    }
    toggleMenu(){
        if(this.bandera_menu){return;}
        this.bandera_menu = true;

        if(this.menu_open){

            $(".menu").animate({
                left: parseInt($(".menu").css("width").replace("px", "")) * -1
            }, "fast", () =>{
                $(".menu-backdrop").addClass("d-none");
                this.bandera_menu = false;
                this.menu_open = false;
            });
        }else{
            $(".menu-backdrop").removeClass("d-none");
            $(".menu").animate({
                left: 0
            }, "fast", () =>{
                this.bandera_menu = false;
                this.menu_open = true;
            });
        }
    }
    async cerrarSesion(){
        let resp = await modal.pregunta("¿Confirma cerrar sesión?");
        if(resp){
            let ret = await $.post({url: "/logout"});
            window.location.href = "/";
        }
    }   
    FD(obj){
        let fd = new FormData();
        for(let prop in obj){
            fd.append(prop, obj[prop]);
        }
        return fd;
    }
    getTextFromSelect($dom){
        return $dom[0].options[$dom[0].selectedIndex].text;
    }
    verificarUsuario(){
        
        if(_datos.usuario){
            $("[name='identificado']").removeClass("d-none");
            $("[name='identificado'] [name='nombre']").html(_datos.usuario.nombre);
            $("[name='identificado'] [name='numeroSocio']").html("#" + (_datos.usuario.socio ? _datos.usuario.numeroSocio : "000"));
            $("[name='btCerrarSesion']").removeClass("d-none");
            $("[href='/mis-turnos']").parent().removeClass("d-none");
            if(_datos.usuario.administrador){
                $("[href='/gestionar-turnos']").parent().removeClass("d-none");
                $("[href='/usuarios']").parent().removeClass("d-none");
                $("[href='/turnos-fijos']").parent().removeClass("d-none");
            }
        }else{
            $("[name='no-identificado']").removeClass("d-none");
        }
    }
    //recibe ambos parametros string del tipo "20:00" y "00:15"
    sumarHoras(hora1, hora2) {
        // Convertir las horas a minutos
        const [hora1Horas, hora1Minutos] = hora1.split(":").map(Number);
        const [hora2Horas, hora2Minutos] = hora2.split(":").map(Number);
    
        const totalMinutos = hora1Horas * 60 + hora1Minutos + hora2Horas * 60 + hora2Minutos;
    
        // Calcular las nuevas horas y minutos
        const nuevasHoras = Math.floor(totalMinutos / 60) % 24;
        const nuevosMinutos = totalMinutos % 60;
    
        // Formatear el resultado
        const resultado = `${nuevasHoras.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
    
        return resultado;
    }
    getOptions({arr, value, label}){
        let html = "";
        arr.forEach(px=>{
            if(typeof px == "object"){
                html += `<option value="${px[value]}">${px[label]}</option>`;
            }else{
                html += `<option value="${px}">${px}</option>`;
            }
        })
        return html;
    }

    //recibe un parametro hora => "20:00" y uno minutos => 15 (numerico)
    sumarMinutosAHora(hora, minutos) {
        // Convertir la hora a minutos
        const [horaHoras, horaMinutos] = hora.split(":").map(Number);
        const totalMinutos = horaHoras * 60 + horaMinutos;
    
        // Sumar los minutos
        const nuevaHoraEnMinutos = totalMinutos + minutos;
    
        // Calcular las nuevas horas y minutos
        const nuevasHoras = Math.floor(nuevaHoraEnMinutos / 60) % 24;
        const nuevosMinutos = nuevaHoraEnMinutos % 60;
    
        // Formatear el resultado
        const resultado = `${nuevasHoras.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
    
        return resultado;
    }
    //crea el calendario desde el lunes hasta el domingo
    crearCalendario(tabla, lunes0, hora0, hora1){

        const addDays = (f, days) =>{
            let aux = new Date(f);
            aux.setDate(aux.getDate() + days);
            return aux;
        }

        let _lunes = fechas.parse2(lunes0, "USA_FECHA");
        let _martes = fechas.parse2( addDays(lunes0, 1), "USA_FECHA");
        let _miercoles = fechas.parse2( addDays(lunes0, 2), "USA_FECHA");
        let _jueves = fechas.parse2( addDays(lunes0, 3), "USA_FECHA");
        let _viernes = fechas.parse2( addDays(lunes0, 4), "USA_FECHA");
        let _sabado = fechas.parse2( addDays(lunes0, 5), "USA_FECHA");
        let _domingo = fechas.parse2( addDays(lunes0, 6), "USA_FECHA");

        let __lunes = fechas.parse2(_lunes, "ARG_FECHA").substring(0,5);
        let __martes = fechas.parse2(_martes, "ARG_FECHA").substring(0,5);
        let __miercoles = fechas.parse2(_miercoles, "ARG_FECHA").substring(0,5);
        let __jueves =  fechas.parse2(_jueves, "ARG_FECHA").substring(0,5);
        let __viernes = fechas.parse2(_viernes, "ARG_FECHA").substring(0,5);
        let __sabado = fechas.parse2(_sabado, "ARG_FECHA").substring(0,5);
        let __domingo = fechas.parse2(_domingo, "ARG_FECHA").substring(0,5);

        tabla.html("");
        const thead = `<thead class="thead-dark">
            <tr>
                <th></th>
                <th>Lun<br>${ __lunes }</th>
                <th>Mar<br>${ __martes }</th>
                <th>Mie<br>${ __miercoles }</th>
                <th>Jue<br>${ __jueves }</th>
                <th>Vie<br>${ __viernes }</th>
                <th>Sab<br>${ __sabado }</th>
                <th>Dom<br>${ __domingo }</th>
            </tr>
        </thead>`;
        tabla.append(thead);
        
        const tbody = `<tbody></tbody>`;
        tabla.append(tbody);

        let hx = hora0;
        let cc = 0;
        let trs = "";
        while(hx < hora1){
            trs += `<tr fila='${cc}' hora='${hx}'>
                <td><b>${hx}</b></td>
                <td dia='1' fecha='${ fechas.parse2(_lunes + "T" + hx , "USA_FECHA_HORA") }'></td>
                <td dia='2' fecha='${ fechas.parse2(_martes + "T" + hx , "USA_FECHA_HORA") }'></td>
                <td dia='3' fecha='${ fechas.parse2(_miercoles + "T" + hx , "USA_FECHA_HORA") }'></td>
                <td dia='4' fecha='${ fechas.parse2(_jueves + "T" + hx , "USA_FECHA_HORA") }'></td>
                <td dia='5' fecha='${ fechas.parse2(_viernes + "T" + hx , "USA_FECHA_HORA") }'></td>
                <td dia='6' fecha='${ fechas.parse2(_sabado + "T" + hx , "USA_FECHA_HORA") }'></td>
                <td dia='0' fecha='${ fechas.parse2(_domingo + "T" + hx , "USA_FECHA_HORA") }'></td>
            </tr>`;

            hx = this.sumarHoras(hx, _datos.conf.fraccionHoraria);
            cc = cc + 1;
            if(cc > 100) return;
        }
        tabla.find("tbody").html(trs);
    }
    //crea el calendario semanal desde hoy 7 dias a futuro
    crearCalendarioV2(ahora, tabla, hora0, hora1){
        let Fahora = typeof ahora == "string" ? ahora : fechas.parse2(ahora, "USA_FECHA_HORA");
        let Oahora = new Date(Fahora);

        tabla.html("");
        let thead = `<thead class="thead-dark"><tr><th></th>`;
        const auxDiaFecha = [];
        for(let i = 0; i < 7; i++){
            let nextDay = new Date(Fahora);
            nextDay.setDate(nextDay.getDate() + i);
            let dd = fechas.parse2(nextDay, "ARG_FECHA");
            thead += `<th>${fechas.DAY_OF_WEEK[nextDay.getDay()]}<br>${ dd.substring(0,5) }</th>`;
            auxDiaFecha.push({dia: nextDay.getDay(), fecha: dd});
        }
        thead += `</tr></thead>`;
        tabla.append(thead);
        
        const tbody = `<tbody></tbody>`;
        tabla.append(tbody);

        let hx = hora0;
        let cc = 0;
        let trs = "";
        while(hx < hora1){
            trs += `<tr fila='${cc}' hora='${hx}'>
                        <td><b>${hx}</b></td>`;
            for(let diaFecha of auxDiaFecha){
                trs += `<td dia='${diaFecha.dia}' fecha='${ fechas.parse2(diaFecha.fecha + "T" + hx , "USA_FECHA_HORA") }'></td>`
            }
            trs += `</tr>`;

            hx = this.sumarHoras(hx, _datos.conf.fraccionHoraria);
            cc = cc + 1;
            if(cc > 100) return;
        }
        tabla.find("tbody").html(trs);
    }
    separadorMiles(querySelector){
        if(typeof querySelector == "string") querySelector = $(querySelector)
        const separar = () =>{
            let valor = querySelector.val();
            valor = valor.replaceAll(" ", "");
            let partes = valor.split(".");
            let entero = Array.from(partes[0]);
            let decimal = partes.length == 2 ? partes[1] : "";

            let _entero = [];
            let c = 0;
            entero.reverse().forEach(e=>{
                _entero.push(e);
                c++;
                if(c == 3){
                    c = 0;
                    _entero.push(" ");
                }
            })
            _entero.reverse();
            
            entero = _entero.join("").trim();

            querySelector.val(decimal ? entero + "." + decimal : entero);
        }
        querySelector
        .on("focus", ()=>{
            separar();
        })
        .on("keyup", ()=>{
            separar();
        })
        .on("blur", ()=>{
            let valor = querySelector.val();
            valor = valor.replaceAll(" ", "");
            querySelector.val(valor);
        })
        
    }
}