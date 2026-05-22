import { OrderStatus } from "../../../types";

export interface OrderResponseDTO {
  id: string;
  customer: { id: string; name: string } | null;
  warehouseId?: { id: string; name: string } | null;
  deliveryDate: Date | string;
  status: OrderStatus;
  totalAmount: number | string;
  orderItems: {
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
  orderItemsCount: number;
  salespersonId?: { userId: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrdersBySalespersonResponseDTO {
  id: string;
  customer: { id: string; name: string } | null;
  warehouse?: { id: string; name: string } | null;
  deliveryDate: Date | string;
  status: OrderStatus;
  totalAmount: number | string;
  orderItemsCount: number;
  salesperson?: { userId: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems: {
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
}