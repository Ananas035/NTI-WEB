import {
  Component,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from '../../services/api';
import { Language } from '../../services/language';
import { TranslatePipe } from '../../pipes/translate-pipe';

interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
}

interface BackendCustomer {
  _id: string;
  customerId: number;
  name: string;
  showroomName?: string;
  mobileNumber?: string;
  address?: string;
  createdAt?: string;
}

interface BackendProduct {
  _id: string;
  modelName: string;
  modelCode: number;
  price: number;
  availablePieces: number;
  colors?: string[];
  image?: string;
  createdAt?: string;
}

interface BackendInvoiceItem {
  product?: {
    _id?: string;
    modelName?: string;
    modelCode?: number;
    price?: number;
  };

  modelCode: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BackendInvoice {
  _id: string;
  invoiceNumber: string;

  customer: {
    _id?: string;
    customerId?: number;
    name?: string;
    showroomName?: string;
    mobileNumber?: string;
    address?: string;
  };

  date?: string;
  createdAt?: string;

  items: BackendInvoiceItem[];

  invoiceTotal: number;
}

interface CustomerView {
  id: number;
  name: string;
  store: string;
  mobile: string;
  address: string;
  joinDate: string;
  orders: number;
}

interface ProductView {
  id: number;
  name: string;
  code: string;
  pieces: number;
  price: number;
  colors: string[];
  createdAt: string;
}

interface InvoiceItem {
  id: number;
  modelCode: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceView {
  id: string;
  customerId: number;
  customerName: string;
  customerStore: string;
  date: string;
  amount: number;
  items: InvoiceItem[];
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices implements OnInit {

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private language: Language
  ) {}

  pendingInvoiceNumber = '';

  // =========================
  // Loading / Errors
  // =========================

  isLoadingInvoices = true;
  isLoadingFormData = true;
  isSaving = false;

  errorMessage = '';
  stockErrorMsg = '';

  viewLoading = false;
  viewErrorMessage = '';

  // =========================
  // Backend Data
  // =========================

  customers: CustomerView[] = [];
  products: ProductView[] = [];
  invoices: InvoiceView[] = [];

  // =========================
  // Search
  // =========================

  searchTerm = '';

  // =========================
  // Create Invoice Modal
  // =========================

  showCreateModal = false;

  generatedInvoiceId = '';
  invoiceDate = '';

  selectedCustomerId: number | null = null;

  invoiceItems: InvoiceItem[] = [];

  // =========================
  // View Invoice
  // =========================

  viewingInvoice: InvoiceView | null = null;

  // =========================
  // Print
  // =========================

  printableInvoice: InvoiceView | null = null;

  private nextItemId = 1;

  // =========================
  // Translation Helper
  // =========================

  private translateKey(key: string): string {
    return this.language.translate(key);
  }

  // =========================
  // Lifecycle
  // =========================

  private tryOpenInvoiceFromQuery(): void {

    if (!this.pendingInvoiceNumber) {
      return;
    }

    const invoice = this.invoices.find(
      item => item.id === this.pendingInvoiceNumber
    );

    if (invoice) {
      this.openViewModal(invoice);
      this.pendingInvoiceNumber = '';
      return;
    }

    this.api
      .get<any>(
        `/invoices/${encodeURIComponent(
          this.pendingInvoiceNumber
        )}`
      )
      .subscribe({

        next: (response) => {

          if (
            response?.success &&
            response?.data
          ) {

            this.openViewModal(
              this.mapBackendInvoice(
                response.data
              )
            );

            this.pendingInvoiceNumber = '';

            this.cdr.detectChanges();
          }
        },

        error: (error) => {

          console.error(
            'Open Invoice From Dashboard Error:',
            error
          );
        }
      });
  }

  ngOnInit(): void {

    this.customerLoaded = false;
    this.productLoaded = false;
    this.isLoadingFormData = true;

    this.loadInvoices();
    this.loadCustomers();
    this.loadProducts();

    this.route.queryParams.subscribe(params => {

      const invoiceNumber =
        params['invoice'];

      if (!invoiceNumber) {
        return;
      }

      this.pendingInvoiceNumber =
        String(invoiceNumber);

      this.tryOpenInvoiceFromQuery();
    });
  }

  // =========================
  // Load Invoices
  // =========================

  loadInvoices(): void {

    this.isLoadingInvoices = true;
    this.errorMessage = '';

    this.api
      .get<ApiResponse<BackendInvoice[]>>(
        '/invoices'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            this.invoices =
              response.data.map(
                invoice =>
                  this.mapBackendInvoice(invoice)
              );

            this.updateCustomerOrders();

          } else {

            this.invoices = [];

            this.errorMessage =
              response.message ||
              'inv_error_load';
          }

          this.isLoadingInvoices = false;

          this.cdr.detectChanges();

          this.tryOpenInvoiceFromQuery();
        },

        error: (error) => {

          console.error(
            'Invoices Load Error:',
            error
          );

          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'inv_error_load_generic'
            );

          this.isLoadingInvoices = false;

          this.cdr.detectChanges();
        }

      });
  }

  // =========================
  // Load Customers
  // =========================

  loadCustomers(): void {

    this.api
      .get<ApiResponse<BackendCustomer[]>>(
        '/customers'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            this.customers =
              response.data.map(
                customer => ({

                  id:
                    Number(
                      customer.customerId
                    ),

                  name:
                    customer.name ||
                    this.translateKey(
                      'inv_customer_name_fallback'
                    ),

                  store:
                    customer.showroomName ||
                    '—',

                  mobile:
                    customer.mobileNumber ||
                    '—',

                  address:
                    customer.address ||
                    '—',

                  joinDate:
                    this.formatDateOnly(
                      customer.createdAt
                    ),

                  orders: 0
                })
              );

            this.updateCustomerOrders();
          }

          this.customerLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Customers Load Error:',
            error
          );

          this.customerLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        }

      });
  }

  // =========================
  // Load Products
  // =========================

  loadProducts(): void {

    this.api
      .get<ApiResponse<BackendProduct[]>>(
        '/products'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            this.products =
              response.data.map(
                product => ({

                  id:
                    Number(
                      product.modelCode
                    ),

                  name:
                    product.modelName ||
                    this.translateKey(
                      'inv_customer_name_fallback'
                    ),

                  code:
                    String(
                      product.modelCode
                    ),

                  pieces:
                    Number(
                      product.availablePieces
                    ) || 0,

                  price:
                    Number(
                      product.price
                    ) || 0,

                  colors:
                    Array.isArray(product.colors)
                      ? product.colors
                      : [],

                  createdAt:
                    this.formatDateOnly(
                      product.createdAt
                    )
                })
              );
          }

          this.productLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Products Load Error:',
            error
          );

          this.productLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        }

      });
  }

  // =========================
  // Form Data Loading
  // =========================

  private customerLoaded = false;
  private productLoaded = false;

  private checkFormDataFinished(): void {

    if (
      this.customerLoaded &&
      this.productLoaded
    ) {

      this.isLoadingFormData = false;

      this.cdr.detectChanges();
    }
  }

  // =========================
  // Customer Orders
  // =========================

  private updateCustomerOrders(): void {

    this.customers =
      this.customers.map(
        customer => ({

          ...customer,

          orders:
            this.invoices.filter(
              invoice =>
                invoice.customerId ===
                customer.id
            ).length

        })
      );
  }

  // =========================
  // Map Backend Invoice
  // =========================

  private mapBackendInvoice(
    invoice: BackendInvoice
  ): InvoiceView {

    const customerId =
      Number(
        invoice.customer?.customerId
      ) || 0;

    const customerName =
      invoice.customer?.name ||
      invoice.customer?.showroomName ||
      '—';

    const customerStore =
      invoice.customer?.showroomName ||
      '—';

    const items: InvoiceItem[] =
      Array.isArray(invoice.items)
        ? invoice.items.map(
            item => ({

              id:
                this.nextItemId++,

              modelCode:
                String(
                  item.modelCode ||
                  item.product?.modelCode ||
                  ''
                ),

              modelName:
                item.product?.modelName ||
                '',

              quantity:
                Number(
                  item.quantity
                ) || 0,

              unitPrice:
                Number(
                  item.unitPrice
                ) || 0,

              total:
                Number(
                  item.total
                ) || 0
            })
          )
        : [];

    return {

      id:
        invoice.invoiceNumber,

      customerId,

      customerName,

      customerStore,

      date:
        this.formatDateOnly(
          invoice.date ||
          invoice.createdAt
        ),

      amount:
        Number(
          invoice.invoiceTotal
        ) || 0,

      items
    };
  }

  // =========================
  // Filtered Invoices
  // =========================

  get filteredInvoices(): InvoiceView[] {

    const q =
      this.searchTerm
        .trim()
        .toLowerCase();

    if (!q) {
      return this.invoices;
    }

    return this.invoices.filter(
      invoice =>
        invoice.id
          .toLowerCase()
          .includes(q) ||

        invoice.customerName
          .toLowerCase()
          .includes(q) ||

        invoice.customerStore
          .toLowerCase()
          .includes(q)
    );
  }

  // =========================
  // Invoice Total
  // =========================

  get totalInvoiceAmount(): number {

    return this.invoiceItems.reduce(
      (sum, item) =>
        sum +
        (
          Number(item.total) || 0
        ),
      0
    );
  }

  // =========================
  // Open Create Modal
  // =========================

  openCreateInvoice(): void {

    this.stockErrorMsg = '';

    if (this.customers.length === 0) {

      this.stockErrorMsg =
        'inv_error_no_customers';

      return;
    }

    if (this.products.length === 0) {

      this.stockErrorMsg =
        'inv_error_no_products';

      return;
    }

    const lastInvoiceNumber =
      this.invoices.length > 0
        ? this.invoices[0].id
        : 'INV-0000';

    const lastNumber =
      parseInt(
        lastInvoiceNumber.replace(
          'INV-',
          ''
        ),
        10
      ) || 0;

    this.generatedInvoiceId =
      `INV-${String(
        lastNumber + 1
      ).padStart(4, '0')}`;

    this.invoiceDate =
      this.formatDateOnly(
        new Date().toISOString()
      );

    this.selectedCustomerId =
      this.customers[0]?.id ||
      null;

    this.invoiceItems = [
      this.createEmptyInvoiceItem()
    ];

    this.showCreateModal = true;

    this.cdr.detectChanges();
  }

  // =========================
  // Create Empty Item
  // =========================

  private createEmptyInvoiceItem(): InvoiceItem {

    return {

      id:
        this.nextItemId++,

      modelCode: '',

      modelName: '',

      quantity: 1,

      unitPrice: 0,

      total: 0
    };
  }

  // =========================
  // Close Create Modal
  // =========================

  closeCreateModal(): void {

    this.showCreateModal = false;

    this.stockErrorMsg = '';
  }

  // =========================
  // Add Item
  // =========================

  addInvoiceItem(): void {

    this.invoiceItems.push(
      this.createEmptyInvoiceItem()
    );
  }

  // =========================
  // Remove Item
  // =========================

  removeInvoiceItem(
    id: number
  ): void {

    if (
      this.invoiceItems.length <= 1
    ) {
      return;
    }

    this.invoiceItems =
      this.invoiceItems.filter(
        item =>
          item.id !== id
      );
  }

  // =========================
  // Model Changed
  // =========================

  onModelCodeChange(
    item: InvoiceItem
  ): void {

    const product =
      this.products.find(
        product =>
          product.code ===
          item.modelCode
      );

    if (!product) {

      item.modelName = '';
      item.unitPrice = 0;
      item.total = 0;

      return;
    }

    item.modelName =
      product.name;

    item.unitPrice =
      product.price;

    this.recalculateItem(item);
  }

  // =========================
  // Recalculate Item
  // =========================

  recalculateItem(
    item: InvoiceItem
  ): void {

    item.total =
      Number(
        item.quantity || 0
      ) *
      Number(
        item.unitPrice || 0
      );
  }

  // =========================
  // Save Invoice
  // =========================

  saveInvoice(
    andPrint = false
  ): void {

    this.stockErrorMsg = '';

    if (
      this.selectedCustomerId === null ||
      Number(
        this.selectedCustomerId
      ) <= 0
    ) {

      this.stockErrorMsg =
        'inv_error_select_customer';

      return;
    }

    const validItems =
      this.invoiceItems.filter(
        item =>
          item.modelCode.trim() !== '' &&
          Number(item.quantity) > 0
      );

    if (
      validItems.length === 0
    ) {

      this.stockErrorMsg =
        'inv_error_invalid_items';

      return;
    }

    // =========================
    // Frontend Stock Validation
    // =========================

    for (
      const item of validItems
    ) {

      const product =
        this.products.find(
          product =>
            product.code ===
            item.modelCode
        );

      if (!product) {

        this.stockErrorMsg =
          `${this.translateKey(
            'inv_error_model_not_found'
          )} ${item.modelCode}`;

        return;
      }

      if (
        Number(item.quantity) >
        Number(product.pieces)
      ) {

        this.stockErrorMsg =
          `${this.translateKey(
            'inv_error_insufficient_stock'
          )} ${product.pieces} ${
            this.translateKey(
              'inv_quantity_pieces'
            )
          }`;

        return;
      }
    }

    // =========================
    // Payload
    // =========================

    const payload = {

      customerId:
        Number(
          this.selectedCustomerId
        ),

      items:
        validItems.map(
          item => ({

            modelCode:
              Number(
                item.modelCode
              ),

            quantity:
              Number(
                item.quantity
              )

          })
        )
    };

    this.isSaving = true;

    this.api
      .post<ApiResponse<BackendInvoice>>(
        '/invoices',
        payload
      )
      .subscribe({

        next: (response) => {

          this.isSaving = false;

          if (
            !response.success ||
            !response.data
          ) {

            this.stockErrorMsg =
              response.message ||
              'inv_error_save';

            this.cdr.detectChanges();

            return;
          }

          const createdInvoice =
            this.mapBackendInvoice(
              response.data
            );

          this.invoices = [
            createdInvoice,
            ...this.invoices
          ];

          this.updateCustomerOrders();

          this.showCreateModal = false;

          this.stockErrorMsg = '';

          this.loadProducts();

          this.cdr.detectChanges();

          if (andPrint) {

            setTimeout(() => {

              this.printInvoice(
                createdInvoice
              );

            }, 150);
          }
        },

        error: (error) => {

          this.isSaving = false;

          console.error(
            'Create Invoice Error:',
            error
          );

          this.stockErrorMsg =
            this.getApiErrorMessage(
              error,
              'inv_error_save_generic'
            );

          this.cdr.detectChanges();
        }

      });
  }

  // =========================
  // Open View Modal
  // =========================

  openViewModal(
    invoice: InvoiceView
  ): void {

    this.viewingInvoice = {

      ...invoice,

      items:
        invoice.items.map(
          item => ({
            ...item
          })
        )
    };

    this.viewLoading = true;

    this.viewErrorMessage = '';

    this.cdr.detectChanges();

    this.api
      .get<ApiResponse<BackendInvoice>>(
        `/invoices/${encodeURIComponent(
          invoice.id
        )}`
      )
      .subscribe({

        next: (response) => {

          this.viewLoading = false;

          if (
            response.success &&
            response.data
          ) {

            this.viewingInvoice =
              this.mapBackendInvoice(
                response.data
              );
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.viewLoading = false;

          console.error(
            'Get Invoice Error:',
            error
          );

          this.viewErrorMessage =
            this.getApiErrorMessage(
              error,
              'inv_error_view'
            );

          this.cdr.detectChanges();
        }

      });
  }

  // =========================
  // Close View Modal
  // =========================

  closeViewModal(): void {

    this.viewingInvoice = null;

    this.viewLoading = false;

    this.viewErrorMessage = '';
  }

  // =========================
  // Print Invoice
  // =========================

  printInvoice(
    invoice: InvoiceView
  ): void {

    this.printableInvoice = {

      ...invoice,

      items:
        invoice.items.map(
          item => ({
            ...item
          })
        )
    };

    const originalTitle =
      document.title;

    document.title =
      `${invoice.id} - ${invoice.customerName}`;

    window.onafterprint = () => {

      document.title =
        originalTitle;

      this.printableInvoice =
        null;

      window.onafterprint =
        null;

      this.cdr.detectChanges();
    };

    this.cdr.detectChanges();

    setTimeout(() => {
      window.print();
    }, 150);
  }

  // =========================
  // Close Print
  // =========================

  closePrint(): void {

    this.printableInvoice = null;

    document.title =
      'FactoryHub';

    this.cdr.detectChanges();
  }

  // =========================
  // Track Item
  // =========================

  trackByItemId(
    index: number,
    item: InvoiceItem
  ): number {

    return item.id;
  }

  // =========================
  // Date Format
  // =========================

  private formatDateOnly(
    value?: string
  ): string {

    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      isNaN(
        date.getTime()
      )
    ) {

      return '—';
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );

    return `${year}-${month}-${day}`;
  }

  // =========================
  // API Error
  // =========================

  private getApiErrorMessage(
    error: any,
    fallback: string
  ): string {

    return (
      error?.error?.message ||
      error?.message ||
      fallback
    );
  }
}