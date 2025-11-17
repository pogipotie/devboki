# Receipt Image Saving Integration Guide

This guide explains how to integrate the receipt image saving functionality into the hosted kiosk web application.

## Quick Start

The receipt image saving functionality is automatically available when the kiosk app runs inside the Capacitor wrapper. Simply use the global functions provided:

```javascript
// Save a receipt as an image
const fileUri = await window.saveKioskReceipt(receiptData);

// Share a receipt via native share dialog
await window.shareKioskReceipt(receiptData);

// Add save/share buttons to a receipt element
window.addReceiptSaveButtons(receiptElement, receiptData);
```

## Integration Steps

### 1. Check Functionality Availability

Before using the functionality, check if it's available:

```javascript
if (window.saveKioskReceipt && window.shareKioskReceipt) {
  // Receipt saving functionality is available
  console.log('Receipt image saving is enabled');
} else {
  console.log('Receipt image saving is not available');
}
```

### 2. Prepare Receipt Data

Create a receipt data object with the following structure:

```javascript
const receiptData = {
  orderNumber: 'ORD-12345',
  date: new Date().toLocaleString(),
  items: [
    { name: 'Coffee', quantity: 2, price: 3.50 },
    { name: 'Sandwich', quantity: 1, price: 8.99 }
  ],
  subtotal: 12.49,
  tax: 1.00,
  total: 13.49,
  paymentMethod: 'Credit Card',
  storeName: 'BOKI KIOSK',
  storeAddress: '123 Main St, Anytown, ST 12345'
};
```

### 3. Add Save/Share Buttons

#### Option A: Automatic Button Addition

Use the built-in function to add buttons to your receipt element:

```javascript
const receiptElement = document.getElementById('receipt-container');
window.addReceiptSaveButtons(receiptElement, receiptData);
```

This will add floating buttons that appear on hover:
- 💾 Save button (green)
- 📤 Share button (blue)

#### Option B: Custom Buttons

Create your own buttons and connect them to the functions:

```html
<div id="receipt-actions">
  <button id="save-receipt-btn" class="receipt-action-btn save-btn">
    💾 Save Receipt
  </button>
  <button id="share-receipt-btn" class="receipt-action-btn share-btn">
    📤 Share Receipt
  </button>
</div>
```

```javascript
document.getElementById('save-receipt-btn').addEventListener('click', async () => {
  try {
    const fileUri = await window.saveKioskReceipt(receiptData);
    console.log('Receipt saved to:', fileUri);
    // Show success message to user
  } catch (error) {
    console.error('Failed to save receipt:', error);
    // Show error message to user
  }
});

document.getElementById('share-receipt-btn').addEventListener('click', async () => {
  try {
    await window.shareKioskReceipt(receiptData);
    console.log('Receipt shared successfully');
  } catch (error) {
    console.error('Failed to share receipt:', error);
  }
});
```

### 4. Extract Receipt Data from DOM

If you already have receipt data displayed on the page, you can extract it:

```javascript
const receiptElement = document.querySelector('.receipt-container');
const extractedData = window.extractReceiptDataFromDOM(receiptElement);

if (extractedData) {
  // Use the extracted data
  await window.saveKioskReceipt(extractedData);
}
```

### 5. Handle Different Receipt Formats

The system works with various receipt formats. Here are some examples:

#### Simple Receipt
```javascript
const simpleReceipt = {
  orderNumber: 'SIMPLE-001',
  date: '2024-01-15 14:30:25',
  items: [
    { name: 'Item 1', quantity: 1, price: 10.00 }
  ],
  subtotal: 10.00,
  tax: 0.80,
  total: 10.80,
  paymentMethod: 'Cash'
};
```

#### Detailed Receipt
```javascript
const detailedReceipt = {
  orderNumber: 'DETAILED-001',
  date: '2024-01-15 14:30:25',
  items: [
    { name: 'Premium Coffee', quantity: 2, price: 4.50 },
    { name: 'Artisan Sandwich', quantity: 1, price: 12.99 },
    { name: 'Organic Cookie', quantity: 3, price: 2.99 }
  ],
  subtotal: 25.96,
  tax: 2.08,
  total: 28.04,
  paymentMethod: 'Credit Card',
  storeName: 'BOKI Premium Kiosk',
  storeAddress: '456 Premium Ave, Luxury City, LC 67890'
};
```

## Error Handling

Always wrap receipt operations in try-catch blocks:

