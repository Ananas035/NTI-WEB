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

type BackendTransactionType =
  | 'ADD'
  | 'RESTOCK'
  | 'SALE'
  | 'RETURN';

interface BackendInventoryTransaction {
  _id: string;

  product:
    | string
    | {
        _id?: string;
        modelName?: string;
        modelCode?: number;
        price?: number;
      };

  transactionType: BackendTransactionType;

  quantity: number;

  previousInventory: number;

  currentInventory: number;

  referenceNumber?: string | null;

  date?: string;

  createdAt?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  code: string;

  /**
   * إجمالي الكمية الداخلة للمخزن
   * ADD + RESTOCK
   */
  added: number;

  /**
   * إجمالي الكمية التي خرجت في فواتير البيع
   */
  sold: number;

  /**
   * إجمالي الكمية التي رجعت للمخزن
   */
  returned: number;

  /**
   * الرصيد الحالي الموجود بالمخزن
   */
  available: number;

  price: number;

  colors: string[];

  image?: string;

  createdAt: string;

  status:
    | 'inStock'
    | 'lowStock'
    | 'outOfStock';
}

export interface InventoryHistoryRecord {
  date: string;

  type:
    | 'new_model'
    | 'restock'
    | 'invoice'
    | 'return';

  ref: string;

  quantity: number;

  stockBefore: number;

