import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { initializeReceiptImageBridge } from '../../bridge/receiptImageBridge';
import { injectReceiptSavingScriptViaDOM } from '../../utils/webViewInjector';

// TypeScript type definitions for window properties
declare global {
  interface Window {
    bokiDebug?: {
      runDebug: () => void;
    };
    saveKioskReceipt?: (data: any) => Promise<void>;
    autoDetectReceipts?: () => void;
    addReceiptSaveButtons?: (element: Element, data: any) => void;
  }
}

// Debug helper function
const injectDebugScript = () => {
  console.log('🏪 BOKI Kiosk: Attempting to inject debug script...');
  const debugScript = document.createElement('script');
  debugScript.src = '/debug-receipt-injection.js';
  debugScript.onload = () => console.log('🏪 BOKI Kiosk: Debug script loaded successfully');
  debugScript.onerror = () => console.log('🏪 BOKI Kiosk: Debug script failed to load');
  document.head.appendChild(debugScript);
  
  // Also inject debug functions directly as fallback
  const fallbackDebug = document.createElement('script');
  fallbackDebug.textContent = `
    window.bokiDebug = {
      runDebug: function() {
        console.log('🔍 BOKI Fallback Debug: Starting debug...');
        console.log('Available functions:', {
          saveKioskReceipt: typeof window.saveKioskReceipt,
          autoDetectReceipts: typeof window.autoDetectReceipts,
          addReceiptSaveButtons: typeof window.addReceiptSaveButtons
        });
        
        // Find receipt elements
        const selectors = ['.receipt', '.order-summary', '.modal-content', '[class*="receipt"]', '[class*="order"]'];
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log('Found', elements.length, 'elements with selector:', selector);
          }
        });
      }
    };
    console.log('🏪 BOKI Kiosk: Fallback debug functions injected');
  `;
  document.head.appendChild(fallbackDebug);
};

// Extend window interface for our custom functions
declare global {
  interface Window {
    autoDetectReceipts?: () => void;
  }
}

interface KioskAppWrapperProps {
  children: React.ReactNode;
}

const KioskAppWrapper: React.FC<KioskAppWrapperProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Force UTF-8 encoding for all content
    const forceUTF8Encoding = () => {
      // Add meta charset if not present
      if (!document.querySelector('meta[charset]')) {
        const metaCharset = document.createElement('meta');
        metaCharset.setAttribute('charset', 'UTF-8');
        document.head.insertBefore(metaCharset, document.head.firstChild);
      }
      
      // Force document encoding
      if (document.characterSet !== 'UTF-8') {
        // Create a meta tag to set charset instead of directly assigning
        const existingMeta = document.querySelector('meta[charset]');
        if (existingMeta) {
          existingMeta.setAttribute('charset', 'UTF-8');
        } else {
          const metaCharset = document.createElement('meta');
          metaCharset.setAttribute('charset', 'UTF-8');
          document.head.insertBefore(metaCharset, document.head.firstChild);
        }
      }
      
      console.log('🏪 BOKI Kiosk: UTF-8 encoding enforced');
    };
    
    // Apply encoding fix immediately and after page loads
    forceUTF8Encoding();
    
    // Check if running as native app
    const isNativeApp = Capacitor.isNativePlatform();

    if (isNativeApp) {
      // Force enable kiosk mode for native app
      localStorage.setItem('kiosk_mode', 'true');
      console.log('🏪 BOKI Kiosk: Native app mode enabled');
      
      // Initialize the receipt image bridge for native functionality
      initializeReceiptImageBridge();
      console.log('🏪 BOKI Kiosk: Receipt image bridge initialized');
      
      // Inject receipt saving functionality into the web view
      // This will add the save/share buttons to receipt elements
      const injectWithRetry = (attempt = 1, maxAttempts = 5) => {
        console.log(`🏪 BOKI Kiosk: Starting injection attempt ${attempt}/${maxAttempts}`);
        
        setTimeout(() => {
          try {
            console.log('🏪 BOKI Kiosk: Injecting debug script...');
            // Inject debug script first
            injectDebugScript();
            
            console.log('🏪 BOKI Kiosk: Injecting main receipt functionality...');
            // Inject main receipt functionality
            injectReceiptSavingScriptViaDOM();
            console.log(`🏪 BOKI Kiosk: Receipt saving functionality injected into web view (attempt ${attempt})`);
            
            // Try to manually trigger receipt detection after injection
            setTimeout(() => {
              console.log('🏪 BOKI Kiosk: Attempting manual receipt detection...');
              if (window.autoDetectReceipts) {
                console.log('🏪 BOKI Kiosk: autoDetectReceipts found, running...');
                window.autoDetectReceipts();
                console.log('🏪 BOKI Kiosk: Manual receipt detection triggered');
              } else {
                console.log('🏪 BOKI Kiosk: autoDetectReceipts not available yet, will retry...');
                // Retry detection after more time
                setTimeout(() => {
                  if (window.autoDetectReceipts) {
                    console.log('🏪 BOKI Kiosk: autoDetectReceipts found on retry, running...');
                    window.autoDetectReceipts();
                    console.log('🏪 BOKI Kiosk: Manual receipt detection triggered (retry)');
                  } else {
                    console.log('🏪 BOKI Kiosk: autoDetectReceipts still not available after retry');
                  }
                }, 3000);
              }
            }, 2000);
            
            // Also run debug after a delay
            setTimeout(() => {
              console.log('🏪 BOKI Kiosk: Attempting to run debug...');
              if (window.bokiDebug) {
                window.bokiDebug.runDebug();
                console.log('🏪 BOKI Kiosk: Debug script executed');
              } else {
                console.log('🏪 BOKI Kiosk: bokiDebug not available');
              }
            }, 4000);
            
          } catch (error) {
            console.error(`🏪 BOKI Kiosk: Failed to inject receipt functionality (attempt ${attempt}):`, error);
            if (attempt < maxAttempts) {
              injectWithRetry(attempt + 1, maxAttempts);
            }
          }
        }, attempt * 2000); // Increase delay with each attempt
      };
      
      injectWithRetry();
      
      // Also inject when the page loads (for navigation changes)
      const injectOnLoad = () => {
        setTimeout(() => {
          // Re-apply encoding fix after page loads
          forceUTF8Encoding();
          injectReceiptSavingScriptViaDOM();
          console.log('🏪 BOKI Kiosk: Receipt functionality re-injected after page load');
        }, 2000);
      };
      
      window.addEventListener('load', injectOnLoad);
      
      // Clean up
      return () => {
        window.removeEventListener('load', injectOnLoad);
      };
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>🏪 BOKI Kiosk</h1>
          <p>Initializing kiosk mode...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default KioskAppWrapper;