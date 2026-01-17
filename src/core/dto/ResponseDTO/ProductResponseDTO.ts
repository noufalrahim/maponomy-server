export interface ProductResponseDTO {
  id: string;
  name: string;
  sku: string;
  image: string | null;
  measureUnit: string;
  packageType: string;
  price: string;
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId: { id: string; name: string } | null;
  vendorId?: { id: string; name: string } | null;
}