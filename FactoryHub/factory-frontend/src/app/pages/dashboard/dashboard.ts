import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '../../services/api';
import { TranslatePipe } from '../../pipes/translate-pipe';

interface Customer {
  _id: string;
  customerId: number;
  name: string;
  showroomName?: string;
  mobileNumber?: string;
  address?: string;
  createdAt?: string;
}

interface Product {
  _id: string;
  modelName: string;
  modelCode: number;
  price: number;
  availablePieces: number;
  createdAt?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;

  customer: {
    _id?: string;
    customerId?: number;
    name?: string;
    showroomName?: string;
  };

  items: any[];

  invoiceTotal: number;

  createdAt?: string;
}

interface ReturnDocument {
  _id: string;
  returnNumber: string;

  customer: {
    _id?: string;
    customerId?: number;
    name?: string;
    showroomName?: string;
  };

  items: any[];

  returnTotal: number;

  notes?: string;

  createdAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
}

interface DailySale {
  date: string;
  label: string;
  amount: number;
  height: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // Loading / Error
  // =========================

  isLoading = true;

  errorMessage = '';


  // =========================
  // Dashboard Statistics
  // =========================

  totalCustomers = 0;

  totalInvoices = 0;

  totalReturns = 0;

  totalInventory = 0;



  totalInvoiceAmount = 0;


  totalReturnAmount = 0;

  last7DaysInvoiceAmount = 0;


  last7DaysInvoiceCount = 0;


  // =========================
  // Recent Data
  // =========================

  recentInvoices: any[] = [];

  recentCustomers: any[] = [];


  // =========================
  // Daily Sales Chart
  // =========================

  dailySales: DailySale[] = [];

  dailySalesMaxAmount = 0;


  // =========================
  // Statistics Cards
  // =========================

  stats = [

    {
      titleKey: 'stat_customers',

      value: '0',

      subKey: 'this_month',

      type: 'blue',

      icon:
        'M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM3.5 18a6.5 6.5 0 0 1 13 0'
    },

    {
      titleKey: 'stat_invoices',

      value: '0',

      subAmount: 0,

      type: 'green',

      icon:
        'M3 2h14v16H3z M7 7h6M7 10h6M7 13h4'
    },

    {
      titleKey: 'stat_returns',

      value: '0',

      subAmount: 0,

      type: 'amber',

      icon:
        'M4 7h9a4 4 0 0 1 0 8H7 M7 4 L4 7 L7 10'
    },

    {
      titleKey: 'stat_inventory',

      value: '0',

      subKey: 'pieces_available',

      type: 'purple',

      icon:
        'M2 18V9L10 3l8 6v9H2Z M7 12h6v6H7z'
    }

  ];


  // =========================
  // Angular Init
  // =========================

  ngOnInit(): void {

    this.loadDashboard();

  }


  // =========================
  // Load Dashboard
  // =========================

  loadDashboard(): void {

    this.isLoading = true;

    this.errorMessage = '';


    let customers: Customer[] = [];

    let products: Product[] = [];

    let invoices: Invoice[] = [];

    let returns: ReturnDocument[] = [];


    let completedRequests = 0;

    const totalRequests = 4;


    const requestFinished = () => {

      completedRequests++;


      if (
        completedRequests === totalRequests
      ) {

        this.calculateDashboardData(
          customers,
          products,
          invoices,
          returns
        );


        this.isLoading = false;

        this.cdr.detectChanges();

      }

    };


    // =========================
    // Customers
    // =========================

    this.api
      .get<ApiResponse<Customer[]>>(
        '/customers'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            customers = response.data;

          }

          requestFinished();

        },

