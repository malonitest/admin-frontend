/**
 * Temporary workaround for document upload
 * Uses the original /uploadDocument endpoint until /upload is fixed
 */

import { axiosClient } from '@/api/axiosClient';

export async function uploadDocumentWorkaround(
  file: File,
  documentType: string,
  leadId?: string
): Promise<any> {
  try {
    const formData = new FormData();
    
    // Try new endpoint first
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (leadId) formData.append('leadId', leadId);

    console.log('?? Attempting upload...');
    console.log('- File:', file.name, file.type, file.size);
    console.log('- Document Type:', documentType);
    console.log('- Lead ID:', leadId);

    try {
      // Try new endpoint
      const response = await axiosClient.post('/documents/upload', formData);
      console.log('? Upload successful (new endpoint):', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('?? New endpoint not found, trying original...');
        
        // Try original endpoint as fallback
        const response = await axiosClient.post('/documents/uploadDocument', formData);
        console.log('? Upload successful (original endpoint):', response.data);
        return response.data;
      }
      throw error;
    }

  } catch (error: any) {
    console.error('? Upload failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).uploadDocumentWorkaround = uploadDocumentWorkaround;
  console.log('?? Workaround loaded! Use: uploadDocumentWorkaround(file, "carVIN", leadId)');
}
