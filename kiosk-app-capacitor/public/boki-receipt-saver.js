/**
 * BOKI Receipt Saver - Integration Script
 * This script should be included in your hosted kiosk web application
 * to enable receipt image saving functionality
 * 
 * Usage: Add this script to your HTML or import it in your JavaScript
 */

(function() {
  'use strict';
  
  console.log('🔧 BOKI Receipt Saver: Integration script loaded');
  
  // Configuration
  const CONFIG = {
    autoInject: true, // Automatically add buttons to receipt elements
    buttonPosition: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
    showOnHover: true, // Show buttons on hover
    autoShowDuration: 3000, // Auto-show buttons for 3 seconds
    debug: true // Enable debug logging
  };
  
  // Receipt data template
  const RECEIPT_TEMPLATE = {
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
  
  // Wait for native bridge to be ready
  function waitForNativeBridge() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds timeout
      
      const checkBridge = () => {
        attempts++;
        
        if (window.receiptImageBridge && window.receiptImageBridge.isAvailable && window.receiptImageBridge.isAvailable()) {
          log('Native bridge detected and ready');
          resolve(true);
        } else if (window.saveReceiptAsImage && window.shareReceiptImage) {
          log('Individual bridge methods detected');
          resolve(true);
        } else if (attempts >= maxAttempts) {
          log('Native bridge timeout - functionality limited', 'warn');
          resolve(false);
        } else {
          setTimeout(checkBridge, 100);
        }
      };
      
      checkBridge();
    });
  }
  
  // Logging helper
  function log(message, level = 'log') {
    if (CONFIG.debug) {
      console[level]('🔧 BOKI Receipt Saver:', message);
    }
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`boki-notification boki-notification-\${type}\`;
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
      font-family: Arial, sans-serif;
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
  
  // Save receipt function
  window.saveKioskReceipt = async function(receiptData) {
    try {
      log('Saving receipt...');
      
      let fileUri;
      if (window.receiptImageBridge && window.receiptImageBridge.saveReceiptAsImage) {
        fileUri = await window.receiptImageBridge.saveReceiptAsImage(receiptData);
      } else if (window.saveReceiptAsImage) {
        fileUri = await window.saveReceiptAsImage(receiptData);
      } else {
        throw new Error('No receipt saving method available');
      }
      
      log('Receipt saved successfully: ' + fileUri);
      showNotification('✅ Receipt saved successfully!', 'success');
      return fileUri;
    } catch (error) {
      log('Failed to save receipt: ' + error.message, 'error');
      showNotification('❌ Failed to save receipt: ' + error.message, 'error');
      throw error;
    }
  };
  
  // Share receipt function
  window.shareKioskReceipt = async function(receiptData) {
    try {
      log('Sharing receipt...');
      
      if (window.receiptImageBridge && window.receiptImageBridge.shareReceiptImage) {
        await window.receiptImageBridge.shareReceiptImage(receiptData);
      } else if (window.shareReceiptImage) {
        await window.shareReceiptImage(receiptData);
      } else {
        throw new Error('No receipt sharing method available');
      }
      
      log('Receipt shared successfully');
      showNotification('✅ Receipt shared successfully!', 'success');
    } catch (error) {
      log('Failed to share receipt: ' + error.message, 'error');
      showNotification('❌ Failed to share receipt: ' + error.message, 'error');
      throw error;
    }
  };
  
  // Extract receipt data from DOM
  window.extractReceiptDataFromDOM = function(receiptElement) {
    try {
      const data = { ...RECEIPT_TEMPLATE };
      
      // Extract order number
      const orderElement = receiptElement.querySelector('.order-number, [data-order-number], .order-no, .receipt-number');
      if (orderElement) {
        data.orderNumber = orderElement.textContent.trim() || orderElement.getAttribute('data-order-number') || '';
      }
      
      // Extract date
      const dateElement = receiptElement.querySelector('.receipt-date, [data-date], .date, .timestamp');
      if (dateElement) {
        data.date = dateElement.textContent.trim() || dateElement.getAttribute('data-date') || data.date;
      }
      
      // Extract items
      const itemSelectors = [
        '.receipt-item', '[data-item]', '.item', '.product-item',
        '.order-item', '.cart-item', '.receipt-line'
      ];
      
      let itemElements = [];
      for (const selector of itemSelectors) {
        itemElements = receiptElement.querySelectorAll(selector);
        if (itemElements.length > 0) break;
      }
      
      itemElements.forEach(itemEl => {
        const nameSelectors = ['.item-name', '[data-name]', '.product-name', '.name', 'h4', 'h5', 'h6'];
        const quantitySelectors = ['.item-quantity', '[data-quantity]', '.qty', '.quantity', '.count'];
        const priceSelectors = ['.item-price', '[data-price]', '.price', '.cost', '.amount'];
        
        let name = 'Unknown Item';
        let quantity = 1;
        let price = 0;
        
        // Find name
        for (const selector of nameSelectors) {
          const nameEl = itemEl.querySelector(selector);
          if (nameEl && nameEl.textContent.trim()) {
            name = nameEl.textContent.trim();
            break;
          }
        }
        
        // Find quantity
        for (const selector of quantitySelectors) {
          const qtyEl = itemEl.querySelector(selector);
          if (qtyEl) {
            const qtyText = qtyEl.textContent.trim().replace(/[^\d]/g, '');
            quantity = parseInt(qtyText) || 1;
            break;
          }
        }
        
        // Find price
        for (const selector of priceSelectors) {
          const priceEl = itemEl.querySelector(selector);
          if (priceEl) {
            const priceText = priceEl.textContent.trim().replace(/[$,]/g, '');
            price = parseFloat(priceText) || 0;
            break;
          }
        }
        
        if (name !== 'Unknown Item' || price > 0) {
          data.items.push({ name, quantity, price });
        }
      });
      
      // Extract totals
      const subtotalSelectors = ['.subtotal', '[data-subtotal]', '.sub-total', '.before-tax'];
      for (const selector of subtotalSelectors) {
        const subtotalEl = receiptElement.querySelector(selector);
        if (subtotalEl) {
          const subtotalText = subtotalEl.textContent.trim().replace(/[$,]/g, '');
          data.subtotal = parseFloat(subtotalText) || 0;
          break;
        }
      }
      
      const taxSelectors = ['.tax', '[data-tax]', '.tax-amount', '.vat', '.gst'];
      for (const selector of taxSelectors) {
        const taxEl = receiptElement.querySelector(selector);
        if (taxEl) {
          const taxText = taxEl.textContent.trim().replace(/[$,]/g, '');
          data.tax = parseFloat(taxText) || 0;
          break;
        }
      }
      
      const totalSelectors = ['.total', '[data-total]', '.grand-total', '.final-amount', '.amount-due'];
      for (const selector of totalSelectors) {
        const totalEl = receiptElement.querySelector(selector);
        if (totalEl) {
          const totalText = totalEl.textContent.trim().replace(/[$,]/g, '');
          data.total = parseFloat(totalText) || 0;
          break;
        }
      }
      
      // If we couldn't find subtotal but found total, estimate subtotal
      if (data.subtotal === 0 && data.total > 0 && data.tax > 0) {
        data.subtotal = data.total - data.tax;
      }
      
      // If we couldn't find total but found subtotal and tax, calculate total
      if (data.total === 0 && data.subtotal > 0 && data.tax > 0) {
        data.total = data.subtotal + data.tax;
      }
      
      // Extract payment method
      const paymentSelectors = ['.payment-method', '[data-payment]', '.payment-type', '.paid-with'];
      for (const selector of paymentSelectors) {
        const paymentEl = receiptElement.querySelector(selector);
        if (paymentEl) {
          data.paymentMethod = paymentEl.textContent.trim() || paymentEl.getAttribute('data-payment') || 'Unknown';
          break;
        }
      }
      
      log('Extracted receipt data:' + JSON.stringify(data, null, 2));
      return data;
      
    } catch (error) {
      log('Failed to extract receipt data: ' + error.message, 'error');
      return null;
    }
  };
  
  // Add save/share buttons to receipt element
  window.addReceiptSaveButtons = function(receiptElement, receiptData) {
    if (!receiptElement) {
      log('Receipt element is required', 'error');
      return null;
    }
    
    // If no receipt data provided, try to extract it
    if (!receiptData) {
      log('No receipt data provided, attempting to extract from DOM');
      receiptData = window.extractReceiptDataFromDOM(receiptElement);
      if (!receiptData) {
        log('Could not extract receipt data, using template', 'warn');
        receiptData = { ...RECEIPT_TEMPLATE };
      }
    }
    
    // Remove existing buttons if any
    const existingButtons = receiptElement.querySelector('.boki-receipt-buttons');
    if (existingButtons) {
      existingButtons.remove();
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'boki-receipt-buttons';
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
    saveButton.innerHTML = '💾 Save Receipt';
    saveButton.className = 'boki-save-btn';
    saveButton.style.cssText = \`
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    \`;
    saveButton.onclick = () => window.saveKioskReceipt(receiptData);
    
    // Create share button
    const shareButton = document.createElement('button');
    shareButton.innerHTML = '📤 Share Receipt';
    shareButton.className = 'boki-share-btn';
    shareButton.style.cssText = \`
      background: linear-gradient(135deg, #2196F3, #1976D2);
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
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
    if (CONFIG.showOnHover) {
      receiptElement.addEventListener('mouseenter', () => {
        buttonContainer.style.opacity = '1';
      });
      
      receiptElement.addEventListener('mouseleave', () => {
        buttonContainer.style.opacity = '0';
      });
    }
    
    // Auto-show for a few seconds after adding
    setTimeout(() => {
      buttonContainer.style.opacity = '1';
      setTimeout(() => {
        if (CONFIG.showOnHover) {
          buttonContainer.style.opacity = '0';
        }
      }, CONFIG.autoShowDuration);
    }, 500);
    
    log('Buttons added to receipt element');
    return buttonContainer;
  };
  
  // Auto-detect and add buttons to receipt elements
  function autoDetectReceipts() {
    const receiptSelectors = [
      '.receipt', '.receipt-container', '[data-receipt]',
      '.order-receipt', '.sales-receipt', '.transaction-receipt',
      '.receipt-wrapper', '.receipt-main', '.receipt-card'
    ];
    
    let receiptElements = [];
    for (const selector of receiptSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        receiptElements = [...receiptElements, ...elements];
      }
    }
    
    // Remove duplicates
    receiptElements = [...new Set(receiptElements)];
    
    log(\`Found \${receiptElements.length} receipt elements\`);
    
    receiptElements.forEach((receiptEl, index) => {
      // Skip if already processed
      if (receiptEl.dataset.bokiProcessed) return;
      receiptEl.dataset.bokiProcessed = 'true';
      
      log(\`Processing receipt element \${index + 1}\`);
      const receiptData = window.extractReceiptDataFromDOM(receiptEl);
      if (receiptData) {
        window.addReceiptSaveButtons(receiptEl, receiptData);
      }
    });
  }
  
  // Initialize
  async function initialize() {
    log('Initializing BOKI Receipt Saver...');
    
    // Wait for native bridge
    await waitForNativeBridge();
    
    // Auto-detect receipts if enabled
    if (CONFIG.autoInject) {
      // Initial detection
      setTimeout(autoDetectReceipts, 1000);
      
      // Watch for dynamically added receipts
      const observer = new MutationObserver(() => {
        setTimeout(autoDetectReceipts, 500);
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    log('BOKI Receipt Saver initialized successfully!');
    log('Available functions:');
    log('  - window.saveKioskReceipt(receiptData)');
    log('  - window.shareKioskReceipt(receiptData)');
    log('  - window.addReceiptSaveButtons(receiptElement, receiptData)');
    log('  - window.extractReceiptDataFromDOM(receiptElement)');
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();