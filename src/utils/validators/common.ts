import { z } from "zod";

export const idSchema = z.string().min(1);

export const moneySchema = z.number().min(0);

export const optionalTextSchema = z.string().trim().max(500).optional();
