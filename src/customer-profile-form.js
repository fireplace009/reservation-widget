import { LitElement, html, css } from 'lit';
import { createCustomerProfile, getCustomer } from './customer-service.js';

export class CustomerProfileForm extends LitElement {
    static properties = {
        user: { type: Object },
        profile: { type: Object },
        loading: { type: Boolean },
        message: { type: String },
        error: { type: String }
    };

    static styles = css`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }

    .card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    h2 {
      margin-top: 0;
      color: #333;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.2rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #555;
    }

    input {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      box-sizing: border-box;
    }

    button {
      background-color: #ff7a5c;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 1rem;
    }

    button:hover {
      opacity: 0.9;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .message {
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .error {
      background-color: #ffebee;
      color: #c62828;
    }

    .status-banner {
      background-color: #fff3e0;
      color: #e65100;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `;

    constructor() {
        super();
        this.user = null;
        this.profile = {
            companyName: '',
            vatNumber: '',
            address: '',
            logoUrl: ''
        };
        this.loading = false;
        this.message = '';
        this.error = '';
    }

    updated(changedProperties) {
        if (changedProperties.has('user') && this.user) {
            this.fetchProfile();
        }
    }

    async fetchProfile() {
        try {
            const profile = await getCustomer(this.user.uid);
            if (profile) {
                this.profile = { ...this.profile, ...profile };
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    }

    handleInput(e) {
        const { name, value } = e.target;
        this.profile = { ...this.profile, [name]: value };
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.loading = true;
        this.message = '';
        this.error = '';

        try {
            await createCustomerProfile(this.user, this.profile);
            this.message = 'Profile saved successfully!';
            // Re-fetch to ensure we have the latest state (including status)
            await this.fetchProfile();
        } catch (err) {
            console.error('Error saving profile:', err);
            this.error = 'Failed to save profile. Please try again.';
        } finally {
            this.loading = false;
        }
    }

    render() {
        if (!this.user) return html``;

        return html`
      <div class="card">
        <h2>Business Profile</h2>

        ${this.profile.status === 'pending' ? html`
          <div class="status-banner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Your account is pending approval. You can update your details below.</span>
          </div>
        ` : ''}

        ${this.message ? html`<div class="message success">${this.message}</div>` : ''}
        ${this.error ? html`<div class="message error">${this.error}</div>` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label>Company Name</label>
            <input 
              type="text" 
              name="companyName" 
              .value=${this.profile.companyName} 
              @input=${this.handleInput} 
              required 
              placeholder="My Awesome Restaurant"
            />
          </div>

          <div class="form-group">
            <label>VAT Number</label>
            <input 
              type="text" 
              name="vatNumber" 
              .value=${this.profile.vatNumber} 
              @input=${this.handleInput} 
              placeholder="BE 0123.456.789"
            />
          </div>

          <div class="form-group">
            <label>Address</label>
            <input 
              type="text" 
              name="address" 
              .value=${this.profile.address} 
              @input=${this.handleInput} 
              placeholder="Main Street 1, 1000 Brussels"
            />
          </div>

          <div class="form-group">
            <label>Logo URL</label>
            <input 
              type="url" 
              name="logoUrl" 
              .value=${this.profile.logoUrl} 
              @input=${this.handleInput} 
              placeholder="https://example.com/logo.png"
            />
          </div>

          <button type="submit" ?disabled=${this.loading}>
            ${this.loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    `;
    }
}

customElements.define('customer-profile-form', CustomerProfileForm);
