/**
 * Test script for receipt image saving functionality
 * Run this to verify the implementation works correctly
 */

import { receiptImageSaver, ReceiptData } from '../src/utils/receiptImageSaver';

// Test receipt data
const testReceipt: ReceiptData = {
  orderNumber: 'TEST-001',
  date: new Date().toLocaleString(),
  items: [
    { name: 'Coffee', quantity: 2, price: 3.50 },
    { name: 'Sandwich', quantity: 1, price: 8.99 },
    { name: 'Cookie', quantity: 3, price: 2.25 }
  ],
  subtotal: 19.72,
  tax: 1.58,
  total: 21.30,
  paymentMethod: 'Credit Card',
  storeName: 'BOKI KIOSK',
  storeAddress: '123 Main St, Anytown, ST 12345'
};

async function testReceiptSaving() {
  console.log('🧪 Testing receipt image saving functionality...');
  console.log('📋 Test receipt data:', testReceipt);
  
  try {
    console.log('🎨 Creating receipt image...');
    const fileUri = await receiptImageSaver.saveReceiptAsImage(testReceipt);
    console.log('✅ Receipt saved successfully!');
    console.log('📁 File URI:', fileUri);
    
    console.log('\n🧪 Testing receipt sharing...');
    await receiptImageSaver.shareReceiptImage(testReceipt);
    console.log('✅ Receipt shared successfully!');
    
    console.log('\n🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testReceiptSaving().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testReceiptSaving };