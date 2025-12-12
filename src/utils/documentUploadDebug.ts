/**
 * Debug utility pro testování rùzných document upload endpointù
 */

import { axiosClient } from '@/api/axiosClient';

// Možné alternativní endpointy
const POSSIBLE_ENDPOINTS = [
  '/documents/upload',      // Dokumentace endpoint
  '/document/upload',       // Singular form
  '/upload/document',       // Reversed order
  '/files/upload',          // Files instead of documents
  '/media/upload',          // Media instead of documents
  '/api/documents/upload',  // With api prefix
  '/v1/documents',          // POST to collection
  '/leads/{leadId}/documents', // Nested route
];

interface UploadTestResult {
  endpoint: string;
  status: number;
  statusText: string;
  success: boolean;
  error?: string;
  responseData?: any;
}

/**
 * Testuje rùzné endpointy pro upload dokumentù
 */
export async function testDocumentUploadEndpoints(
  file: File,
  documentType: string,
  leadId: string
): Promise<UploadTestResult[]> {
  const results: UploadTestResult[] = [];

  console.log('?? Testing document upload endpoints...');
  console.log('File:', file.name, file.type, file.size);
  console.log('Document Type:', documentType);
  console.log('Lead ID:', leadId);

  for (const endpoint of POSSIBLE_ENDPOINTS) {
    console.log(`\n?? Testing: ${endpoint}`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('leadId', leadId);

      // Replace {leadId} in endpoint if present
      const finalEndpoint = endpoint.replace('{leadId}', leadId);

      const response = await axiosClient.post(finalEndpoint, formData, {
        validateStatus: () => true, // Don't throw on any status
      });

      results.push({
        endpoint: finalEndpoint,
        status: response.status,
        statusText: response.statusText,
        success: response.status >= 200 && response.status < 300,
        responseData: response.data,
      });

      console.log(`? ${finalEndpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('?? SUCCESS! Found working endpoint:', finalEndpoint);
        console.log('Response:', response.data);
      }

    } catch (error: any) {
      results.push({
        endpoint,
        status: error.response?.status || 0,
        statusText: error.response?.statusText || 'Network Error',
        success: false,
        error: error.message,
      });

      console.log(`? ${endpoint}: ${error.message}`);
    }
  }

  console.log('\n?? Test Results Summary:');
  console.table(results.map(r => ({
    Endpoint: r.endpoint,
    Status: r.status,
    Success: r.success ? '?' : '?',
  })));

  return results;
}

/**
 * Testuje upload s rùznými názvy parametrù
 */
export async function testDifferentParameterNames(
  file: File,
  documentType: string,
  leadId: string
): Promise<void> {
  console.log('\n?? Testing different parameter names...');

  const parameterVariations = [
    { file: 'file', type: 'documentType', lead: 'leadId' },
    { file: 'document', type: 'type', lead: 'leadId' },
    { file: 'upload', type: 'documentType', lead: 'lead' },
    { file: 'file', type: 'docType', lead: 'leadId' },
  ];

  for (const params of parameterVariations) {
    try {
      const formData = new FormData();
      formData.append(params.file, file);
      formData.append(params.type, documentType);
      formData.append(params.lead, leadId);

      console.log(`\nTrying parameters:`, params);
      
      const response = await axiosClient.post('/documents/upload', formData, {
        validateStatus: () => true,
      });

      console.log(`Status: ${response.status}`);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('?? SUCCESS with parameters:', params);
        console.log('Response:', response.data);
        return;
      }

    } catch (error: any) {
      console.log(`Failed with:`, params, error.message);
    }
  }

  console.log('? No parameter variation worked');
}

/**
 * Vytvoøí testovací file pro debugging
 */
export function createTestFile(): File {
  const blob = new Blob(['Test document content'], { type: 'text/plain' });
  return new File([blob], 'test-document.txt', { type: 'text/plain' });
}

/**
 * Hlavní debug funkce - volat z console
 */
export async function debugDocumentUpload(
  file?: File,
  documentType: string = 'carVIN',
  leadId: string = 'test-lead-id'
): Promise<void> {
  console.clear();
  console.log('?? Document Upload Debug Tool');
  console.log('================================\n');

  const testFile = file || createTestFile();

  // Test 1: Try different endpoints
  await testDocumentUploadEndpoints(testFile, documentType, leadId);

  // Test 2: Try different parameter names
  await testDifferentParameterNames(testFile, documentType, leadId);

  console.log('\n? Debug complete!');
  console.log('Check results above to find working endpoint.');
}

// Export pro použití v console
if (typeof window !== 'undefined') {
  (window as any).debugDocumentUpload = debugDocumentUpload;
  console.log('?? Debug tool loaded! Run: debugDocumentUpload()');
}
