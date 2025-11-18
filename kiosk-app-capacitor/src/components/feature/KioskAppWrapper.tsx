import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { initializeReceiptImageBridge } from '../../bridge/receiptImageBridge';
import { injectReceiptSavingScriptIntoExternalSite } from '../../utils/webViewInjector';

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
    
    // Add navigation interception to prevent browser opening
    const interceptNavigation = (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        const targetAttr = link.getAttribute('target');
        
        console.log('🏪 BOKI Kiosk: Intercepted link click:', { href, target: targetAttr });
        
        // Prevent browser opening for external links
        if (targetAttr === '_blank' || targetAttr === '_system') {
          event.preventDefault();
          event.stopPropagation();
          
          // Instead, try to navigate within the WebView
          if (href && href.startsWith('http')) {
            console.log('🏪 BOKI Kiosk: Preventing browser opening, navigating within WebView:', href);
            window.location.href = href;
          }
          
          return false;
        }
      }
    };

    // Add click event listener to intercept all link clicks
    document.addEventListener('click', interceptNavigation, true);
    
    // Intercept window.open to prevent popups
    const originalWindowOpen = window.open;
    window.open = function(url?: string, target?: string, features?: string) {
      console.log('🏪 BOKI Kiosk: Intercepted window.open call:', { url, target, features });
      
      // Prevent opening in new window/browser
      if (target === '_blank' || target === '_system' || !target) {
        console.log('🏪 BOKI Kiosk: Preventing popup, navigating within WebView:', url);
        if (url) {
          window.location.href = url;
        }
        return null; // Return null to indicate the window wasn't opened
      }
      
      // For other cases, use the original function
      return originalWindowOpen.call(window, url, target, features);
    };
    
    // Intercept form submissions that might open browser
    const interceptFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const target = form.getAttribute('target');
      const action = form.getAttribute('action');
      
      console.log('🏪 BOKI Kiosk: Intercepted form submission:', { target, action });
      
      if (target === '_blank' || target === '_system') {
        event.preventDefault();
        event.stopPropagation();
        
        if (action) {
          console.log('🏪 BOKI Kiosk: Preventing form from opening browser, submitting within WebView');
          form.removeAttribute('target');
          form.submit();
        }
        
        return false;
      }
    };
    
    document.addEventListener('submit', interceptFormSubmit, true);
    
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
            // Inject main receipt functionality into external website
            injectReceiptSavingScriptIntoExternalSite();
            console.log(`🏪 BOKI Kiosk: Receipt saving functionality injected into external website (attempt ${attempt})`);
            
            // Wait for functions to be available, then verify them
            setTimeout(() => {
              console.log('🏪 BOKI Kiosk: Verifying function availability...');
              const availableFunctions = {
                saveReceiptImage: typeof window.saveReceiptImage,
                saveKioskReceipt: typeof window.saveKioskReceipt,
                handlePrint: typeof window.handlePrint,
                handleBluetooth: typeof window.handleBluetooth,
                handleClose: typeof window.handleClose,
                autoDetectReceipts: typeof window.autoDetectReceipts
              };
              console.log('🏪 BOKI Kiosk: Function availability check:', availableFunctions);
              
              // If functions are not available, retry injection
              if (availableFunctions.saveReceiptImage === 'undefined' || 
                  availableFunctions.handlePrint === 'undefined' ||
                  availableFunctions.handleBluetooth === 'undefined' ||
                  availableFunctions.handleClose === 'undefined') {
                console.log('🏪 BOKI Kiosk: Required functions not available, will retry injection...');
                if (attempt < maxAttempts) {
                  injectWithRetry(attempt + 1, maxAttempts);
                  return;
                }
              }
              
              console.log('🏪 BOKI Kiosk: All required functions are available!');
            }, 3000);
            
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
          injectReceiptSavingScriptIntoExternalSite();
          console.log('🏪 BOKI Kiosk: Receipt functionality re-injected into external website after page load');
        }, 2000);
      };
      
      window.addEventListener('load', injectOnLoad);
      
      // Monitor function availability and re-inject if functions disappear
      const monitorFunctions = () => {
        setInterval(() => {
          const requiredFunctions = [
            'saveReceiptImage',
            'handlePrint', 
            'handleBluetooth',
            'handleClose'
          ];
          
          const missingFunctions = requiredFunctions.filter(funcName => {
            return typeof (window as any)[funcName] === 'undefined';
          });
          
          if (missingFunctions.length > 0) {
            console.log('🏪 BOKI Kiosk: Detected missing functions:', missingFunctions);
            console.log('🏪 BOKI Kiosk: Re-injecting receipt functionality...');
            injectReceiptSavingScriptIntoExternalSite();
          }
        }, 10000); // Check every 10 seconds
      };
      
      // Start monitoring after initial injection
      setTimeout(monitorFunctions, 10000);
      
      // Clean up
      return () => {
        window.removeEventListener('load', injectOnLoad);
        document.removeEventListener('click', interceptNavigation, true);
        document.removeEventListener('submit', interceptFormSubmit, true);
        // Restore original window.open
        window.open = originalWindowOpen;
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