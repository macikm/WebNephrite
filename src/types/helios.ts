export interface LoginRequest {
  userName: string;
  password: string;
  useWindowsAuthentication?: boolean;
  useCurrentUserCredentials?: boolean;
  languageId?: string;
  dbProfile?: string;
  serverURL?: string;
}

export interface LoginResponse {
  success: boolean;
  statusCode: string;
  errorMessage?: string;
  userName?: string;
  userId?: string;
}

export interface UserInfo {
  id: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  providerName?: string;
  providerSubjectId?: number;
  systemRole?: string;
  serverUrl?: string;
  dbprofile?: string;
  languageId?: string;
}

export interface InvoiceCustomer {
  id?: number;
  number?: string;
  name?: string;
}

export interface InvoiceItem {
  id?: number;
  itemId?: number;
  productId?: number;
  name?: string;
  quantity?: number;
  measureUnit?: string;
  unitPrice?: number;
  vatRate?: number;
  vatAmount?: number;
  totalPrice?: number;
}

export interface Invoice {
  id: number;
  number: string;
  invoiceNo?: string;
  createdOn?: string;
  modifiedOn?: string;
  issueDate?: string;
  dueDate?: string;
  vatDate?: string;
  transactionDate?: string;
  totalAmount: number;
  outstandingAmount: number;
  invPaymentStatusCode: 'paid' | 'unpaid' | 'partiallyPaid' | string;
  documentTypeCode?: 'realization' | 'creditNote' | 'proforma' | string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  currencyCode?: string;
  paymentType?: string;
  tin?: string;
  note?: string;
  customer?: InvoiceCustomer;
  items?: InvoiceItem[];
  jobOrder?: {
    id?: number;
    number?: string;
    name?: string;
  };
  department?: {
    id?: number;
    number?: string;
    name?: string;
  };
  bankAccount?: {
    id?: number;
    accountNo?: string;
    bankCode?: string;
  };
}

export interface Product {
  id: number;
  referenceId?: string;
  name: string;
  typeCode?: string;
  description?: string;
  barcode?: string;
  measureUnit?: string;
  vatRate?: number;
  price?: number;
  unitPrice?: number;
  statusCode?: string;
  vendorName?: string;
  manufacturerName?: string;
  createdOn?: string;
  modifiedOn?: string;
}

export interface OrderItem {
  id?: number;
  productId?: number;
  name?: string;
  quantity?: number;
  measureUnit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Order {
  id: number;
  orderNumber?: string;
  number?: string;
  customerName?: string;
  customer?: {
    id?: number;
    name?: string;
    number?: string;
  };
  orderDate?: string;
  deliveryDate?: string;
  status?: string;
  totalAmount?: number;
  currency?: string;
  note?: string;
  paymentType?: string;
  transportType?: string;
  items?: OrderItem[];
}

export interface Customer {
  id: number;
  referenceId?: string;
  number?: string;
  name: string;
  legalForm?: string;
  tin?: string;
  vatId?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  web?: string;
  turnoverFV?: number;
  turnoverFD?: number;
}

export interface ContactPerson {
  id: number;
  number?: string;
  reference?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  titlePre?: string;
  titlePost?: string;
  phone?: string;
  mobilePhone?: string;
  email?: string;
  position?: string;
  status?: string;
  company?: {
    id?: number;
    number?: string;
    name?: string;
  };
  note?: string;
}

export interface JobOrder {
  id: number;
  number: string;
  name: string;
  statusCode?: string;
  customer?: {
    id?: number;
    name?: string;
  };
  startDate?: string;
  endDate?: string;
  budget?: number;
  note?: string;
}

export interface JobTask {
  id: number;
  number?: string;
  name: string;
  jobOrderId?: number;
  statusCode?: string;
  plannedHours?: number;
  spentHours?: number;
  assignedTo?: string;
  dueDate?: string;
  description?: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  documentNumber?: string;
  reference?: string;
  category?: string;
  createdOn?: string;
  description?: string;
  fileName?: string;
  fileContentLength?: number;
  fileContent?: string; // Base64 content
  location?: string;
  state?: string;
}
