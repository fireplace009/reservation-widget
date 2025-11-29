import { LitElement, html, css } from 'lit';
import { CONFIG } from './config.js';

export class ReservationHeatmap extends LitElement {
  static properties = {
    reservations: { type: Array },
    currentDate: { type: Object },
    selectedDate: { type: String }, // 'YYYY-MM-DD' - for viewing details
    selectedDaysForBlocking: { type: Array } // Array of dates selected for blocking
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
      background-color: #e0e0e0 !important;
      color: #999;
      cursor: not-allowed;
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

    .lock-icon {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      color: #d32f2f;
    }

    .day-cell.selected-for-blocking {
      border: 2px solid #2196F3 !important;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }
  `;

  constructor() {
    super();
    this.reservations = [];
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedDaysForBlocking = [];
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

    const dayReservations = this.reservations.filter(r => r.date === dateStr && r.status !== 'cancelled');
    const totalGuests = dayReservations.reduce((sum, r) => sum + Number(r.guests), 0);

    // Check if fully blocked
    // A day is fully blocked if all slots defined in config have a type='blocked' reservation
    // We need to know how many slots there are.
    const [startHour, startMinute] = CONFIG.OPEN_HOURS.start.split(':').map(Number);
    const [endHour, endMinute] = CONFIG.OPEN_HOURS.end.split(':').map(Number);
    let current = new Date();
    current.setHours(startHour, startMinute, 0, 0);
    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);
    let slotCount = 0;
    while (current < end) {
      slotCount++;
      current.setMinutes(current.getMinutes() + CONFIG.SLOT_DURATION);
    }

    const blockedCount = dayReservations.filter(r => r.type === 'blocked').length;
    const isFullyBlocked = slotCount > 0 && blockedCount >= slotCount;

    const maxDailyCapacity = slotCount * CONFIG.MAX_CAPACITY_PER_SLOT;
    const percentage = maxDailyCapacity > 0 ? totalGuests / maxDailyCapacity : 0;

    return { totalGuests, percentage, isFullyBlocked };
  }

  getColor(percentage) {
    if (percentage === 0) return '#e8f5e9'; // Very light green
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

  handleDayClick(day, event) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check if Ctrl/Cmd key is pressed for multi-selection
    if (event && (event.ctrlKey || event.metaKey)) {
      this.toggleDaySelection(dateStr);
    } else {
      // Regular click - select for viewing details
      this.dispatchEvent(new CustomEvent('date-selected', {
        detail: { date: dateStr }
      }));
    }
  }

  toggleDaySelection(dateStr) {
    const index = this.selectedDaysForBlocking.indexOf(dateStr);
    if (index > -1) {
      // Remove from selection
      this.selectedDaysForBlocking = this.selectedDaysForBlocking.filter(d => d !== dateStr);
    } else {
      // Add to selection
      this.selectedDaysForBlocking = [...this.selectedDaysForBlocking, dateStr];
    }

    // Emit event with selected days
    this.dispatchEvent(new CustomEvent('days-selected', {
      detail: { dates: this.selectedDaysForBlocking },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const { days, firstDay } = this.getDaysInMonth(this.currentDate);
    const monthName = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dayCells = [];
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(html`<div class="day-cell empty-cell"></div>`);
    }

    for (let day = 1; day <= days; day++) {
      const { totalGuests, percentage, isFullyBlocked } = this.getOccupancy(day);
      const color = this.getColor(percentage);

      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ...

      // Check if day is open (CONFIG.OPEN_DAYS: [3,4,5,6] -> Wed, Thu, Fri, Sat)
      const isOpen = CONFIG.OPEN_DAYS.includes(dayOfWeek);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = this.selectedDate === dateStr;

      const isSelectedForBlocking = this.selectedDaysForBlocking.includes(dateStr);

      dayCells.push(html`
        <div 
          class="day-cell ${!isOpen ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isSelectedForBlocking ? 'selected-for-blocking' : ''}" 
          style="background-color: ${!isOpen ? '' : color}; color: ${isFullyBlocked ? 'red' : 'inherit'};" 
          title="${!isOpen ? 'Closed' : (isFullyBlocked ? 'Fully Blocked' : `${totalGuests} guests`)}"
          @click=${(e) => isOpen ? this.handleDayClick(day, e) : null}
        >
          <span class="day-number" style="${isFullyBlocked ? 'font-weight: 900;' : ''}">${day}</span>
          ${isOpen && totalGuests > 0 ? html`<span class="occupancy-info" style="${isFullyBlocked ? 'color: red;' : ''}">${totalGuests} pax</span>` : ''}
          ${isFullyBlocked ? html`
            <svg class="lock-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          ` : ''}
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
