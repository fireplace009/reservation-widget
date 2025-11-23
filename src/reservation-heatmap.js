import { LitElement, html, css } from 'lit';
import { CONFIG } from './config.js';

export class ReservationHeatmap extends LitElement {
  static properties = {
    reservations: { type: Array },
    currentDate: { type: Object },
    selectedDate: { type: String } // 'YYYY-MM-DD'
  };

  static styles = css`
    :host {
      display: block;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden; /* Prevent scrollbar on host */
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      flex-shrink: 0;
    }

    h2 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .nav-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      color: #666;
      padding: 0.2rem 0.5rem;
    }

    .nav-btn:hover {
      color: #333;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      flex-grow: 1;
      min-height: 0; /* Allow shrinking */
    }

    .day-header {
      text-align: center;
      font-weight: bold;
      color: #999;
      font-size: 0.7rem;
      padding-bottom: 0.2rem;
    }

    .day-cell {
      border-radius: 4px;
      padding: 0.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: #333;
      position: relative;
      transition: all 0.1s;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .day-cell:hover:not(.disabled) {
      transform: scale(1.02);
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .day-cell.selected {
      border-color: #333;
      z-index: 2;
    }

    .day-cell.disabled {
      background-color: #f5f5f5 !important;
      color: #ccc;
      cursor: default;
      pointer-events: none;
    }

    .day-number {
      font-weight: bold;
      margin-bottom: 0.1rem;
    }

    .occupancy-info {
      font-size: 0.6rem;
      opacity: 0.8;
    }

    .empty-cell {
      background: transparent;
    }
  `;

  constructor() {
    super();
    this.reservations = [];
    this.currentDate = new Date();
    this.selectedDate = null;
  }

  getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon

    // Adjust for Monday start (1 = Mon, ..., 7 = Sun)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    return { days, firstDay: adjustedFirstDay };
  }

  getOccupancy(day) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    // Create date string in YYYY-MM-DD format (local time)
    // Note: This simple string construction avoids timezone issues if we just want to match the string stored in DB
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dayReservations = this.reservations.filter(r => r.date === dateStr);
    const totalGuests = dayReservations.reduce((sum, r) => sum + Number(r.guests), 0);

    // Calculate max capacity for a day
    // Assuming open 17:00 - 22:00 (5 hours) * 4 slots/hr * 8 pax/slot = 160 pax max theoretical
    // Or use a simpler heuristic or config. 
    // Let's estimate daily capacity based on CONFIG.
    // CONFIG.OPEN_HOURS (e.g., 17-22 = 5 hours). Slots = 5 * 4 = 20 slots.
    // Max capacity = 20 slots * 8 pax = 160.
    // However, let's make it visual relative to a "busy" day, say 50 guests is busy.
    const maxDailyCapacity = 100; // Arbitrary "full" number for visualization

    const percentage = Math.min(totalGuests / maxDailyCapacity, 1);

    return { totalGuests, percentage };
  }

  getColor(percentage) {
    if (percentage === 0) return '#e8f5e9'; // Very light green

    // Interpolate between Green (#4CAF50) and Red (#F44336)
    // Simple logic: 
    // Low (0-0.3): Greenish
    // Med (0.3-0.7): Yellow/Orange
    // High (0.7-1.0): Red

    if (percentage < 0.1) return '#c8e6c9'; // Light Green
    if (percentage < 0.3) return '#a5d6a7'; // Green
    if (percentage < 0.5) return '#fff59d'; // Yellow
    if (percentage < 0.7) return '#ffcc80'; // Orange
    if (percentage < 0.9) return '#ef9a9a'; // Light Red
    return '#e57373'; // Red
  }

  handlePrevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
  }

  handleNextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
  }

  handleDayClick(day) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Toggle selection
    if (this.selectedDate === dateStr) {
      this.selectedDate = null;
    } else {
      this.selectedDate = dateStr;
    }

    this.dispatchEvent(new CustomEvent('date-selected', {
      detail: { date: this.selectedDate },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const { days, firstDay } = this.getDaysInMonth(this.currentDate);
    const monthName = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dayCells = [];

    // Empty cells for padding
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(html`<div class="empty-cell"></div>`);
    }

    // Day cells
    for (let day = 1; day <= days; day++) {
      const { totalGuests, percentage } = this.getOccupancy(day);
      const color = this.getColor(percentage);

      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ...

      // Check if day is open (CONFIG.OPEN_DAYS: [3,4,5,6] -> Wed, Thu, Fri, Sat)
      // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed...
      const isOpen = CONFIG.OPEN_DAYS.includes(dayOfWeek);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = this.selectedDate === dateStr;

      dayCells.push(html`
        <div 
          class="day-cell ${!isOpen ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
          style="background-color: ${!isOpen ? '' : color};" 
          title="${!isOpen ? 'Closed' : `${totalGuests} guests`}"
          @click=${() => isOpen ? this.handleDayClick(day) : null}
        >
          <span class="day-number">${day}</span>
          ${isOpen && totalGuests > 0 ? html`<span class="occupancy-info">${totalGuests} pax</span>` : ''}
        </div>
      `);
    }

    return html`
      <header>
        <button class="nav-btn" @click=${this.handlePrevMonth}>&lt;</button>
        <h2>${monthName}</h2>
        <button class="nav-btn" @click=${this.handleNextMonth}>&gt;</button>
      </header>
      <div class="calendar-grid">
        ${weekDays.map(d => html`<div class="day-header">${d}</div>`)}
        ${dayCells}
      </div>
    `;
  }
}


customElements.define('reservation-heatmap', ReservationHeatmap);
