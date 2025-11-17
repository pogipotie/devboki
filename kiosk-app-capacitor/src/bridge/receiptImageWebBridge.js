/**
 * Receipt Image Saver - Web Bridge Script
 * This script should be injected into the web view to provide receipt saving functionality
 * to the hosted kiosk application
 */

(function() {
  'use strict';
  
  console.log('Receipt Image Saver Web Bridge loaded');
  
  // Wait for the native bridge to be ready
  function waitForBridge() {
    return new Promise((resolve) => {
      if (window.receiptImageBridge) {
        resolve();
      } else {
        window.addEventListener('receiptImageBridgeReady', resolve, { once: true });
      }
    });
  }
  
  // Create a helper function to save receipts
  async function saveReceipt(receiptData) {
    try {
      await waitForBridge();
      
      if (!window.receiptImageBridge) {
        throw new Error('Receipt image bridge not available');
      }
      
      const fileUri = await window.receiptImageBridge.saveReceiptAsImage(receiptData);
      console.log('Receipt saved successfully:', fileUri);
      
      // Show success message
      if (window.Toastify) {
        window.Toastify({
          text: 'Receipt saved successfully!',
          duration: 3000,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#4CAF50',
        }).showToast();
      }
      
      return fileUri;
    } catch (error) {
      console.error('Failed to save receipt:', error);
      
      // Show error message
      if (window.Toastify) {
        window.Toastify({
          text: 'Failed to save receipt: ' + error.message,
          duration: 3000,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#F44336',
        }).showToast();
      }
      
      throw error;
    }
  }
  
  // Create a helper function to share receipts
  async function shareReceipt(receiptData) {
    try {
      await waitForBridge();
      
      if (!window.receiptImageBridge) {
        throw new Error('Receipt image bridge not available');
      }
      
      await window.receiptImageBridge.shareReceiptImage(receiptData);
      console.log('Receipt shared successfully');
      
      // Show success message
      if (window.Toastify) {
        window.Toastify({
          text: 'Receipt shared successfully!',
          duration: 3000,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#4CAF50',
        }).showToast();
      }
    } catch (error) {
      console.error('Failed to share receipt:', error);
      
      // Show error message
      if (window.Toastify) {
        window.Toastify({
          text: 'Failed to share receipt: ' + error.message,
          duration: 3000,
          gravity: 'top',
          position: 'center',
          backgroundColor: '#F44336',
        }).showToast();
      }
      
      throw error;
    }
  }
  
  // Expose helper functions globally
  window.saveKioskReceipt = saveReceipt;
  window.shareKioskReceipt = shareReceipt;
  
  // Create a UI helper function to add save/share buttons to receipt elements
  window.addReceiptSaveButtons = function(receiptElement, receiptData) {
    if (!receiptElement || !receiptData) {
      console.error('Receipt element and data are required');
      return;
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'receipt-action-buttons';
    buttonContainer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.innerHTML = '💾 Save';
    saveButton.className = 'receipt-save-btn';
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
    saveButton.onclick = () => saveReceipt(receiptData);
    
    // Create share button
    const shareButton = document.createElement('button');
    shareButton.innerHTML = '📤 Share';
    shareButton.className = 'receipt-share-btn';
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
    shareButton.onclick = () => shareReceipt(receiptData);
    
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(shareButton);
    
    // Make receipt element relative positioned
    receiptElement.style.position = 'relative';
    receiptElement.appendChild(buttonContainer);
    
    return buttonContainer;
  };
  
  console.log('Receipt Image Saver Web Bridge initialized');
  console.log('Available functions:');
  console.log('- window.saveKioskReceipt(receiptData)');
  console.log('- window.shareKioskReceipt(receiptData)');
  console.log('- window.addReceiptSaveButtons(receiptElement, receiptData)');
  
})();