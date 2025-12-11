// Force rebuild trigger - Azure Static Web Apps
// This file change will trigger a new deployment

export const DEPLOYMENT_VERSION = '2024-12-09-backend-fallback';
export const BACKEND_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';

console.log('?? Deployment version:', DEPLOYMENT_VERSION);
console.log('?? Backend URL (FALLBACK):', BACKEND_URL);
console.log('??  New backend domain does not exist - using old backend');
