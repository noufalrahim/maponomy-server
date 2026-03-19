import { z } from "zod";
import { OrderStatus } from "../../../types";

export const createOrderRequestSchema = z.object({
    vendorId: z.string().min(1),
    deliveryDate: z.coerce.date(),
    deliveryStartTime: z.string(),
    deliveryEndTime: z.string(),
    warehouseId: z.string().optional(),
    status: z.enum([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
        OrderStatus.DELIVERED
    ]),
    createdBy: z.string().min(1),
    orderItems: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.number(),
        unitPrice: z.number(),
        serviceTime: z.number().optional(),
    })),
}).strict();

export const updateOrderRequestSchema = z.object({
    id: z.string().min(1),
    vendorId: z.string().optional(),
    deliveryDate: z.coerce.date().optional(),
    deliveryStartTime: z.string().optional(),
    deliveryEndTime: z.string().optional(),
    warehouseId: z.string().optional(),
    status: z.enum([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
        OrderStatus.DELIVERED
    ]).optional(),
    createdBy: z.string().min(1).optional(),
    orderItems: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.number(),
        unitPrice: z.number(),
        serviceTime: z.number().optional(),
    })).optional(),
}).strict();

export type CreateOrderRequestDTO = z.infer<typeof createOrderRequestSchema>;
export type UpdateOrderRequestDTO = z.infer<typeof updateOrderRequestSchema>;
