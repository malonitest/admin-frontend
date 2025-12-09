/**
 * Azure Cosmos DB Migration Utility
 * 
 * Handles one-time cleanup after backend migration from Forpsi MongoDB to Azure Cosmos DB
 * This ensures all users get fresh tokens from the new database
 */

const MIGRATION_FLAG = 'azure_migration_completed_v1';
const MIGRATION_DATE = '2024-12-09'; // Date of migration

/**
 * Checks if migration cleanup has been performed
 */
export const needsMigration = (): boolean => {
  return !localStorage.getItem(MIGRATION_FLAG);
};

/**
 * Performs one-time migration cleanup
 * Clears all authentication data and redirects to login
 */
export const performMigration = (): void => {
  try {
    console.log('[Migration] Starting Azure Cosmos DB migration cleanup...');
    
    // Clear all authentication data
    const keysToRemove = [
      'accessToken',
      'refreshToken',
      'user',
      'token',
      'auth',
      'session'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Set migration flag
    localStorage.setItem(MIGRATION_FLAG, MIGRATION_DATE);
    localStorage.setItem('migration_completed_at', new Date().toISOString());
    
    console.log('[Migration] Cleanup completed successfully');
    
    // Show notification (can be customized)
    showMigrationNotification();
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login?reason=migration';
    }, 2000);
    
  } catch (error) {
    console.error('[Migration] Error during cleanup:', error);
    // Fallback: Force reload
    window.location.reload();
  }
};

/**
 * Shows a notification about the migration
 */
const showMigrationNotification = (): void => {
  // Create a simple notification banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #1976d2;
    color: white;
    padding: 16px;
    text-align: center;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  banner.innerHTML = `
    <strong>Dùležitá aktualizace:</strong> 
    Provedli jsme upgrade databáze. Pøesmìrováváme vás na pøihlášení...
  `;
  document.body.appendChild(banner);
};

/**
 * Initialize migration check on app start
 * Call this in your main App component or index file
 */
export const initMigrationCheck = (): void => {
  // Only run if user is logged in (has tokens)
  const hasTokens = localStorage.getItem('accessToken') || 
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('accessToken');
  
  if (hasTokens && needsMigration()) {
    console.log('[Migration] User has old tokens, performing migration...');
    performMigration();
  } else if (needsMigration()) {
    // No tokens, just set flag
    localStorage.setItem(MIGRATION_FLAG, MIGRATION_DATE);
    console.log('[Migration] No tokens found, marking migration as complete');
  }
};

/**
 * Reset migration flag (for testing only)
 */
export const resetMigration = (): void => {
  localStorage.removeItem(MIGRATION_FLAG);
  localStorage.removeItem('migration_completed_at');
  console.log('[Migration] Reset completed - ready for re-test');
};
