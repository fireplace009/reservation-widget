
import { LitElement, html, css } from 'lit';
import { loginWithGoogle, logout, observeAuthState } from './auth-service.js';
import { getAllReservations } from './reservation-service.js';
import './data-grid.js';
import './reservation-widget.js';
import './reservation-heatmap.js';
import './timeslot-heatmap.js';
import { auth } from './firebase-config.js';
import { addReservation, deleteReservation } from './reservation-service.js';
import { CONFIG } from './config.js';

export class AdminDashboard extends LitElement {
  static properties = {
    user: { type: Object },
    reservations: { type: Array },
    loading: { type: Boolean },
    showAddForm: { type: Boolean },
    selectedDate: { type: String },
    showBlockConfirm: { type: Boolean },
    slotToBlock: { type: Object }, // { time: '10:00', isBlocked: boolean, blockedId: string }
    blockAction: { type: String } // 'block' or 'unblock'
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }

    main {
      padding: 1rem 2rem; /* Reduced top/bottom padding */
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem; /* Reduced gap */
      height: calc(100vh - 80px); /* Full height minus header */
      box-sizing: border-box;
      overflow: hidden; /* Prevent full page scroll */
    }

    .dashboard-section {
      min-height: 0; /* Allow shrinking */
      overflow: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      padding: 1rem;
    }

    .heatmap-section {
      flex: 0 0 30%; /* Fixed 30% height */
      overflow: hidden; /* No scrollbar for heatmap container */
      padding: 0.5rem;
      min-height: 250px; /* Minimum height to ensure usability */
    }

    .grid-section {
      flex: 1; /* Remaining space */
      overflow: hidden; /* Container shouldn't scroll, child should */
      display: flex;
      flex-direction: column;
    }

    /* Ensure data-grid scrolls internally */
    data-grid {
      flex: 1;
      overflow: auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    h1 {
      color: #ff7a5c;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-small {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    button {
      padding: 0.8rem 1.5rem;
      background: #ff7a5c;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    button:hover {
      opacity: 0.9;
    }

    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
    }

    .login-container h2 {
      margin-bottom: 2rem;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      position: relative;
      width: 100%;
      max-width: 450px;
    }

    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      color: #333;
      font-size: 2rem;
      padding: 0.5rem;
      z-index: 1001;
      cursor: pointer;
      line-height: 1;
    }
  `;

  constructor() {
    super();
    this.user = null;
    this.reservations = [];
    this.loading = true;
    this.showAddForm = false;
    this.selectedDate = null;
    this.showBlockConfirm = false;
    this.slotToBlock = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeAuth = observeAuthState((user) => {
      this.user = user;
      if (user) {
        this.fetchReservations();
      } else {
        this.reservations = [];
      }
      this.loading = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }

  async fetchReservations() {
    try {
      this.reservations = await getAllReservations();
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }

  async handleLogin() {
    try {
      await loginWithGoogle();
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  }

  async handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
  }

  handleOverlayClick(e) {
    if (e.target.classList.contains('modal-overlay')) {
      this.toggleAddForm();
    }
  }

  handleReservationSuccess() {
    this.showAddForm = false;
    this.fetchReservations();
  }

  handleDateSelected(e) {
    this.selectedDate = e.detail.date;
  }

  get filteredReservations() {
    if (!this.selectedDate) {
      return this.reservations;
    }
    return this.reservations.filter(r => r.date === this.selectedDate);
  }

  async handleBlockSlot(e) {
    const { time, isBlocked, blockedId } = e.detail;

    this.slotToBlock = { time, blockedId };
    this.blockAction = isBlocked ? 'unblock' : 'block';
    this.showBlockConfirm = true;
  }

  async confirmBlockSlot() {
    if (!this.slotToBlock) return;

    const { time, blockedId } = this.slotToBlock;

    try {
      if (this.blockAction === 'unblock') {
        if (blockedId) {
          await deleteReservation(blockedId);
        }
      } else {
        await addReservation({
          date: this.selectedDate,
          time: time,
          guests: CONFIG.MAX_CAPACITY_PER_SLOT,
          name: 'BLOCKED',
          email: 'admin@internal',
          type: 'blocked'
        });
      }

      // Refresh
      this.fetchReservations();
      this.closeBlockConfirm();
    } catch (error) {
      console.error('Error updating slot:', error);
      alert(`Failed to ${this.blockAction} slot.`);
    }
  }

  closeBlockConfirm() {
    this.showBlockConfirm = false;
    this.slotToBlock = null;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    if (!this.user) {
      return html`
        <div class="login-container">
          <h1>Admin Login</h1>
          <button @click=${loginWithGoogle}>Login with Google</button>
        </div>
      `;
    }

    return html`
      <header>
        <h1>Reservations</h1>
        <div>
          <button @click=${this.toggleAddForm} style="margin-right: 1rem;">Add Reservation</button>
          <button @click=${this.fetchReservations} style="margin-right: 1rem; background: transparent; border: 1px solid #d4af37; color: #d4af37;">Refresh</button>
          <span style="margin-right: 1rem; opacity: 0.7;">${this.user.email}</span>
          <button @click=${this.handleLogout}>Logout</button>
        </div>
      </header>
      <main>
        <div class="dashboard-section heatmap-section">
          <reservation-heatmap 
            .reservations=${this.reservations}
            .selectedDate=${this.selectedDate}
            @date-selected=${this.handleDateSelected}
          ></reservation-heatmap>
        </div>
        
        ${this.selectedDate ? html`
          <div class="dashboard-section" style="flex: 0 0 auto; min-height: auto;">
            <timeslot-heatmap
              .date=${this.selectedDate}
              .reservations=${this.reservations}
              @block-slot=${this.handleBlockSlot}
            ></timeslot-heatmap>
          </div>
        ` : ''}

        <div class="dashboard-section grid-section">
          <data-grid .items=${this.filteredReservations}></data-grid>
        </div>
      </main>

      ${this.showAddForm ? html`
        <div class="modal-overlay" @click=${this.handleOverlayClick}>
          <div class="modal-content">
            <button class="close-button" @click=${this.toggleAddForm}>&times;</button>
            <reservation-widget @reservation-success=${this.handleReservationSuccess}></reservation-widget>
          </div>
        </div>
      ` : ''}

      ${this.showBlockConfirm ? html`
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 400px; text-align: center;">
            <h3>${this.blockAction === 'unblock' ? 'Unblock Slot?' : 'Block Slot?'}</h3>
            <p>Are you sure you want to <strong>${this.blockAction === 'unblock' ? 'UNBLOCK' : 'BLOCK'}</strong> the slot at <strong>${this.slotToBlock?.time}</strong>?</p>
            <p>${this.blockAction === 'unblock' ? 'This will make the slot available for bookings again.' : 'This will prevent further bookings for this time.'}</p>
            <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
              <button @click=${this.closeBlockConfirm} style="background: #ccc; color: #333;">Cancel</button>
              <button @click=${this.confirmBlockSlot} style="background: ${this.blockAction === 'unblock' ? '#4CAF50' : '#e57373'}; color: white;">
                ${this.blockAction === 'unblock' ? 'Unblock Slot' : 'Block Slot'}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('admin-dashboard', AdminDashboard);
