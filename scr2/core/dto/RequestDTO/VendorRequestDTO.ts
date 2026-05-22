import { z } from "zod";

export const vendorRequestSchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    phoneNumber: z.string().min(1),
    active: z.boolean().default(true),
    type: z.enum(["external", "own"]),
    warehouseId: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    storeImage: z.string().optional(),
    salespersonId: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
}).strict();

export type VendorRequestDTO = z.infer<typeof vendorRequestSchema>;

export const vendorUpdateSchema = vendorRequestSchema.partial().extend({
    id: z.string().min(1),
});

export type VendorUpdateDTO = z.infer<typeof vendorUpdateSchema>;
