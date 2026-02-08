/**
 * Zod schemas for runtime validation of parsed tool results.
 * These mirror the interfaces in types.ts and are used for data validation.
 */
import { z } from "zod/v4";

export const ParsedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().optional(),
  mrp: z.number().optional(),
  image: z.string().optional(),
  brand: z.string().optional(),
  quantity: z.string().optional(),
  available: z.boolean().optional(),
  description: z.string().optional(),
});

export const ParsedRestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisine: z.string().optional(),
  rating: z.number().optional(),
  priceForTwo: z.string().optional(),
  image: z.string().optional(),
  address: z.string().optional(),
  offers: z.array(z.string()).optional(),
  locality: z.string().optional(),
});

export const ParsedTimeSlotSchema = z.object({
  time: z.string(),
  available: z.boolean(),
});

export const ParsedAddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const ParsedStatusSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const ParsedInfoEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.string().optional(),
});

export const CartStateSchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
});
