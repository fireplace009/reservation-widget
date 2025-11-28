
import { LitElement, html, css } from 'lit';
import { loginWithGoogle, logout, observeAuthState } from './auth-service.js';
import { getAllReservations, updateReservation, addReservation, deleteReservation } from './reservation-service.js';
import './data-grid.js';
import './reservation-widget.js';
import './reservation-heatmap.js';
import './timeslot-heatmap.js';
import { auth } from './firebase-config.js';
import { CONFIG } from './config.js';

export class AdminDashboard extends LitElement {
  static properties = {
    user: { type: Object },
    reservations: { type: Array },
    loading: { type: Boolean },
    showAddForm: { type: Boolean },
    selectedDate: { type: String },
    showBlockConfirm: { type: Boolean },
    slotToBlock: { type: Object },
    blockAction: { type: String },
    selectedReservation: { type: Object }, // For editing
    showEditModal: { type: Boolean },
    isSidebarOpen: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      height: 100vh;
    }

    .layout-container {
      display: flex;
      height: 100%;
      width: 100%;
    }

    aside {
      background: white;
      border-right: 1px solid #e0e0e0;
      transition: width 0.3s ease;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      z-index: 10;
      width: 260px;
    }

    aside.closed {
      width: 60px;
    }

    .sidebar-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      box-sizing: border-box;
      border-bottom: 1px solid #f0f0f0;
    }

    .sidebar-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
      flex: 1;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow: hidden;
      white-space: nowrap;
    }

    h1 {
      color: #ff7a5c;
      margin: 0;
      font-size: 1.2rem;
      opacity: 1;
      transition: opacity 0.2s;
    }

    aside.closed h1,
    aside.closed .user-email,
    aside.closed .btn-text {
      opacity: 0;
      width: 0;
      display: none;
    }

    .toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    main {
      flex: 1;
      padding: 1rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      background-color: #f4f4f4;
    }

    .dashboard-section {
      min-height: 0;
      overflow: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      padding: 1rem;
    }

    .heatmap-section {
      flex: 0 0 30%;
      overflow: hidden;
      padding: 0.5rem;
      min-height: 250px;
    }

    .grid-section {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    data-grid {
      flex: 1;
      overflow: auto;
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

    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.8rem;
      width: 100%;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #555;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;
      white-space: nowrap;
      overflow: hidden;
    }

    .sidebar-btn:hover {
      background: #f5f5f5;
    }

    .sidebar-btn.primary {
      background: #ff7a5c;
      color: white;
    }

    .sidebar-btn.primary:hover {
      opacity: 0.9;
    }

    .sidebar-btn svg {
      flex-shrink: 0;
    }

    .user-info {
      margin-top: auto;
      padding: 1rem;
      border-top: 1px solid #f0f0f0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .user-email {
      font-size: 0.8rem;
      color: #888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
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

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input, textarea {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
      gap: 1rem;
    }

    .btn-cancel {
      background: #e57373;
    }

    .btn-save {
      background: #4CAF50;
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
    this.selectedReservation = null;
    this.showEditModal = false;
    this.showEditModal = false;
    const storedSidebarState = localStorage.getItem('adminSidebarOpen');
    this.isSidebarOpen = storedSidebarState === null ? true : storedSidebarState === 'true';
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
      this.closeEditModal();
    }
  }

  handleReservationSuccess() {
    this.showAddForm = false;
    this.fetchReservations();
  }

  handleDateSelected(e) {
    this.selectedDate = e.detail.date;
  }

  handleRowClick(e) {
    this.selectedReservation = e.detail;
    this.showEditModal = true;
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
    if (this.blockAction === 'blockDay') {
      await this.executeBlockDay();
      this.closeBlockConfirm();
      return;
    }

    if (this.blockAction === 'unblockDay') {
      await this.executeUnblockDay();
      this.closeBlockConfirm();
      return;
    }

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
          guests: 0, // Blocked slots now have 0 guests
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

  async handleBlockDay() {
    console.log('Block Day clicked for:', this.selectedDate);
    if (!this.selectedDate) return;

    this.blockAction = 'blockDay';
    this.showBlockConfirm = true;
  }

  async executeBlockDay() {
    this.loading = true;
    try {
      console.log('Starting Block Day process...');
      // Generate all slots
      const [startHour, startMinute] = CONFIG.OPEN_HOURS.start.split(':').map(Number);
      const [endHour, endMinute] = CONFIG.OPEN_HOURS.end.split(':').map(Number);
      let current = new Date();
      current.setHours(startHour, startMinute, 0, 0);
      const end = new Date();
      end.setHours(endHour, endMinute, 0, 0);

      const slots = [];
      while (current < end) {
        slots.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        current.setMinutes(current.getMinutes() + CONFIG.SLOT_DURATION);
      }

      // Get existing reservations for the day
      const dayReservations = this.reservations.filter(r => r.date === this.selectedDate && r.status !== 'cancelled');

      // Create blocked reservations for slots that aren't already blocked
      const promises = [];
      for (const time of slots) {
        const isBlocked = dayReservations.some(r => r.time === time && r.type === 'blocked');
        if (!isBlocked) {
          promises.push(addReservation({
            date: this.selectedDate,
            time: time,
            guests: 0,
            name: 'BLOCKED',
            email: 'admin@internal',
            type: 'blocked'
          }));
        }
      }

      await Promise.all(promises);
      await this.fetchReservations();
      alert('Day blocked successfully');
    } catch (error) {
      console.error('Error blocking day:', error);
      alert('Failed to block day');
    } finally {
      this.loading = false;
    }
  }

  async handleUnblockDay() {
    console.log('Unblock Day clicked for:', this.selectedDate);
    if (!this.selectedDate) return;

    this.blockAction = 'unblockDay';
    this.showBlockConfirm = true;
  }

  async executeUnblockDay() {
    this.loading = true;
    try {
      console.log('Starting Unblock Day process...');
      // Get existing reservations for the day
      const dayReservations = this.reservations.filter(r => r.date === this.selectedDate && r.type === 'blocked');

      const promises = dayReservations.map(r => deleteReservation(r.id));
      await Promise.all(promises);

      await this.fetchReservations();
      alert('Day unblocked successfully');
    } catch (error) {
      console.error('Error unblocking day:', error);
      alert('Failed to unblock day');
    } finally {
      this.loading = false;
    }
  }

  renderBlockConfirmContent() {
    if (this.blockAction === 'blockDay') {
      return html`
        <p>Are you sure you want to <strong>BLOCK ALL SLOTS</strong> for <strong>${this.selectedDate}</strong>?</p>
        <p>This will prevent any new bookings for the entire day.</p>
      `;
    }
    if (this.blockAction === 'unblockDay') {
      return html`
        <p>Are you sure you want to <strong>UNBLOCK ALL SLOTS</strong> for <strong>${this.selectedDate}</strong>?</p>
        <p>This will remove all blocked slots and make them available again.</p>
      `;
    }
    return html`
      <p>Are you sure you want to <strong>${this.blockAction === 'unblock' ? 'UNBLOCK' : 'BLOCK'}</strong> the slot at <strong>${this.slotToBlock?.time}</strong>?</p>
      <p>${this.blockAction === 'unblock' ? 'This will make the slot available for bookings again.' : 'This will prevent further bookings for this time.'}</p>
    `;
  }

  getBlockConfirmButtonText() {
    if (this.blockAction === 'blockDay') return 'Block Day';
    if (this.blockAction === 'unblockDay') return 'Unblock Day';
    if (this.blockAction === 'unblock') return 'Unblock Slot';
    return 'Block Slot';
  }

  closeBlockConfirm() {
    this.showBlockConfirm = false;
    this.slotToBlock = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedReservation = null;
  }

  handleEditInput(e) {
    const { name, value } = e.target;
    this.selectedReservation = { ...this.selectedReservation, [name]: value };
  }

  async saveReservation() {
    if (!this.selectedReservation) return;

    try {
      await updateReservation(this.selectedReservation.id, {
        guests: Number(this.selectedReservation.guests),
        description: this.selectedReservation.description || ''
      });
      this.fetchReservations();
      this.closeEditModal();
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Failed to update reservation.');
    }
  }

  async cancelReservation() {
    console.log('Cancel button clicked');
    if (!this.selectedReservation) {
      console.error('No selected reservation');
      return;
    }

    console.log('Selected reservation:', this.selectedReservation);

    // Removed confirmation dialog as it was causing issues/confusion
    // if (!window.confirm('Are you sure you want to cancel this reservation?')) {
    //     console.log('Cancellation aborted by user');
    //     return;
    // }

    try {
      console.log('Calling updateReservation with status: cancelled');
      await updateReservation(this.selectedReservation.id, { status: 'cancelled' });
      console.log('Reservation updated successfully');
      this.fetchReservations();
      this.closeEditModal();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Failed to cancel reservation: ' + error.message);
    }
  }

  async uncancelReservation() {
    console.log('Uncancel button clicked');
    if (!this.selectedReservation) return;

    try {
      console.log('Calling updateReservation with status: confirmed');
      await updateReservation(this.selectedReservation.id, { status: 'confirmed' });
      console.log('Reservation restored successfully');
      this.fetchReservations();
      this.closeEditModal();
    } catch (error) {
      console.error('Error restoring reservation:', error);
      alert('Failed to restore reservation: ' + error.message);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    localStorage.setItem('adminSidebarOpen', this.isSidebarOpen);
  }

  render() {
    if (this.loading) {
      return html`
      <div class="loading">Loading...</div>
      `;
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
      <div class="layout-container">
        <aside class="${this.isSidebarOpen ? 'open' : 'closed'}">
          <div class="sidebar-header">
            <div class="logo-area">
               <span style="font-size: 1.5rem;">🔥</span>
               <h1>Admin</h1>
            </div>
            <button class="toggle-btn" @click=${this.toggleSidebar}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
          
          <div class="sidebar-content">
            <button class="sidebar-btn primary" @click=${this.toggleAddForm}>
              <span style="font-size: 1.2rem;">+</span>
              <span class="btn-text">New Reservation</span>
            </button>

            <button class="sidebar-btn" @click=${this.fetchReservations}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span class="btn-text">Refresh Data</span>
            </button>
          </div>

          <div class="user-info">
            <div class="user-email" title="${this.user.email}">${this.user.email}</div>
            <button class="sidebar-btn" @click=${this.handleLogout} style="color: #e57373;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span class="btn-text">Logout</span>
            </button>
          </div>
        </aside>

        <main>
          <div class="dashboard-section heatmap-section">
            <reservation-heatmap 
              .reservations=${this.reservations}
              .selectedDate=${this.selectedDate}
              @date-selected=${this.handleDateSelected}
            ></reservation-heatmap>
          </div>
          
          ${this.selectedDate ? html`
            <div class="action-row" style="padding: 0 0 1rem 0; display: flex; justify-content: flex-end; gap: 1rem;">
              <button @click=${() => this.handleUnblockDay()} style="background: #4CAF50; padding: 0.5rem 1rem;">Unblock Day</button>
              <button @click=${() => this.handleBlockDay()} style="background: #e57373; padding: 0.5rem 1rem;">Block Day</button>
            </div>
            <div class="dashboard-section" style="flex: 0 0 auto; min-height: auto;">
              <timeslot-heatmap
                .date=${this.selectedDate}
                .reservations=${this.reservations}
                @block-slot=${this.handleBlockSlot}
              ></timeslot-heatmap>
            </div>
          ` : ''}

          <div class="dashboard-section grid-section">
            <data-grid 
              .items=${this.filteredReservations}
              @row-click=${this.handleRowClick}
            ></data-grid>
          </div>
        </main>
      </div>

      ${this.showAddForm ? html`
        <div class="modal-overlay" @click=${this.handleOverlayClick}>
          <div class="modal-content">
            <button class="close-button" @click=${this.toggleAddForm}>&times;</button>
            <reservation-widget @reservation-success=${this.handleReservationSuccess}></reservation-widget>
          </div>
        </div>
      ` : ''}

      ${this.showEditModal && this.selectedReservation ? html`
        <div class="modal-overlay" @click=${this.handleOverlayClick}>
          <div class="modal-content">
            <button class="close-button" @click=${this.closeEditModal}>&times;</button>
            <h2>Edit Reservation</h2>
            <p><strong>Date:</strong> ${this.selectedReservation.date} at ${this.selectedReservation.time}</p>
            <p><strong>Name:</strong> ${this.selectedReservation.name}</p>
            <p><strong>Email:</strong> ${this.selectedReservation.email}</p>
            <p><strong>Phone:</strong> ${this.selectedReservation.phone || '-'}</p>
            
            <div class="form-group">
              <label>Guests</label>
              <input type="number" name="guests" .value=${this.selectedReservation.guests} @input=${this.handleEditInput} />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea name="description" .value=${this.selectedReservation.description || ''} @input=${this.handleEditInput}></textarea>
            </div>

            <div class="form-group">
              <label>Status: <strong>${this.selectedReservation.status || 'confirmed'}</strong></label>
            </div>

            <div class="modal-actions">
              ${this.selectedReservation.status !== 'cancelled' ? html`
                <button type="button" class="btn-cancel" @click=${() => this.cancelReservation()}>Cancel Reservation</button>
              ` : html`
                <button type="button" class="btn-save" style="background: #2196F3;" @click=${() => this.uncancelReservation()}>Uncancel Reservation</button>
              `}
              <button type="button" class="btn-save" @click=${() => this.saveReservation()}>Save Changes</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this.showBlockConfirm ? html`
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 400px; text-align: center;">
            <h3>${this.blockAction === 'blockDay' ? 'Block Entire Day?' : (this.blockAction === 'unblockDay' ? 'Unblock Entire Day?' : (this.blockAction === 'unblock' ? 'Unblock Slot?' : 'Block Slot?'))}</h3>
            
            ${this.renderBlockConfirmContent()}

            <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
              <button @click=${this.closeBlockConfirm} style="background: #ccc; color: #333; padding: 0.5rem 1rem;">Cancel</button>
              <button @click=${this.confirmBlockSlot} style="background: ${this.blockAction === 'unblock' || this.blockAction === 'unblockDay' ? '#4CAF50' : '#e57373'}; color: white; padding: 0.5rem 1rem;">
                ${this.getBlockConfirmButtonText()}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('admin-dashboard', AdminDashboard);
