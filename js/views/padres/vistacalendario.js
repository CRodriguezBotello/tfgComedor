import { Vista } from '../vista.js'; 

export class VistaCalendario extends Vista {
    constructor(controlador, div) {
        super(controlador, div);
        
        this.loadingMessage = document.createElement('p');
        this.loadingMessage.textContent = 'Cargando...';
        
        this.calendarContainer = document.getElementById('calendarGestion-container');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.monthYearHeader = document.getElementById('monthYear');
        let currentDate = new Date();
        this.currentMonth = currentDate.getMonth();
        this.idPadre = 0;
        this.currentYear = currentDate.getFullYear();
        this.diasComedor = null;
        this.festivos = null;
        this.hijos = null;
      
        this.prevMonthBtn.addEventListener('click', () => {
            this.changeMonth(-1);
            this.controlador.obtenerDatosCalendario(this.currentYear, this.currentMonth + 1); // Cambiado a this.currentYear y this.currentMonth
        });
        
        this.nextMonthBtn.addEventListener('click', () => {
            this.changeMonth(1);
            this.controlador.obtenerDatosCalendario(this.currentYear, this.currentMonth + 1); // Cambiado a this.currentYear y this.currentMonth
        });
    }

    changeMonth(change) {
        this.currentMonth += change;
        if (this.currentMonth < 0) {
            this.currentYear -= 1;
            this.currentMonth = 11;
        } else if (this.currentMonth > 11) {
            this.currentYear += 1;
            this.currentMonth = 0;
        }
      
        this.renderCalendars(this.hijos);
    }
    
    loadCalendarData(hijos) {
        // Mostrar el mensaje de "Cargando..."
        this.calendarContainer.innerHTML = '';
        this.calendarContainer.appendChild(this.loadingMessage);
    
        // Renderizar los datos
        this.renderCalendars(hijos);
    }
    
    renderCalendars(hijos) {
       this.hijos = hijos;
        if (hijos && hijos.length > 0) {
            this.calendarContainer.innerHTML = '';
    
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const monthName = monthNames[this.currentMonth];
            this.monthYearHeader.textContent = `${monthName} ${this.currentYear}`;
    
            hijos.forEach(child => {
                const childCalendar = document.createElement('div');
                childCalendar.classList.add('child-calendar');
    
                const childMonthYearHeader = document.createElement('h2');
                childMonthYearHeader.textContent = `${child.nombre}`;
                childCalendar.appendChild(childMonthYearHeader);
    
                const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
                const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
                let firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
                firstDayIndex = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    
                const weekRow = document.createElement('div');
                weekRow.classList.add('calendar', 'week-row');
                daysOfWeek.forEach(day => {
                    const weekDay = document.createElement('div');
                    weekDay.classList.add('day', 'week-day');
                    weekDay.textContent = day;
                    weekRow.appendChild(weekDay);
                });
                childCalendar.appendChild(weekRow);
    
                const daysList = document.createElement('div');
                daysList.classList.add('calendar');
    
                for (let i = 0; i < firstDayIndex; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.classList.add('day');
                    emptyDay.textContent = '';
                    daysList.appendChild(emptyDay);
                }
    
                for (let i = 1; i <= daysInMonth; i++) {
                    const day = document.createElement('div');
                    day.classList.add('day');
                    day.textContent = i;
                
                    const date = new Date(this.currentYear, this.currentMonth, i);
                    if (date.getDay() === 6 || date.getDay() === 0) {
                        day.classList.add('weekend');
                    }
                
                    const formattedDate = `${('0' + i).slice(-2)}-${('0' + (this.currentMonth + 1)).slice(-2)}-${this.currentYear}`;
                    if (child.dias.includes(formattedDate)) {
                        day.classList.add('blue-day');
                    }
                    daysList.appendChild(day);
                }
                childCalendar.appendChild(daysList);
                this.calendarContainer.appendChild(childCalendar);
            });
        } else {
            this.calendarContainer.innerHTML = '<p>No hay días marcados para mostrar.</p>';
        }
    }
    
    /**
     * Método para mostrar la vista.
     * @param {boolean} ver - Indica si se debe mostrar o no la vista.
     */
    mostrar(ver) {
        super.mostrar(ver); // Llama al método mostrar de la clase padre
      
        this.controlador.obtenerDatosCalendario(this.currentYear, this.currentMonth + 1);
    }

}