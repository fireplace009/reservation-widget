
import { LitElement, html, css } from 'lit';
import { loginWithGoogle, logout, observeAuthState } from './auth-service.js';
import { getAllReservations, updateReservation, addReservation, deleteReservation } from './reservation-service.js';
import './data-grid.js';
import './reservation-widget.js';
import './voucher-widget.js';
import './reservation-heatmap.js';
import './reservation-heatmap.js';
import './timeslot-heatmap.js';
import './voucher-dashboard.js';
import './customer-profile-form.js';
import './super-admin-dashboard.js';
import { auth } from './firebase-config.js';
import { getUserRole } from './auth-service.js';
import { getCustomer } from './customer-service.js';
import { CONFIG } from './config.js';

export class AdminDashboard extends LitElement {
  static properties = {
    user: { type: Object },
    reservations: { type: Array },
    loading: { type: Boolean },
    showAddForm: { type: Boolean },
    showAddVoucherForm: { type: Boolean },
    selectedDate: { type: String },
    showBlockConfirm: { type: Boolean },
    slotsToBlock: { type: Array },
    blockAction: { type: String },
    selectedReservation: { type: Object }, // For editing
    showEditModal: { type: Boolean },
    isSidebarOpen: { type: Boolean },
    currentSelection: { type: Array },
    selectedDaysForBlocking: { type: Array },

    blockDescription: { type: String },
    blockDescription: { type: String },
    currentView: { type: String }, // 'reservations' or 'vouchers'
    userRole: { type: String }, // 'super_admin' or 'customer'
    customerStatus: { type: String }, // 'pending', 'approved', 'declined'
    isSuperAdminView: { type: Boolean }
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

    .sidebar-btn, .nav-item, .logout-btn {
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

    .sidebar-btn:hover, .nav-item:hover, .logout-btn:hover {
      background: #f5f5f5;
    }

    .nav-item.active {
      background: #e3f2fd;
      color: #1976d2;
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
    this.showAddVoucherForm = false;
    const today = new Date();
    this.selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.showBlockConfirm = false;
    this.slotsToBlock = [];
    this.selectedReservation = null;
    this.showEditModal = false;
    this.showEditModal = false;
    const storedSidebarState = localStorage.getItem('adminSidebarOpen');
    this.isSidebarOpen = storedSidebarState === null ? true : storedSidebarState === 'true';
    this.currentSelection = [];
    this.selectedDaysForBlocking = [];
    this.selectedDaysForBlocking = [];
    this.blockDescription = '';
    this.currentView = 'reservations';
    this.isSuperAdminView = true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeAuth = observeAuthState(async (user) => {
      this.user = user;
      if (user) {
        this.userRole = getUserRole(user);

        if (this.userRole === 'customer') {
          try {
            const profile = await getCustomer(user.uid);
            this.customerStatus = profile ? profile.status : 'pending';

            // If no profile exists, create one immediately
            if (!profile) {
              await import('./customer-service.js').then(m => m.createCustomerProfile(user));
              this.customerStatus = 'pending';
            }
          } catch (e) {
            console.error('Error fetching customer profile:', e);
            this.customerStatus = 'pending';
          }
        }

        if (this.userRole === 'super_admin' || (this.userRole === 'customer' && this.customerStatus === 'approved')) {
          this.fetchReservations();
        }
      } else {
        this.reservations = [];
        this.userRole = null;
        this.customerStatus = null;
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

  toggleAddVoucherForm() {
    this.showAddVoucherForm = !this.showAddVoucherForm;
  }

  handleOverlayClick(e) {
    if (e.target.classList.contains('modal-overlay')) {
      if (this.showEditModal) {
        this.closeEditModal();
      } else if (this.showAddForm) {
        this.toggleAddForm();
      } else if (this.showAddVoucherForm) {
        this.toggleAddVoucherForm();
      } else if (this.showBlockConfirm) {
        this.closeBlockConfirm();
      }
    }
  }

  handleReservationSuccess() {
    this.showAddForm = false;
    this.fetchReservations();
  }

  handleDateSelected(e) {
    if (this.selectedDate === e.detail.date) {
      this.selectedDate = null;
    } else {
      this.selectedDate = e.detail.date;
    }
  }

  handleDaysSelected(e) {
    this.selectedDaysForBlocking = e.detail.dates || [];
  }

  handleRowClick(e) {
    this.selectedReservation = e.detail;
    this.showEditModal = true;
  }

  get filteredReservations() {
    let filtered = this.reservations;

    // Filter out blocked slots (internal use)
    filtered = filtered.filter(r => r.type !== 'blocked');

    if (!this.selectedDate) {
      return filtered;
    }
    return filtered.filter(r => r.date === this.selectedDate);
  }

  handleSelectionChanged(e) {
    this.currentSelection = e.detail.slots || [];
  }

  handleBatchAction() {
    if (this.currentSelection.length === 0) return;
    this.handleSlotsSelected({ detail: { slots: this.currentSelection } });
  }

  clearSelection() {
    this.currentSelection = [];
  }

  async handleSlotsSelected(e) {
    const { slots } = e.detail;
    if (!slots || slots.length === 0) return;

    // Determine action: if ANY of the selected slots are blocked, we unblock.
    // Otherwise (all are free), we block.
    const dayReservations = this.reservations.filter(r => r.date === this.selectedDate && r.status !== 'cancelled');

    // Map slots to their current status
    const slotsStatus = slots.map(time => {
      const blockedReservation = dayReservations.find(r => r.time === time && r.type === 'blocked');
      return {
        time,
        isBlocked: !!blockedReservation,
        blockedId: blockedReservation ? blockedReservation.id : null
      };
    });

    const anyBlocked = slotsStatus.some(s => s.isBlocked);
    this.blockAction = anyBlocked ? 'unblock' : 'block';
    this.slotsToBlock = slotsStatus;
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

    if (!this.slotsToBlock || this.slotsToBlock.length === 0) return;

    try {
      const promises = [];

      if (this.blockAction === 'unblock') {
        // Unblock only the blocked ones
        const slotsToUnblock = this.slotsToBlock.filter(s => s.isBlocked && s.blockedId);
        slotsToUnblock.forEach(slot => {
          promises.push(deleteReservation(slot.blockedId));
        });
      } else {
        // Block only the unblocked ones
        const slotsToBlock = this.slotsToBlock.filter(s => !s.isBlocked);
        slotsToBlock.forEach(slot => {
          promises.push(addReservation({
            date: this.selectedDate,
            time: slot.time,
            guests: 0,
            name: 'BLOCKED',
            email: 'admin@internal',
            type: 'blocked'
          }));
        });
      }

      await Promise.all(promises);

      // Refresh
      this.fetchReservations();
      this.closeBlockConfirm();
    } catch (error) {
      console.error('Error updating slots:', error);
      alert(`Failed to ${this.blockAction} slots.`);
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

      // Determine which days to block
      const daysToBlock = this.selectedDaysForBlocking.length > 0
        ? this.selectedDaysForBlocking
        : [this.selectedDate];

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

      const promises = [];

      // Block all slots for each selected day
      for (const date of daysToBlock) {
        const dayReservations = this.reservations.filter(r => r.date === date && r.status !== 'cancelled');

        for (const time of slots) {
          const isBlocked = dayReservations.some(r => r.time === time && r.type === 'blocked');
          if (!isBlocked) {
            promises.push(addReservation({
              date: date,
              time: time,
              guests: 0,
              name: 'BLOCKED',
              email: 'admin@internal',
              type: 'blocked',
              blockDescription: this.blockDescription || ''
            }));
          }
        }
      }

      await Promise.all(promises);
      await this.fetchReservations();

      const dayCount = daysToBlock.length;
      alert(`${dayCount} day(s) blocked successfully`);

      // Clear selection
      this.selectedDaysForBlocking = [];
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

      // Determine which days to unblock
      const daysToUnblock = this.selectedDaysForBlocking.length > 0
        ? this.selectedDaysForBlocking
        : [this.selectedDate];

      const promises = [];

      // Unblock all slots for each selected day
      for (const date of daysToUnblock) {
        const dayReservations = this.reservations.filter(r => r.date === date && r.type === 'blocked');
        dayReservations.forEach(r => promises.push(deleteReservation(r.id)));
      }

      await Promise.all(promises);
      await this.fetchReservations();

      const dayCount = daysToUnblock.length;
      alert(`${dayCount} day(s) unblocked successfully`);

      // Clear selection
      this.selectedDaysForBlocking = [];
    } catch (error) {
      console.error('Error unblocking day:', error);
      alert('Failed to unblock day');
    } finally {
      this.loading = false;
    }
  }

  renderBlockConfirmContent() {
    if (this.blockAction === 'blockDay') {
      const dayCount = this.selectedDaysForBlocking.length > 0 ? this.selectedDaysForBlocking.length : 1;
      const daysList = this.selectedDaysForBlocking.length > 0
        ? this.selectedDaysForBlocking.join(', ')
        : this.selectedDate;

      return html`
        <p>Are you sure you want to <strong>BLOCK ALL SLOTS</strong> for <strong>${dayCount} day(s)</strong>?</p>
        <p style="font-size: 0.9rem; color: #666;">${daysList}</p>
        <p>This will prevent any new bookings for the selected day(s).</p>
        <div class="form-group">
          <label for="blockDescription">Description (optional):</label>
          <textarea 
            id="blockDescription" 
            .value=${this.blockDescription}
            @input=${(e) => this.blockDescription = e.target.value}
            placeholder="e.g., Closed for holidays"
            rows="3"
          ></textarea>
        </div>
      `;
    }
    if (this.blockAction === 'unblockDay') {
      const dayCount = this.selectedDaysForBlocking.length > 0 ? this.selectedDaysForBlocking.length : 1;
      const daysList = this.selectedDaysForBlocking.length > 0
        ? this.selectedDaysForBlocking.join(', ')
        : this.selectedDate;

      return html`
        <p>Are you sure you want to <strong>UNBLOCK ALL SLOTS</strong> for <strong>${dayCount} day(s)</strong>?</p>
        <p style="font-size: 0.9rem; color: #666;">${daysList}</p>
        <p>This will remove all blocked slots and make them available again.</p>
      `;
    }
    const count = this.slotsToBlock ? this.slotsToBlock.length : 0;
    const slotsList = this.slotsToBlock ? this.slotsToBlock.map(s => s.time).join(', ') : '';

    return html`
      <p>Are you sure you want to <strong>${this.blockAction === 'unblock' ? 'UNBLOCK' : 'BLOCK'}</strong> ${count} slot(s)?</p>
      <p><strong>${slotsList}</strong></p>
      <p>${this.blockAction === 'unblock' ? 'This will make the slots available for bookings again.' : 'This will prevent further bookings for these times.'}</p>
    `;
  }

  getBlockConfirmButtonText() {
    if (this.blockAction === 'blockDay') return 'Block Day';
    if (this.blockAction === 'unblockDay') return 'Unblock Day';
    if (this.blockAction === 'unblock') return 'Unblock Slots';
    return 'Block Slots';
  }

  closeBlockConfirm() {
    this.showBlockConfirm = false;
    this.slotsToBlock = [];
    // Optionally clear selection after action
    this.currentSelection = [];
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

  async handleCancelClick(e) {
    const reservation = e.detail;
    if (!reservation) return;

    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await updateReservation(reservation.id, { status: 'cancelled' });
      this.fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Failed to cancel reservation: ' + error.message);
    }
  }

  async handleUncancelClick(e) {
    const reservation = e.detail;
    if (!reservation) return;

    try {
      await updateReservation(reservation.id, { status: 'confirmed' });
      this.fetchReservations();
    } catch (error) {
      console.error('Error restoring reservation:', error);
      alert('Failed to restore reservation: ' + error.message);
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

    // Routing Logic
    if (this.userRole === 'super_admin' && this.isSuperAdminView) {
      return html`<super-admin-dashboard @navigate-customer=${() => this.isSuperAdminView = false}></super-admin-dashboard>`;
    }

    if (this.userRole === 'customer' && this.customerStatus !== 'approved') {
      return html`
        <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
            <button @click=${logout} style="background: transparent; border: 1px solid #ccc; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Logout</button>
          </div>
          <customer-profile-form .user=${this.user}></customer-profile-form>
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
            ${this.userRole === 'super_admin' ? html`
              <button class="sidebar-btn" @click=${() => this.isSuperAdminView = true} style="background: #e3f2fd; color: #1565c0; margin-bottom: 1rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span class="btn-text">Super Admin</span>
              </button>
            ` : ''}

            <button class="sidebar-btn primary" @click=${this.toggleAddForm}>
              <span style="font-size: 1.2rem;">+</span>
              <span class="btn-text">New Reservation</span>
            </button>

            <button class="sidebar-btn primary" @click=${this.toggleAddVoucherForm}>
              <span style="font-size: 1.2rem;">+</span>
              <span class="btn-text">New Voucher</span>
            </button>


            <button class="sidebar-btn" @click=${this.fetchReservations}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span class="btn-text">Refresh Data</span>
            </button>
          </div>

          <div class="sidebar-content">            
            <nav class="nav-menu">
            
              <button 
                class="nav-item ${this.currentView === 'reservations' ? 'active' : ''}"
                @click=${() => this.currentView = 'reservations'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="btn-text">Reservations</span>
              </button>

              <button 
                class="nav-item ${this.currentView === 'vouchers' ? 'active' : ''}"
                @click=${() => this.currentView = 'vouchers'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                  <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
                </svg>
                <span class="btn-text">Vouchers</span>
              </button>
            </nav>

            <div style="flex-grow: 1;"></div>

            <button class="logout-btn" @click=${logout}>
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
          ${this.currentView === 'reservations' ? html`
            <div class="dashboard-section heatmap-section">
              <reservation-heatmap 
                .reservations=${this.reservations}
                .selectedDate=${this.selectedDate}
                .selectedDaysForBlocking=${this.selectedDaysForBlocking}
                @date-selected=${this.handleDateSelected}
                @days-selected=${this.handleDaysSelected}
              ></reservation-heatmap>
            </div>
            
            ${this.selectedDate ? html`
              <div class="dashboard-section timeslot-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h3>${new Date(this.selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                  
                  ${this.currentSelection.length > 0 ? html`
                    <div class="selection-toolbar" style="display: flex; gap: 1rem; align-items: center; background: #e3f2fd; padding: 0.5rem 1rem; border-radius: 4px;">
                      <span>${this.currentSelection.length} slots selected</span>
                      <button @click=${() => this.handleBatchAction('block')} style="background: #e57373; padding: 0.5rem 1rem;">Block</button>
                      <button @click=${() => this.handleBatchAction('unblock')} style="background: #4CAF50; padding: 0.5rem 1rem;">Unblock</button>
                      <button @click=${this.clearSelection} style="background: none; color: #666; border: 1px solid #ccc; padding: 0.5rem;">
                        &times;
                      </button>
                    </div>
                  ` : html`<div></div>`}
                  
                  <div style="display: flex; gap: 1rem;">
                    <button @click=${() => this.handleUnblockDay()} style="background: #4CAF50; padding: 0.5rem 1rem;">Unblock Day</button>
                    <button @click=${() => this.handleBlockDay()} style="background: #e57373; padding: 0.5rem 1rem;">Block Day</button>
                  </div>
                </div>
                <div class="dashboard-section" style="flex: 0 0 auto; min-height: auto;">
                  <timeslot-heatmap
                    .date=${this.selectedDate}
                    .reservations=${this.reservations}
                    .selectedSlots=${this.currentSelection}
                    @selection-changed=${this.handleSelectionChanged}
                  ></timeslot-heatmap>
                </div>
              </div>
            ` : ''}

            <div class="dashboard-section grid-section">
              <data-grid 
                .items=${this.filteredReservations}
                @row-click=${this.handleRowClick}
                @cancel-click=${this.handleCancelClick}
                @uncancel-click=${this.handleUncancelClick}
              ></data-grid>
            </div>
          ` : html`
            <voucher-dashboard></voucher-dashboard>
          `}
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

      ${this.showAddVoucherForm ? html`
        <div class="modal-overlay" @click=${this.handleOverlayClick}>
          <div class="modal-content">
            <button class="close-button" @click=${this.toggleAddVoucherForm}>&times;</button>
            <voucher-widget></voucher-widget>
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
            <p><strong>Email:</strong> <a href="mailto:${this.selectedReservation.email}">${this.selectedReservation.email}</a></p>
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
            <h3>${this.blockAction === 'blockDay' ? 'Block Entire Day?' : (this.blockAction === 'unblockDay' ? 'Unblock Entire Day?' : (this.blockAction === 'unblock' ? 'Unblock Slots?' : 'Block Slots?'))}</h3>
            
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
