// Force rebuild trigger - Azure Static Web Apps
// This file change will trigger a new deployment

export const DEPLOYMENT_VERSION = '2024-12-10-new-db-documents';
export const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL 
  || 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1').replace(/\/$/, '');

console.log('Deployment version:', DEPLOYMENT_VERSION);
console.log('Backend URL:', BACKEND_URL);
