export interface Customer {
  id: number;
  name: string;
  store: string;
  mobile: string;
  address: string;
  joinDate: string;
  orders: number;
}

export interface ProductModel {
  id: number;
  name: string;
  code: string;
  pieces: number;
  colors: string[];
  createdAt: string;
  image?: string;
  price?: number;
}

export interface InvoiceItem {
  id: number;
  modelCode: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId: number;
  customerName: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'partial';
  items: InvoiceItem[];
}

export interface ReturnItem {
  id: string;
  customerId: number;
  customerName: string;
  date: string;
  amount: number;
  items: InvoiceItem[];
}

export interface Payment {
  id: string;
  customerId: number;
  date: string;
  amount: number;
  notes: string;
}

export interface Check {
  id: string;
  customerId: number;
  customerName: string;
  issuerName?: string;
  bankName: string;
  date: string;
  amount: number;
  status: 'processed' | 'pending';
}

export interface AccountTransaction {
  id: string;
  date: string;
  type: 'invoice' | 'return' | 'payment' | 'check';
  refId: string;
  quantity: string | number;
  amount: number;
  balance?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}