        error: (error) => {

          console.error(
            'Dashboard Customers Error:',
            error
          );

          requestFinished();

        }

      });


    // =========================
    // Products
    // =========================

    this.api
      .get<ApiResponse<Product[]>>(
        '/products'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            products = response.data;

          }

          requestFinished();

        },

        error: (error) => {

          console.error(
            'Dashboard Products Error:',
            error
          );

          requestFinished();

        }

      });


    // =========================
    // Invoices
    // =========================

    

    this.api
      .get<ApiResponse<Invoice[]>>(
        '/invoices'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            invoices = response.data;

          }

          requestFinished();

        },

        error: (error) => {

          console.error(
            'Dashboard Invoices Error:',
            error
          );

          requestFinished();

        }

      });

      


    // =========================
    // Returns
    // =========================

    this.api
      .get<ApiResponse<ReturnDocument[]>>(
        '/returns'
      )
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(response.data)
          ) {

            returns = response.data;

          }

          requestFinished();

        },

        error: (error) => {

          console.error(
            'Dashboard Returns Error:',
            error
          );

          requestFinished();

        }

      });

  }


  // =========================
  // Calculate Dashboard Data
  // =========================

  private calculateDashboardData(
    customers: Customer[],
    products: Product[],
    invoices: Invoice[],
    returns: ReturnDocument[]
  ): void {

    // =========================
    // Basic Totals
    // =========================

    this.totalCustomers =
      customers.length;


    this.totalInvoices =
      invoices.length;


    this.totalReturns =
      returns.length;


    // =========================
    // Inventory
    // =========================

    this.totalInventory =
      products.reduce(
        (total, product) => {

          return (
            total +
            (Number(
              product.availablePieces
            ) || 0)
          );

        },
        0
      );


    // =========================
    // Total Invoice Amount
    // =========================

    this.totalInvoiceAmount =
      invoices.reduce(
        (total, invoice) => {

          return (
            total +
            (Number(
              invoice.invoiceTotal
            ) || 0)
          );

        },
        0
      );


    // =========================
    // Total Return Amount
    // =========================

    this.totalReturnAmount =
      returns.reduce(
        (total, returnDoc) => {

          return (
            total +
            (Number(
              returnDoc.returnTotal
            ) || 0)
          );

        },
        0
      );


    // =========================
    // Current Week
    // Monday -> Sunday
    // =========================

    this.calculateDailySales(
      invoices
    );


    this.calculateLast7DaysTotals(
      invoices
    );


    // =========================
    // Update Statistics Cards
    // =========================

    this.stats[0].value =
      this.totalCustomers.toLocaleString(
        'en-US'
      );


    this.stats[1].value =
      this.totalInvoices.toLocaleString(
        'en-US'
      );


    this.stats[1].subAmount =
      this.totalInvoiceAmount;


    this.stats[2].value =
      this.totalReturns.toLocaleString(
        'en-US'
      );


    this.stats[2].subAmount =
      this.totalReturnAmount;


    this.stats[3].value =
      this.totalInventory.toLocaleString(
        'en-US'
      );


    // =========================
    // Recent Invoices
    // =========================

    this.recentInvoices =
      invoices
        .slice()

        .sort((a, b) => {

          return (
            this.getDateValue(
              b.createdAt
            ) -

            this.getDateValue(
              a.createdAt
            )
          );

        })

        .slice(0, 4)

        .map(invoice => {

          const status =
            this.getInvoiceStatus(
              invoice
            );


          return {

            id:
              invoice.invoiceNumber,

            customerName:
              invoice.customer?.name ||
              invoice.customer?.showroomName ||
              '—',

            date:
              this.formatDate(
                invoice.createdAt
              ),

            amount:
              Number(
                invoice.invoiceTotal
              ) || 0,

            statusKey:
              status.statusKey,

            statusClass:
              status.statusClass

          };

        });


    // =========================
    // Recent Customers
    // =========================

    

    this.recentCustomers =
      customers

        .slice()

        .sort((a, b) => {

          return (
            this.getDateValue(
              b.createdAt
            ) -

            this.getDateValue(
              a.createdAt
            )
          );

        })

        .slice(0, 4)

        .map(customer => {

          return {
            id: customer.customerId,

            name: customer.name || '—',

            store:
              customer.showroomName || '—',

            date: this.formatDate(customer.createdAt),

            orders: invoices.filter(invoice => {
              return (
                invoice.customer?.customerId ===
                customer.customerId
              );
            }).length,

            avatar: this.getAvatar(customer.name)
          };

        });

  }

  // =========================
// Day Translation Key
// =========================

// =========================
// Day Translation Key
// =========================

private getDayTranslationKey(
  day: number
): string {

  switch (day) {

    case 0:
      return 'day_sunday';

    case 1:
      return 'day_monday';

    case 2:
      return 'day_tuesday';

    case 3:
      return 'day_wednesday';

    case 4:
      return 'day_thursday';

    case 5:
      return 'day_friday';

    case 6:
      return 'day_saturday';

    default:
      return '';
  }
}