  stockAfter: number;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private language: Language
  ) {}

  // =========================
  // Loading
  // =========================

  isLoading = true;

  errorMessage = '';

  // =========================
  // Backend Products
  // =========================

  products: BackendProduct[] = [];

  // =========================
  // Backend Inventory
  // =========================

  inventoryTransactions:
    BackendInventoryTransaction[] = [];

  // =========================
  // Search / Filter
  // =========================

  searchTerm = '';

  filterStatus:
    | 'All'
    | 'inStock'
    | 'lowStock'
    | 'outOfStock' = 'All';

  // =========================
  // History
  // =========================

  historyTarget:
    | InventoryItem
    | null = null;

  historyRecordsData:
    InventoryHistoryRecord[] = [];

  historyLoading = false;

  historyError = '';

  // =========================
  // Translation
  // =========================

  private translateKey(key: string): string {
    return this.language.translate(key);
  }

  // =========================
  // Lifecycle
  // =========================

  ngOnInit(): void {
    this.loadInventory();
  }

  // =========================
  // Load Inventory
  // =========================

  loadInventory(): void {

    this.isLoading = true;

    this.errorMessage = '';

    let productsLoaded = false;
    let transactionsLoaded = false;

    let products: BackendProduct[] = [];

    let transactions:
      BackendInventoryTransaction[] = [];

    const finishLoading = () => {

      if (
        !productsLoaded ||
        !transactionsLoaded
      ) {
        return;
      }

      this.products = products;

      this.inventoryTransactions =
        transactions;

      this.isLoading = false;

      this.cdr.detectChanges();
    };


    // =========================
    // Products
    // =========================

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

            products =
              response.data;
          }

          productsLoaded = true;

          finishLoading();
        },

        error: (error) => {

          console.error(
            'Inventory Products Error:',
            error
          );

          productsLoaded = true;

          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'inventory_error_load_products'
            );

          finishLoading();
        }
      });


    // =========================
    // Inventory Transactions
    // =========================

    this.api
      .get<
        ApiResponse<
          BackendInventoryTransaction[]
        >
      >('/inventory')
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            transactions =
              response.data;
          }

          transactionsLoaded = true;

          finishLoading();
        },

        error: (error) => {

          console.error(
            'Inventory Transactions Error:',
            error
          );

          transactionsLoaded = true;

          this.errorMessage =
            this.errorMessage ||
            this.getApiErrorMessage(
              error,
              'inventory_error_load_transactions'
            );

          finishLoading();
        }
      });
  }

  // =========================
  // Inventory Data
  // =========================

  get inventoryData(): InventoryItem[] {

    return this.products.map(product => {

      const transactions =
        this.inventoryTransactions.filter(
          transaction =>
            this.getTransactionModelCode(
              transaction
            ) ===
            Number(product.modelCode)
        );


      // =========================
      // Added
      // =========================

      let added = 0;

      transactions.forEach(
        transaction => {

          if (
            transaction.transactionType ===
              'ADD' ||
            transaction.transactionType ===
              'RESTOCK'
          ) {

            added +=
              Number(
                transaction.quantity
              ) || 0;
          }
        }
      );


      // =========================
      // Sold
      // =========================

      let sold = 0;

      transactions.forEach(
        transaction => {

          if (
            transaction.transactionType ===
            'SALE'
          ) {

            sold +=
              Number(
                transaction.quantity
              ) || 0;
          }
        }
      );


      // =========================
      // Returned
      // =========================

      let returned = 0;

      transactions.forEach(
        transaction => {

          if (
            transaction.transactionType ===
            'RETURN'
          ) {

            returned +=
              Number(
                transaction.quantity
              ) || 0;
          }
        }
      );


      // =========================
      // Current Available
      // =========================
      //
      // المصدر الأساسي هو Backend Product.
      //

      const available =
        Number(
          product.availablePieces
        ) || 0;


      // =========================
      // Status
      // =========================

      let status:
        | 'inStock'
        | 'lowStock'
        | 'outOfStock' =
          'inStock';


      if (available <= 0) {

        status =
          'outOfStock';

      } else if (available < 24) {

        status =
          'lowStock';
      }


      return {

        id:
          Number(
            product.modelCode
          ),

        name:
          product.modelName ||
          this.translateKey(
            'inventory_no_name'
          ),

        code:
          String(
            product.modelCode
          ),

        added,

        sold,

        returned,

        available,

        price:
          Number(
            product.price
          ) || 0,

        colors:
          Array.isArray(product.colors)
            ? product.colors
            : [],

        image:
          product.image,

        createdAt:
          this.formatDateOnly(
            product.createdAt
          ),

        status
      };
    });
  }

  // =========================
  // Filtered Inventory
  // =========================

  get filteredInventory(): InventoryItem[] {

    const q =
      this.searchTerm
        .trim()
        .toLowerCase();


    return this.inventoryData.filter(
      item => {

        const matchesSearch =
          !q ||
          item.name
            .toLowerCase()
            .includes(q) ||
          item.code
            .toLowerCase()
            .includes(q);


        const matchesFilter =
          this.filterStatus === 'All' ||
          item.status ===
            this.filterStatus;


        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }

  // =========================
  // Statistics
  // =========================

  get totalAvailablePieces(): number {

    return this.inventoryData.reduce(
      (sum, item) =>
        sum + item.available,
      0
    );
  }

  get totalAddedPieces(): number {

    return this.inventoryData.reduce(
      (sum, item) =>
        sum + item.added,
      0
    );
  }

  get totalSoldPieces(): number {

    return this.inventoryData.reduce(
      (sum, item) =>
        sum + item.sold,
      0
    );
  }

  get totalReturnedPieces(): number {

    return this.inventoryData.reduce(
      (sum, item) =>
        sum + item.returned,
      0
    );
  }

  get lowStockCount(): number {

    return this.inventoryData.filter(
      item =>
        item.status ===
        'lowStock'
    ).length;
  }

  get outOfStockCount(): number {

    return this.inventoryData.filter(
      item =>
        item.status ===
        'outOfStock'
    ).length;
  }

  // =========================
  // Filters
  // =========================

  setFilter(
    status:
      | 'All'
      | 'inStock'
      | 'lowStock'
      | 'outOfStock'
  ): void {

    this.filterStatus =
      status;
  }

  // =========================
  // Open History
  // =========================

  openHistory(
    item: InventoryItem
  ): void {

    this.historyTarget =
      item;

    this.historyRecordsData =
      [];

    this.historyError = '';

    this.historyLoading =
      true;

    this.cdr.detectChanges();


    // =========================
    // Get Exact Model History
    // =========================

    this.api
      .get<
        ApiResponse<
          BackendInventoryTransaction[]
        >
      >(
        `/inventory/model/${encodeURIComponent(item.code)}`
      )
      .subscribe({

        next: (response) => {

          this.historyLoading =
            false;

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            this.historyRecordsData =
              this.mapHistoryRecords(
                response.data,
                item
              );
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          this.historyLoading =
            false;

          console.error(
            'Inventory History Error:',
            error
          );

          this.historyError =
            this.getApiErrorMessage(
              error,
              'inventory_error_load_history'
            );

          this.cdr.detectChanges();
        }
      });
  }

  // =========================
  // Close History
  // =========================

  closeHistory(): void {

    this.historyTarget =
      null;

    this.historyRecordsData =
      [];

    this.historyLoading =
      false;

    this.historyError =
      '';
  }

  // =========================
  // History Getter
  // =========================

  get historyRecords():
    InventoryHistoryRecord[] {

    return this.historyRecordsData;
  }

  // =========================
  // Map History
  // =========================

  private mapHistoryRecords(
    transactions:
      BackendInventoryTransaction[],
    item: InventoryItem
  ): InventoryHistoryRecord[] {

    const history =
      transactions
        .map(transaction => {

          let type:
            | 'new_model'
            | 'restock'
            | 'invoice'
            | 'return';


          let quantity =
            Number(
              transaction.quantity
            ) || 0;


          if (
            transaction.transactionType ===
            'ADD'
          ) {

            type =
              'new_model';

          } else if (
            transaction.transactionType ===
            'RESTOCK'
          ) {

            type =
              'restock';

          } else if (
            transaction.transactionType ===
            'SALE'
          ) {

            type =
              'invoice';

            quantity =
              -quantity;

          } else {

            type =
              'return';
          }


          return {

            date:
              this.formatDateTime(
                transaction.date ||
                transaction.createdAt
              ),

            dateValue:
              this.getDateValue(
                transaction.date ||
                transaction.createdAt
              ),

            type,

            ref:
              transaction.referenceNumber ||
              '—',

            quantity,

            stockBefore:
              Number(
                transaction.previousInventory
              ) || 0,

            stockAfter:
              Number(
                transaction.currentInventory
              ) || 0
          };
        })
        .sort(
          (a, b) =>
            b.dateValue -
            a.dateValue
        );


    return history.map(
      record => {

        const {
          dateValue,
          ...displayRecord
        } = record;

        return displayRecord;
      }
    );
  }

  // =========================
  // Get Transaction Model Code
  // =========================

  private getTransactionModelCode(
    transaction:
      BackendInventoryTransaction
  ): number {

    if (
      typeof transaction.product ===
      'object' &&
      transaction.product !== null
    ) {

      return Number(
        transaction.product.modelCode
      ) || 0;
    }

    return 0;
  }

  // =========================
  // Image URL
  // =========================

  getImageUrl(
    image?: string
  ): string {

    if (!image) {
      return '';
    }

    if (
      image.startsWith('http://') ||
      image.startsWith('https://')
    ) {

      return image;
    }

    if (
      image.startsWith('/')
    ) {

      return `http://localhost:5000${image}`;
    }

    return image;
  }

  // =========================
  // Date
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
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDateTime(
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

    const locale =
      this.language.currentLang === 'ar'
        ? 'ar-EG'
        : 'en-US';

    return date.toLocaleString(
      locale,
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  private getDateValue(
    value?: string
  ): number {

    if (!value) {
      return 0;
    }

    const timestamp =
      new Date(value).getTime();

    return isNaN(timestamp)
      ? 0
      : timestamp;
  }

  // =========================
  // API Error
  // =========================

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

    return message;
  }
}