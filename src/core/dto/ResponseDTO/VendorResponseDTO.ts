export interface VendorResponseDTO {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  active: boolean;

  warehouseId: {
    id: string;
    name: string;
  } | null;

  salespersonId?: {
    id: string;
    name: string;
  }[];

  salespersonCount?: number;

  orderCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
