# Receipt Image Saving Feature

This feature enables users to save receipts as images in the BOKI Kiosk mobile app.

## Overview

The receipt image saving functionality is implemented as a bridge between the hosted kiosk web application and the native Capacitor app. It allows users to:

1. **Save receipts as PNG images** to their device storage
2. **Share receipts** via native share dialogs
3. **Add save/share buttons** to receipt elements in the web interface

## Architecture

### Components

1. **ReceiptImageSaver** (`src/utils/receiptImageSaver.ts`)
   - Core functionality for generating receipt images
   - Handles canvas rendering and file operations
   - Provides save and share methods

2. **Receipt Image Bridge** (`src/bridge/receiptImageBridge.ts`)
   - Native bridge that exposes functionality to the web view
   - Handles communication between web and native layers

3. **Web Bridge Script** (`src/bridge/receiptImageWebBridge.js`)
   - JavaScript that gets injected into the web view
   - Provides easy-to-use functions for the hosted web app

4. **Receipt Injector** (`src/utils/receiptInjector.ts`)
   - Utility for injecting functionality into web pages
   - Handles script injection and initialization

## Usage

### For Web Developers (Hosted Kiosk App)

The hosted kiosk web application can use the following functions that are automatically injected:

```javascript
// Save a receipt as an image
const receiptData = {
  orderNumber: 'ORD-12345',
  date: '2024-01-15 14:30:25',
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

try {
  const fileUri = await window.saveKioskReceipt(receiptData);
  console.log('Receipt saved to:', fileUri);
} catch (error) {
  console.error('Failed to save receipt:', error);
}

// Share a receipt
await window.shareKioskReceipt(receiptData);

// Add save/share buttons to a receipt element
const receiptElement = document.getElementById('receipt-container');
window.addReceiptSaveButtons(receiptElement, receiptData);
```

### For Mobile App Developers

The functionality is automatically initialized when the app loads. The bridge is exposed to the web view and ready to use.

## Receipt Data Structure

```typescript
interface ReceiptData {
  orderNumber: string;           // Unique order identifier
  date: string;                  // Formatted date string
  items: Array<{                // Array of purchased items
    name: string;                // Item name
    quantity: number;            // Quantity purchased
    price: number;               // Price per item
  }>;
  subtotal: number;              // Subtotal amount
  tax: number;                   // Tax amount
  total: number;                 // Total amount
  paymentMethod: string;         // Payment method used
  storeName?: string;           // Optional store name
  storeAddress?: string;        // Optional store address
}
```

## File Locations

- Saved receipts are stored in the device's Documents directory
- File naming format: `receipt_{orderNumber}_{timestamp}.png`
- Files can be accessed through the device's file manager

## Error Handling

The bridge includes comprehensive error handling and user feedback:

- Success/error messages are displayed using toast notifications
- Console logging for debugging
- Graceful fallbacks if native functionality is unavailable

## Testing

To test the functionality:

1. Build and run the Capacitor app
2. Navigate to a receipt in the kiosk interface
3. Use the save/share buttons or call the functions directly
4. Check device storage for saved images

## Troubleshooting

### Common Issues

1. **"Receipt bridge not available"**
   - Ensure the app is running in native mode (not web browser)
   - Check that the bridge has been initialized

2. **"Failed to save receipt"**
   - Verify file system permissions
   - Check available storage space
   - Ensure receipt data is valid

3. **Images not appearing in gallery**
   - Some devices require a media scan to detect new files
   - Check the Documents folder directly

### Debug Information

Enable debug logging to see detailed information:
- Bridge initialization: Check console for "Receipt Image Bridge initialized"
- Function calls: Look for "Saving receipt as image..." and "Receipt saved successfully"
- Error details: Check console for error messages and stack traces

## Security Considerations

- Receipt data is processed locally on the device
- No sensitive data is transmitted to external services
- File permissions are limited to the app's sandbox
- Images are stored in the user's Documents directory