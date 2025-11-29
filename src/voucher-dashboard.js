import { LitElement, html, css } from 'lit';
import { getAllVouchers, getVoucherByCode, redeemVoucher } from './voucher-service.js';
import { Html5QrcodeScanner } from 'html5-qrcode';

export class VoucherDashboard extends LitElement {
    static properties = {
        vouchers: { type: Array },
        scannedVoucher: { type: Object },
        manualCode: { type: String },
        redeemAmount: { type: Number },
        isScanning: { type: Boolean },
        loading: { type: Boolean },
        error: { type: String },
        successMessage: { type: String }
    };

    static styles = css`
    :host {
      display: block;
      padding: 1rem;
      font-family: 'Inter', sans-serif;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }

    h2 {
      margin-top: 0;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 0.8rem;
      border-bottom: 1px solid #eee;
    }

    th {
      background-color: #f9f9f9;
      font-weight: 600;
    }

    input {
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 1rem;
    }

    button {
      padding: 0.8rem 1.5rem;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }

    button.secondary {
      background-color: #757575;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    #reader {
      width: 100%;
      margin-bottom: 1rem;
    }

    .error {
      color: #d32f2f;
      margin-bottom: 1rem;
    }

    .success {
      color: #388e3c;
      margin-bottom: 1rem;
    }

    .history-item {
      font-size: 0.9rem;
      color: #666;
      border-bottom: 1px solid #eee;
      padding: 0.5rem 0;
    }
  `;

    constructor() {
        super();
        this.vouchers = [];
        this.scannedVoucher = null;
        this.manualCode = '';
        this.redeemAmount = 0;
        this.isScanning = false;
        this.loading = false;
        this.error = '';
        this.successMessage = '';
        this.scanner = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchVouchers();
    }

    async fetchVouchers() {
        this.loading = true;
        try {
            this.vouchers = await getAllVouchers();
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            this.error = 'Failed to load vouchers';
        } finally {
            this.loading = false;
        }
    }

    startScanner() {
        this.isScanning = true;
        // Wait for render
        setTimeout(() => {
            this.scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );
            this.scanner.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
        }, 0);
    }

    stopScanner() {
        if (this.scanner) {
            this.scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
            this.scanner = null;
        }
        this.isScanning = false;
    }

    onScanSuccess(decodedText, decodedResult) {
        // Handle the scanned code as you like, for example:
        console.log(`Code matched = ${decodedText}`, decodedResult);
        this.stopScanner();
        this.handleVoucherCode(decodedText);
    }

    onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    }

    async handleManualEntry() {
        if (!this.manualCode) return;
        await this.handleVoucherCode(this.manualCode);
    }

    async handleVoucherCode(code) {
        this.loading = true;
        this.error = '';
        this.scannedVoucher = null;
        this.successMessage = '';

        try {
            const voucher = await getVoucherByCode(code);
            if (voucher) {
                this.scannedVoucher = voucher;
            } else {
                this.error = 'Voucher not found';
            }
        } catch (err) {
            console.error('Error fetching voucher:', err);
            this.error = 'Error fetching voucher details';
        } finally {
            this.loading = false;
        }
    }

    async handleRedeem() {
        if (!this.scannedVoucher || !this.redeemAmount) return;

        this.loading = true;
        this.error = '';
        this.successMessage = '';

        try {
            const result = await redeemVoucher(this.scannedVoucher.code, Number(this.redeemAmount));
            this.successMessage = `Successfully redeemed €${this.redeemAmount}. New balance: €${result.newBalance}`;

            // Refresh voucher details
            await this.handleVoucherCode(this.scannedVoucher.code);
            // Refresh list
            await this.fetchVouchers();

            this.redeemAmount = 0;
        } catch (err) {
            console.error('Redemption failed:', err);
            this.error = err.message || 'Redemption failed';
        } finally {
            this.loading = false;
        }
    }

    render() {
        return html`
      <div class="dashboard-grid">
        <!-- Left Column: Scanner & Redemption -->
        <div>
          <div class="card">
            <h2>Scan Voucher</h2>
            ${!this.isScanning ? html`
              <button @click=${this.startScanner}>Start QR Scanner</button>
            ` : html`
              <div id="reader"></div>
              <button class="secondary" @click=${this.stopScanner}>Stop Scanner</button>
            `}
            
            <div style="margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
              <label>Or enter code manually:</label>
              <div style="display: flex; gap: 0.5rem;">
                <input 
                  type="text" 
                  .value=${this.manualCode} 
                  @input=${(e) => this.manualCode = e.target.value}
                  placeholder="Enter voucher code"
                  style="margin-bottom: 0;"
                />
                <button @click=${this.handleManualEntry}>Go</button>
              </div>
            </div>
          </div>

          ${this.scannedVoucher ? html`
            <div class="card">
              <h2>Voucher Details</h2>
              ${this.error ? html`<div class="error">${this.error}</div>` : ''}
              ${this.successMessage ? html`<div class="success">${this.successMessage}</div>` : ''}

              <p><strong>Code:</strong> ${this.scannedVoucher.code}</p>
              <p><strong>Name:</strong> ${this.scannedVoucher.name}</p>
              <p><strong>Initial Amount:</strong> €${this.scannedVoucher.initialAmount}</p>
              <p><strong>Remaining Balance:</strong> €${this.scannedVoucher.remainingAmount}</p>

              ${this.scannedVoucher.remainingAmount > 0 ? html`
                <div style="margin-top: 1rem; background: #f5f5f5; padding: 1rem; border-radius: 4px;">
                  <label>Amount to Redeem (€)</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <input 
                      type="number" 
                      min="1" 
                      max=${this.scannedVoucher.remainingAmount}
                      .value=${this.redeemAmount}
                      @input=${(e) => this.redeemAmount = e.target.value}
                      style="margin-bottom: 0;"
                    />
                    <button @click=${this.handleRedeem} ?disabled=${this.loading}>Redeem</button>
                  </div>
                </div>
              ` : html`
                <div class="error">This voucher has been fully redeemed.</div>
              `}

              <h3>History</h3>
              ${this.scannedVoucher.history && this.scannedVoucher.history.length > 0 ?
                    this.scannedVoucher.history.map(h => html`
                  <div class="history-item">
                    ${new Date(h.date).toLocaleString()}: ${h.type === 'redemption' ? 'Redeemed' : 'Purchased'} €${h.amount}
                  </div>
                `) :
                    html`<p>No history yet.</p>`
                }
            </div>
          ` : ''}
          
          ${this.error && !this.scannedVoucher ? html`<div class="card error">${this.error}</div>` : ''}
        </div>

        <!-- Right Column: List of Vouchers -->
        <div>
          <div class="card">
            <h2>Sold Vouchers</h2>
            ${this.loading && !this.vouchers.length ? html`<p>Loading...</p>` : ''}
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                ${this.vouchers.map(v => html`
                  <tr>
                    <td>${new Date(v.createdAt).toLocaleDateString()}</td>
                    <td>${v.name}</td>
                    <td>€${v.initialAmount}</td>
                    <td>€${v.remainingAmount}</td>
                  </tr>
                `)}
                ${this.vouchers.length === 0 ? html`<tr><td colspan="4">No vouchers sold yet.</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    }
}

customElements.define('voucher-dashboard', VoucherDashboard);
