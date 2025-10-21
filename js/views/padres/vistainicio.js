import { Vista } from '../vista.js';

export class VistaInicioPadres extends Vista {
    constructor(controlador, div) {
        super(controlador, div);

        this.hijos = null;
        this.diasComedor = null;
        this.festivos = null;

        this.listaMeses = [
            "Enero","Febrero","Marzo",
            "Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre",
            "Octubre","Noviembre","Diciembre"
        ];
        this.listaDias = ["L","M","X","J","V","S","D"];
        this.idPadre = 0;

        const fechaActual = new Date();
        this.mes = fechaActual.getMonth();
        this.anio = fechaActual.getFullYear();

        this.tabla = this.div.querySelector('#menuHijos');

        // Notificaciones
        this.DURACION_NOTIFICACION = 3000;
        this.VERTICAL_POSITION = 80;
        this.NOTIFICACIONES_GENERADAS = 0;
    }

    obtenerPadre(datos) {
        this.idPadre = datos.id;
    }

    obtenerFestivos(festivos) {
        this.festivos = festivos;
        this.controlador.dameHijosCalendario(this.idPadre);
    }

    inicializar(hijos) {
        this.hijos = hijos;
        if (this.hijos.length > 0) {
            const ids = this.hijos.map(h => h.id);
            this.controlador.obtenerDiasComedor(ids);
        } else {
            this.iniciarCalendario();
        }
    }

    montarCalendario(dias) {
        this.diasComedor = dias;
        this.iniciarCalendario();
    }

    iniciarCalendario() {
        if (this.hijos && this.hijos.length > 0) {
            this.tabla.style.display = 'block';
            this.tabla.innerHTML = '';
            this.crearBotones();
            this.crearCalendariosHijos();
        } else {
            this.tabla.style.display = 'none';
        }
    }

    crearBotones() {
        const contenedorBotones = document.createElement('div');
        contenedorBotones.classList.add('controlesMes');

        const botonMesAnterior = document.createElement('button');
        botonMesAnterior.textContent = 'Mes anterior';
        botonMesAnterior.addEventListener('click', this.mesAnterior.bind(this));

        const tituloMes = document.createElement('span');
        tituloMes.classList.add('tituloMes');
        tituloMes.textContent = `${this.listaMeses[this.mes]} ${this.anio}`;

        const botonMesSiguiente = document.createElement('button');
        botonMesSiguiente.textContent = 'Mes siguiente';
        botonMesSiguiente.addEventListener('click', this.mesSiguiente.bind(this));

        contenedorBotones.appendChild(botonMesAnterior);
        contenedorBotones.appendChild(tituloMes);
        contenedorBotones.appendChild(botonMesSiguiente);

        this.tabla.appendChild(contenedorBotones);
    }

