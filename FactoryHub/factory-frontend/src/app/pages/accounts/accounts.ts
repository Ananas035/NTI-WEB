import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { TranslatePipe } from '../../pipes/translate-pipe';
import { Language } from '../../services/language';

import {
  Customer,
  Invoice,
  ReturnItem,
  Check,
  AccountTransaction
} from '../../interfaces/interface';

import { ApiService } from '../../services/api';


// ============================================================
// Backend Customer
// ============================================================

interface BackendCustomer {
  _id?: string;
  customerId: number;
  name: string;
  showroomName: string;
  mobileNumber: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}


// ============================================================
// Backend Transaction
// ============================================================

interface BackendTransaction {
  _id: string;

  customer: {
    _id?: string;
    customerId?: number;
    name?: string;
    showroomName?: string;
    mobileNumber?: string;
    address?: string;
  };

  transactionType:
    | 'INVOICE'
    | 'RETURN'
    | 'PAYMENT';

  amount: number;

  referenceNumber: string;

  paymentMethod?:
    | 'CASH'
    | 'CHECK'
    | null;

  notes?: string;

  date: string;

  createdAt?: string;

  updatedAt?: string;
}


// ============================================================
// Backend Check
// ============================================================

interface BackendCheck {
  _id?: string;

  checkNumber: string;

  customer: {
    _id?: string;
    customerId?: number;
    name?: string;
    showroomName?: string;
    mobileNumber?: string;
    address?: string;
  };

  amount: number;

  bankName: string;

  collectionDate: string;

  status:
    | 'UNDER_COLLECTION'
    | 'COLLECTED';

  collectedAt?: string | null;

  notes?: string;

  dateAdded?: string;

  createdAt?: string;

  updatedAt?: string;
}


// ============================================================
// Account Response
// ============================================================

interface AccountResponse {
  success: boolean;

  customer: {
    customerId: number;
    name: string;
    showroomName: string;
    mobileNumber: string;
    address: string;
  };

  summary: {
    totalInvoices: number;
    totalReturns: number;
    totalPayments: number;
    currentBalance: number;
  };

  transactions: BackendTransaction[];
}


// ============================================================
// Account Customer
// ============================================================

interface AccountCustomer extends Customer {
  backendId?: string;
}


// ============================================================
// Account Check
// ============================================================

interface AccountCheck extends Check {
  collectionDateRaw?: string;
}


// ============================================================
// Customer Account
// ============================================================

interface CustomerAccount extends AccountCustomer {
  netPieces: number;
  amountDue: number;
  invoiceAmount: number;
  returnAmount: number;
  paidAmount: number;
  loadingAccount?: boolean;
}


// ============================================================
// Statement Summary
// ============================================================

interface StatementSummary {
  purchased: number;
  returned: number;
  netPieces: number;

  invVal: number;
  retVal: number;
  paidVal: number;

  amountDue: number;
}


// ============================================================
// Component
// ============================================================

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css'
})
export class Accounts implements OnInit {

  constructor(
  private api: ApiService,
  private cdr: ChangeDetectorRef,
  private route: ActivatedRoute,
  private language: Language
) {}

private translateKey(key: string): string {
  return this.language.translate(key);
}
  // ============================================================
  // Main Data
  // ============================================================

  customers: AccountCustomer[] = [];

  invoices: Invoice[] = [];

  returnsData: ReturnItem[] = [];


  // ============================================================
  // Accounts
  // ============================================================

  accountData: {
    [customerId: number]: AccountResponse;
  } = {};


  // ============================================================
  // Customer To Open From Dashboard
  // ============================================================

  private pendingCustomerId: number | null = null;

  // ============================================================
  // Checks
  // ============================================================

  customerChecks: AccountCheck[] = [];
  showAllChecks = false;

  isLoadingChecks = false;


  // ============================================================
  // Loading / Errors
  // ============================================================

  isLoading = true;

  errorMessage = '';


  // ============================================================
  // Search
  // ============================================================

  searchTerm = '';


  // ============================================================
  // Customer Modal
  // ============================================================

  showCustomerModal = false;

  isEditingCustomer = false;

  editTargetId: number | null = null;

  customerError = '';


  // ============================================================
  // Delete Modal
  // ============================================================

  showDeleteModal = false;

  deleteCustomerId: number | null = null;


  // ============================================================
  // Customer Form
  // ============================================================

  formName = '';

  formStore = '';

  formMobile = '';

  formAddress = '';


  // ============================================================
  // Statement
  // ============================================================

  viewAccountCustomer:
    AccountCustomer | null = null;

  showFullRecord = false;

  statementLoading = false;

  statementError = '';

  statementSummary:
    StatementSummary | null = null;

  statementTransactions:
    AccountTransaction[] = [];


  // ============================================================
  // Payment Modal
  // ============================================================

  showPaymentModal = false;

  formPayAmount: number | null = null;

  formPayNotes = '';

  payError = '';


  // ============================================================
  // Check Modal
  // ============================================================

  showCheckModal = false;

  formCheckIssuer = '';

  formCheckBank = '';

  formCheckDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  formCheckAmount: number | null = null;

  checkError = '';

  // ============================================================
// Check Date Warning Modal
// ============================================================

showCheckDateWarning = false;

checkDateWarningNumber = '';

checkDateWarningDate = '';

// ============================================================
// Close Check Date Warning
// ============================================================

closeCheckDateWarning(): void {

  this.showCheckDateWarning = false;

  this.checkDateWarningNumber = '';

  this.checkDateWarningDate = '';

  this.cdr.detectChanges();
}


  // ============================================================
  // Init
  // ============================================================

