import { LitElement, html, css } from 'lit';
import { checkAvailability, addReservation, getReservations } from './reservation-service.js';
import { CONFIG } from './config.js';
import { getLocale, t } from './translations.js';
import { sendConfirmationEmail } from './email-service.js';

export class ReservationWidget extends LitElement {
  static properties = {
    date: { type: String },
    time: { type: String },
    guests: { type: Number },
    email: { type: String },
    state: { type: String }, // 'idle', 'loading', 'success', 'error'
    errorMessage: { type: String },
    availableSlots: { type: Array },
    bookedCounts: { type: Object },
    locale: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      --primary-color: #ff7a5c;
      --bg-color: #ffffff;
      --text-color: #333333;
      --input-bg: #f5f5f5;
      --border-radius: 12px;
    }

    .widget-container {
      background: var(--bg-color);
      padding: 2rem;
      border-radius: var(--border-radius);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 400px;
      color: var(--text-color);
      transition: all 0.3s ease;
    }

    h2 {
      margin-top: 0;
      text-align: center;
      color: var(--primary-color);
      margin-bottom: 1.5rem;
    }

    .logo {
      display: block;
      margin: 0 auto 1rem auto;
      width: 64px;
      height: 64px;
      object-fit: contain;
    }

    .form-group {
      margin-bottom: 1.2rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    input, select {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: var(--input-bg);
      color: var(--text-color);
      font-size: 1rem;
      box-sizing: border-box;
      transition: border-color 0.3s ease;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    button {
      width: 100%;
      padding: 1rem;
      background: var(--primary-color);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
      margin-top: 1rem;
    }

    button:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .message {
      text-align: center;
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
    }

    .error {
      background: rgba(255, 0, 0, 0.2);
      color: #ff6b6b;
    }

    .success {
      background: rgba(0, 255, 0, 0.2);
      color: #6bff6b;
    }
    
    /* Spinner */
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border-left-color: var(--primary-color);
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  constructor() {
    super();
    this.date = '';
    this.time = '';
    this.guests = 2;
    this.email = '';
    this.state = 'idle';
    this.errorMessage = '';
    this.availableSlots = [];
    this.bookedCounts = {};
    this.locale = getLocale();
  }

  // Generate time slots based on config
  get timeSlots() {
    const slots = [];
    const [startHour, startMinute] = CONFIG.OPEN_HOURS.start.split(':').map(Number);
    const [endHour, endMinute] = CONFIG.OPEN_HOURS.end.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMinute, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);

    while (current < end) {
      const timeString = current.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + CONFIG.SLOT_DURATION);
    }

    return slots;
  }

  isDayOpen(dateString) {
    if (!dateString) return false;
    const day = new Date(dateString).getDay();
    return CONFIG.OPEN_DAYS.includes(day);
  }

  async handleInput(e) {
    const { name, value } = e.target;
    this[name] = value;

    if (name === 'date') {
      if (!this.isDayOpen(value)) {
        this.errorMessage = t('closed_day', this.locale);
        this.time = '';
        this.bookedCounts = {};
      } else {
        this.errorMessage = '';
        await this.fetchAvailability(value);
      }
    }
  }

  async fetchAvailability(date) {
    try {
      const reservations = await getReservations(date);
      const counts = {};

      reservations.forEach(r => {
        counts[r.time] = (counts[r.time] || 0) + r.guests;
      });

      this.bookedCounts = counts;
      this.requestUpdate();
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.isDayOpen(this.date)) {
      this.errorMessage = t('closed_day', this.locale);
      return;
    }

    if (!this.date || !this.time || !this.email) {
      this.state = 'error';
      this.errorMessage = t('fill_all', this.locale);
      return;
    }

    this.state = 'loading';
    this.errorMessage = '';

    try {
      const isAvailable = await checkAvailability(this.date, this.time, Number(this.guests));

      if (!isAvailable) {
        throw new Error(t('slot_unavailable', this.locale));
      }

      await addReservation({
        date: this.date,
        time: this.time,
        guests: Number(this.guests),
        email: this.email,
      });

      // Send confirmation email
      sendConfirmationEmail({
        date: this.date,
        time: this.time,
        guests: Number(this.guests),
        email: this.email
      });

      this.state = 'success';
      this.dispatchEvent(new CustomEvent('reservation-success', {
        bubbles: true,
        composed: true,
        detail: { date: this.date, time: this.time }
      }));
    } catch (error) {
      this.state = 'error';
      this.errorMessage = error.message;
    }
  }

  reset() {
    this.state = 'idle';
    this.date = '';
    this.time = '';
    this.guests = 2;
    this.email = '';
    this.email = '';
    this.errorMessage = '';
    this.bookedCounts = {};
  }

  render() {
    if (this.state === 'success') {
      const formattedDate = new Date(this.date).toLocaleDateString(this.locale, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      return html`
        <div class="widget-container">
          <h2>${t('reservation_confirmed', this.locale)}</h2>
          <div class="message success">
            <p>${t('thank_you_message', this.locale, { guests: this.guests, date: formattedDate, time: this.time })}</p>
            <p>${t('confirmation_email', this.locale, { email: this.email })}</p>
          </div>
          <button @click=${this.reset}>${t('make_another', this.locale)}</button>
        </div>
      `;
    }

    return html`
      <div class="widget-container">
        <img src="/logo.png" alt="Logo" class="logo" />
        <h2>${t('reserve_table', this.locale)}</h2>
        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="date">${t('date', this.locale)}</label>
            <input type="date" id="date" name="date" .value=${this.date} @input=${this.handleInput} required />
          </div>

          <div class="form-group">
            <label for="time">${t('time', this.locale)}</label>
            <select id="time" name="time" .value=${this.time} @change=${this.handleInput} required ?disabled=${!this.date || !!this.errorMessage}>
              <option value="" disabled selected>${t('select_time', this.locale)}</option>
              ${this.timeSlots.map(slot => {
      const booked = this.bookedCounts[slot] || 0;
      const remaining = CONFIG.MAX_CAPACITY_PER_SLOT - booked;
      const isDisabled = this.guests > remaining;
      const label = isDisabled ? t('slot_full', this.locale, { time: slot }) : slot;
      return html`<option value="${slot}" ?disabled=${isDisabled}>${label}</option>`;
    })}
            </select>
          </div>

          <div class="form-group">
            <label for="guests">${t('guests', this.locale)}</label>
            <input type="number" id="guests" name="guests" min="1" max="10" .value=${this.guests} @input=${this.handleInput} required />
          </div>

          <div class="form-group">
            <label for="email">${t('email', this.locale)}</label>
            <input type="email" id="email" name="email" placeholder="${t('placeholder_email', this.locale)}" .value=${this.email} @input=${this.handleInput} required />
          </div>

          ${this.state === 'error' || this.errorMessage ? html`<div class="message error">${this.errorMessage}</div>` : ''}

          <button type="submit" ?disabled=${this.state === 'loading' || !!this.errorMessage}>
            ${this.state === 'loading' ? html`<div class="spinner"></div>` : t('confirm_reservation', this.locale)}
          </button>
        </form>
      </div>
    `;
  }
}

customElements.define('reservation-widget', ReservationWidget);
