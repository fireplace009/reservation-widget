import { LitElement, html, css } from 'lit';
import { CONFIG } from './config.js';

export class TimeslotHeatmap extends LitElement {
  static properties = {
    date: { type: String },
    reservations: { type: Array },
    isDragging: { type: Boolean },
    selectionStart: { type: String },
    selectionEnd: { type: String },
    selectedSlots: { type: Array }
  };

  static styles = css`
    :host {
      display: block;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }

    h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }

    .slots-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .slot {
      flex: 1;
      min-width: 60px;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.1s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      position: relative;
    }

    .slot:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1;
    }

    .time {
      font-weight: bold;
      font-size: 0.9rem;
      margin-bottom: 0.2rem;
    }

    .info {
      font-size: 0.7rem;
    }

    .blocked-text {
      /* Removed color: red */
      font-weight: bold;
    }

    .lock-icon {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      color: #d32f2f;
    }

    .selected-slot {
      border: 2px solid #2196F3 !important;
      transform: scale(0.95);
    }
  `;

  constructor() {
    super();
    this.date = null;
    this.reservations = [];
    this.isDragging = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedSlots = [];
  }

  getSlots() {
    const slots = [];
    const [startHour, startMinute] = CONFIG.OPEN_HOURS.start.split(':').map(Number);
    const [endHour, endMinute] = CONFIG.OPEN_HOURS.end.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMinute, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);

    while (current < end) {
      const timeStr = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      slots.push(timeStr);
      current.setMinutes(current.getMinutes() + CONFIG.SLOT_DURATION);
    }

    return slots;
  }

  getSlotOccupancy(time) {
    // Filter reservations for this date and time
    // Note: this.reservations passed in should ideally be all reservations, 
    // but we need to make sure we filter by date if the parent doesn't do it strictly enough,
    // though the parent likely passes all reservations.
    // Actually, the parent passes `reservations` which is ALL reservations.
    // We need to filter by `this.date` AND `time`.

    const slotReservations = this.reservations.filter(r => r.date === this.date && r.time === time && r.status !== 'cancelled');
    const totalGuests = slotReservations.reduce((sum, r) => sum + Number(r.guests), 0);
    const blockedReservation = slotReservations.find(r => r.type === 'blocked');
    const isBlocked = !!blockedReservation;
    const blockedId = blockedReservation ? blockedReservation.id : null;

    const percentage = Math.min(totalGuests / CONFIG.MAX_CAPACITY_PER_SLOT, 1);

    return { totalGuests, percentage, isBlocked, blockedId };
  }

  getColor(percentage, isBlocked) {
    if (isBlocked) return '#e57373'; // Red for blocked
    if (percentage === 0) return '#e8f5e9'; // Very light green
    if (percentage < 0.3) return '#a5d6a7'; // Green
    if (percentage < 0.6) return '#fff59d'; // Yellow
    if (percentage < 0.9) return '#ffcc80'; // Orange
    return '#e57373'; // Red for full
  }

  handleMouseDown(time) {
    this.isDragging = true;
    this.selectionStart = time;
    this.selectionEnd = time;
  }

  handleMouseOver(time) {
    if (this.isDragging) {
      this.selectionEnd = time;
    }
  }

  handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const draggedSlots = this.getDraggedSlots();
    let newSelection = [...this.selectedSlots];

    if (draggedSlots.length === 1 && this.selectionStart === this.selectionEnd) {
      // Single click: toggle
      const slot = draggedSlots[0];
      if (newSelection.includes(slot)) {
        newSelection = newSelection.filter(s => s !== slot);
      } else {
        newSelection.push(slot);
      }
    } else {
      // Drag range: merge (union)
      draggedSlots.forEach(slot => {
        if (!newSelection.includes(slot)) {
          newSelection.push(slot);
        }
      });
    }

    this.selectedSlots = newSelection;
    this.dispatchEvent(new CustomEvent('selection-changed', {
      detail: { slots: this.selectedSlots },
      bubbles: true,
      composed: true
    }));

    this.selectionStart = null;
    this.selectionEnd = null;
  }

  getDraggedSlots() {
    if (!this.selectionStart || !this.selectionEnd) return [];

    const allSlots = this.getSlots();
    const startIndex = allSlots.indexOf(this.selectionStart);
    const endIndex = allSlots.indexOf(this.selectionEnd);

    if (startIndex === -1 || endIndex === -1) return [];

    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);

    return allSlots.slice(start, end + 1);
  }

  isSlotSelected(time) {
    // Selected if in persistent selection OR in current drag range
    if (this.selectedSlots.includes(time)) return true;

    if (this.isDragging && this.selectionStart && this.selectionEnd) {
      const dragged = this.getDraggedSlots();
      return dragged.includes(time);
    }

    return false;
  }

  render() {
    if (!this.date) return html``;

    const slots = this.getSlots();

    return html`
      <h3>Timeslots for ${this.date}</h3>
      <div 
        class="slots-container"
        @mouseleave=${this.handleMouseUp}
      >
        ${slots.map(time => {
      const { totalGuests, percentage, isBlocked, blockedId } = this.getSlotOccupancy(time);
      const color = this.getColor(percentage, isBlocked);
      const isSelected = this.isSlotSelected(time);

      return html`
            <div 
              class="slot ${isSelected ? 'selected-slot' : ''}" 
              style="background-color: ${color};"
              @mousedown=${() => this.handleMouseDown(time)}
              @mouseover=${() => this.handleMouseOver(time)}
              @mouseup=${this.handleMouseUp}
              title="${isBlocked ? 'Blocked' : `${totalGuests}/${CONFIG.MAX_CAPACITY_PER_SLOT} guests`}"
            >
              <span class="time ${isBlocked ? 'blocked-text' : ''}">${time}</span>
              <span class="info ${isBlocked ? 'blocked-text' : ''}">
                ${totalGuests} pax
              </span>
              ${isBlocked ? html`
                <svg class="lock-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              ` : ''}
            </div>
          `;
    })}
      </div>
    `;
  }
}

customElements.define('timeslot-heatmap', TimeslotHeatmap);