  ngOnInit(): void {

  this.route.queryParamMap
    .pipe(take(1))
    .subscribe(params => {

      const customerParam =
        params.get('customer');

      const customerId =
        Number(customerParam);


      this.pendingCustomerId =
        customerId > 0
          ? customerId
          : null;


      this.loadAccounts();
    });
}


  // ============================================================
  // Load Accounts Page
  // ============================================================

  loadAccounts(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.accountData = {};

    this.statementError = '';


    this.api
      .get<{
        success: boolean;
        count?: number;
        data: BackendCustomer[];
      }>('/customers')
      .subscribe({

        next: (customerResponse) => {

          if (
            !customerResponse.success ||
            !Array.isArray(
              customerResponse.data
            )
          ) {

            this.errorMessage =
            'acc_error_load_customers';
  

            this.isLoading = false;

            this.cdr.detectChanges();

            return;
          }


          this.customers =
            customerResponse.data.map(
              customer => ({

                id:
                  Number(
                    customer.customerId
                  ),

                backendId:
                  customer._id,

                name:
                  customer.name,

                store:
                  customer.showroomName,

                mobile:
                  customer.mobileNumber,

                address:
                  customer.address,

                joinDate:
                  customer.createdAt
                    ? this.formatDateForDisplay(
                        customer.createdAt
                      )
                    : '—',

                orders: 0
              })
            );


          this.loadInvoices();
        },

        error: (error) => {

          console.error(
            'Accounts Customers Error:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            'acc_error_server_customers';


          this.isLoading = false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Load Invoices
  // ============================================================

  private loadInvoices(): void {

    this.api
      .get<{
        success: boolean;
        count?: number;
        data: any[];
      }>('/invoices')
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(
              response.data
            )
          ) {

            this.invoices =
              response.data.map(
                invoice => ({

                  id:
                    invoice.invoiceNumber,

                  customerId:
                    Number(
                      invoice.customer?.customerId
                    ) || 0,

                  customerName:
                    invoice.customer?.name ||
                    invoice.customer?.showroomName ||
                    '',

                  
                  date:
                    invoice.createdAt || '',

                  amount:
                    Number(
                      invoice.invoiceTotal
                    ) || 0,

                  status:
                    'paid',

                  items:
                    Array.isArray(
                      invoice.items
                    )
                      ? invoice.items
                      : []

                })
              ) as Invoice[];
          }
          else {

            this.invoices = [];
          }


          this.loadReturns();
        },

        error: (error) => {

          console.error(
            'Accounts Invoices Error:',
            error
          );

          this.invoices = [];

          this.loadReturns();
        }
      });
  }


  // ============================================================
  // Load Returns
  // ============================================================

  private loadReturns(): void {

    this.api
      .get<{
        success: boolean;
        count?: number;
        data: any[];
      }>('/returns')
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(
              response.data
            )
          ) {

            this.returnsData =
              response.data.map(
                returnDoc => ({

                  id:
                    returnDoc.returnNumber,

                  customerId:
                    Number(
                      returnDoc.customer?.customerId
                    ) || 0,

                  customerName:
                    returnDoc.customer?.name ||
                    returnDoc.customer?.showroomName ||
                    '',

                  
                  date:
                    returnDoc.createdAt || '',

                  amount:
                    Number(
                      returnDoc.returnTotal
                    ) || 0,

                  items:
                    Array.isArray(
                      returnDoc.items
                    )
                      ? returnDoc.items
                      : []

                })
              ) as ReturnItem[];
          }
          else {

            this.returnsData = [];
          }


          this.loadChecks();

          this.loadCustomerAccounts();
        },