openCustomer(customerId: number): void {
  if (!customerId) {
    return;
  }

  this.router.navigate(['/accounts'], {
    queryParams: {
      customer: customerId
    }
  });
}
  // =========================
  // Daily Sales Chart
  // Monday -> Sunday
  // =========================

  private calculateDailySales(
    invoices: Invoice[]
  ): void {

    const days: DailySale[] = [];


    const today = new Date();


    // =========================
    // Find Current Monday
    // =========================

    const monday =
      new Date(today);

    monday.setHours(
      0,
      0,
      0,
      0
    );


    const dayOfWeek =
      monday.getDay();

    const daysSinceMonday =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;


    monday.setDate(
      monday.getDate() -
      daysSinceMonday
    );



    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(monday);


      date.setDate(
        monday.getDate() + i
      );


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


      const dateKey =
        `${year}-${month}-${day}`;


      // =========================
      // Calculate Day Amount
      // =========================

      const amount =
        invoices.reduce(
          (total, invoice) => {

            if (!invoice.createdAt) {

              return total;

            }


            const invoiceDate =
              new Date(
                invoice.createdAt
              );


            if (
              isNaN(
                invoiceDate.getTime()
              )
            ) {

              return total;

            }


            const invoiceYear =
              invoiceDate.getFullYear();


            const invoiceMonth =
              String(
                invoiceDate.getMonth() + 1
              ).padStart(
                2,
                '0'
              );


            const invoiceDay =
              String(
                invoiceDate.getDate()
              ).padStart(
                2,
                '0'
              );


            const invoiceDateKey =
              `${invoiceYear}-${invoiceMonth}-${invoiceDay}`;


            if (
              invoiceDateKey ===
              dateKey
            ) {

              return (
                total +
                (
                  Number(
                    invoice.invoiceTotal
                  ) || 0
                )
              );

            }


            return total;

          },
          0
        );


      // =========================
      // Add Day
      // =========================

      days.push({

        date:
          dateKey,

        label:
          this.getDayTranslationKey(
            date.getDay()
          ),
  

        amount,

        height: 0

      });

    }


    // =========================
    // Find Maximum
    // =========================

    this.dailySalesMaxAmount =
      Math.max(
        ...days.map(
          day => day.amount
        ),
        0
      );


    // =========================
    // Calculate Bar Heights
    // =========================

    days.forEach(day => {

      if (
        this.dailySalesMaxAmount ===
        0
      ) {

        day.height = 0;

        return;

      }


      day.height =
        (
          day.amount /
          this.dailySalesMaxAmount
        ) * 100;

    });


    // =========================
    // Save Chart Data
    // =========================

    this.dailySales =
      days;

  }


  // =========================
  // Current Week Totals
  // Monday -> Sunday
  // =========================

  private calculateLast7DaysTotals(
    invoices: Invoice[]
  ): void {

    this.last7DaysInvoiceAmount = 0;

    this.last7DaysInvoiceCount = 0;


    const today =
      new Date();


    // =========================
    // Find Current Monday
    // =========================

    const monday =
      new Date(today);

    monday.setHours(
      0,
      0,
      0,
      0
    );


    const dayOfWeek =
      monday.getDay();


    const daysSinceMonday =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;


    monday.setDate(
      monday.getDate() -
      daysSinceMonday
    );


    // =========================
    // Find Current Sunday
    // =========================

    const sunday =
      new Date(monday);


    sunday.setDate(
      monday.getDate() + 6
    );


    sunday.setHours(
      23,
      59,
      59,
      999
    );


    // =========================
    // Calculate Week Totals
    // =========================

    invoices.forEach(invoice => {

      if (!invoice.createdAt) {

        return;

      }


      const invoiceDate =
        new Date(
          invoice.createdAt
        );


      if (
        isNaN(
          invoiceDate.getTime()
        )
      ) {

        return;

      }


      if (
        invoiceDate >= monday &&
        invoiceDate <= sunday
      ) {

        // عدد فواتير الأسبوع
        this.last7DaysInvoiceCount++;


        // إجمالي مبيعات الأسبوع
        this.last7DaysInvoiceAmount +=
          Number(
            invoice.invoiceTotal
          ) || 0;

      }

    });

  }


  // =========================
  // Invoice Status
  // =========================

  private getInvoiceStatus(
    invoice: Invoice
  ): {
    statusKey: string;
    statusClass: string;
  } {

    return {

      statusKey:
        'status_paid',

      statusClass:
        'paid'

    };

  }


  // =========================
  // Customer Avatar
  // =========================

  private getAvatar(
    name?: string
  ): string {

    if (
      !name ||
      !name.trim()
    ) {

      return '؟';

    }


    return name
      .trim()
      .charAt(0);

  }


  // =========================
  // Format Date
  // =========================

  private formatDate(
    date?: string
  ): string {

    if (!date) {

      return '—';

    }


    const parsedDate =
      new Date(date);


    if (
      isNaN(
        parsedDate.getTime()
      )
    ) {

      return '—';

    }


    return parsedDate.toLocaleDateString(
      'ar-EG',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    );

  }


  // =========================
  // Get Date Value
  // =========================

  private getDateValue(
    date?: string
  ): number {

    if (!date) {

      return 0;

    }


    const value =
      new Date(date).getTime();


    return isNaN(value)
      ? 0
      : value;

  }


  // =========================
  // Navigation
  // =========================

  // ============================
// Open Invoice Details
// ============================

openInvoice(invoiceNumber: string): void {
  if (!invoiceNumber) {
    return;
  }

  this.router.navigate(['/invoices'], {
    queryParams: {
      invoice: invoiceNumber
    }
  });
}

// ============================
// Navigation
// ============================

navigate(path: string): void {
  this.router.navigate([path]);
}

}