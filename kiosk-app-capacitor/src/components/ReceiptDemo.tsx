import React, { useState } from 'react';
import { receiptImageSaver, ReceiptData } from '../utils/receiptImageSaver';

/**
 * Demo component showing how to use the receipt image saving functionality
 * This component can be used for testing the feature
 */
const ReceiptDemo: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [lastSavedFile, setLastSavedFile] = useState<string>('');

  // Sample receipt data
  const sampleReceipt: ReceiptData = {
    orderNumber: 'DEMO-001',
    date: new Date().toLocaleString(),
    items: [
      { name: 'Coffee', quantity: 2, price: 3.50 },
      { name: 'Sandwich', quantity: 1, price: 8.99 },
      { name: 'Cookie', quantity: 3, price: 2.25 },
      { name: 'Bottled Water', quantity: 1, price: 1.99 }
    ],
    subtotal: 19.72,
    tax: 1.58,
    total: 21.30,
    paymentMethod: 'Credit Card',
    storeName: 'BOKI KIOSK',
    storeAddress: '123 Main St, Anytown, ST 12345'
  };

  const handleSaveReceipt = async () => {
    try {
      setIsSaving(true);
      const fileUri = await receiptImageSaver.saveReceiptAsImage(sampleReceipt);
      setLastSavedFile(fileUri);
      alert(`Receipt saved successfully!\nFile: ${fileUri}`);
    } catch (error) {
      console.error('Failed to save receipt:', error);
      alert(`Failed to save receipt: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareReceipt = async () => {
    try {
      setIsSharing(true);
      await receiptImageSaver.shareReceiptImage(sampleReceipt);
      alert('Receipt shared successfully!');
    } catch (error) {
      console.error('Failed to share receipt:', error);
      alert(`Failed to share receipt: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '20px auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>🏪 Receipt Image Saver Demo</h2>
      <p>This demo shows how the receipt image saving functionality works.</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '4px',
        margin: '20px 0',
        border: '1px solid #ddd',
        fontFamily: 'Courier New, monospace'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>{sampleReceipt.storeName}</h3>
          <p>{sampleReceipt.storeAddress}</p>
          <p>Order: {sampleReceipt.orderNumber}</p>
          <p>Date: {sampleReceipt.date}</p>
        </div>
        
        <div style={{ margin: '20px 0' }}>
          {sampleReceipt.items.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              margin: '5px 0'
            }}>
              <span>{item.name} x{item.quantity}</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div style={{ 
          borderTop: '1px dashed #000', 
          paddingTop: '10px',
          marginTop: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            margin: '5px 0'
          }}>
            <span>Subtotal:</span>
            <span>${sampleReceipt.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            margin: '5px 0'
          }}>
            <span>Tax:</span>
            <span>${sampleReceipt.tax.toFixed(2)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            margin: '5px 0',
            fontWeight: 'bold',
            fontSize: '1.2em'
          }}>
            <span>TOTAL:</span>
            <span>${sampleReceipt.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8em' }}>
          <p>Payment: {sampleReceipt.paymentMethod}</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleSaveReceipt}
          disabled={isSaving}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isSaving ? 0.6 : 1
          }}
        >
          {isSaving ? '💾 Saving...' : '💾 Save as Image'}
        </button>
        
        <button
          onClick={handleShareReceipt}
          disabled={isSharing}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: isSharing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isSharing ? 0.6 : 1
          }}
        >
          {isSharing ? '📤 Sharing...' : '📤 Share Receipt'}
        </button>
      </div>
      
      {lastSavedFile && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px',
          border: '1px solid #4CAF50'
        }}>
          <strong>Last saved file:</strong><br />
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {lastSavedFile}
          </code>
        </div>
      )}
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '4px',
        border: '1px solid #ffeaa7',
        fontSize: '14px'
      }}>
        <strong>Note:</strong> This functionality is only available when running in the 
        native Capacitor app. In a web browser, the save/share functions will not work.
      </div>
    </div>
  );
};

export default ReceiptDemo;