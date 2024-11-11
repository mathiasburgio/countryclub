const fechas = require("./../resources/Fechas");
const configurar = require("./configurar");

var myMongo = null;

const obtenerFechaTurnoFijoV2 = (dia) =>{
    for(let i = 0; i < 7; i++){
        let faux = new Date();
        faux.setDate(faux.getDate() + i);
        if(faux.getDay() === dia) return faux;
    }
}

const reservarFijos = async () =>{
    try{
        let t0 = performance.now();
        const objDate = new Date();
        objDate.setHours(0);
        objDate.setMinutes(0);
        const strDate = fechas.parse2(objDate, "USA_FECHA") + "T00:00";

        const turnosFijos = await myMongo.model("TurnoFijo").find();
        const turnos = await myMongo.model("Turno").find({ 
            fecha: { $gte: objDate } 
        });

        //console.log("fijos:", turnosFijos, "turnos:", turnos);

        let reservasFijas = 0;
        for(const tf of turnosFijos){
            let turnoOcupado = turnos.find(tx=> (tx.dia == tf.dia) && (tx.hora == tf.hora) && (tx.espacio == tf.espacio) )
            if(!turnoOcupado){
                reservasFijas++;
                let aux2 = obtenerFechaTurnoFijoV2(tf.dia);
                aux2 = new Date(fechas.parse2(aux2, "USA_FECHA") + "T" + tf.hora);
                
                let turno = await myMongo.model("Turno")({
                    fx: new Date(),
                    fecha: aux2,//fecha alquilada
                    dia: tf.dia,// 0-6 dom-sab
                    hora: tf.hora,// 11:00
                    cancelado: false,
                    esFijo: true,
                    espacio: tf.espacio,
                    usuario: {
                        uid: tf.uid,
                        nombre: tf.nombre
                    },
                    pago:{
                        cobrado: false
                    },
                }).save();
            }
        }
        let t1 = performance.now();
        console.log(`Turnos fijos generados en ${(t1 - t0).toFixed(3)}ms; reservas ${reservasFijas};`);
    }catch(err){
        console.log(err);
    }
}

setInterval(()=>{
    reservarFijos();
},(1000 * 60 * 10));//cada 10 min

module.exports.setMongoose = (conn) =>{ myMongo = conn; }
module.exports.reservarFijos = () => reservarFijos();