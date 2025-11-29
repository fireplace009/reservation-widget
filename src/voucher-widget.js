import { LitElement, html, css } from 'lit';
import { createVoucher } from './voucher-service.js';

export class VoucherWidget extends LitElement {
    static properties = {
        amount: { type: Number },
        name: { type: String },
        email: { type: String },
        state: { type: String }, // 'idle', 'loading', 'success', 'error'
        errorMessage: { type: String },
        voucherCode: { type: String }
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
      box-sizing: border-box;
    }

    h2 {
      margin-top: 0;
      text-align: center;
      color: var(--primary-color);
      margin-bottom: 1.5rem;
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

    input {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: var(--input-bg);
      color: var(--text-color);
      font-size: 1rem;
      box-sizing: border-box;
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
      margin-top: 1rem;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .qr-placeholder {
      margin-top: 1rem;
      text-align: center;
      padding: 1rem;
      background: #f0f0f0;
      border-radius: 8px;
    }
  `;

    constructor() {
        super();
        this.amount = 50;
        this.name = '';
        this.email = '';
        this.state = 'idle';
        this.errorMessage = '';
        this.voucherCode = '';
    }

    handleInput(e) {
        const { name, value } = e.target;
        this[name] = value;
    }

    async handlePay(e) {
        e.preventDefault();

        if (!this.name || !this.email || !this.amount) {
            this.errorMessage = 'Please fill in all fields';
            return;
        }

        this.state = 'loading';
        this.errorMessage = '';

        try {
            // Simulate Molly payment delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Create voucher
            const code = await createVoucher({
                name: this.name,
                email: this.email,
                amount: this.amount
            });

            this.voucherCode = code;
            this.state = 'success';

            // Simulate sending email
            console.log(`[MOCK EMAIL] Sending QR code for voucher ${code} to ${this.email}`);

        } catch (error) {
            console.error('Payment failed:', error);
            this.state = 'error';
            this.errorMessage = 'Payment failed. Please try again.';
        }
    }

    reset() {
        this.state = 'idle';
        this.amount = 50;
        this.name = '';
        this.email = '';
        this.voucherCode = '';
    }

    render() {
        if (this.state === 'success') {
            return html`
        <div class="widget-container">
          <h2>Payment Successful!</h2>
          <div class="message success">
            <p>Thank you, ${this.name}!</p>
            <p>You have purchased a voucher for €${this.amount}.</p>
            <p>An email with your QR code has been sent to <strong>${this.email}</strong>.</p>
          </div>
          <div class="qr-placeholder">
            <p><strong>Voucher Code:</strong> ${this.voucherCode}</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${this.voucherCode}" alt="QR Code" />
          </div>
          <button @click=${this.reset}>Buy Another Voucher</button>
        </div>
      `;
        }

        return html`
      <div class="widget-container">
        <h2>Buy a Voucher</h2>
        <form @submit=${this.handlePay}>
          <div class="form-group">
            <label for="amount">Amount (€)</label>
            <input type="number" id="amount" name="amount" min="10" .value=${this.amount} @input=${this.handleInput} required />
          </div>

          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" name="name" placeholder="John Doe" .value=${this.name} @input=${this.handleInput} required />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="john@example.com" .value=${this.email} @input=${this.handleInput} required />
          </div>

          ${this.state === 'error' ? html`<div class="message error">${this.errorMessage}</div>` : ''}

          <button type="submit" ?disabled=${this.state === 'loading'}>
            ${this.state === 'loading' ? 'Processing Payment...' : `Pay €${this.amount}`}
          </button>
        </form>
      </div>
    `;
    }
}

customElements.define('voucher-widget', VoucherWidget);
