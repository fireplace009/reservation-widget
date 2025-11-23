import { LitElement, html, css } from 'lit';
import { getReservationById, updateReservation } from './reservation-service.js';

export class CancellationPage extends LitElement {
    static properties = {
        reservation: { type: Object },
        loading: { type: Boolean },
        error: { type: String },
        success: { type: Boolean }
    };

    static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }

    .container {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    h1 {
      color: #ff7a5c;
      margin-top: 0;
    }

    .details {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      margin: 1.5rem 0;
      text-align: left;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      transition: opacity 0.2s;
      width: 100%;
    }

    .btn-cancel {
      background: #e57373;
      color: white;
    }

    .btn-cancel:hover {
      opacity: 0.9;
    }

    .error {
      color: #e57373;
      margin-bottom: 1rem;
    }

    .success-message {
      color: #4CAF50;
    }
    
    .loading {
      color: #666;
    }
  `;

    constructor() {
        super();
        this.reservation = null;
        this.loading = true;
        this.error = '';
        this.success = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchReservation();
    }

    async fetchReservation() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (!id) {
            this.error = 'No reservation ID provided.';
            this.loading = false;
            return;
        }

        try {
            const reservation = await getReservationById(id);
            if (!reservation) {
                this.error = 'Reservation not found.';
            } else {
                this.reservation = reservation;
            }
        } catch (err) {
            console.error(err);
            this.error = 'Failed to load reservation.';
        } finally {
            this.loading = false;
        }
    }

    async handleCancel() {
        if (!this.reservation) return;

        this.loading = true;
        try {
            await updateReservation(this.reservation.id, { status: 'cancelled' });
            this.success = true;
        } catch (err) {
            console.error(err);
            this.error = 'Failed to cancel reservation.';
        } finally {
            this.loading = false;
        }
    }

    render() {
        if (this.loading) {
            return html`<div class="container"><div class="loading">Loading...</div></div>`;
        }

        if (this.error) {
            return html`
        <div class="container">
          <h1>Error</h1>
          <p class="error">${this.error}</p>
        </div>
      `;
        }

        if (this.success) {
            return html`
        <div class="container">
          <h1 style="color: #4CAF50;">Cancelled</h1>
          <p>Your reservation has been successfully cancelled.</p>
          <p>We hope to see you another time!</p>
        </div>
      `;
        }

        if (this.reservation.status === 'cancelled') {
            return html`
        <div class="container">
          <h1 style="color: #e57373;">Already Cancelled</h1>
          <p>This reservation has already been cancelled.</p>
        </div>
      `;
        }

        return html`
      <div class="container">
        <h1>Cancel Reservation</h1>
        <p>Are you sure you want to cancel this reservation?</p>
        
        <div class="details">
          <p><strong>Date:</strong> ${this.reservation.date}</p>
          <p><strong>Time:</strong> ${this.reservation.time}</p>
          <p><strong>Name:</strong> ${this.reservation.name}</p>
          <p><strong>Guests:</strong> ${this.reservation.guests}</p>
        </div>

        <button class="btn btn-cancel" @click=${this.handleCancel}>
          Confirm Cancellation
        </button>
      </div>
    `;
    }
}

customElements.define('cancellation-page', CancellationPage);