        error: (error) => {

          console.error(
            'Accounts Returns Error:',
            error
          );

          this.returnsData = [];

          this.loadChecks();

          this.loadCustomerAccounts();
        }
      });
  }


  // ============================================================
  // Load All Checks
  // GET /api/checks
  // ============================================================

  private loadChecks(): void {

    this.isLoadingChecks = true;


    this.api
      .get<{
        success: boolean;
        count?: number;
        data: BackendCheck[];
      }>('/checks')
      .subscribe({

        next: (response) => {

          if (
            response.success &&
            Array.isArray(
              response.data
            )
          ) {

            this.customerChecks =
              response.data.map(
                check =>
                  this.mapBackendCheck(
                    check
                  )
              );
          }
          else {

            this.customerChecks = [];
          }


          this.isLoadingChecks = false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Accounts Checks Error:',
            error
          );


          this.customerChecks = [];

          this.isLoadingChecks = false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Map Backend Check To Frontend Check
  // ============================================================

  private mapBackendCheck(
    check: BackendCheck
  ): AccountCheck {

    const customerId =
      Number(
        check.customer?.customerId
      ) || 0;


    const customerName =
      check.customer?.name ||
      check.customer?.showroomName ||
      '—';


    // ==========================================================
    // Extract Issuer Name
    // Current backend stores issuer name inside notes
    // ==========================================================

    let issuerName = '—';


    const notes =
      String(
        check.notes || ''
      ).trim();


    const issuerPrefix =
      'جهة الإصدار:';


    if (
      notes.startsWith(
        issuerPrefix
      )
    ) {

      const extractedIssuer =
        notes
          .substring(
            issuerPrefix.length
          )
          .trim();


      if (extractedIssuer) {

        issuerName =
          extractedIssuer;
      }
    }


    return {

      id:
        check.checkNumber,

      customerId,

      customerName,

      issuerName,

      bankName:
        check.bankName || '—',

      
      date:
        this.formatDateForDisplay(
          check.collectionDate
        ),

      
      collectionDateRaw:
        check.collectionDate,

      amount:
        Number(
          check.amount
        ) || 0,

      status:
        check.status ===
          'UNDER_COLLECTION'
          ? 'pending'
          : 'processed'

    } as AccountCheck;
  }


  // ============================================================
  // Load Account For Every Customer
  // ============================================================

  private loadCustomerAccounts(): void {

    if (
      this.customers.length === 0
    ) {

      this.isLoading = false;

      this.cdr.detectChanges();

      return;
    }


    let completed = 0;

    const total =
      this.customers.length;


    this.customers.forEach(
      customer => {

        this.api
          .get<AccountResponse>(
            `/accounts/customer/${customer.id}`
          )
          .subscribe({

            next: (response) => {

              if (
                response &&
                response.success
              ) {

                this.accountData[
                  customer.id
                ] = response;
              }


              completed++;

              this.checkAccountsLoading(
                completed,
                total
              );
            },

            error: (error) => {

              console.error(
                `Account Error for Customer ${customer.id}:`,
                error
              );


              completed++;

              this.checkAccountsLoading(
                completed,
                total
              );
            }
          });
      }
    );
  }


  // ============================================================
  // Check Accounts Loading
  // ============================================================

  private checkAccountsLoading(
  completed: number,
  total: number
): void {

  if (
    completed >= total
  ) {

    this.isLoading = false;

    this.cdr.detectChanges();


    // ==========================================================
    // Open Customer Statement From Dashboard
    // ==========================================================

    if (
      this.pendingCustomerId !== null
    ) {

      const customer =
        this.getCustomerById(
          this.pendingCustomerId
        );


      if (customer) {

        this.openStatement(
          customer
        );
      }


      // Prevent reopening the same statement
      this.pendingCustomerId = null;
    }
  }
}


  // ============================================================
  // Customer Accounts Table
  // ============================================================

  get customerAccounts():
    CustomerAccount[] {

    const q =
      this.searchTerm
        .trim()
        .toLowerCase();


    return this.customers

      .map(customer => {

        const account =
          this.accountData[
            customer.id
          ];


        // --------------------------------------------------------
        // Invoice Count
        // --------------------------------------------------------

        const invoiceCount =
          this.invoices.filter(
            invoice =>
              Number(
                invoice.customerId
              ) ===
              Number(
                customer.id
              )
          ).length;


        // --------------------------------------------------------
        // Purchased Pieces
        // --------------------------------------------------------

        let purchased = 0;


        this.invoices

          .filter(
            invoice =>
              Number(
                invoice.customerId
              ) ===
              Number(
                customer.id
              )
          )

          .forEach(
            invoice => {

              if (
                Array.isArray(
                  invoice.items
                )
              ) {

                invoice.items.forEach(
                  item => {

                    purchased +=
                      Number(
                        item?.quantity
                      ) || 0;
                  }
                );
              }
            }
          );


        // --------------------------------------------------------
        // Returned Pieces
        // --------------------------------------------------------

        let returned = 0;


        this.returnsData

          .filter(
            ret =>
              Number(
                ret.customerId
              ) ===
              Number(
                customer.id
              )
          )

          .forEach(
            ret => {

              if (
                Array.isArray(
                  ret.items
                )
              ) {

                ret.items.forEach(
                  item => {

                    returned +=
                      Number(
                        item?.quantity
                      ) || 0;
                  }
                );
              }
            }
          );


        // --------------------------------------------------------
        // Financial Values
        // --------------------------------------------------------

        const invoiceAmount =
          Number(
            account?.summary?.totalInvoices
          ) || 0;


        const returnAmount =
          Number(
            account?.summary?.totalReturns
          ) || 0;


        const paidAmount =
          Number(
            account?.summary?.totalPayments
          ) || 0;


        const amountDue =
          account?.summary
            ? Number(
                account.summary.currentBalance
              ) || 0
            :
              (
                invoiceAmount -
                returnAmount -
                paidAmount
              );


        return {

          ...customer,

          orders:
            invoiceCount,

          netPieces:
            purchased - returned,

          amountDue,

          invoiceAmount,

          returnAmount,

          paidAmount,

          loadingAccount:
            !account
        };
      })

      .filter(
        customer => {

          if (!q) {
            return true;
          }


          return (

            customer.name
              .toLowerCase()
              .includes(q) ||

            customer.store
              .toLowerCase()
              .includes(q) ||

            customer.mobile
              .toLowerCase()
              .includes(q)
          );
        }
      );
  }


  // ============================================================
  // Add Customer Modal
  // ============================================================

  openAddCustomer(): void {

    this.isEditingCustomer = false;

    this.editTargetId = null;

    this.formName = '';

    this.formStore = '';

    this.formMobile = '';

    this.formAddress = '';

    this.customerError = '';

    this.showCustomerModal = true;
  }


  // ============================================================
  // Edit Customer Modal
  // ============================================================

  openEditCustomer(
    customer: AccountCustomer
  ): void {

    this.isEditingCustomer = true;

    this.editTargetId =
      customer.id;

    this.formName =
      customer.name;

    this.formStore =
      customer.store;

    this.formMobile =
      customer.mobile;

    this.formAddress =
      customer.address;

    this.customerError = '';

    this.showCustomerModal = true;
  }


  // ============================================================
  // Close Customer Modal
  // ============================================================

  closeCustomerModal(): void {

    this.showCustomerModal = false;

    this.isEditingCustomer = false;

    this.editTargetId = null;

    this.customerError = '';
  }


  // ============================================================
  // Reset Customer Form
  // ============================================================

  resetCustomerForm(): void {

    this.formName = '';

    this.formStore = '';

    this.formMobile = '';

    this.formAddress = '';
  }


  // ============================================================
  // Save Customer
  // ============================================================

  saveCustomer(): void {

    if (
      this.isEditingCustomer
    ) {

      this.updateCustomer();

      return;
    }


    this.addCustomer();
  }


  // ============================================================
  // Add Customer
  // ============================================================

  addCustomer(): void {

    this.customerError = '';


    const name =
      this.formName.trim();

    const store =
      this.formStore.trim();

    const mobile =
      this.formMobile.trim();

    const address =
      this.formAddress.trim();


    if (!name) {

      this.customerError =
        'acc_validation_customer_name';

      return;
    }


    if (!store) {

      this.customerError =
        'acc_validation_store';

      return;
    }


    if (!mobile) {

      this.customerError =
        'acc_validation_mobile';

      return;
    }


    if (!address) {

      this.customerError =
        'acc_validation_address';

      return;
    }


    this.isLoading = true;


    this.api
      .post<{
        success: boolean;
        data: BackendCustomer;
        message?: string;
      }>(
        '/customers',
        {
          name,

          showroomName:
            store,

          mobileNumber:
            mobile,

          address
        }
      )
      .subscribe({

        next: (response) => {

          if (
            !response ||
            !response.success
          ) {

            this.customerError =
              response?.message ||
              'acc_error_add_customer';


            this.isLoading = false;

            this.cdr.detectChanges();

            return;
          }


          this.closeCustomerModal();

          this.resetCustomerForm();

          this.loadAccounts();
        },

        error: (error) => {

          console.error(
            'Create Customer Error:',
            error
          );


          this.customerError =
            error?.error?.message ||
            'acc_error_add_customer';


          this.isLoading = false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Update Customer
  // ============================================================

  updateCustomer(): void {

    this.customerError = '';


    if (
      !this.editTargetId
    ) {

      this.customerError =
      'acc_error_customer_edit_target';

      return;
    }


    const customer =
      this.customers.find(
        c =>
          c.id ===
          this.editTargetId
      );


    if (
      !customer ||
      !customer.backendId
    ) {

      this.customerError =
      'acc_error_customer_database_id';

      
      return;
    }


    const name =
      this.formName.trim();

    const store =
      this.formStore.trim();

    const mobile =
      this.formMobile.trim();

    const address =
      this.formAddress.trim();


    if (!name) {

      this.customerError =
        'acc_validation_customer_name';

      return;
    }


    if (!store) {

      this.customerError =
        'acc_validation_store';

      return;
    }


    if (!mobile) {

      this.customerError =
        'acc_validation_mobile';

      return;
    }


    if (!address) {

      this.customerError =
        'acc_validation_address';

      return;
    }


    this.isLoading = true;


    this.api
      .patch<{
        success: boolean;
        data: BackendCustomer;
        message?: string;
      }>(
        `/customers/${customer.backendId}`,
        {
          name,

          showroomName:
            store,

          mobileNumber:
            mobile,

          address
        }
      )
      .subscribe({

        next: (response) => {

          if (
            !response ||
            !response.success
          ) {

            this.customerError =
              response?.message ||
              'acc_error_update_customer';


            this.isLoading = false;

            this.cdr.detectChanges();

            return;
          }


          this.closeCustomerModal();

          this.resetCustomerForm();

          this.loadAccounts();
        },

        error: (error) => {

          console.error(
            'Update Customer Error:',
            error
          );


          this.customerError =
            error?.error?.message ||
            'acc_error_update_customer';


          this.isLoading = false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Delete Modal
  // ============================================================

  openDeleteModal(
    customerId: number
  ): void {

    this.deleteCustomerId =
      customerId;

    this.customerError = '';

    this.showDeleteModal = true;
  }


  // ============================================================
  // HTML Alias
  // ============================================================

  openDeleteConfirm(
    customerId: number
  ): void {

    this.openDeleteModal(
      customerId
    );
  }


  // ============================================================
  // HTML Alias
  // ============================================================

  openDeleteCustomer(
    customerId: number
  ): void {

    this.openDeleteModal(
      customerId
    );
  }


  // ============================================================
  // Close Delete
  // ============================================================

  closeDeleteModal(): void {

    this.showDeleteModal = false;

    this.deleteCustomerId = null;

    this.customerError = '';
  }


  // ============================================================
  // Confirm Delete
  // ============================================================

  confirmDeleteCustomer(): void {

    this.customerError = '';


    if (
      !this.deleteCustomerId
    ) {

      return;
    }


    const customer =
      this.customers.find(
        c =>
          c.id ===
          this.deleteCustomerId
      );


    if (
      !customer ||
      !customer.backendId
    ) {

      this.customerError =
        'acc_error_customer_database_id';

      return;
    }


    this.isLoading = true;


    this.api
      .delete<{
        success: boolean;
        data: unknown;
        message?: string;
      }>(
        `/customers/${customer.backendId}`
      )
      .subscribe({

        next: (response) => {

          if (
            !response ||
            !response.success
          ) {

            this.customerError =
              response?.message ||
              'acc_error_delete_customer';


            this.isLoading = false;

            this.cdr.detectChanges();

            return;
          }


          this.showDeleteModal = false;

          this.deleteCustomerId = null;

          this.loadAccounts();
        },

        error: (error) => {

          console.error(
            'Delete Customer Error:',
            error
          );


          this.customerError =
            error?.error?.message ||
            'تعذر حذف العميل';


          this.isLoading = false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // HTML Alias
  // ============================================================

  confirmDelete(): void {

    this.confirmDeleteCustomer();
  }


  // ============================================================
  // HTML Alias
  // ============================================================

  deleteCustomer(): void {

    this.confirmDeleteCustomer();
  }


  // ============================================================
  // Open Statement
  // ============================================================

  openStatement(
  customer: AccountCustomer
): void {

  this.viewAccountCustomer =
    customer;

  // يبدأ بآخر 5 حركات فقط
  this.showFullRecord = false;

  this.statementLoading = true;

  this.statementError = '';

  this.statementSummary = null;

  this.statementTransactions = [];


  const existingAccount =
    this.accountData[
      customer.id
    ];


  if (
    existingAccount &&
    existingAccount.success
  ) {

    this.prepareStatement(
      customer,
      existingAccount
    );

    return;
  }


  this.api
    .get<AccountResponse>(
      `/accounts/customer/${customer.id}`
    )
    .subscribe({

      next: (response) => {

        if (
          !response ||
          !response.success
        ) {

          this.statementError =
            'acc_error_statement_load';

          this.statementLoading =
            false;

          this.cdr.detectChanges();

          return;
        }


        this.accountData[
          customer.id
        ] = response;


        this.prepareStatement(
          customer,
          response
        );
      },

      error: (error) => {

        console.error(
          'Open Statement Error:',
          error
        );


        this.statementError =
          error?.error?.message ||
          'acc_error_statement_load';


        this.statementLoading =
          false;


        this.cdr.detectChanges();
      }
    });
}


  // ============================================================
  // Prepare Statement
  // ============================================================

  private prepareStatement(
    customer: AccountCustomer,
    account: AccountResponse
  ): void {

    const customerId =
      Number(customer.id);


    // ==========================================================
    // Purchased Pieces
    // ==========================================================

    let purchased = 0;


    this.invoices

      .filter(
        invoice =>
          Number(
            invoice.customerId
          ) ===
          customerId
      )

      .forEach(
        invoice => {

          if (
            Array.isArray(
              invoice.items
            )
          ) {

            invoice.items.forEach(
              item => {

                purchased +=
                  Number(
                    item?.quantity
                  ) || 0;

              }
            );
          }
        }
      );


    // ==========================================================
    // Returned Pieces
    // ==========================================================

    let returned = 0;


    this.returnsData

      .filter(
        ret =>
          Number(
            ret.customerId
          ) ===
          customerId
      )

      .forEach(
        ret => {

          if (
            Array.isArray(
              ret.items
            )
          ) {

            ret.items.forEach(
              item => {

                returned +=
                  Number(
                    item?.quantity
                  ) || 0;

              }
            );
          }
        }
      );


    // ==========================================================
    // Summary
    // ==========================================================

    this.statementSummary = {

      purchased,

      returned,

      netPieces:
        purchased - returned,

      invVal:
        Number(
          account.summary?.totalInvoices
        ) || 0,

      retVal:
        Number(
          account.summary?.totalReturns
        ) || 0,

      paidVal:
        Number(
          account.summary?.totalPayments
        ) || 0,

      amountDue:
        Number(
          account.summary?.currentBalance
        ) || 0
    };


    // ==========================================================
    // Build Statement Transactions
    // ==========================================================

    const transactions:
      AccountTransaction[] = [];


    // ==========================================================
    // Invoices
    // ==========================================================

    this.invoices

      .filter(
        invoice =>
          Number(
            invoice.customerId
          ) ===
          customerId
      )

      .forEach(
        invoice => {

          let quantity = 0;


          if (
            Array.isArray(
              invoice.items
            )
          ) {

            invoice.items.forEach(
              item => {

                quantity +=
                  Number(
                    item?.quantity
                  ) || 0;

              }
            );
          }


          transactions.push({

            id:
              invoice.id,

            /*
             * Keep original ISO date.
             */
            date:
              invoice.date ||
              '—',

            type:
              'invoice',

            refId:
              invoice.id,

            quantity:
              quantity > 0
                ? quantity
                : '—',

            amount:
              Number(
                invoice.amount
              ) || 0

          });

        }
      );


    // ==========================================================
    // Returns
    // ==========================================================

    this.returnsData

      .filter(
        ret =>
          Number(
            ret.customerId
          ) ===
          customerId
      )

      .forEach(
        ret => {

          let quantity = 0;


          if (
            Array.isArray(
              ret.items
            )
          ) {

            ret.items.forEach(
              item => {

                quantity +=
                  Number(
                    item?.quantity
                  ) || 0;

              }
            );
          }


          transactions.push({

            id:
              ret.id,

            /*
             * Keep original ISO date.
             */
            date:
              ret.date ||
              '—',

            type:
              'return',

            refId:
              ret.id,

            quantity:
              quantity > 0
                ? quantity
                : '—',

            amount:
              Number(
                ret.amount
              ) || 0

          });

        }
      );


    // ==========================================================
    // Payments / Collected Checks
    // ==========================================================

    if (
      Array.isArray(
        account.transactions
      )
    ) {

      account.transactions

        .filter(
          transaction =>
            transaction.transactionType ===
            'PAYMENT'
        )

        .forEach(
          transaction => {

            const type:
              | 'payment'
              | 'check' =

              transaction.paymentMethod ===
              'CHECK'
                ? 'check'
                : 'payment';


            transactions.push({

              id:
                transaction.referenceNumber,

              date:
                transaction.date ||
                '—',

              type,

              refId:
                transaction.referenceNumber,

              quantity:
                '—',

              amount:
                Number(
                  transaction.amount
                ) || 0

            });

          }
        );

    }


    // ==========================================================
    // Sort Transactions By Real Date
    // Oldest -> Newest
    // ==========================================================

    transactions.sort(
      (a, b) => {

        const aTime =
          this.getTransactionDateValue(
            a.date
          );

        const bTime =
          this.getTransactionDateValue(
            b.date
          );


        return aTime - bTime;
      }
    );


    // ==========================================================
    // Running Balance
    // ==========================================================

    let balance = 0;


    this.statementTransactions =
      transactions.map(
        transaction => {

          if (
            transaction.type ===
            'invoice'
          ) {

            balance +=
              Number(
                transaction.amount
              ) || 0;

          }
          else {

            balance -=
              Number(
                transaction.amount
              ) || 0;

          }


          return {

            ...transaction,

            balance

          };

        }
      );


    // ==========================================================
    // Finish
    // ==========================================================

    this.statementLoading =
      false;

    this.cdr.detectChanges();
  }


  // ============================================================
  // Displayed Transactions
  // ============================================================

  get displayedTransactions():
    AccountTransaction[] {

    if (
      this.showFullRecord
    ) {

      return this.statementTransactions;
    }


    return this.statementTransactions
      .slice(-5);
  }


// ============================================================
// Current Customer Checks
// ============================================================

get currentCustomerChecks():
  AccountCheck[] {

  if (
    !this.viewAccountCustomer
  ) {

    return [];
  }


  const customerId =
    this.viewAccountCustomer.id;


  return this.customerChecks

    .filter(
      check =>
        Number(
          check.customerId
        ) ===
        Number(
          customerId
        )
    )

    .sort(
      (a, b) => {

        const aDate =
          this.getCheckDateValue(
            a.collectionDateRaw ||
            a.date
          );

        const bDate =
          this.getCheckDateValue(
            b.collectionDateRaw ||
            b.date
          );


        return bDate - aDate;
      }
    );
}

// ============================================================
// Displayed Customer Checks
// ============================================================

get displayedCustomerChecks():
  AccountCheck[] {

  const allChecks =
    this.currentCustomerChecks;


  if (
    this.showAllChecks
  ) {

    return allChecks;
  }


  return allChecks.slice(0, 5);
}

// ============================================================
// Toggle Checks View
// ============================================================

toggleChecksView(): void {

  this.showAllChecks =
    !this.showAllChecks;

  this.cdr.detectChanges();
}


  // ============================================================
  // Close Statement
  // ============================================================

  closeStatement(): void {

  this.viewAccountCustomer = null;

  this.showFullRecord = false;

  this.showAllChecks = false;

  this.statementLoading = false;

  this.statementError = '';

  this.statementSummary = null;

  this.statementTransactions = [];
}


  // ============================================================
  // Toggle Full Record
  // ============================================================

  toggleFullRecord(): void {

    this.showFullRecord =
      !this.showFullRecord;
  }


  // ============================================================
  // Refresh Statement
  // ============================================================

  refreshCurrentStatement(): void {

    if (
      !this.viewAccountCustomer
    ) {

      return;
    }


    const customer =
      this.viewAccountCustomer;


    this.statementLoading = true;

    this.statementError = '';


    this.api
      .get<AccountResponse>(
        `/accounts/customer/${customer.id}`
      )
      .subscribe({

        next: (response) => {

          if (
            !response ||
            !response.success
          ) {

            this.statementError =
              'acc_error_statement_refresh';

            this.statementLoading =
              false;

            this.cdr.detectChanges();

            return;
          }


          this.accountData[
            customer.id
          ] = response;


          this.prepareStatement(
            customer,
            response
          );
        },

        error: (error) => {

          console.error(
            'Refresh Statement Error:',
            error
          );


          this.statementError =
            error?.error?.message ||
            'acc_error_statement_refresh';


          this.statementLoading =
            false;

          this.cdr.detectChanges();
        }
      });


    this.loadChecks();
  }


  // ============================================================
  // Open Payment
  // ============================================================

  openPaymentModal(
    customer?: AccountCustomer
  ): void {

    if (customer) {

      this.viewAccountCustomer =
        customer;
    }


    this.formPayAmount = null;

    this.formPayNotes = '';

    this.payError = '';

    this.showPaymentModal = true;
  }


  // ============================================================
  // HTML Alias
  // ============================================================

  openAddPayment(
    customer?: AccountCustomer
  ): void {

    this.openPaymentModal(
      customer
    );
  }


  // ============================================================
  // Close Payment
  // ============================================================

  closePaymentModal(): void {

    this.showPaymentModal = false;

    this.formPayAmount = null;

    this.formPayNotes = '';

    this.payError = '';
  }


  // ============================================================
  // Submit Cash Payment
  // POST /api/payments
  // ============================================================

  submitPayment(): void {

    this.payError = '';


    // ==========================================================
    // Customer
    // ==========================================================

    if (
      !this.viewAccountCustomer
    ) {

      this.payError =
      'acc_validation_select_customer';

      return;
    }


    const customerId =
      Number(
        this.viewAccountCustomer.id
      );


    if (!customerId) {

      this.payError =
        'acc_validation_customer_id';

      return;
    }


    // ==========================================================
    // Amount
    // ==========================================================

    const amount =
      Number(
        this.formPayAmount
      );


    if (
      !amount ||
      amount <= 0
    ) {

      this.payError =
        'acc_validation_payment_amount';

      return;
    }


    // ==========================================================
    // Notes
    // ==========================================================

    const notes =
      this.formPayNotes
        .trim();


    // ==========================================================
    // Loading
    // ==========================================================

    this.statementLoading = true;


    // ==========================================================
    // POST /api/payments
    // ==========================================================

    this.api
      .post<{
        success: boolean;
        message?: string;

        data?: {

          _id?: string;

          paymentNumber?: string;

          customer?: {

            customerId?: number;

            name?: string;

            showroomName?: string;
          };

          amount?: number;

          paymentMethod?: string;

          notes?: string;

          date?: string;

          referenceNumber?: string;
        };

      }>(
        '/payments',
        {
          customerId,

          amount,

          paymentMethod:
            'CASH',

          notes
        }
      )
      .subscribe({

        // ========================================================
        // Success
        // ========================================================

        next: (response) => {

          if (
            !response ||
            !response.success
          ) {

            this.payError =
              response?.message ||
              'acc_error_create_payment';

            this.statementLoading =
              false;

            this.cdr.detectChanges();

            return;
          }


          // ------------------------------------------------------
          // Close Payment Modal
          // ------------------------------------------------------

          this.closePaymentModal();


          // ------------------------------------------------------
          // Refresh Account
          // ------------------------------------------------------

          if (
            this.viewAccountCustomer
          ) {

            this.refreshCurrentStatement();

          }
          else {

            this.loadAccounts();

          }

        },


        // ========================================================
        // Error
        // ========================================================

        error: (error) => {

          console.error(
            'Create Payment Error:',
            error
          );


          this.payError =
            error?.error?.message ||
            'acc_error_payment';


          this.statementLoading =
            false;


          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // Payment Alias
  // ============================================================

  savePayment(): void {

    this.submitPayment();
  }


  // ============================================================
  // Open Check
  // ============================================================

  openCheckModal(
    customer?: AccountCustomer
  ): void {

    if (customer) {

      this.viewAccountCustomer =
        customer;
    }


    this.formCheckIssuer = '';

    this.formCheckBank = '';

    this.formCheckDate =
      new Date()
        .toISOString()
        .slice(0, 10);

    this.formCheckAmount = null;

    this.checkError = '';

    this.showCheckModal = true;
  }


  // ============================================================
  // HTML Alias
  // ============================================================

  openAddCheck(
    customer?: AccountCustomer
  ): void {

    this.openCheckModal(
      customer
    );
  }


  // ============================================================
  // Close Check
  // ============================================================

  closeCheckModal(): void {

    this.showCheckModal = false;

    this.formCheckIssuer = '';

    this.formCheckBank = '';

    this.formCheckDate =
      new Date()
        .toISOString()
        .slice(0, 10);

    this.formCheckAmount = null;

    this.checkError = '';
  }


  // ============================================================
  // Submit Check
  // POST /api/checks
  // ============================================================

  submitCheck(): void {

    this.checkError = '';


    // ==========================================================
    // Customer
    // ==========================================================

    if (
      !this.viewAccountCustomer
    ) {

      this.checkError =
        'acc_validation_select_customer';

      return;
    }


    const customerId =
      this.viewAccountCustomer.id;


    // ==========================================================
    // Amount
    // ==========================================================

    const amount =
      Number(
        this.formCheckAmount
      );


    if (
      !amount ||
      amount <= 0
    ) {

      this.checkError =
        'acc_validation_check_amount';

      return;
    }


    // ==========================================================
    // Bank
    // ==========================================================

    const bankName =
      this.formCheckBank.trim();


    if (!bankName) {

      this.checkError =
        'acc_validation_bank';

      return;
    }


    // ==========================================================
    // Collection Date
    // ==========================================================

    if (
      !this.formCheckDate
    ) {

      this.checkError =
        'acc_validation_collection_date';

      return;
    }


    const parsedDate =
      new Date(
        this.formCheckDate
      );


    if (
      isNaN(
        parsedDate.getTime()
      )
    ) {

      this.checkError =
        'acc_validation_collection_date_invalid';
      
      return;
    }


    // ==========================================================
    // Loading
    // ==========================================================

    this.isLoadingChecks = true;


    // ==========================================================
    // Preserve Issuer Name In Notes
    // ==========================================================

    let notes = '';


    const issuer =
      this.formCheckIssuer.trim();


    if (issuer) {

      notes =
        `جهة الإصدار: ${issuer}`;
    }


    // ==========================================================
    // POST /api/checks
    // ==========================================================

    this.api
      .post<{
        success: boolean;
        data: BackendCheck;
        message?: string;
      }>(
        '/checks',
        {
          customerId,

          amount,

          bankName,

          collectionDate:
            this.formCheckDate,

          notes
        }
      )
      .subscribe({

        next: (response) => {

          if (
            !response ||
            !response.success
          ) {

            this.checkError =
              response?.message ||
              'acc_error_add_check'

            this.isLoadingChecks =
              false;

            this.cdr.detectChanges();

            return;
          }


          // ----------------------------------------------------
          // Close Modal
          // ----------------------------------------------------

          this.closeCheckModal();


          // ----------------------------------------------------
          // Reload Checks
          // ----------------------------------------------------

          this.loadChecks();
        },

        error: (error) => {

          console.error(
            'Create Check Error:',
            error
          );


          this.checkError =
            error?.error?.message ||
            'تعذر إضافة الشيك';


          this.isLoadingChecks =
            false;

          this.cdr.detectChanges();
        }
      });
  }


  // ============================================================
  // Check Alias
  // ============================================================

  saveCheck(): void {

    this.submitCheck();
  }


  // ============================================================
  // Process / Collect Check
  // PATCH /api/checks/:checkNumber/collect
  // ============================================================

  // ============================================================
// Process / Collect Check
// PATCH /api/checks/:checkNumber/collect
// ============================================================

processCheck(
  check: AccountCheck
): void {

  this.checkError = '';


  // ==========================================================
  // Validate Check
  // ==========================================================

  if (
    !check ||
    !check.id
  ) {

    this.checkError =
      'acc_error_check_id';

    this.cdr.detectChanges();

    return;
  }


  // ==========================================================
  // Already Processed
  // ==========================================================

  if (
    check.status === 'processed'
  ) {

    this.checkError =
      'acc_error_check_processed';

    this.cdr.detectChanges();

    return;
  }


  // ==========================================================
  // Original Backend Date
  // ==========================================================

  const rawDate =
    String(
      check.collectionDateRaw || ''
    ).trim();


  if (!rawDate) {

    this.checkError =
      `${this.translateKey('acc_error_check_date_read')} ${check.id}`;

    this.cdr.detectChanges();

    return;
  }


  // ==========================================================
  // Extract YYYY-MM-DD
  // ==========================================================

  const dueDateText =
    rawDate.substring(0, 10);


  // ==========================================================
  // Validate Date
  // ==========================================================

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dueDateText
    )
  ) {

    this.checkError =
      `${this.translateKey('acc_error_check_date_invalid')} ${check.id}`;

    this.cdr.detectChanges();

    return;
  }


  // ==========================================================
  // Get Today As YYYY-MM-DD
  // ==========================================================

  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      today.getDate()
    ).padStart(2, '0');


  const todayText =
    `${year}-${month}-${day}`;


  // ==========================================================
  // Date Has Not Arrived Yet
  // ==========================================================

  if (
    dueDateText > todayText
  ) {

    const parts =
      dueDateText.split('-');


    const dueYear =
      parts[0];

    const dueMonth =
      parts[1];

    const dueDay =
      parts[2];


    this.checkDateWarningNumber =
      check.id;


    this.checkDateWarningDate =
      `${dueDay}/${dueMonth}/${dueYear}`;


    this.showCheckDateWarning =
      true;


    this.cdr.detectChanges();


    // مهم:
    // لا ترسل أي request للـ backend
    return;
  }


  // ==========================================================
  // Date Has Arrived Or Passed
  // ==========================================================

  this.statementLoading = true;


  this.api
    .patch<{
      success: boolean;
      message?: string;
      data?: unknown;
    }>(
      `/checks/${encodeURIComponent(check.id)}/collect`,
      {}
    )
    .subscribe({

      next: (response) => {

        this.statementLoading = false;


        if (
          !response ||
          !response.success
        ) {

          this.checkError =
            response?.message ||
            'acc_error_collect_check';

          this.cdr.detectChanges();

          return;
        }


        // تحديث الحساب بعد التحصيل
        this.refreshCurrentStatement();

        this.cdr.detectChanges();
      },


      error: (error) => {

        console.error(
          'Collect Check Error:',
          error
        );


        this.statementLoading = false;


        this.checkError =
          error?.error?.message ||
          'acc_error_collect_check_generic'


        this.cdr.detectChanges();
      }

    });
}


  // ============================================================
  // Refresh Checks
  // ============================================================

  refreshChecks(): void {

    this.loadChecks();
  }


  // ============================================================
  // Current Customer
  // ============================================================

  getCurrentCustomer():
    AccountCustomer | null {

    return this.viewAccountCustomer;
  }


  // ============================================================
  // Get Customer
  // ============================================================

  getCustomerById(
    customerId: number
  ): AccountCustomer | null {

    return (
      this.customers.find(
        customer =>
          Number(customer.id) ===
          Number(customerId)
      ) || null
    );
  }


  // ============================================================
  // Get Account
  // ============================================================

  getAccount(
    customerId: number
  ): AccountResponse | null {

    return (
      this.accountData[
        customerId
      ] || null
    );
  }


  // ============================================================
  // Refresh Accounts
  // ============================================================

  refreshAccounts(): void {

    this.loadAccounts();
  }


  // ============================================================
  // Clear Search
  // ============================================================

  clearSearch(): void {

    this.searchTerm = '';
  }


  // ============================================================
  // Track Customer
  // ============================================================

  trackCustomer(
    index: number,
    customer: AccountCustomer
  ): number {

    return (
      customer.id ||
      index
    );
  }


  // ============================================================
  // Track Transaction
  // ============================================================

  trackTransaction(
    index: number,
    transaction: AccountTransaction
  ): string {

    return (
      transaction.id ||
      `${index}-${transaction.refId}`
    );
  }


  // ============================================================
  // Safe Number
  // ============================================================

  getSafeNumber(
    value:
      number |
      null |
      undefined
  ): number {

    return Number(value) || 0;
  }


  // ============================================================
  // Format Date For Display
  // ============================================================

  private formatDateForDisplay(
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


  // ============================================================
  // Transaction Date Value
  // ============================================================

  private getTransactionDateValue(
    date?: string
  ): number {

    if (!date) {

      return 0;
    }


    const value =
      new Date(date).getTime();


    if (
      isNaN(value)
    ) {

      return 0;
    }


    return value;
  }


  // ============================================================
  // Check Date Value
  // Supports:
  // 2026-09-25
  // 2026-09-25T00:00:00.000Z
  // 25/09/2026
  // Arabic digits
  // ============================================================

  private getCheckDateValue(
    date?: string
  ): number {

    if (!date) {

      return 0;
    }


    const normalized =
      String(date)
        .replace(
          /[٠-٩]/g,
          digit =>
            String(
              '٠١٢٣٤٥٦٧٨٩'
                .indexOf(digit)
            )
        )
        .trim();


    // ----------------------------------------------------------
    // ISO / YYYY-MM-DD
    // ----------------------------------------------------------

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        normalized
      )
    ) {

      const isoDate =
        new Date(
          normalized.substring(
            0,
            10
          ) +
          'T00:00:00'
        );


      const timestamp =
        isoDate.getTime();


      return isNaN(timestamp)
        ? 0
        : timestamp;
    }


    // ----------------------------------------------------------
    // DD/MM/YYYY
    // ----------------------------------------------------------

    const parts =
      normalized.split('/');


    if (
      parts.length === 3
    ) {

      const day =
        Number(
          parts[0]
        );


      const month =
        Number(
          parts[1]
        );


      const year =
        Number(
          parts[2]
        );


      const timestamp =
        new Date(
          year,
          month - 1,
          day
        ).getTime();


      return isNaN(timestamp)
        ? 0
        : timestamp;
    }


    // ----------------------------------------------------------
    // Fallback
    // ----------------------------------------------------------

    const parsed =
      new Date(
        normalized
      ).getTime();


    return isNaN(parsed)
      ? 0
      : parsed;
  }


  // ============================================================
  // Parse Display Date
  // Used For Existing Logic
  // ============================================================

  private parseDisplayDate(
    date?: string
  ): number {

    return this.getCheckDateValue(
      date
    );
  }

}