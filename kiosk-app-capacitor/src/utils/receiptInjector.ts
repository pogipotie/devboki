import { Capacitor } from '@capacitor/core';

// Extend window interface for Capacitor
declare global {
  interface Window {
    Capacitor?: typeof Capacitor;
  }
}



/**
 * Script injection utility for adding receipt image saving functionality
 * to the hosted kiosk web application
 */

export interface ReceiptData {
  orderNumber: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  storeName?: string;
  storeAddress?: string;
}

/**
 * Inject receipt saving functionality into a web view
 * This should be called when the web view loads
 */
export function injectReceiptFunctionality(): void {
  // Check if we're in a Capacitor environment
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
    console.log('Not in native environment, skipping receipt functionality injection');
    return;
  }

  // Inject the receipt saving functions into the global scope
  const script = `
    (function() {
      // Receipt image saving functionality
      window.saveKioskReceipt = async function(receiptData) {
        try {
          if (window.receiptImageBridge && window.receiptImageBridge.saveReceiptAsImage) {
            const fileUri = await window.receiptImageBridge.saveReceiptAsImage(receiptData);
            console.log('Receipt saved:', fileUri);
            return fileUri;
          } else {
            throw new Error('Receipt bridge not available');
          }
        } catch (error) {
          console.error('Failed to save receipt:', error);
          throw error;
        }
      };

      window.shareKioskReceipt = async function(receiptData) {
        try {
          if (window.receiptImageBridge && window.receiptImageBridge.shareReceiptImage) {
            await window.receiptImageBridge.shareReceiptImage(receiptData);
            console.log('Receipt shared successfully');
          } else {
            throw new Error('Receipt bridge not available');
          }
        } catch (error) {
          console.error('Failed to share receipt:', error);
          throw error;
        }
      };

      window.addReceiptSaveButtons = function(receiptElement, receiptData) {
        if (!receiptElement || !receiptData) return;
        
        // Create button container
        const container = document.createElement('div');
        container.className = 'receipt-action-buttons';
        container.style.cssText = 'position: absolute; top: 10px; right: 10px; display: flex; gap: 10px; z-index: 1000;';
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '💾 Save';
        saveBtn.style.cssText = 'background: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;';
        saveBtn.onclick = () => window.saveKioskReceipt(receiptData);
        
        // Share button
        const shareBtn = document.createElement('button');
        shareBtn.innerHTML = '📤 Share';
        shareBtn.style.cssText = 'background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;';
        shareBtn.onclick = () => window.shareKioskReceipt(receiptData);
        
        container.appendChild(saveBtn);
        container.appendChild(shareBtn);
        
        receiptElement.style.position = 'relative';
        receiptElement.appendChild(container);
        
        return container;
      };

      console.log('Receipt functionality injected successfully');
    })();
  `;

  // Create and inject the script element
  const scriptElement = document.createElement('script');
  scriptElement.textContent = script;
  document.head.appendChild(scriptElement);
}

/**
 * Example usage function that can be called from the hosted web app
 */
export function setupReceiptSaving() {
  // Wait for the DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectReceiptFunctionality);
  } else {
    injectReceiptFunctionality();
  }
}

/**
 * Helper function to create a sample receipt (for testing)
 */
export function createSampleReceipt(): ReceiptData {
  return {
    orderNumber: 'TEST-001',
    date: new Date().toLocaleString(),
    items: [
      { name: 'Coffee', quantity: 2, price: 3.50 },
      { name: 'Sandwich', quantity: 1, price: 8.99 },
      { name: 'Cookie', quantity: 3, price: 2.25 }
    ],
    subtotal: 14.74,
    tax: 1.18,
    total: 15.92,
    paymentMethod: 'Cash',
    storeName: 'BOKI KIOSK',
    storeAddress: '123 Main St, Anytown, ST 12345'
  };
}