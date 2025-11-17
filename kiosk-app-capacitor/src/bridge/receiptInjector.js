/**
 * Receipt Image Saver - Injection Script
 * This script can be injected into the hosted kiosk web application
 * to enable receipt image saving functionality
 */

(function() {
  'use strict';
  
  console.log('🔧 BOKI Receipt Saver: Injection script loaded');
  
  // Wait for the native bridge to be ready
  function waitForNativeBridge() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds timeout
      
      const checkBridge = () => {
        attempts++;
        
        if (window.receiptImageBridge && window.receiptImageBridge.isAvailable()) {
          console.log('🔧 BOKI Receipt Saver: Native bridge ready');
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.warn('🔧 BOKI Receipt Saver: Native bridge timeout - functionality not available');
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
        
        if (!window.receiptImageBridge) {
          throw new Error('Receipt bridge not available');
        }
        
        const fileUri = await window.receiptImageBridge.saveReceiptAsImage(receiptData);
        console.log('🔧 BOKI Receipt Saver: Receipt saved successfully:', fileUri);
        
        // Show success notification
        showNotification('✅ Receipt saved successfully!', 'success');
        
        return fileUri;
      } catch (error) {
        console.error('🔧 BOKI Receipt Saver: Failed to save receipt:', error);
        showNotification('❌ Failed to save receipt: ' + error.message, 'error');
        throw error;
      }
    };
    
    // Main share function
    window.shareKioskReceipt = async function(receiptData) {
      try {
        console.log('🔧 BOKI Receipt Saver: Sharing receipt...', receiptData);
        
        if (!window.receiptImageBridge) {
          throw new Error('Receipt bridge not available');
        }
        
        await window.receiptImageBridge.shareReceiptImage(receiptData);
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
      buttonContainer.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 8px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      
      // Create save button
      const saveButton = document.createElement('button');
      saveButton.innerHTML = '💾 Save';
      saveButton.className = 'receipt-save-btn';
      saveButton.style.cssText = `
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
      `;
      saveButton.onclick = () => window.saveKioskReceipt(receiptData);
      
      // Create share button
      const shareButton = document.createElement('button');
      shareButton.innerHTML = '📤 Share';
      shareButton.className = 'receipt-share-btn';
      shareButton.style.cssText = `
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
      `;
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
      notification.className = `receipt-notification receipt-notification-${type}`;
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
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
      `;
      
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
    
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReceiptSaving);
  } else {
    initializeReceiptSaving();
  }
  
})();