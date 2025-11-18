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
  
  // Optimized for 32-character width thermal paper (2-inch/58mm)
  const separator = '='.repeat(32);
  const divider = '-'.repeat(32);
  
  const receipt = `
${separator}
        BOKI RESTAURANT
      Order Receipt (Kiosk)
${separator}

Order #: ${orderNumber.padEnd(24)} ${timestamp.toLocaleDateString()}
Time: ${timestamp.toLocaleTimeString().padEnd(20)} ${displayOrderType}

${divider}
            ITEMS
${divider}
${items.map(item => {
  const itemName = `${item.name}${item.size_name ? ` (${item.size_name})` : ''}`;
  const qtyPrice = `${item.quantity}x ${formatPesoSimple(item.price)}`;
  const total = formatPesoSimple(item.price * item.quantity);
  
  // Format for thermal printer - optimized for 32 characters
  const itemNameLine = itemName.length > 32 ? itemName.substring(0, 29) + '...' : itemName;
  const qtyLine = `${qtyPrice.padEnd(20)}${total.padStart(12)}`;
  
  return `${itemNameLine}\n${qtyLine}`;
}).join('\n\n')}

${divider}
TOTAL: ${formatPesoSimple(totalAmount).padStart(26)}
${divider}

Please take this receipt to
the cashier to complete your
payment.

Order ID: ${orderId}

Thank you for choosing BOKI!
${separator}
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
  
  // Create HTML receipt optimized for 2-inch (58mm) thermal paper
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - Order ${receiptData.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            background: white;
            color: black;
            width: 100%;
            max-width: 210px; /* 58mm in pixels at 72 DPI */
            margin: 0;
            padding: 5px;
          }
          
          .receipt {
            width: 100%;
            margin: 0;
            padding: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .receipt-header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          
          .receipt-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .receipt-subtitle {
            font-size: 10px;
            margin-bottom: 2px;
          }
          
          .order-info {
            margin: 8px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          
          .info-line {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
            font-size: 10px;
          }
          
          .items-section {
            margin: 8px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          
          .section-title {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 3px;
          }
          
          .item {
            margin: 3px 0;
          }
          
          .item-name {
            font-size: 10px;
            font-weight: bold;
          }
          
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            margin-top: 1px;
          }
          
          .total-section {
            margin: 8px 0;
            text-align: right;
            font-weight: bold;
            font-size: 12px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          
          .footer {
            text-align: center;
            margin-top: 8px;
            font-size: 9px;
          }
          
          .footer-line {
            margin: 2px 0;
          }
          
          .order-id {
            font-size: 8px;
            text-align: center;
            margin-top: 5px;
            font-style: italic;
          }
          
          .print-hint {
            position: fixed;
            top: 5px;
            left: 50%;
            transform: translateX(-50%);
            background: #f3f4f6;
            color: #374151;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 10px;
            text-align: center;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 180px;
          }
          
          /* Thermal printer optimizations */
          @media print {
            .print-hint { display: none; }
            body { 
              margin: 0; 
              padding: 0; 
              font-size: 10px;
              max-width: none;
              width: 100%;
            }
            
            .receipt {
              width: 100%;
              max-width: none;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          
          /* Mobile responsive adjustments */
          @media screen and (max-width: 250px) {
            body {
              font-size: 10px;
              padding: 3px;
            }
            
            .receipt-header, .order-info, .items-section, .total-section {
              margin: 5px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-hint">💡 Printing dialog will open automatically...</div>
        <div class="receipt">
          <div class="receipt-header">
            <div class="receipt-title">BOKI RESTAURANT</div>
            <div class="receipt-subtitle">Order Receipt (Kiosk)</div>
          </div>
          
          <div class="order-info">
            <div class="info-line">
              <span>Order #:</span>
              <span>${receiptData.orderNumber}</span>
            </div>
            <div class="info-line">
              <span>Date:</span>
              <span>${receiptData.timestamp.toLocaleDateString()}</span>
            </div>
            <div class="info-line">
              <span>Time:</span>
              <span>${receiptData.timestamp.toLocaleTimeString()}</span>
            </div>
            <div class="info-line">
              <span>Type:</span>
              <span>${receiptData.orderType === 'delivery' ? 'DINE-IN' : 'TAKE-OUT'}</span>
            </div>
          </div>
          
          <div class="items-section">
            <div class="section-title">ITEMS</div>
            ${receiptData.items.map(item => `
              <div class="item">
                <div class="item-name">${item.name}${item.size_name ? ` (${item.size_name})` : ''}</div>
                <div class="item-details">
                  <span>${item.quantity}x ${formatPesoSimple(item.price)}</span>
                  <span><strong>${formatPesoSimple(item.price * item.quantity)}</strong></span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            TOTAL: <strong>${formatPesoSimple(receiptData.totalAmount)}</strong>
          </div>
          
          <div class="footer">
            <div class="footer-line">Please take this receipt to the cashier</div>
            <div class="footer-line">to complete your payment.</div>
            <div class="order-id">Order ID: ${receiptData.orderId}</div>
            <div class="footer-line" style="margin-top: 8px;">Thank you for choosing BOKI!</div>
          </div>
        </div>
        
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
      
      // Try multiple approaches for maximum compatibility
      let success = false;
      
      // Approach 1: Use Capacitor Browser with a simple HTML page
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
          console.log('📱 Attempting Capacitor Browser plugin...');
          
          // Create a simple HTML string that doesn't need blob URLs
          const simpleHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Receipt - Order ${receiptData.orderNumber}</title>
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  
                  body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 11px; 
                    line-height: 1.2; 
                    background: white;
                    color: black;
                    width: 100%;
                    max-width: 210px; /* 58mm in pixels at 72 DPI */
                    margin: 0;
                    padding: 5px;
                  }
                  
                  .print-btn {
                    position: fixed;
                    top: 5px;
                    right: 5px;
                    background: #3b82f6;
                    color: white;
                    padding: 5px 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                    z-index: 1000;
                  }
                  
                  @media print { 
                    .print-btn { display: none; }
                    body { 
                      margin: 0; 
                      padding: 0; 
                      font-size: 10px;
                      max-width: none;
                      width: 100%;
                    }
                  }
                  
                  /* Thermal printer optimizations */
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                </style>
              </head>
              <body>
                <button class="print-btn" onclick="window.print()">🖨️ Print</button>
                ${receiptHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
                <script>
                  // Auto-print after a short delay
                  setTimeout(function() {
                    window.print();
                  }, 1000);
                  
                  // Also allow manual print
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key === 'p') {
                      e.preventDefault();
                      window.print();
                    }
                  });
                <\/script>
              </body>
            </html>
          `;
          
          // Use a data URL with the simple HTML (this works better with Capacitor Browser)
          const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(simpleHtml);
          
          try {
            window.Capacitor.Plugins.Browser.open({ url: dataUrl });
            console.log('✅ Capacitor Browser opened successfully');
            success = true;
          } catch (capacitorError) {
            console.warn('⚠️ Capacitor Browser failed:', capacitorError);
          }
        }
      } catch (error) {
        console.warn('⚠️ Capacitor Browser approach failed:', error);
      }
      
      // Approach 2: Enhanced window.open if Capacitor Browser failed
      if (!success) {
        try {
          console.log('📱 Trying enhanced window.open approach...');
          
          // Optimized window size for thermal printer preview
          const printWindow = window.open('about:blank', '_blank', 'width=220,height=600,scrollbars=yes,resizable=yes,location=yes');
          
          if (printWindow) {
            // Write content directly to the new window
            printWindow.document.open();
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            
            console.log('✅ Receipt opened using window.open for ESC POS printing');
            
            // Try to trigger print dialog after content loads
            setTimeout(() => {
              try {
                printWindow.focus();
                if (printWindow.print) {
                  printWindow.print();
                }
              } catch (printError) {
                console.log('📄 Print dialog may not be available, but browser is open for ESC POS');
              }
            }, 1000);
            
            success = true;
          } else {
            console.error('❌ Failed to open print window');
          }
        } catch (windowError) {
          console.error('❌ Window.open failed:', windowError);
        }
      }
      
      // Approach 3: Download as file if both above failed
      if (!success) {
        try {
          console.log('📱 Trying download approach...');
          
          const receiptBlob = new Blob([receiptHtml], { type: 'text/html' });
          const receiptUrl = URL.createObjectURL(receiptBlob);
          
          // Create a temporary download link
          const downloadLink = document.createElement('a');
          downloadLink.href = receiptUrl;
          downloadLink.download = `receipt-${receiptData.orderNumber}.html`;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          console.log('✅ Receipt downloaded as file for ESC POS printing');
          alert('Receipt downloaded! Open the downloaded file in your browser for ESC POS printing.');
          
          setTimeout(() => {
            URL.revokeObjectURL(receiptUrl);
            console.log('🧹 Cleaned up download URL');
          }, 5000);
          
          success = true;
        } catch (downloadError) {
          console.error('❌ Download approach failed:', downloadError);
          alert('Unable to open receipt for ESC POS printing. Please copy the receipt text manually.');
        }
      }
    } else {
      // For web version - use thermal-optimized approach
      const printWindow = window.open('about:blank', '_blank', 'width=220,height=600,scrollbars=yes,resizable=yes');
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