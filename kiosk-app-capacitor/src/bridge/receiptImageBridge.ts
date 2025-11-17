/**
 * Receipt Image Saver Bridge
 * This script provides functionality to save receipts as images from the kiosk web app
 * It gets injected into the Capacitor web view and exposes methods to the window object
 */

import { receiptImageSaver, ReceiptData } from '../utils/receiptImageSaver';

export interface ReceiptImageBridge {
  saveReceiptAsImage: (receiptData: ReceiptData) => Promise<string>;
  saveReceiptImage: (receiptData: ReceiptData) => Promise<string>;
  shareReceiptImage: (receiptData: ReceiptData) => Promise<void>;
  isAvailable: () => boolean;
}

// Create the bridge object
const receiptImageBridge: ReceiptImageBridge = {
  /**
   * Save receipt as image to device storage
   * @param receiptData - The receipt data to save
   * @returns Promise<string> - The file URI of the saved image
   */
  async saveReceiptAsImage(receiptData: ReceiptData): Promise<string> {
    try {
      console.log('Saving receipt as image...', receiptData);
      const fileUri = await receiptImageSaver.saveReceiptAsImage(receiptData);
      console.log('Receipt saved successfully:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('Failed to save receipt:', error);
      throw new Error(`Failed to save receipt: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Alias for saveReceiptAsImage for compatibility with receipt print window
   * @param receiptData - The receipt data to save
   * @returns Promise<string> - The file URI of the saved image
   */
  async saveReceiptImage(receiptData: ReceiptData): Promise<string> {
    return this.saveReceiptAsImage(receiptData);
  },

  /**
   * Share receipt image via native share dialog
   * @param receiptData - The receipt data to share
   * @returns Promise<void>
   */
  async shareReceiptImage(receiptData: ReceiptData): Promise<void> {
    try {
      console.log('Sharing receipt image...', receiptData);
      await receiptImageSaver.shareReceiptImage(receiptData);
      console.log('Receipt shared successfully');
    } catch (error) {
      console.error('Failed to share receipt:', error);
      throw new Error(`Failed to share receipt: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Check if the receipt image bridge is available
   * @returns boolean
   */
  isAvailable(): boolean {
    return true;
  }
};

// Expose the bridge to the window object
export function initializeReceiptImageBridge(): void {
  if (typeof window !== 'undefined') {
    // Make the bridge available globally
    (window as any).receiptImageBridge = receiptImageBridge;
    
    // Also expose individual methods for easier access
    (window as any).saveReceiptAsImage = receiptImageBridge.saveReceiptAsImage;
    (window as any).saveReceiptImage = receiptImageBridge.saveReceiptImage;
    (window as any).shareReceiptImage = receiptImageBridge.shareReceiptImage;
    
    console.log('Receipt Image Bridge initialized successfully');
    
    // Dispatch a custom event to notify that the bridge is ready
    window.dispatchEvent(new CustomEvent('receiptImageBridgeReady'));
  }
}

// Type declarations for TypeScript support
declare global {
  interface Window {
    receiptImageBridge?: ReceiptImageBridge;
    saveReceiptAsImage?: (receiptData: ReceiptData) => Promise<string>;
    saveReceiptImage?: (receiptData: ReceiptData) => Promise<string>;
    shareReceiptImage?: (receiptData: ReceiptData) => Promise<void>;
  }
}

export default receiptImageBridge;