```javascript
async function saveReceiptSafely(receiptData) {
  try {
    const fileUri = await window.saveKioskReceipt(receiptData);
    
    // Show success to user
    showToast('Receipt saved successfully!', 'success');
    
    return fileUri;
  } catch (error) {
    console.error('Receipt save failed:', error);
    
    // Show error to user
    showToast('Failed to save receipt: ' + error.message, 'error');
    
    // Fallback: maybe offer to email the receipt instead
    return null;
  }
}
```

## Styling the Buttons

The default buttons come with styling, but you can customize them:

```css
/* Override default button styles */
.receipt-save-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049) !important;
  border-radius: 8px !important;
  font-size: 14px !important;
}

.receipt-share-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2) !important;
  border-radius: 8px !important;
  font-size: 14px !important;
}

/* Button container */
.receipt-action-buttons {
  top: 15px !important;
  right: 15px !important;
  gap: 10px !important;
}
```

## Testing

### Test in Development

1. Build the kiosk app with the new functionality
2. Run in Capacitor emulator/simulator
3. Navigate to a receipt in your kiosk interface
4. Test save and share functionality

### Test Receipt Data

Use this test data for quick testing:

```javascript
const testReceipt = {
  orderNumber: 'TEST-001',
  date: new Date().toLocaleString(),
  items: [
    { name: 'Coffee', quantity: 1, price: 3.50 },
    { name: 'Pastry', quantity: 2, price: 2.99 }
  ],
  subtotal: 9.48,
  tax: 0.76,
  total: 10.24,
  paymentMethod: 'Credit Card'
};
```

## Troubleshooting

### Function Not Available

If `window.saveKioskReceipt` is undefined:

1. Check if running in native Capacitor app
2. Ensure the bridge script has loaded (check console for "Receipt functionality initialized")
3. Try refreshing the page

### Save Fails

Common causes:
- Invalid receipt data structure
- Missing required fields (orderNumber, date, items, total)
- File system permissions issues
- Insufficient storage space

### Share Fails

Common causes:
- No apps available to handle sharing
- File not created successfully
- Permission issues

## Best Practices

1. **Always validate receipt data** before saving
2. **Provide user feedback** for all operations
3. **Handle errors gracefully** with fallback options
4. **Test on multiple devices** and platforms
5. **Consider receipt size** - very long receipts may take longer to process

## Integration Example

Here's a complete example integrating with a typical receipt component:

```javascript
class ReceiptComponent {
  constructor(receiptElement, receiptData) {
    this.receiptElement = receiptElement;
    this.receiptData = receiptData;
    this.init();
  }
  
  init() {
    // Check if receipt saving is available
    if (window.saveKioskReceipt && window.shareKioskReceipt) {
      this.addActionButtons();
    } else {
      console.log('Receipt saving not available');
    }
  }
  
  addActionButtons() {
    // Create action container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'receipt-actions';
    actionsContainer.innerHTML = `
      <button class="btn-save-receipt">💾 Save</button>
      <button class="btn-share-receipt">📤 Share</button>
    `;
    
    this.receiptElement.appendChild(actionsContainer);
    
    // Add event listeners
    actionsContainer.querySelector('.btn-save-receipt').addEventListener('click', () => {
      this.saveReceipt();
    });
    
    actionsContainer.querySelector('.btn-share-receipt').addEventListener('click', () => {
      this.shareReceipt();
    });
  }
  
  async saveReceipt() {
    try {
      this.showLoading('Saving receipt...');
      const fileUri = await window.saveKioskReceipt(this.receiptData);
      this.showSuccess('Receipt saved successfully!');
      console.log('Receipt saved to:', fileUri);
    } catch (error) {
      this.showError('Failed to save receipt: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }
  
  async shareReceipt() {
    try {
      this.showLoading('Sharing receipt...');
      await window.shareKioskReceipt(this.receiptData);
      this.showSuccess('Receipt shared successfully!');
    } catch (error) {
      this.showError('Failed to share receipt: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }
  
  showLoading(message) {
    // Implement your loading indicator
  }
  
  showSuccess(message) {
    // Implement your success notification
  }
  
  showError(message) {
    // Implement your error notification
  }
  
  hideLoading() {
    // Hide loading indicator
  }
}

// Usage
const receiptElement = document.getElementById('receipt-container');
const receiptData = { /* your receipt data */ };
new ReceiptComponent(receiptElement, receiptData);
```

## Support

For issues or questions about the receipt image saving functionality:

1. Check the browser console for error messages
2. Verify the native bridge is loaded
3. Ensure receipt data structure is correct
4. Test with the provided demo component