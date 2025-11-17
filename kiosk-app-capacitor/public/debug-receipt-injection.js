/**
 * Debug Helper for Receipt Button Injection
 * This script helps diagnose why save/share buttons are not appearing
 */

// Debug logging helper
function debugLog(message, data = null) {
    console.log(`🔍 BOKI Debug: ${message}`, data || '');
}

// Check if we're in the right environment
function checkEnvironment() {
    debugLog('Environment check starting...');
    
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    const hasBridge = window.receiptImageBridge !== undefined;
    const hasWebFunctions = window.saveKioskReceipt !== undefined;
    
    debugLog('Environment results:', {
        isNative,
        hasBridge,
        hasWebFunctions,
        capacitorVersion: window.Capacitor ? window.Capacitor.getPlatform() : 'not available',
        userAgent: navigator.userAgent
    });
    
    return { isNative, hasBridge, hasWebFunctions };
}

// Test receipt detection
function testReceiptDetection() {
    debugLog('Testing receipt detection...');
    
    const selectors = [
        '.receipt', '.receipt-container', '[data-receipt]',
        '.order-receipt', '.sales-receipt', '.transaction-receipt',
        '.receipt-wrapper', '.receipt-main', '.receipt-card',
        '[class*="receipt"]', '[class*="order"]', '[class*="transaction"]',
        '.modal-content', '.modal-body', '.popup-content',
        '.receipt-modal', '.order-modal', '.transaction-modal'
    ];
    
    const foundElements = [];
    selectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                foundElements.push({
                    selector,
                    count: elements.length,
                    elements: Array.from(elements).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        innerText: el.innerText?.substring(0, 100) + '...'
                    }))
                });
            }
        } catch (e) {
            debugLog(`Error with selector ${selector}:`, e.message);
        }
    });
    
    debugLog('Receipt detection results:', foundElements);
    return foundElements;
}

// Force button injection on specific element
function forceInjectButtons(elementSelector) {
    debugLog(`Force injecting buttons for selector: ${elementSelector}`);
    
    const element = document.querySelector(elementSelector);
    if (!element) {
        debugLog(`Element not found: ${elementSelector}`);
        return false;
    }
    
    debugLog('Found element:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        innerText: element.innerText?.substring(0, 200) + '...'
    });
    
    // Create test receipt data
    const testData = {
        orderNumber: 'DEBUG-' + Date.now(),
        date: new Date().toLocaleString(),
        items: [
            { name: 'Test Item', quantity: 1, price: 9.99 }
        ],
        subtotal: 9.99,
        tax: 0.80,
        total: 10.79,
        paymentMethod: 'Debug Test',
        storeName: 'BOKI KIOSK',
        storeAddress: 'Debug Location'
    };
    
    // Try to add buttons
    if (window.addReceiptSaveButtons) {
        debugLog('Using window.addReceiptSaveButtons...');
        const result = window.addReceiptSaveButtons(element, testData);
        debugLog('Button injection result:', result);
        return result !== null;
    } else {
        debugLog('window.addReceiptSaveButtons not available, creating manual buttons...');
        return createManualButtons(element, testData);
    }
}

// Create manual buttons as fallback
function createManualButtons(element, receiptData) {
    debugLog('Creating manual buttons...');
    
    // Remove existing buttons
    const existingButtons = element.querySelector('.receipt-action-buttons');
    if (existingButtons) {
        existingButtons.remove();
    }
    
    // Create button container
    const container = document.createElement('div');
    container.className = 'receipt-action-buttons';
    container.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 8px;
        z-index: 1000;
        background: rgba(255,255,255,0.9);
        padding: 5px;
        border-radius: 4px;
    `;
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.innerHTML = '💾 Save';
    saveButton.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
    `;
    saveButton.onclick = () => {
        debugLog('Manual save button clicked');
        if (window.saveKioskReceipt) {
            window.saveKioskReceipt(receiptData)
                .then(result => debugLog('Save successful:', result))
                .catch(error => debugLog('Save failed:', error));
        } else {
            debugLog('window.saveKioskReceipt not available');
        }
    };
    
    // Create share button
    const shareButton = document.createElement('button');
    shareButton.innerHTML = '📤 Share';
    shareButton.style.cssText = `
        background: #2196F3;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
    `;
    shareButton.onclick = () => {
        debugLog('Manual share button clicked');
        if (window.shareKioskReceipt) {
            window.shareKioskReceipt(receiptData)
                .then(() => debugLog('Share successful'))
                .catch(error => debugLog('Share failed:', error));
        } else {
            debugLog('window.shareKioskReceipt not available');
        }
    };
    
    container.appendChild(saveButton);
    container.appendChild(shareButton);
    
    // Make element positioned if needed
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
        element.style.position = 'relative';
    }
    
    element.appendChild(container);
    debugLog('Manual buttons created successfully');
    return true;
}

// Run comprehensive debug
function runDebug() {
    debugLog('=== BOKI Receipt Debug Starting ===');
    
    const env = checkEnvironment();
    const receipts = testReceiptDetection();
    
    debugLog('Debug summary:', {
        environment: env,
        receiptsFound: receipts.length,
        totalElements: receipts.reduce((sum, r) => sum + r.count, 0)
    });
    
    // Try to inject buttons on first found receipt
    if (receipts.length > 0 && receipts[0].count > 0) {
        const firstReceipt = receipts[0];
        debugLog(`Attempting injection on first ${firstReceipt.selector} element...`);
        forceInjectButtons(firstReceipt.selector);
    } else {
        debugLog('No receipt elements found for injection');
    }
    
    debugLog('=== BOKI Receipt Debug Complete ===');
}

// Expose debug functions globally
window.bokiDebug = {
    runDebug,
    checkEnvironment,
    testReceiptDetection,
    forceInjectButtons,
    createManualButtons,
    debugLog
};

// Auto-run debug after a delay
setTimeout(() => {
    console.log('🔍 BOKI Debug: Auto-running debug (use window.bokiDebug.runDebug() to run again)');
    runDebug();
}, 3000);

export {};