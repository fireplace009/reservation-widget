import { LitElement, html, css } from 'lit';
import { getAllCustomers, updateCustomerStatus } from './customer-service.js';
import { logout } from './auth-service.js';

export class SuperAdminDashboard extends LitElement {
  static properties = {
    customers: { type: Array },
    loading: { type: Boolean },
    error: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
      color: #333;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    th {
      background-color: #f9f9f9;
      font-weight: 600;
      color: #555;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      display: inline-block;
    }

    .status-pending {
      background-color: #fff3e0;
      color: #e65100;
    }

    .status-approved {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status-declined {
      background-color: #ffebee;
      color: #c62828;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    button.action-btn {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .btn-approve {
      background-color: #4caf50;
      color: white;
    }

    .btn-decline {
      background-color: #ef5350;
      color: white;
    }

    .btn-approve:hover { background-color: #43a047; }
    .btn-decline:hover { background-color: #e53935; }

    .nav-btn {
      padding: 0.5rem 1rem;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      margin-right: 1rem;
    }

    .nav-btn:hover {
      background: #1976D2;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `;

  constructor() {
    super();
    this.customers = [];
    this.loading = false;
    this.error = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchCustomers();
  }

  async fetchCustomers() {
    this.loading = true;
    try {
      this.customers = await getAllCustomers();
    } catch (err) {
      console.error('Error fetching customers:', err);
      this.error = 'Failed to load customers';
    } finally {
      this.loading = false;
    }
  }

  async handleStatusChange(uid, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus} this customer?`)) return;

    try {
      await updateCustomerStatus(uid, newStatus);
      await this.fetchCustomers(); // Refresh list
    } catch (err) {
      console.error(`Error updating status to ${newStatus}:`, err);
      alert('Failed to update status');
    }
  }

  render() {
    return html`
      <header>
        <div>
          <h1>Super Admin Dashboard</h1>
          <p style="color: #666; margin-top: 0.5rem;">Manage Customer Approvals</p>
        </div>
        <div>
          <button class="nav-btn" @click=${() => this.dispatchEvent(new CustomEvent('navigate-customer'))}>
            Go to My Restaurant
          </button>
          <button class="logout-btn" @click=${logout}>Logout</button>
        </div>
      </header>

      <div class="card">
        ${this.loading ? html`<div class="loading">Loading customers...</div>` : ''}
        
        ${!this.loading && this.customers.length === 0 ? html`
          <div class="loading">No customers found.</div>
        ` : ''}

        ${!this.loading && this.customers.length > 0 ? html`
          <table>
            <thead>
              <tr>
                <th>Company / Name</th>
                <th>Email</th>
                <th>VAT</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.customers.map(customer => html`
                <tr>
                  <td>
                    <div style="font-weight: 500;">${customer.companyName || customer.displayName || 'No Name'}</div>
                    <div style="font-size: 0.85rem; color: #888;">Joined: ${new Date(customer.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>${customer.email}</td>
                  <td>${customer.vatNumber || '-'}</td>
                  <td>
                    <span class="status-badge status-${customer.status}">
                      ${customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      ${customer.status !== 'approved' ? html`
                        <button 
                          class="action-btn btn-approve"
                          @click=${() => this.handleStatusChange(customer.uid, 'approved')}
                        >
                          Approve
                        </button>
                      ` : ''}
                      
                      ${customer.status !== 'declined' ? html`
                        <button 
                          class="action-btn btn-decline"
                          @click=${() => this.handleStatusChange(customer.uid, 'declined')}
                        >
                          Decline
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('super-admin-dashboard', SuperAdminDashboard);
