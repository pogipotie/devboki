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







export const printReceipt = async (receiptData: ReceiptData): Promise<void> => {
  const receiptText = formatReceiptText(receiptData);
  
  // Check if we're in a mobile app environment
  const isMobileApp = Capacitor.isNativePlatform();
  
  console.log('🖨️ Receipt Print Debug:', {
    isMobileApp,
    platform: Capacitor.getPlatform(),
    orderNumber: receiptData.orderNumber,
    timestamp: new Date().toISOString()
  });
  
  // Safety check for mobile app environment
  const isMobileEnvironment = Capacitor.isNativePlatform();
  
  // Create HTML content for the receipt
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Receipt - ${receiptData.orderNumber}</title>
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
        <div class="print-hint">💡 Use your browser's print function (Ctrl+P or Menu → Print)</div>
        <div class="receipt">${receiptText}</div>
        <script>
          // Auto-focus and suggest printing
          window.addEventListener('load', function() {
            console.log('📄 Receipt loaded for order: ${receiptData.orderNumber}');
            
            // Show print hint for 3 seconds
            setTimeout(function() {
              const hint = document.querySelector('.print-hint');
              if (hint) {
                hint.style.opacity = '0.7';
              }
            }, 3000);
            
            // Optional: Auto-suggest print dialog (uncomment if desired)
            // setTimeout(function() {
            //   if (confirm('Would you like to print this receipt?')) {
            //     window.print();
            //   }
            // }, 1000);
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
  
  // For mobile app, open in browser; for web, open in new tab
  if (isMobileApp && isMobileEnvironment) {
    console.log('🌐 Opening receipt in browser...');
    try {
      // Create a simple about:blank page and write the HTML directly
      // This avoids blob URL and data URL issues completely
      const printWindow = window.open('about:blank', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes,top=100,left=100');
      if (printWindow) {
        // Ensure the window is properly focused and visible
        printWindow.focus();
        printWindow.document.open();
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        
        // Add a small delay to ensure everything is rendered, then focus again
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.focus();
            console.log('✅ Receipt opened and focused in about:blank window successfully');
            
            // Auto-suggest printing after a brief moment
            setTimeout(() => {
              if (printWindow && !printWindow.closed) {
                // For mobile apps, use a more reliable approach than confirm()
                if (isMobileApp) {
                  // Try to bring window to front and show print hint
                  printWindow.focus();
                  // Add a prominent print button to the receipt itself
                  const printButtonScript = `
                    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
                      <button onclick="window.print()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        font-size: 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                      ">🖨️ PRINT RECEIPT</button>
                    </div>
                  `;
                  printWindow.document.body.insertAdjacentHTML('beforeend', printButtonScript);
                  console.log('📱 Added print button to receipt for mobile');
                } else {
                  // For web, use confirm dialog
                  if (confirm('Would you like to print this receipt?')) {
                    printWindow.print();
                  }
                }
              }
            }, 1000);
          }
        }, 100);
      } else {
        console.error('❌ Failed to open new window (might be blocked by popup blocker)');
        // Fallback: try with minimal parameters but ensure visibility
        const fallbackWindow = window.open('about:blank', '_blank');
        if (fallbackWindow) {
          fallbackWindow.focus();
          fallbackWindow.document.open();
          fallbackWindow.document.write(receiptHtml);
          fallbackWindow.document.close();
          
          setTimeout(() => {
            if (fallbackWindow && !fallbackWindow.closed) {
              fallbackWindow.focus();
              console.log('✅ Receipt opened and focused in fallback about:blank window');
            }
          }, 100);
        } else {
          console.error('❌ All window opening methods failed');
        }
      }
    } catch (browserError) {
      console.error('❌ Failed to open browser:', browserError);
      // Final fallback: try one more time with about:blank and focus
      try {
        const finalWindow = window.open('about:blank');
        if (finalWindow) {
          finalWindow.focus();
          finalWindow.document.open();
          finalWindow.document.write(receiptHtml);
          finalWindow.document.close();
          
          setTimeout(() => {
            if (finalWindow && !finalWindow.closed) {
              finalWindow.focus();
              console.log('✅ Receipt opened and focused in final about:blank window');
            }
          }, 100);
        } else {
          console.error('❌ All window opening methods failed');
        }
      } catch (finalError) {
        console.error('❌ All browser opening methods failed:', finalError);
      }
    }
  } else {
    // For web or when browser plugin is not available, open in new tab/window
    console.log('🌐 Opening receipt in new tab/window...');
    const printWindow = window.open('about:blank', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes,top=100,left=100');
    if (printWindow) {
      printWindow.focus();
      printWindow.document.open();
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      
      // Ensure window is focused and suggest printing
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.focus();
          console.log('✅ Receipt opened and focused in new tab/window successfully');
          
          // Auto-suggest printing for web version too
          setTimeout(() => {
            if (printWindow && !printWindow.closed) {
              if (confirm('Would you like to print this receipt?')) {
                printWindow.print();
              }
            }
          }, 1000);
        }
      }, 100);
    } else {
      console.error('❌ Failed to open new window (might be blocked by popup blocker)');
    }
  }
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