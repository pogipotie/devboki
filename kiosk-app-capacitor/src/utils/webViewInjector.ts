/**
 * Web View Script Injector
 * Injects JavaScript into the Capacitor web view to enable receipt saving functionality
 */

import { Capacitor } from '@capacitor/core';

// TypeScript type definitions for window properties
declare global {
  interface Window {
    saveKioskReceipt?: (data: any) => Promise<void>;
    autoDetectReceipts?: () => void;
    addReceiptSaveButtons?: (element: Element, data: any) => void;
  }
}

// The injector script that will be injected into the web view
const INJECTOR_SCRIPT = `
(function() {
  console.log('🔧 BOKI Receipt Saver: Web View Injector loaded');
  console.log('🔧 BOKI Receipt Saver: User Agent:', navigator.userAgent);
  console.log('🔧 BOKI Receipt Saver: Capacitor available:', !!window.Capacitor);
  
  // Wait for the native bridge to be ready
  function waitForNativeBridge() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkBridge = () => {
        attempts++;
        
        if (window.receiptImageBridge && window.receiptImageBridge.isAvailable && window.receiptImageBridge.isAvailable()) {
          console.log('🔧 BOKI Receipt Saver: Native bridge detected and ready');
          resolve(true);
        } else if (window.saveReceiptAsImage && window.shareReceiptImage) {
          console.log('🔧 BOKI Receipt Saver: Individual bridge methods detected');
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.warn('🔧 BOKI Receipt Saver: Native bridge timeout - functionality limited');
          resolve(false);
        } else {
          setTimeout(checkBridge, 100);
        }
      };
      
      checkBridge();
    });
  }
  
  // Create receipt save/share functionality
  async function initializeReceiptSaving() {
    const bridgeAvailable = await waitForNativeBridge();
    
    if (!bridgeAvailable) {
      console.warn('🔧 BOKI Receipt Saver: Receipt functionality not available in this environment');
      return;
    }
    
    console.log('🔧 BOKI Receipt Saver: Initializing receipt saving functionality');
    
    // Main save function
    window.saveKioskReceipt = async function(receiptData) {
      try {
        console.log('🔧 BOKI Receipt Saver: Saving receipt...', receiptData);
        
        let fileUri;
        if (window.receiptImageBridge && window.receiptImageBridge.saveReceiptAsImage) {
          fileUri = await window.receiptImageBridge.saveReceiptAsImage(receiptData);
        } else if (window.saveReceiptAsImage) {
          fileUri = await window.saveReceiptAsImage(receiptData);
        } else {
          throw new Error('No receipt saving method available');
        }
        
        console.log('🔧 BOKI Receipt Saver: Receipt saved successfully:', fileUri);
        showNotification('✅ Receipt saved successfully!', 'success');
        return fileUri;
      } catch (error) {
        console.error('🔧 BOKI Receipt Saver: Failed to save receipt:', error);
        showNotification('❌ Failed to save receipt: ' + error.message, 'error');
        throw error;
      }
    };
    
    // Alias for compatibility with receipt print window
    window.saveReceiptImage = window.saveKioskReceipt;
    
    // Main share function
    window.shareKioskReceipt = async function(receiptData) {
      try {
        console.log('🔧 BOKI Receipt Saver: Sharing receipt...', receiptData);
        
        if (window.receiptImageBridge && window.receiptImageBridge.shareReceiptImage) {
          await window.receiptImageBridge.shareReceiptImage(receiptData);
        } else if (window.shareReceiptImage) {
          await window.shareReceiptImage(receiptData);
        } else {
          throw new Error('No receipt sharing method available');
        }
        
        console.log('🔧 BOKI Receipt Saver: Receipt shared successfully');
        showNotification('✅ Receipt shared successfully!', 'success');
      } catch (error) {
        console.error('🔧 BOKI Receipt Saver: Failed to share receipt:', error);
        showNotification('❌ Failed to share receipt: ' + error.message, 'error');
        throw error;
      }
    };
    
    // Function to add save/share buttons to receipt elements
    window.addReceiptSaveButtons = function(receiptElement, receiptData) {
      if (!receiptElement || !receiptData) {
        console.error('🔧 BOKI Receipt Saver: Receipt element and data are required');
        return null;
      }
      
      // Remove existing buttons if any
      const existingButtons = receiptElement.querySelector('.receipt-action-buttons');
      if (existingButtons) {
        existingButtons.remove();
      }
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'receipt-action-buttons';
      buttonContainer.style.cssText = \`
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 8px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      \`;
      
      // Create save button
      const saveButton = document.createElement('button');
      saveButton.innerHTML = '💾 Save';
      saveButton.className = 'receipt-save-btn';
      saveButton.style.cssText = \`
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      \`;
      saveButton.onclick = () => window.saveKioskReceipt(receiptData);
      
      // Create share button
      const shareButton = document.createElement('button');
      shareButton.innerHTML = '📤 Share';
      shareButton.className = 'receipt-share-btn';
      shareButton.style.cssText = \`
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      \`;
      shareButton.onclick = () => window.shareKioskReceipt(receiptData);
      
      // Add hover effects
      [saveButton, shareButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'translateY(-1px)';
          button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        button.addEventListener('mouseleave', () => {
          button.style.transform = 'translateY(0)';
          button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mousedown', () => {
          button.style.transform = 'translateY(0)';
          button.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseup', () => {
          button.style.transform = 'translateY(-1px)';
          button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
      });
      
      buttonContainer.appendChild(saveButton);
      buttonContainer.appendChild(shareButton);
      
      // Make receipt element relative positioned
      const originalPosition = receiptElement.style.position;
      if (!originalPosition || originalPosition === 'static') {
        receiptElement.style.position = 'relative';
      }
      
      receiptElement.appendChild(buttonContainer);
      
      // Show buttons on hover
      receiptElement.addEventListener('mouseenter', () => {
        buttonContainer.style.opacity = '1';
      });
      
      receiptElement.addEventListener('mouseleave', () => {
        buttonContainer.style.opacity = '0';
      });
      
      // Auto-show for a few seconds after adding
      setTimeout(() => {
        buttonContainer.style.opacity = '1';
        setTimeout(() => {
          buttonContainer.style.opacity = '0';
        }, 3000);
      }, 500);
      
      console.log('🔧 BOKI Receipt Saver: Buttons added to receipt element');
      return buttonContainer;
    };
    
    // Helper function to extract receipt data from DOM elements
    window.extractReceiptDataFromDOM = function(receiptElement) {
      try {
        const data = {
          orderNumber: '',
          date: new Date().toLocaleString(),
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          paymentMethod: 'Unknown',
          storeName: 'BOKI KIOSK',
          storeAddress: ''
        };
        
        // This is a basic implementation - you may need to customize
        // based on your actual receipt HTML structure
        
        // Extract order number
        const orderElement = receiptElement.querySelector('.order-number, [data-order-number]');
        if (orderElement) {
          data.orderNumber = orderElement.textContent || orderElement.getAttribute('data-order-number') || '';
        }
        
        // Extract date
        const dateElement = receiptElement.querySelector('.receipt-date, [data-date]');
        if (dateElement) {
          data.date = dateElement.textContent || dateElement.getAttribute('data-date') || data.date;
        }
        
        // Extract items
        const itemElements = receiptElement.querySelectorAll('.receipt-item, [data-item]');
        itemElements.forEach(itemEl => {
          const name = itemEl.querySelector('.item-name, [data-name]')?.textContent || 'Unknown Item';
          const quantity = parseInt(itemEl.querySelector('.item-quantity, [data-quantity]')?.textContent || '1');
          const price = parseFloat(itemEl.querySelector('.item-price, [data-price]')?.textContent?.replace('$', '') || '0');
          
          data.items.push({ name, quantity, price });
        });
        
        // Extract totals
        const subtotalEl = receiptElement.querySelector('.subtotal, [data-subtotal]');
        if (subtotalEl) {
          data.subtotal = parseFloat(subtotalEl.textContent?.replace('$', '') || '0');
        }
        
        const taxEl = receiptElement.querySelector('.tax, [data-tax]');
        if (taxEl) {
          data.tax = parseFloat(taxEl.textContent?.replace('$', '') || '0');
        }
        
        const totalEl = receiptElement.querySelector('.total, [data-total]');
        if (totalEl) {
          data.total = parseFloat(totalEl.textContent?.replace('$', '') || '0');
        }
        
        // Extract payment method
        const paymentEl = receiptElement.querySelector('.payment-method, [data-payment]');
        if (paymentEl) {
          data.paymentMethod = paymentEl.textContent || paymentEl.getAttribute('data-payment') || 'Unknown';
        }
        
        console.log('🔧 BOKI Receipt Saver: Extracted receipt data:', data);
        return data;
        
      } catch (error) {
        console.error('🔧 BOKI Receipt Saver: Failed to extract receipt data:', error);
        return null;
      }
    };
    
    // Notification helper
    function showNotification(message, type = 'info') {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = \`receipt-notification receipt-notification-\${type}\`;
      notification.textContent = message;
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: \${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: bold;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      \`;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);
      
      // Remove after delay
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
    
    console.log('🔧 BOKI Receipt Saver: Receipt saving functionality initialized successfully');
    console.log('🔧 BOKI Receipt Saver: Available functions:');
    console.log('  - window.saveKioskReceipt(receiptData)');
    console.log('  - window.shareKioskReceipt(receiptData)');
    console.log('  - window.addReceiptSaveButtons(receiptElement, receiptData)');
    console.log('  - window.extractReceiptDataFromDOM(receiptElement)');
    console.log('  - window.autoDetectReceipts()');
    
    // Expose auto-detection function globally
    window.autoDetectReceipts = autoDetectReceipts;
    
    // Auto-detect and add buttons to receipt elements
    function autoDetectReceipts() {
      console.log('🔧 BOKI Receipt Saver: Starting auto-detection...');
      
      const receiptSelectors = [
        '.receipt', '.receipt-container', '[data-receipt]',
        '.order-receipt', '.sales-receipt', '.transaction-receipt',
        '.receipt-wrapper', '.receipt-main', '.receipt-card',
        // Common receipt structures
        '[class*="receipt"]', '[class*="order"]', '[class*="transaction"]',
        // Modal and container selectors
        '.modal-content', '.modal-body', '.popup-content',
        '.receipt-modal', '.order-modal', '.transaction-modal',
        // Additional selectors for your specific app
        'body', 'main', '.container', '.content', '.page',
        '[class*="print"]', '[class*="summary"]', '[class*="order"]'
      ];
      
      let receiptElements = [];
      for (const selector of receiptSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            receiptElements = [...receiptElements, ...elements];
          }
        } catch (e) {
          console.warn(\`🔧 BOKI Receipt Saver: Error with selector \${selector}:\`, e);
        }
      }
      
      // Remove duplicates
      receiptElements = [...new Set(receiptElements)];
      
      console.log(\`🔧 BOKI Receipt Saver: Found \${receiptElements.length} potential receipt elements\`);
      
      receiptElements.forEach((receiptEl, index) => {
        // Skip if already processed
        if (receiptEl.dataset.bokiProcessed) return;
        receiptEl.dataset.bokiProcessed = 'true';
        
        console.log(\`🔧 BOKI Receipt Saver: Processing receipt element \${index + 1}\`);
        const receiptData = window.extractReceiptDataFromDOM(receiptEl);
        if (receiptData) {
          window.addReceiptSaveButtons(receiptEl, receiptData);
        }
      });
      
      // If no receipt elements found, try more aggressive detection
      if (receiptElements.length === 0) {
        console.log('🔧 BOKI Receipt Saver: No receipt elements found, trying aggressive detection...');
        
        // Look for elements that might contain receipt data
        const potentialElements = document.querySelectorAll('
          div[class*="modal"], div[class*="popup"], div[class*="dialog"],
          div[class*="content"], div[class*="body"], div[class*="container"],
          div[class*="print"], div[class*="summary"], div[class*="order"],
          body > div, main > div, .page > div
        ');
        
        potentialElements.forEach(el => {
          const text = el.textContent.toLowerCase();
          if (text.includes('receipt') || text.includes('order') || text.includes('total') || 
              text.includes('payment') || text.includes('transaction') || 
              text.includes('boki') || text.includes('ks25') || // Your order format
              text.includes('dine-in') || text.includes('take-out')) {
            console.log('🔧 BOKI Receipt Saver: Found potential receipt element by content:', el);
            console.log('Element text preview:', text.substring(0, 200));
            const receiptData = window.extractReceiptDataFromDOM(el);
            if (receiptData) {
              window.addReceiptSaveButtons(el, receiptData);
            }
          }
        });
      }
    }
    
    // Initial detection
    setTimeout(autoDetectReceipts, 2000);
    
    // Set up mutation observer for dynamically added receipts
    setTimeout(() => {
      try {
        const observer = new MutationObserver((mutations) => {
          let shouldReScan = false;
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const element = node as Element;
                if (element.matches && element.matches('[class*="receipt"], [class*="order"], [class*="modal"]')) {
                  shouldReScan = true;
                }
              }
            });
          });
          
          if (shouldReScan) {
            console.log('🔧 BOKI Receipt Saver: DOM changes detected, re-scanning for receipts...');
            setTimeout(autoDetectReceipts, 500);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        console.log('🔧 BOKI Receipt Saver: Mutation observer set up for dynamic receipts');
      } catch (e) {
        console.warn('🔧 BOKI Receipt Saver: Could not set up mutation observer:', e);
      }
    }, 3000);
    
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReceiptSaving);
  } else {
    initializeReceiptSaving();
  }
})();
`;

