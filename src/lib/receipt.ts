import { formatPesoSimple } from './currency';
import { Capacitor } from '@capacitor/core';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  size_option_id?: string;
  size_name?: string;
}

export interface ReceiptData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'delivery' | 'pickup';
  items: OrderItem[];
  totalAmount: number;
  timestamp: Date;
  qrCodeData?: string;
}

export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `BK${year}${month}${day}${random}`;
};

export const generateQRCodeData = (orderId: string, orderNumber: string): string => {
  return JSON.stringify({
    orderId,
    orderNumber,
    restaurant: 'BOKI',
    timestamp: new Date().toISOString()
  });
};

export const formatReceiptText = (receiptData: ReceiptData): string => {
  const { orderId, orderNumber, orderType, items, totalAmount, timestamp } = receiptData;
  
  // Format order type for display - convert 'delivery' to 'DINE-IN' and 'pickup' to 'TAKE-OUT' for kiosk orders
  const displayOrderType = orderType === 'delivery' ? 'DINE-IN' : 'TAKE-OUT';
  
  const receipt = `
========================================
              BOKI RESTAURANT
           Order Receipt (Kiosk)
========================================

Order #: ${orderNumber}
Date: ${timestamp.toLocaleDateString()}
Time: ${timestamp.toLocaleTimeString()}
Type: ${displayOrderType}

----------------------------------------
                ITEMS
----------------------------------------
${items.map(item => {
  const itemLine = `${item.name}${item.size_name ? ` (${item.size_name})` : ''}`;
  const qtyPrice = `${item.quantity}x ${formatPesoSimple(item.price)}`;
  const total = formatPesoSimple(item.price * item.quantity);
  
  return `${itemLine}
  ${qtyPrice} = ${total}`;
}).join('\n\n')}

----------------------------------------
TOTAL: ${formatPesoSimple(totalAmount)}
----------------------------------------

Please take this receipt to the cashier
to complete your payment.

Order ID: ${orderId}

Thank you for choosing BOKI!
========================================
  `.trim();
  
  return receipt;
};







export const displayReceipt = (receiptData: ReceiptData): string => {
  return formatReceiptText(receiptData);
};

export const printReceiptInBrowser = (receiptData: ReceiptData): void => {
  const receiptText = formatReceiptText(receiptData);
  
  // Check if we're in a mobile app environment
  const isMobileApp = Capacitor.isNativePlatform();
  const isMobileEnvironment = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log(`🖨️ Opening receipt in browser for printing - Order ${receiptData.orderNumber}...`);
  console.log(`📱 Mobile App: ${isMobileApp}, Mobile Environment: ${isMobileEnvironment}`);
  
  // Create HTML receipt optimized for printing with auto-print
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - Order ${receiptData.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            margin: 20px;
            white-space: pre-wrap;
            background: white;
            color: black;
          }
          .receipt {
            max-width: 100%;
            margin: 0 auto;
            padding: 10px;
          }
          .print-hint {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #f3f4f6;
            color: #374151;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }
          @media print {
            .print-hint { display: none; }
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-hint">💡 Printing dialog will open automatically...</div>
        <div class="receipt">${receiptText}</div>
        <script>
          // Auto-open print dialog when page loads
          window.addEventListener('load', function() {
            console.log('🖨️ Receipt loaded for printing - Order: ${receiptData.orderNumber}');
            
            // Small delay to ensure everything is rendered, then open print dialog
            setTimeout(function() {
              window.print();
            }, 500);
          });
          
          // Handle keyboard shortcut for print
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
          });
        </script>
      </body>
    </html>
  `;
  
  // Open in browser and trigger print dialog
  if (isMobileApp && isMobileEnvironment) {
    try {
      const printWindow = window.open('about:blank', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes,top=100,left=100');
      if (printWindow) {
        printWindow.focus();
        printWindow.document.open();
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        console.log('✅ Receipt opened in browser with auto-print triggered');
      } else {
        console.error('❌ Failed to open print window');
        alert('Please allow popups to print the receipt');
      }
    } catch (error) {
      console.error('❌ Error opening print window:', error);
      alert('Unable to open print window. Please try again.');
    }
  } else {
    // For web version
    const printWindow = window.open('about:blank', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      console.log('✅ Receipt opened in browser with auto-print triggered');
    } else {
      console.error('❌ Failed to open print window');
      alert('Please allow popups to print the receipt');
    }
  }
};

export const printReceipt = async (receiptData: ReceiptData): Promise<void> => {
  // This function now just prepares the receipt data for in-app display
  // The actual printing will be triggered by printReceiptInBrowser() when user clicks print
  
  console.log(`📄 Receipt prepared for in-app display - Order ${receiptData.orderNumber}`);
  console.log('💡 Use displayReceipt() to get formatted text for in-app display');
  console.log('💡 Use printReceiptInBrowser() when user clicks print button');
  
  // Store receipt data globally or return it for your UI to display
  // You can access the formatted text using displayReceipt(receiptData)
  
  return Promise.resolve();
}

export const downloadReceiptAsText = (receiptData: ReceiptData): void => {
  const receiptText = formatReceiptText(receiptData);
  const blob = new Blob([receiptText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${receiptData.orderNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};