    crearCalendariosHijos() {
        for (const hijo of this.hijos) {
            const contenedorHijo = document.createElement('div');
            contenedorHijo.classList.add('calendarioHijo');

            const tituloHijo = document.createElement('h3');
            tituloHijo.textContent = hijo.nombre;
            contenedorHijo.appendChild(tituloHijo);

            const tablaHijo = document.createElement('table');
            tablaHijo.classList.add('tablaMes');

            // Encabezado
            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            for (const dia of this.listaDias) {
                const th = document.createElement('th');
                th.textContent = dia;
                trHead.appendChild(th);
            }
            thead.appendChild(trHead);
            tablaHijo.appendChild(thead);

            // Cuerpo
            const tbody = document.createElement('tbody');
            const primerDiaMes = new Date(this.anio, this.mes, 1);
            const ultimoDiaMes = new Date(this.anio, this.mes + 1, 0);

            let fechaActual = new Date(primerDiaMes);
            fechaActual.setDate(fechaActual.getDate() - ((fechaActual.getDay() + 6) % 7)); // lunes previo

            while (fechaActual <= ultimoDiaMes || fechaActual.getDay() !== 1) {
                const tr = document.createElement('tr');

                for (let i = 0; i < 7; i++) {
                    const td = document.createElement('td');
                    const fecha = new Date(fechaActual);
                    const diaMes = fecha.getDate();
                    const esDelMes = (fecha.getMonth() === this.mes);
                    const fechaString = this.formatearStringFecha(fecha);

                    if (esDelMes) {
                        td.textContent = diaMes;

                        const ahora = new Date();
                        const manana = new Date(ahora);
                        manana.setDate(ahora.getDate() + 1);
                        manana.setHours(0,0,0,0);

                        const esFestivo = this.esDiaFestivo(fechaString);
                        const esFinDeSemana = (i === 5 || i === 6);

                        const esDiaBloqueado = 
                            fecha < ahora || 
                            fecha.toDateString() === ahora.toDateString() || 
                            (fecha.toDateString() === manana.toDateString() && ahora.getHours() >= 14);

                        const marcado = this.diasComedor && this.diasComedor.some(d => d.idPersona == hijo.id && d.dia === fechaString);
                        if (marcado) td.classList.add('marcado');

                        if (esFestivo || esFinDeSemana || esDiaBloqueado) {
                            td.classList.add('no-seleccionable');
                        } else {
                            td.classList.add('clicable');
                            td.addEventListener('click', () => {
                                const yaMarcado = td.classList.contains('marcado');
                                td.classList.toggle('marcado');
                                this.marcarDesmarcarDia(!yaMarcado, hijo.id, this.idPadre, false, fechaString);
                            });
                        }
                    } else {
                        td.classList.add('fueraMes');
                    }

                    tr.appendChild(td);
                    fechaActual.setDate(fechaActual.getDate() + 1);
                }

                // Botón marcar/desmarcar semana
                const tdBotonSemana = document.createElement('td');
                const botonSemana = document.createElement('button');
                botonSemana.textContent = 'Marcar semana';
                botonSemana.addEventListener('click', () => {
                    const marcar = botonSemana.textContent.startsWith('Marcar');
                    tr.querySelectorAll('td.clicable').forEach(tdDia => {
                        const diaString = this.formatearStringFecha(new Date(this.anio, this.mes, parseInt(tdDia.textContent)));
                        if (marcar && !tdDia.classList.contains('marcado')) {
                            tdDia.classList.add('marcado');
                            this.marcarDesmarcarDia(true, hijo.id, this.idPadre, false, diaString);
                        } else if (!marcar && tdDia.classList.contains('marcado')) {
                            tdDia.classList.remove('marcado');
                            this.marcarDesmarcarDia(false, hijo.id, this.idPadre, false, diaString);
                        }
                    });
                    botonSemana.textContent = marcar ? 'Desmarcar semana' : 'Marcar semana';
                });
                tdBotonSemana.appendChild(botonSemana);
                tr.appendChild(tdBotonSemana);

                tbody.appendChild(tr);
                if (fechaActual.getMonth() > this.mes && fechaActual.getDate() > 7) break;
            }

            tablaHijo.appendChild(tbody);
            contenedorHijo.appendChild(tablaHijo);

            // Botón marcar/desmarcar mes
            const botonMes = document.createElement('button');
            botonMes.textContent = 'Marcar mes';
            botonMes.addEventListener('click', () => {
                const marcar = botonMes.textContent.startsWith('Marcar');
                tablaHijo.querySelectorAll('td.clicable').forEach(tdDia => {
                    const diaString = this.formatearStringFecha(new Date(this.anio, this.mes, parseInt(tdDia.textContent)));
                    if (marcar && !tdDia.classList.contains('marcado')) {
                        tdDia.classList.add('marcado');
                        this.marcarDesmarcarDia(true, hijo.id, this.idPadre, false, diaString);
                    } else if (!marcar && tdDia.classList.contains('marcado')) {
                        tdDia.classList.remove('marcado');
                        this.marcarDesmarcarDia(false, hijo.id, this.idPadre, false, diaString);
                    }
                });
                botonMes.textContent = marcar ? 'Desmarcar mes' : 'Marcar mes';
            });
            contenedorHijo.appendChild(botonMes);

            this.tabla.appendChild(contenedorHijo);
        }
    }

    formatearStringFecha(fecha) {
        return fecha.getFullYear() + '-' +
            ("0" + (fecha.getMonth() + 1)).slice(-2) + '-' +
            ("0" + fecha.getDate()).slice(-2);
    }

    esDiaFestivo(stringFecha) {
        return (this.festivos && this.festivos.includes(stringFecha));
    }

    marcarDesmarcarDia(marcado, idHijo, idPadre, validarFecha, fecha) {
        const datos = {
            'dia': fecha,
            'idPersona': idHijo,
            'idPadre': idPadre
        };

        if (marcado) this.controlador.marcarDiaComedor(datos);
        else this.controlador.desmarcarDiaComedor(datos);

        this.mostrarNotificacion(marcado ? 'marcada' : 'desmarcada', fecha);
    }

    mostrarNotificacion(estado, fechaString) {
        this.NOTIFICACIONES_GENERADAS++;
        if (this.NOTIFICACIONES_GENERADAS === 7) {
            this.VERTICAL_POSITION = 80;
            this.NOTIFICACIONES_GENERADAS = 0;
        }

        let divNotificacion = document.getElementById('divNotificacion');
        let notificacion = document.createElement('div');

        notificacion.classList.add(estado === 'marcada' ? 'marcado' : 'desmarcado');

        const dia = fechaString.slice(-2);
        notificacion.textContent = (estado === 'marcada')
            ? `Ha marcado el día ${dia}.`
            : `Ha desmarcado el día ${dia}.`;

        notificacion.style.top = this.VERTICAL_POSITION + 'px';
        this.VERTICAL_POSITION += 60;

        divNotificacion.appendChild(notificacion);

        setTimeout(() => {
            divNotificacion.removeChild(notificacion);
        }, this.DURACION_NOTIFICACION);
    }

    mesAnterior() {
        this.mes--;
        if (this.mes < 0) {
            this.mes = 11;
            this.anio--;
        }
        this.refrescarCalendario();
    }

    mesSiguiente() {
        this.mes++;
        if (this.mes > 11) {
            this.mes = 0;
            this.anio++;
        }
        this.refrescarCalendario();
    }

    refrescarCalendario() {
        let inicioMes = new Date(this.anio, this.mes, 1);
        let finMes = new Date(this.anio, this.mes + 1, 0);
        this.controlador.obtenerFestivos(inicioMes, finMes);
    }

    mostrar(ver) {
        super.mostrar(ver);
        if (ver) this.refrescarCalendario();
    }
}
