import { Component, computed, effect, signal } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  products: Product[] = [
    {
      id: 1,
      name: 'Laptop',
      price: 25000
    },
    {
      id: 2,
      name: 'Phone',
      price: 15000
    },
    {
      id: 3,
      name: 'Headphones',
      price: 2500
    },
    {
      id: 4,
      name: 'Keyboard',
      price: 1200
    }
  ];

  cart = signal<Product[]>([]);

  totalPrice = computed(() =>
    this.cart().reduce(
      (sum, product) => sum + product.price,
      0
    )
  );

  constructor() {
    effect(() => {
      console.log(`Cart items count: ${this.cart().length}`);
    });
  }

  addToCart(product: Product): void {
    this.cart.update(currentCart => [
      ...currentCart,
      product
    ]);
  }

  removeFromCart(productId: number): void {
    this.cart.update(currentCart =>
      currentCart.filter(product => product.id !== productId)
    );
  }

  clearCart(): void {
    this.cart.set([]);
  }
}