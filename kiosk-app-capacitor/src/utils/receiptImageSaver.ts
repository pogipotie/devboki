import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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

export class ReceiptImageSaver {
  private static instance: ReceiptImageSaver;

  static getInstance(): ReceiptImageSaver {
    if (!ReceiptImageSaver.instance) {
      ReceiptImageSaver.instance = new ReceiptImageSaver();
    }
    return ReceiptImageSaver.instance;
  }

  async saveReceiptAsImage(receiptData: ReceiptData): Promise<string> {
    try {
      // Convert HTML to canvas (using html2canvas or similar)
      // For now, we'll create a simple canvas-based receipt
      const canvas = await this.createReceiptCanvas(receiptData);
      
      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png');
      
      // Save to device
      const fileName = `receipt_${receiptData.orderNumber}_${Date.now()}.png`;
      const savedFile = await this.saveImageToDevice(imageData, fileName);
      
      return savedFile.uri;
    } catch (error) {
      console.error('Error saving receipt as image:', error);
      throw new Error('Failed to save receipt as image');
    }
  }

  async shareReceiptImage(receiptData: ReceiptData): Promise<void> {
    try {
      const fileUri = await this.saveReceiptAsImage(receiptData);
      
      await Share.share({
        title: `Receipt ${receiptData.orderNumber}`,
        text: `Receipt from ${receiptData.storeName || 'BOKI Kiosk'}`,
        url: fileUri,
        dialogTitle: 'Share Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      throw new Error('Failed to share receipt');
    }
  }

  private async createReceiptCanvas(receiptData: ReceiptData): Promise<HTMLCanvasElement> {
    // Create canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas dimensions (receipt width ~300px)
    const canvasWidth = 400;
    const canvasHeight = this.calculateReceiptHeight(receiptData);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Set text properties
    ctx.fillStyle = '#000000';
    ctx.font = '14px Courier New';
    
    let yPosition = 30;
    
    // Draw header
    ctx.font = 'bold 18px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(receiptData.storeName || 'BOKI KIOSK', canvasWidth / 2, yPosition);
    
    yPosition += 25;
    ctx.font = '12px Courier New';
    ctx.fillText(receiptData.storeAddress || 'Thank you for your purchase!', canvasWidth / 2, yPosition);
    
    yPosition += 20;
    ctx.fillText(`Order: ${receiptData.orderNumber}`, canvasWidth / 2, yPosition);
    
    yPosition += 15;
    ctx.fillText(`Date: ${receiptData.date}`, canvasWidth / 2, yPosition);
    
    yPosition += 30;
    
    // Draw items
    ctx.textAlign = 'left';
    ctx.font = '14px Courier New';
    
    receiptData.items.forEach(item => {
      ctx.fillText(`${item.name} x${item.quantity}`, 20, yPosition);
      ctx.textAlign = 'right';
      ctx.fillText(`$${item.price.toFixed(2)}`, canvasWidth - 20, yPosition);
      ctx.textAlign = 'left';
      yPosition += 20;
    });
    
    // Draw totals
    yPosition += 10;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(20, yPosition);
    ctx.lineTo(canvasWidth - 20, yPosition);
    ctx.stroke();
    
    yPosition += 25;
    ctx.fillText('Subtotal:', 20, yPosition);
    ctx.textAlign = 'right';
    ctx.fillText(`$${receiptData.subtotal.toFixed(2)}`, canvasWidth - 20, yPosition);
    
    yPosition += 20;
    ctx.textAlign = 'left';
    ctx.fillText('Tax:', 20, yPosition);
    ctx.textAlign = 'right';
    ctx.fillText(`$${receiptData.tax.toFixed(2)}`, canvasWidth - 20, yPosition);
    
    yPosition += 25;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL:', 20, yPosition);
    ctx.textAlign = 'right';
    ctx.fillText(`$${receiptData.total.toFixed(2)}`, canvasWidth - 20, yPosition);
    
    // Draw footer
    yPosition += 30;
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`Payment: ${receiptData.paymentMethod}`, canvasWidth / 2, yPosition);
    
    yPosition += 15;
    ctx.fillText('Thank you for your business!', canvasWidth / 2, yPosition);
    
    return canvas;
  }

  private calculateReceiptHeight(receiptData: ReceiptData): number {
    // Base height for header and footer
    let height = 200;
    
    // Add height for items (20px per item)
    height += receiptData.items.length * 20;
    
    // Add some padding
    height += 50;
    
    return height;
  }

  private async saveImageToDevice(imageData: string, fileName: string): Promise<any> {
    try {
      // Remove data URL prefix
      const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
      
      // Save to device
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      });
      
      return savedFile;
    } catch (error) {
      console.error('Error saving image to device:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const receiptImageSaver = ReceiptImageSaver.getInstance();