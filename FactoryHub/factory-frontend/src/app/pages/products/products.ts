import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductModel } from '../../interfaces/interface';
import { ApiService } from '../../services/api';
import { TranslatePipe } from '../../pipes/translate-pipe';


interface BackendProduct {
  _id: string;
  modelName: string;
  modelCode: number;
  price: number;
  availablePieces: number;
  colors: string[] | string;
  image: string;
  createdAt: string;
  updatedAt?: string;
}


interface ProductsResponse {
  success: boolean;
  count: number;
  data: BackendProduct[];
  message?: string;
}


interface ProductResponse {
  success: boolean;
  data: BackendProduct;
  message?: string;
}


interface DeleteProductResponse {
  success: boolean;
  message: string;
  data?: BackendProduct;
}


@Component({
  selector: 'app-products',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],

  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {

  // =========================================================
  // API
  // =========================================================

  private readonly productsEndpoint =
    '/products';

  readonly backendBaseUrl =
    'http://localhost:5000';


  // =========================================================
  // Products
  // =========================================================

  models: ProductModel[] = [];


  // =========================================================
  // Search
  // =========================================================

  searchTerm = '';


  // =========================================================
  // Loading / Saving
  // =========================================================

  isLoading = false;
  isSaving = false;


  // =========================================================
  // Modals
  // =========================================================

  showModal = false;
  isEditing = false;


  currentModelId:
    number | null = null;


  showDeleteModal = false;

  deleteTargetId:
    number | null = null;


  // =========================================================
  // Form
  // =========================================================

  formName = '';

  formCode = '';

  formPieces:
    number | null = null;

  formPrice:
    number | null = null;

  formNumColors:
    number | null = null;

  formColors: string[] = [];


  // =========================================================
  // Image
  // =========================================================

  formImage = '';

  selectedImageFile:
    File | null = null;


  // =========================================================
  // Error
  // =========================================================

  errorMessage = '';


  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // Init
  // =========================================================

  ngOnInit(): void {

    this.loadProducts();

  }


  // =========================================================
  // Track
  // =========================================================

  trackByIndex(
    index: number
  ): number {

    return index;

  }


  // =========================================================
  // Color Input
  // =========================================================

  onColorInput(
    index: number,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.formColors[index] =
      input.value;

  }


  // =========================================================
  // Normalize Colors
  // =========================================================

  private normalizeColors(
    value:
      string[] |
      string |
      null |
      undefined
  ): string[] {

    if (!value) {
      return [];
    }

    const values =
      Array.isArray(value)
        ? value
        : [value];

    return [
      ...new Set(
        values
          .flatMap(
            (item: string) =>
              item.split(',')
          )
          .map(
            (color: string) =>
              color.trim()
          )
          .filter(
            (color: string) =>
              color.length > 0
          )
      )
    ];

  }


  // =========================================================
  // Load Products
  // GET /api/products
  // =========================================================

  loadProducts(): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.api
      .get<ProductsResponse>(
        this.productsEndpoint
      )
      .subscribe({

        next: (response) => {

          if (
            response?.success
          ) {

            this.models =
              (
                response.data ||
                []
              ).map(
                product =>
                  this.mapBackendProduct(
                    product
                  )
              );

          }
          else {

            this.models = [];

            this.errorMessage =
              response?.message ||
              'prd_error_load';

          }


          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Load products error:',
            error
          );


          this.models = [];


          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'prd_error_load_backend'
            );


          this.isLoading = false;

          this.cdr.detectChanges();

        }

      });

  }


  // =========================================================
  // Map Backend Product
  // =========================================================

  private mapBackendProduct(
    product: BackendProduct
  ): ProductModel {

    return {

      id:
        Number(
          product.modelCode
        ),

      name:
        product.modelName,

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
        this.normalizeColors(
          product.colors
        ),

      createdAt:
        product.createdAt
          ? this.formatDate(
              product.createdAt
            )
          : '',

      image:
        product.image || ''

    };

  }


  // =========================================================
  // Filtered Models
  // =========================================================

  get filteredModels():
    ProductModel[] {

    const q =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (!q) {
      return this.models;
    }


    return this.models.filter(
      model =>
        model.name
          .toLowerCase()
          .includes(q) ||

        model.code
          .toLowerCase()
          .includes(q)
    );

  }


  // =========================================================
  // Add Modal
  // =========================================================

  openAddModal(): void {

    this.isEditing = false;

    this.currentModelId = null;

    this.resetForm();

    this.showModal = true;

  }


  // =========================================================
  // Edit Modal
  // =========================================================

  openEditModal(
    model: ProductModel
  ): void {

    this.isEditing = true;

    this.currentModelId =
      Number(model.id);


    this.formName =
      model.name;


    this.formCode =
      model.code;


    this.formPieces =
      Number(model.pieces);


    this.formPrice =
      Number(
        model.price ?? 0
      );


    this.formColors =
      this.normalizeColors(
        model.colors
      );


    this.formNumColors =
      this.formColors.length;


    this.formImage =
      model.image
        ? this.getImageUrl(
            model.image
          )
        : '';


    this.selectedImageFile = null;

    this.errorMessage = '';

    this.showModal = true;

  }


  // =========================================================
  // Close Modal
  // =========================================================

  closeModal(): void {

    if (this.isSaving) {
      return;
    }


    this.showModal = false;

    this.resetForm();

  }


  // =========================================================
  // Number Of Colors
  // =========================================================

  onNumColorsChange(): void {

    const count =
      Number(
        this.formNumColors
      ) || 0;


    if (count <= 0) {

      this.formColors = [];

      this.formNumColors = 0;

      return;
    }


    const newColors =
      [
        ...this.formColors
      ];


    while (
      newColors.length <
      count
    ) {

      newColors.push('');

    }


    if (
      newColors.length >
      count
    ) {

      newColors.length =
        count;
    }


    this.formColors =
      newColors;

  }


  // =========================================================
  // Select Image
  // =========================================================

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      this.errorMessage =
        'prd_error_image_invalid';

      this.selectedImageFile =
        null;

      this.cdr.detectChanges();

      return;

    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      this.errorMessage =
        'prd_error_image_size';

      this.selectedImageFile =
        null;

      this.cdr.detectChanges();

      return;

    }


    this.errorMessage = '';

    this.selectedImageFile =
      file;


    const reader =
      new FileReader();


    reader.onload = () => {

      this.formImage =
        reader.result as string;

      this.cdr.detectChanges();

    };


    reader.onerror = () => {

      this.errorMessage =
        'prd_error_image_read';

      this.cdr.detectChanges();

    };


    reader.readAsDataURL(
      file
    );


    this.cdr.detectChanges();

  }


  // =========================================================
  // Remove Image
  // =========================================================

  removeImage(): void {

    this.formImage = '';

    this.selectedImageFile =
      null;

    this.errorMessage = '';

    this.cdr.detectChanges();

  }


  // =========================================================
  // Save Model
  // POST / PATCH
  // =========================================================

  saveModel(): void {

    this.cdr.detectChanges();

    this.errorMessage = '';


    // =======================================================
    // Validation
    // =======================================================

    const name =
      this.formName.trim();


    const code =
      this.formCode.trim();


    const pieces =
      Number(
        this.formPieces
      );


    const price =
      Number(
        this.formPrice
      );


    if (!name) {

      this.errorMessage =
        'prd_error_name';

      return;
    }


    if (
      !code ||
      !/^\d+$/.test(code)
    ) {

      this.errorMessage =
        'prd_error_code_integer';

      return;
    }


    if (
      !Number.isInteger(
        Number(code)
      ) ||
      Number(code) <= 0
    ) {

      this.errorMessage =
        'prd_error_code_positive';

      return;
    }


    if (
      this.formPieces === null ||
      !Number.isFinite(pieces) ||
      pieces <= 0
    ) {

      this.errorMessage =
        'prd_error_pieces';

      return;
    }


    if (
      this.formPrice === null ||
      !Number.isFinite(price) ||
      price < 0
    ) {

      this.errorMessage =
        'prd_error_price';

      return;
    }


    const cleanedColors =
      this.formColors
        .map(
          color =>
            color.trim()
        )
        .filter(
          color =>
            color.length > 0
        );


    // =======================================================
    // Form Data
    // =======================================================

    const formData =
      new FormData();


    formData.append(
      'modelName',
      name
    );


    formData.append(
      'modelCode',
      String(
        Number(code)
      )
    );


    formData.append(
      'price',
      String(price)
    );


    formData.append(
      'availablePieces',
      String(pieces)
    );


    formData.append(
      'colors',
      cleanedColors.join(',')
    );


    // New image only

    if (
      this.selectedImageFile
    ) {

      formData.append(
        'image',
        this.selectedImageFile
      );

    }


    this.isSaving = true;


    // =======================================================
    // Update
    // PATCH /api/products/code/:modelCode
    // =======================================================

    if (
      this.isEditing &&
      this.currentModelId !== null
    ) {

      const modelCode =
        this.currentModelId;


      this.api
        .patch<ProductResponse>(
          `${this.productsEndpoint}/code/${modelCode}`,
          formData
        )
        .subscribe({

          next: (response) => {

            if (
              !response?.success ||
              !response.data
            ) {

              this.errorMessage =
                response?.message ||
                'prd_error_save_changes';

              this.isSaving = false;

              this.cdr.detectChanges();

              return;

            }


            const updatedModel =
              this.mapBackendProduct(
                response.data
              );


            this.models =
              this.models.map(
                model =>
                  model.id === modelCode
                    ? updatedModel
                    : model
              );


            this.isSaving = false;

            this.closeModal();

            this.cdr.detectChanges();

          },


          error: (error) => {

            console.error(
              'Update product error:',
              error
            );


            this.errorMessage =
              this.getApiErrorMessage(
                error,
                'prd_error_update'
              );


            this.isSaving = false;

            this.cdr.detectChanges();

          }

        });


      return;
    }


    // =======================================================
    // Add
    // POST /api/products
    // =======================================================

    this.api
      .post<ProductResponse>(
        this.productsEndpoint,
        formData
      )
      .subscribe({

        next: (response) => {

          if (
            !response?.success ||
            !response.data
          ) {

            this.errorMessage =
              response?.message ||
              'prd_error_add';

            this.isSaving = false;

            this.cdr.detectChanges();

            return;

          }


          const newModel =
            this.mapBackendProduct(
              response.data
            );


          this.models = [
            newModel,
            ...this.models
          ];


          this.isSaving = false;

          this.closeModal();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Create product error:',
            error
          );


          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'prd_error_add_generic'
            );


          this.isSaving = false;

          this.cdr.detectChanges();

        }

      });

  }


  // =========================================================
  // Delete Confirm
  // =========================================================

  openDeleteConfirm(
    id: number
  ): void {

    this.deleteTargetId =
      Number(id);

    this.showDeleteModal = true;

  }


  // =========================================================
  // Delete Product
  // DELETE /api/products/code/:modelCode
  // =========================================================

  confirmDelete(): void {

    if (
      this.deleteTargetId ===
      null
    ) {

      return;
    }


    const modelCode =
      this.deleteTargetId;


    this.api
      .delete<DeleteProductResponse>(
        `${this.productsEndpoint}/code/${modelCode}`
      )
      .subscribe({

        next: (response) => {

          if (
            !response?.success
          ) {

            this.errorMessage =
              response?.message ||
              'prd_error_delete';

            this.showDeleteModal =
              false;

            this.deleteTargetId =
              null;

            this.cdr.detectChanges();

            return;

          }


          this.models =
            this.models.filter(
              model =>
                model.id !==
                modelCode
            );


          this.deleteTargetId =
            null;

          this.showDeleteModal =
            false;

          this.errorMessage = '';

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Delete product error:',
            error
          );


          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'prd_error_delete_generic'
            );


          this.deleteTargetId =
            null;

          this.showDeleteModal =
            false;

          this.cdr.detectChanges();

        }

      });

  }


  // =========================================================
  // Cancel Delete
  // =========================================================

  cancelDelete(): void {

    this.deleteTargetId =
      null;

    this.showDeleteModal =
      false;

  }


  // =========================================================
  // Image URL
  // =========================================================

  getImageUrl(
    image?: string
  ): string {

    if (!image) {
      return '';
    }


    if (
      image.startsWith(
        'http://'
      ) ||
      image.startsWith(
        'https://'
      )
    ) {

      return image;

    }


    if (
      image.startsWith('/')
    ) {

      return `${this.backendBaseUrl}${image}`;

    }


    return `${this.backendBaseUrl}/${image}`;

  }


  // =========================================================
  // Date
  // =========================================================

  private formatDate(
    date: string
  ): string {

    if (!date) {
      return '';
    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return date;

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


  // =========================================================
  // API Error
  // =========================================================

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


  // =========================================================
  // Reset Form
  // =========================================================

  private resetForm(): void {

    this.formName = '';

    this.formCode = '';

    this.formPieces = null;

    this.formPrice = null;

    this.formNumColors =
      null;

    this.formColors = [];

    this.formImage = '';

    this.selectedImageFile =
      null;

    this.errorMessage = '';

  }

}