import { LitElement, html, css } from 'lit';

export class DataGrid extends LitElement {
  static properties = {
    items: { type: Array },
    sortColumn: { type: String },
    sortDirection: { type: String } // 'asc' or 'desc'
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      color: #333333;
      font-size: 0.9rem;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background-color: #f9f9f9;
      font-weight: 600;
      color: #ff7a5c;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
    }

    th:hover {
      background-color: #f0f0f0;
    }

    tr:hover {
      background-color: #f5f5f5;
    }

    .empty {
      text-align: center;
      padding: 2rem;
      color: #999;
    }
    
    .sort-icon {
      display: inline-block;
      margin-left: 0.5rem;
      font-size: 0.7rem;
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.sortColumn = 'date';
    this.sortDirection = 'desc';
    this.sortDirection = 'desc';
  }

  formatDate(timestamp) {
    if (!timestamp) return '';
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  }

  handleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get sortedItems() {
    if (!this.items) return [];

    return [...this.items].sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      // Special handling for date sorting to include time
      if (this.sortColumn === 'date') {
        valA = `${a.date} ${a.time}`;
        valB = `${b.date} ${b.time}`;
      }

      if (valA === valB) return 0;

      const direction = this.sortDirection === 'asc' ? 1 : -1;

      // Handle string comparison
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * direction;
      }

      // Handle numbers and timestamps
      return (valA > valB ? 1 : -1) * direction;
    });
  }

  renderSortIcon(column) {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  render() {
    if (!this.items || this.items.length === 0) {
      return html`<div class="empty">No reservations found.</div>`;
    }

    return html`
      <table>
        <thead>
          <tr>
            <th @click=${() => this.handleSort('date')}>Date & Time <span class="sort-icon">${this.renderSortIcon('date')}</span></th>
            <th @click=${() => this.handleSort('guests')}>Guests <span class="sort-icon">${this.renderSortIcon('guests')}</span></th>
            <th @click=${() => this.handleSort('email')}>Email <span class="sort-icon">${this.renderSortIcon('email')}</span></th>
            <th @click=${() => this.handleSort('phone')}>Phone <span class="sort-icon">${this.renderSortIcon('phone')}</span></th>
            <th @click=${() => this.handleSort('description')}>Description <span class="sort-icon">${this.renderSortIcon('description')}</span></th>
            <th @click=${() => this.handleSort('status')}>Status <span class="sort-icon">${this.renderSortIcon('status')}</span></th>
            <th @click=${() => this.handleSort('createdAt')}>Created At <span class="sort-icon">${this.renderSortIcon('createdAt')}</span></th>
          </tr>
        </thead>
        <tbody>
          ${this.sortedItems.map(item => html`
            <tr @click=${() => this.dispatchEvent(new CustomEvent('row-click', { detail: item }))} style="cursor: pointer;">
              <td>${item.date} ${item.time}</td>
              <td>${item.guests}</td>
              <td>${item.email}</td>
              <td>${item.phone || '-'}</td>
              <td>${item.description || '-'}</td>
              <td>${item.status || 'confirmed'}</td>
              <td>${this.formatDate(item.createdAt)}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }
}

customElements.define('data-grid', DataGrid);
