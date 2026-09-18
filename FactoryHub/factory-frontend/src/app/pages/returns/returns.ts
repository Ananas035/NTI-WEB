import {
  Component,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

interface BackendReturnItem {
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

interface BackendReturn {
  _id: string;
  returnNumber: string;

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

  items: BackendReturnItem[];

  returnTotal: number;
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

interface ReturnItemView {
  id: number;
  modelCode: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReturnView {
  id: string;
  customerId: number;
  customerName: string;
  customerStore: string;
  date: string;
  amount: number;
  items: ReturnItemView[];
}

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './returns.html',
  styleUrl: './returns.css'
})
export class Returns implements OnInit {

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private language: Language
  ) {}

  // =========================
  // Loading / Errors
  // =========================

  isLoadingReturns = true;
  isLoadingFormData = true;
  isSaving = false;

  errorMessage = '';
  viewLoading = false;
  viewErrorMessage = '';

  // =========================
  // Backend Data
  // =========================

  customers: CustomerView[] = [];
  products: ProductView[] = [];
  returnsData: ReturnView[] = [];

  // =========================
  // Search
  // =========================

  searchTerm = '';

  // =========================
  // Create Return Modal
  // =========================

  showModal = false;

  formReturnId = '';
  formCustomerId: number | null = null;
  formDate = '';
  formItems: ReturnItemView[] = [];

  // =========================
  // View Return
  // =========================

  viewingReturn: ReturnView | null = null;

  // =========================
  // Internal IDs
  // =========================

  private nextItemId = 1;

  private customersLoaded = false;
  private productsLoaded = false;

  // =========================
  // Translation Helper
  // =========================

  private translateKey(key: string): string {
    return this.language.translate(key);
  }

  // =========================
  // Lifecycle
  // =========================

  ngOnInit(): void {

    this.loadReturns();
    this.loadCustomers();
    this.loadProducts();

  }

  // =========================
  // Load Returns
  // =========================

  loadReturns(): void {

    this.isLoadingReturns = true;
    this.errorMessage = '';

    this.api
      .get<ApiResponse<BackendReturn[]>>(
        '/returns'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            this.returnsData =
              response.data.map(
                returnDoc =>
                  this.mapBackendReturn(
                    returnDoc
                  )
              );

            this.updateCustomerOrders();

          } else {

            this.returnsData = [];

            this.errorMessage =
              response.message ||
              'ret_error_load';

          }

          this.isLoadingReturns = false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Returns Load Error:',
            error
          );

          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'ret_error_load_generic'
            );

          this.isLoadingReturns = false;

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
                      'ret_customer_name_fallback'
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

          this.customersLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Returns Customers Error:',
            error
          );

          this.customersLoaded = true;

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
                      'ret_model_fallback'
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
                    Array.isArray(
                      product.colors
                    )
                      ? product.colors
                      : [],

                  createdAt:
                    this.formatDateOnly(
                      product.createdAt
                    )

                })
              );
          }

          this.productsLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Returns Products Error:',
            error
          );

          this.productsLoaded = true;

          this.checkFormDataFinished();

          this.cdr.detectChanges();
        }
      });
  }

  // =========================
  // Form Data Loading
  // =========================

  private checkFormDataFinished(): void {

    if (
      this.customersLoaded &&
      this.productsLoaded
    ) {

      this.isLoadingFormData = false;

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
            this.returnsData.filter(
              ret =>
                ret.customerId ===
                customer.id
            ).length

        })
      );
  }

  // =========================
  // Map Backend Return
  // =========================

  private mapBackendReturn(
    returnDoc: BackendReturn
  ): ReturnView {

    const customerId =
      Number(
        returnDoc.customer?.customerId
      ) || 0;

    const customerName =
      returnDoc.customer?.name ||
      returnDoc.customer?.showroomName ||
      '—';

    const customerStore =
      returnDoc.customer?.showroomName ||
      '—';

    const items: ReturnItemView[] =
      Array.isArray(returnDoc.items)
        ? returnDoc.items.map(
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
        returnDoc.returnNumber,

      customerId,

      customerName,

      customerStore,

      date:
        this.formatDateOnly(
          returnDoc.date ||
          returnDoc.createdAt
        ),

      amount:
        Number(
          returnDoc.returnTotal
        ) || 0,

      items

    };
  }

  // =========================
  // Filtered Returns
  // =========================

  get filteredReturns(): ReturnView[] {

    const q =
      this.searchTerm
        .trim()
        .toLowerCase();

    if (!q) {
      return this.returnsData;
    }

    return this.returnsData.filter(
      ret =>
        ret.id
          .toLowerCase()
          .includes(q) ||

        ret.customerName
          .toLowerCase()
          .includes(q) ||

        ret.customerStore
          .toLowerCase()
          .includes(q)
    );
  }

  // =========================
  // Return Total
  // =========================

  get totalReturnAmount(): number {

    return this.formItems.reduce(
      (sum, item) =>
        sum +
        (
          Number(item.total) || 0
        ),
      0
    );
  }

  // =========================
  // Total Pieces
  // =========================

  calculateTotalPieces(
    items: ReturnItemView[]
  ): number {

    return items.reduce(
      (sum, item) =>
        sum +
        (
          Number(item.quantity) || 0
        ),
      0
    );
  }

  // =========================
  // Open Add Modal
  // =========================

  openAddModal(): void {

    this.errorMessage = '';

    if (
      this.customers.length === 0
    ) {

      this.errorMessage =
        'ret_error_no_customers';

      return;
    }

    if (
      this.products.length === 0
    ) {

      this.errorMessage =
        'ret_error_no_products';

      return;
    }

    const lastReturnNumber =
      this.returnsData.length > 0
        ? this.returnsData[0].id
        : 'RET-0000';

    const lastNumber =
      parseInt(
        lastReturnNumber.replace(
          'RET-',
          ''
        ),
        10
      ) || 0;

    this.formReturnId =
      `RET-${String(
        lastNumber + 1
      ).padStart(4, '0')}`;

    this.formDate =
      this.formatDateOnly(
        new Date().toISOString()
      );

    this.formCustomerId =
      this.customers[0]?.id ||
      null;

    this.formItems = [
      this.createEmptyItem()
    ];

    this.showModal = true;

    this.cdr.detectChanges();
  }

  // =========================
  // Create Empty Item
  // =========================

  private createEmptyItem(): ReturnItemView {

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
  // Close Modal
  // =========================

  closeModal(): void {

    this.showModal = false;

    this.formItems = [];

    this.errorMessage = '';

    this.isSaving = false;
  }

  // =========================
  // Add Item
  // =========================

  addItem(): void {

    this.formItems.push(
      this.createEmptyItem()
    );
  }

  // =========================
  // Remove Item
  // =========================

  removeItem(
    id: number
  ): void {

    if (
      this.formItems.length <= 1
    ) {
      return;
    }

    this.formItems =
      this.formItems.filter(
        item =>
          item.id !== id
      );
  }

  // =========================
  // Model Changed
  // =========================

  onModelCodeChange(
    item: ReturnItemView
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
  // Recalculate
  // =========================

  recalculateItem(
    item: ReturnItemView
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
  // Save Return
  // =========================

  saveReturn(): void {

    this.errorMessage = '';

    // -------------------------
    // Customer
    // -------------------------

    if (
      this.formCustomerId === null ||
      Number(
        this.formCustomerId
      ) <= 0
    ) {

      this.errorMessage =
        'ret_validation_customer';

      return;
    }

    // -------------------------
    // Valid Items
    // -------------------------

    const validItems =
      this.formItems.filter(
        item =>
          item.modelCode.trim() !== '' &&
          Number(item.quantity) > 0
      );

    if (
      validItems.length === 0
    ) {

      this.errorMessage =
        'ret_validation_items';

      return;
    }

    // -------------------------
    // Validate Products
    // -------------------------

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

        this.errorMessage =
          `${this.translateKey(
            'ret_error_model_not_found'
          )} ${item.modelCode}`;

        return;
      }
    }

    // -------------------------
    // Payload
    // -------------------------

    const payload = {

      customerId:
        Number(
          this.formCustomerId
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

    // -------------------------
    // Save
    // -------------------------

    this.isSaving = true;

    this.api
      .post<ApiResponse<BackendReturn>>(
        '/returns',
        payload
      )
      .subscribe({

        next: (response) => {

          this.isSaving = false;

          if (
            !response.success ||
            !response.data
          ) {

            this.errorMessage =
              response.message ||
              'ret_error_save';

            this.cdr.detectChanges();

            return;
          }

          // -------------------------
          // Backend Response
          // -------------------------

          const createdReturn =
            this.mapBackendReturn(
              response.data
            );

          this.returnsData = [
            createdReturn,
            ...this.returnsData
          ];

          this.updateCustomerOrders();

          this.showModal = false;

          this.formItems = [];

          this.errorMessage = '';

          this.loadProducts();

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.isSaving = false;

          console.error(
            'Create Return Error:',
            error
          );

          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'ret_error_save_generic'
            );

          this.cdr.detectChanges();
        }
      });
  }

  // =========================
  // Open View
  // =========================

  openViewModal(
    ret: ReturnView
  ): void {

    this.viewingReturn = {

      ...ret,

      items:
        ret.items.map(
          item => ({
            ...item
          })
        )
    };

    this.viewLoading = true;

    this.viewErrorMessage = '';

    this.cdr.detectChanges();

    this.api
      .get<ApiResponse<BackendReturn>>(
        `/returns/${encodeURIComponent(
          ret.id
        )}`
      )
      .subscribe({

        next: (response) => {

          this.viewLoading = false;

          if (
            response.success &&
            response.data
          ) {

            this.viewingReturn =
              this.mapBackendReturn(
                response.data
              );
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.viewLoading = false;

          console.error(
            'Get Return Error:',
            error
          );

          this.viewErrorMessage =
            this.getApiErrorMessage(
              error,
              'ret_error_view'
            );

          this.cdr.detectChanges();
        }
      });
  }

  // =========================
  // Close View
  // =========================

  closeViewModal(): void {

    this.viewingReturn = null;

    this.viewLoading = false;

    this.viewErrorMessage = '';
  }

  // =========================
  // Track By
  // =========================

  trackByItemId(
    index: number,
    item: ReturnItemView
  ): number {

    return item.id;
  }

  // =========================
  // Format Date
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

  private translateBackendReturnError(
  message: string
): string {

  const pattern =
    /^العميل (.+) لم يستلم أي قطع من الموديل (.+) ولا يمكن تسجيل مرتجع منه$/;

  const match =
    message.match(pattern);

  if (!match) {
    return message;
  }

  const customerName =
    match[1];

  const modelCode =
    match[2];

  const template =
    this.language.translate(
      'ret_error_customer_no_received'
    );

  return template
    .replace(
      '{name}',
      customerName
    )
    .replace(
      '{code}',
      modelCode
    );
}

  private getApiErrorMessage(
  error: any,
  fallback: string
): string {

  const message =
    error?.error?.message ||
    error?.message ||
    '';

  if (!message) {
    return this.language.translate(
      fallback
    );
  }

  return this.translateBackendReturnError(
    message
  );
}
}