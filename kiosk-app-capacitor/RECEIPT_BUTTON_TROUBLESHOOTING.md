# BOKI Receipt Save Button Troubleshooting Guide

## Problem: Save Receipt Button Not Appearing

### Quick Diagnosis Steps

1. **Check Console Logs**
   - Open the app and look for these log messages:
     - `🔧 BOKI Receipt Saver: Web View Injector loaded`
     - `🏪 BOKI Kiosk: Receipt saving functionality injected into web view`
     - `🔍 BOKI Debug: Environment check starting...`
   - If you don't see these, the injection isn't working

2. **Use Debug Tools**
   - In the web view console, run: `window.bokiDebug.runDebug()`
   - This will show you:
     - Environment status (native/bridge availability)
     - Receipt elements found on the page
     - Injection attempts and results

3. **Test with Local File**
   - Try loading: `http://localhost:5174/test-receipt-integration.html`
   - This will test the injection locally before the remote app

### Common Issues & Solutions

#### Issue 1: Remote Web App Not Loading
**Symptoms**: App shows loading spinner indefinitely
**Solution**: 
- Check internet connection
- Verify the remote URL: `https://bokicapstone.vercel.app/kiosk`
- Check if the remote server is accessible

#### Issue 2: Script Injection Timing
**Symptoms**: Functions available but buttons don't appear
**Solution**:
- The injection now includes retry logic (up to 5 attempts)
- Each attempt waits longer (2s, 4s, 6s, 8s, 10s)
- Manual detection is triggered after injection

#### Issue 3: Receipt Element Detection
**Symptoms**: No receipt elements found
**Solution**:
- The injector looks for these selectors:
  - `.receipt`, `.receipt-container`, `[data-receipt]`
  - `.order-receipt`, `.sales-receipt`, `.transaction-receipt`
  - `[class*="receipt"]`, `[class*="order"]`, `[class*="transaction"]`
  - `.modal-content`, `.modal-body`, `.popup-content`

#### Issue 4: Bridge Not Available
**Symptoms**: `window.receiptImageBridge` is undefined
**Solution**:
- Ensure you're running the native app (not web browser)
- Check that Capacitor plugins are properly installed
- Verify the bridge initialization in `KioskAppWrapper.tsx`

### Manual Testing Commands

```javascript
// Check if functions are available
window.bokiDebug.checkEnvironment();

// Test receipt detection
window.bokiDebug.testReceiptDetection();

// Force inject buttons on first receipt
window.bokiDebug.forceInjectButtons('.receipt');

// Test save functionality
window.saveKioskReceipt({
  orderNumber: 'TEST-001',
  date: new Date().toLocaleString(),
  items: [{ name: 'Test', quantity: 1, price: 9.99 }],
  subtotal: 9.99,
  tax: 0.80,
  total: 10.79,
  paymentMethod: 'Cash'
});
```

### Integration with Remote Web App

If you control the remote web app (`https://bokicapstone.vercel.app/kiosk`), you can:

1. **Add the integration script** to your HTML:
```html
<script src="https://your-kiosk-app.com/boki-receipt-saver.js"></script>
```

2. **Manually trigger receipt detection** when receipts are displayed:
```javascript
// After showing a receipt
if (window.autoDetectReceipts) {
  window.autoDetectReceipts();
}
```

3. **Add data attributes** to help detection:
```html
<div class="receipt" data-receipt="true" data-order-number="12345">
  <!-- receipt content -->
</div>
```

### What to Expect When Working

When the save button functionality is working correctly, you should see:

1. **Console Logs**:
   - `🔧 BOKI Receipt Saver: Web View Injector loaded`
   - `🔧 BOKI Receipt Saver: Found X potential receipt elements`
   - `🔧 BOKI Receipt Saver: Buttons added to receipt element`

2. **Visual Indicators**:
   - Save (💾) and Share (📤) buttons appear on receipt hover
   - Buttons show temporarily when receipt is displayed
   - Smooth fade-in/fade-out animations

3. **Functionality**:
   - Clicking Save saves receipt as image to device
   - Clicking Share opens native share dialog
   - Success/error notifications appear

### If Still Not Working

1. **Check the APK Build**:
   ```bash
   npm run cap:build:android
   ```

2. **Verify All Files Are Present**:
   - `public/debug-receipt-injection.js`
   - `public/test-receipt-integration.html`
   - `public/boki-receipt-saver.js`

3. **Test on Device**:
   - Install the APK on a real device
   - Check device logs with Android Studio
   - Test with airplane mode to see local behavior

4. **Contact Support**:
   Provide these details:
   - Console logs from the web view
   - Results of `window.bokiDebug.runDebug()`
   - Screenshots of what you see
   - Device model and Android version