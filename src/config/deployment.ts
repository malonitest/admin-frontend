// Force rebuild trigger - Azure Static Web Apps
// This file change will trigger a new deployment

export const DEPLOYMENT_VERSION = '2024-12-09-backend-migration';
export const BACKEND_URL = 'https://backrent-api-prod.azurewebsites.net/v1';

console.log('?? Deployment version:', DEPLOYMENT_VERSION);
console.log('?? Backend URL:', BACKEND_URL);