/**
 * Inject the receipt saving functionality into the current web view
 */
export async function injectReceiptSavingScript(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Receipt saving injection: Not running in native environment');
    return;
  }

  try {
    // For Android WebView, we can use the native bridge to inject JavaScript
    if (Capacitor.getPlatform() === 'android') {
      // Inject the script into the web view
      const script = `
        (function() {
          if (window.receiptSavingInjected) {
            console.log('Receipt saving already injected, skipping...');
            return;
          }
          window.receiptSavingInjected = true;
          ${INJECTOR_SCRIPT}
        })();
      `;
      
      // Use Capacitor's native bridge to inject the script
      (window as any).Capacitor.Plugins.WebView.injectJavaScript(script);
      console.log('Receipt saving functionality injected into web view');
    } else {
      // For other platforms, we might need to use a different approach
      console.log('Platform-specific injection needed for', Capacitor.getPlatform());
    }
  } catch (error) {
    console.error('Failed to inject receipt saving script:', error);
  }
}

/**
 * Inject script into external website context when using external URL
 */
export async function injectReceiptSavingScriptIntoExternalSite(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Receipt saving injection: Not running in native environment');
    return;
  }

  try {
    console.log('🏪 BOKI Kiosk: Attempting to inject into external website context...');
    
    // For Android WebView, inject directly into the current page context
    if (Capacitor.getPlatform() === 'android') {
      // Create a bulletproof script using base64 encoding to avoid any escaping issues
      const scriptContent = `
        (function(){
          console.log('BOKI Receipt Saver: Starting injection...');
          
          // Wait for DOM to be ready
          function whenReady(fn) {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', fn);
            } else {
              fn();
            }
          }
          
          whenReady(function() {
            // Prevent multiple injections
            if (window.bokiReceiptInjected) {
              console.log('BOKI Receipt Saver: Already injected, skipping');
              return;
            }
            window.bokiReceiptInjected = true;
            
            try {
              console.log('BOKI Receipt Saver: Creating functions...');
              
              // Create the main receipt saving function
              window.saveKioskReceipt = function(receiptData) {
                return new Promise(function(resolve, reject) {
                  console.log('BOKI Receipt Saver: Attempting to save receipt...', receiptData);
                  
                  // Try native bridge first
                  if (window.receiptImageBridge && window.receiptImageBridge.saveReceiptAsImage) {
                    window.receiptImageBridge.saveReceiptAsImage(receiptData)
                      .then(function(fileUri) {
                        console.log('BOKI Receipt Saver: Saved via native bridge:', fileUri);
                        resolve(fileUri);
                      })
                      .catch(function(error) {
                        console.error('BOKI Receipt Saver: Native bridge failed:', error);
                        reject(error);
                      });
                  } else if (window.saveReceiptAsImage) {
                    // Fallback to direct function
                    window.saveReceiptAsImage(receiptData)
                      .then(function(fileUri) {
                        console.log('BOKI Receipt Saver: Saved via direct function:', fileUri);
                        resolve(fileUri);
                      })
                      .catch(function(error) {
                        console.error('BOKI Receipt Saver: Direct function failed:', error);
                        reject(error);
                      });
                  } else {
                    reject(new Error('No receipt saving method available'));
                  }
                });
              };
              
              // Create compatibility alias
              window.saveReceiptImage = window.saveKioskReceipt;
              
              // Create sharing function
              window.shareKioskReceipt = function(receiptData) {
                return new Promise(function(resolve, reject) {
                  console.log('BOKI Receipt Saver: Attempting to share receipt...', receiptData);
                  
                  if (window.receiptImageBridge && window.receiptImageBridge.shareReceiptImage) {
                    window.receiptImageBridge.shareReceiptImage(receiptData)
                      .then(function() {
                        console.log('BOKI Receipt Saver: Shared via native bridge');
                        resolve();
                      })
                      .catch(function(error) {
                        console.error('BOKI Receipt Saver: Native bridge share failed:', error);
                        reject(error);
                      });
                  } else if (window.shareReceiptImage) {
                    window.shareReceiptImage(receiptData)
                      .then(function() {
                        console.log('BOKI Receipt Saver: Shared via direct function');
                        resolve();
                      })
                      .catch(function(error) {
                        console.error('BOKI Receipt Saver: Direct function share failed:', error);
                        reject(error);
                      });
                  } else {
                    reject(new Error('No receipt sharing method available'));
                  }
                });
              };
              
              // Create compatibility functions that the external site expects
              window.handlePrint = function() {
                console.log('BOKI Receipt Saver: handlePrint called');
                // Try to find and click any print buttons
                const printButtons = document.querySelectorAll('[class*="print"], [id*="print"], button[onclick*="print"]');
                if (printButtons.length > 0) {
                  printButtons[0].click();
                } else {
                  // Fallback: try to print the current page
                  window.print();
                }
              };
              
              window.handleBluetooth = function() {
                console.log('BOKI Receipt Saver: handleBluetooth called');
                // For now, just log - can be extended for Bluetooth functionality
                alert('Bluetooth functionality not yet implemented in kiosk mode');
              };
              
              window.handleClose = function() {
                console.log('BOKI Receipt Saver: handleClose called');
                // Try to find and click any close buttons
                const closeButtons = document.querySelectorAll('[class*="close"], [id*="close"], button[onclick*="close"]');
                if (closeButtons.length > 0) {
                  closeButtons[0].click();
                } else {
                  // Fallback: go back in history
                  window.history.back();
                }
              };
              
              console.log('BOKI Receipt Saver: Functions created successfully');
              console.log('BOKI Receipt Saver: Available functions:');
              console.log('  - window.saveKioskReceipt(data)');
              console.log('  - window.saveReceiptImage(data)');
              console.log('  - window.shareKioskReceipt(data)');
              console.log('  - window.handlePrint()');
              console.log('  - window.handleBluetooth()');
              console.log('  - window.handleClose()');
              
              // Verify functions are actually available
              console.log('BOKI Receipt Saver: Function verification:');
              console.log('  - saveKioskReceipt:', typeof window.saveKioskReceipt);
              console.log('  - saveReceiptImage:', typeof window.saveReceiptImage);
              console.log('  - handlePrint:', typeof window.handlePrint);
              console.log('  - handleBluetooth:', typeof window.handleBluetooth);
              console.log('  - handleClose:', typeof window.handleClose);
              
            } catch (error) {
              console.error('BOKI Receipt Saver: Error creating functions:', error);
            }
          });
        })()
      `;
      
      // Use the WebView injection method
      (window as any).Capacitor.Plugins.WebView.injectJavaScript(scriptContent);
      console.log('🏪 BOKI Kiosk: Receipt saving functionality injected into external website');
      
      // Also try to inject after a delay to ensure the external site is fully loaded
      setTimeout(() => {
        console.log('🏪 BOKI Kiosk: Attempting second injection after delay...');
        (window as any).Capacitor.Plugins.WebView.injectJavaScript(scriptContent);
      }, 5000);
      
    } else {
      console.log('🏪 BOKI Kiosk: Platform-specific injection needed for', Capacitor.getPlatform());
    }
  } catch (error) {
    console.error('🏪 BOKI Kiosk: Failed to inject receipt saving script into external site:', error);
  }
}

/**
 * Alternative method: Create a script element and inject it
 */
export function injectReceiptSavingScriptViaDOM(): void {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Receipt saving injection: Not running in native environment');
    return;
  }

  try {
    console.log('Attempting DOM injection of receipt saving script...');
    
    // Create the main script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = INJECTOR_SCRIPT;
    
    // Add error handling
    script.onerror = () => {
      console.error('Failed to load receipt saving script');
    };
    
    script.onload = () => {
      console.log('Receipt saving script loaded successfully');
    };
    
    document.head.appendChild(script);
    console.log('Receipt saving functionality injected via DOM');
    
    // Also try injecting into body as fallback
    setTimeout(() => {
      if (!window.saveKioskReceipt) {
        console.log('Functions not available, trying body injection...');
        const bodyScript = document.createElement('script');
        bodyScript.type = 'text/javascript';
        bodyScript.textContent = INJECTOR_SCRIPT;
        document.body.appendChild(bodyScript);
        console.log('Receipt saving functionality injected via body');
      }
    }, 1000);
    
  } catch (error) {
    console.error('Failed to inject receipt saving script via DOM:', error);
  }
}