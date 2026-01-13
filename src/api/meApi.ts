import axiosClient from './axiosClient';

export type PortalDocument = {
  id?: string;
  _id?: string;
  file?: string;
  documentType?: string;
};

export type PortalLeadDocuments = {
  carVIN?: PortalDocument;
  carMileage?: PortalDocument;
  carExterior?: PortalDocument[];
  carInterior?: PortalDocument[];
  carVTP?: PortalDocument[];
  carMTP?: PortalDocument[];
  buyAgreement?: PortalDocument[];
  rentAgreement?: PortalDocument[];
  powerOfAttorney?: PortalDocument[];
  buyMandate?: PortalDocument[];
  sellMandate?: PortalDocument[];
  insurance?: PortalDocument[];
  greenCard?: PortalDocument;
  sell?: PortalDocument[];
  [key: string]: unknown;
};

export type PortalLead = {
  id: string;
  status?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    companyID?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    enableAddress2?: boolean;
    address2?: string;
    city2?: string;
    postalCode2?: string;
    country2?: string;
    birthday?: string;
  };
  car?: {
    brand?: string;
    model?: string;
    registration?: number | null;
    VIN?: string;
    mileage?: number | null;
  };
  lease?: {
    leaseAmount?: number;
    monthlyPayment?: number;
    rentDuration?: number;
    nextPayment?: string;
    start?: string;
    yearlyInsuranceFee?: number;
    yearlyInterestRate?: number;
    adminFee?: number;
  };
  documents?: PortalLeadDocuments;
  createdAt?: string;
};

export type Paginated<T> = {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
};

export type Invoice = {
  id: string;
  title?: string;
  value?: number;
  currency?: string;
  externalToken?: string;
  paymentDate?: string | null;
  createdAt?: string;
};

export const meApi = {
  getMyLead: async (): Promise<PortalLead> => {
    const res = await axiosClient.get<PortalLead>('/me/lead');
    return res.data;
  },

  updateMyProfile: async (payload: {
    name?: string;
    email?: string;
    companyID?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    enableAddress2?: boolean;
    address2?: string;
    city2?: string;
    postalCode2?: string;
    country2?: string;
    birthday?: string;
  }): Promise<PortalLead> => {
    const res = await axiosClient.patch<PortalLead>('/me/profile', payload);
    return res.data;
  },

  getMyGallery: async (): Promise<PortalLeadDocuments> => {
    const res = await axiosClient.get<PortalLeadDocuments>('/me/gallery');
    return res.data;
  },

  getMyInvoices: async (params?: { page?: number; limit?: number }): Promise<Paginated<Invoice>> => {
    const res = await axiosClient.get<Paginated<Invoice>>('/me/invoices', { params });
    return res.data;
  },

  payInvoice: async (invoiceId: string): Promise<void> => {
    await axiosClient.post(`/me/invoices/${encodeURIComponent(invoiceId)}/pay`);
  },
};

export default meApi;
