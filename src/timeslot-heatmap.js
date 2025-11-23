import { LitElement, html, css } from 'lit';
import { CONFIG } from './config.js';

export class TimeslotHeatmap extends LitElement {
  static properties = {
    date: { type: String },
    reservations: { type: Array }
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
      color: red;
      font-weight: bold;
    }
  `;

  constructor() {
    super();
    this.date = null;
    this.reservations = [];
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

  handleSlotClick(time, isBlocked, blockedId) {
    this.dispatchEvent(new CustomEvent('block-slot', {
      detail: { time, isBlocked, blockedId },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.date) return html``;

    const slots = this.getSlots();

    return html`
      <h3>Timeslots for ${this.date}</h3>
      <div class="slots-container">
        ${slots.map(time => {
      const { totalGuests, percentage, isBlocked, blockedId } = this.getSlotOccupancy(time);
      const color = this.getColor(percentage, isBlocked);

      return html`
            <div 
              class="slot" 
              style="background-color: ${color};"
              @click=${() => this.handleSlotClick(time, isBlocked, blockedId)}
              title="${isBlocked ? 'Blocked' : `${totalGuests}/${CONFIG.MAX_CAPACITY_PER_SLOT} guests`}"
            >
              <span class="time ${isBlocked ? 'blocked-text' : ''}">${time}</span>
              <span class="info ${isBlocked ? 'blocked-text' : ''}">
                ${totalGuests} pax
              </span>
            </div>
          `;
    })}
      </div>
    `;
  }
}

customElements.define('timeslot-heatmap', TimeslotHeatmap);
