/**
 * Helper function for document upload with automatic fallback
 * Tries /documents/upload first, falls back to /documents/uploadDocument if 404
 */

import { axiosClient } from '@/api/axiosClient';

export async function uploadDocumentWithFallback(
  file: File,
  documentType: string,
  leadId?: string
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (leadId) {
    formData.append('leadId', leadId);
  }

  // Try new endpoint first
  try {
    const response = await axiosClient.post('/documents/upload', formData);
    return response.data;
  } catch (error: any) {
    // If 404, try fallback to original endpoint
    if (error.response?.status === 404) {
      console.warn('?? /upload returned 404, trying fallback /uploadDocument...');
      const response = await axiosClient.post('/documents/uploadDocument', formData);
      return response.data;
    }
    // Re-throw other errors
    throw error;
  }
}

export default uploadDocumentWithFallback;
