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

export const printReceiptInBrowser = async (receiptData: ReceiptData): Promise<void> => {
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
  try {
    if (isMobileApp && isMobileEnvironment) {
      console.log('📱 Mobile app detected, opening in browser for ESC POS printing...');
      
      // Use data URL approach for better mobile browser compatibility
      try {
        // Encode receipt HTML as base64 for data URL
        const encodedHtml = btoa(unescape(encodeURIComponent(receiptHtml)));
        const dataUrl = `data:text/html;base64,${encodedHtml}`;
        
        console.log('📱 Opening data URL in mobile browser for ESC POS printing');
        
        // Use a more aggressive approach to ensure browser opens
        let printWindow;
        try {
          // Try multiple approaches to open the window
          printWindow = window.open(dataUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes,location=yes');
          
          if (!printWindow) {
            // Fallback: try without location bar
            printWindow = window.open(dataUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
          }
          
          if (!printWindow) {
            // Final fallback: try with minimal features
            printWindow = window.open(dataUrl, '_blank');
          }
        } catch (openError) {
          console.error('❌ Window open failed:', openError);
        }
        
        if (printWindow) {
          printWindow.focus();
          console.log('✅ Receipt opened in mobile browser for ESC POS printing');
          
          // Add a delay to ensure the page loads, then try to trigger print
          setTimeout(() => {
            try {
              printWindow.focus();
              // Try to trigger print dialog for ESC POS apps
              if (printWindow.print) {
                printWindow.print();
              }
            } catch (printError) {
              console.log('📄 Print dialog may not be available, but browser should be open for ESC POS');
            }
          }, 1000);
          
        } else {
          console.error('❌ Failed to open print window in mobile app');
          alert('Please allow popups and try again to print the receipt with ESC POS app');
        }
      } catch (dataUrlError) {
        console.error('❌ Data URL approach failed:', dataUrlError);
        
        // Final fallback: try the original blank window approach
        try {
          const printWindow = window.open('about:blank', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
          if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            console.log('✅ Receipt opened using fallback approach for ESC POS printing');
          }
        } catch (fallbackError) {
          console.error('❌ All approaches failed:', fallbackError);
          alert('Unable to open receipt for ESC POS printing. Please copy the receipt text manually.');
        }
      }
    } else {
      // For web version - use the original reliable approach
      const printWindow = window.open('about:blank', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        
        // Add a small delay to ensure the page loads before attempting print
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (printError) {
            console.log('📄 Print dialog may not be available in this browser');
          }
        }, 1000);
      } else {
        alert('Unable to open print window. Please ensure popups are allowed.');
      }
    }
  } catch (error) {
    console.error('❌ Error in printReceiptInBrowser:', error);
    alert('Unable to print receipt. Please try again.');
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