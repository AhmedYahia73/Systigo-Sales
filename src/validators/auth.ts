import z from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at leas 6 characters long"),
    }),
});

export const hashPasswordSchema = z.object({
    body: z.object({
        password: z.string({ required_error: "Password is required" }).min(1, "Password cannot be empty"),
    }),
});