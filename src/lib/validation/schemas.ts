import { z } from "zod";

// Bangladeshi phone regex: 013 to 019 followed by 8 digits (total 11 digits)
export const bdPhoneRegex = /^01[3-9]\d{8}$/;

export const checkoutFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(bdPhoneRegex, "Enter a valid 11-digit Bangladeshi phone number (e.g., 01712345678)"),
  address: z.string().min(5, "Please enter your full delivery address (house/road/holding)"),
  area: z.string().min(1, "Please select an area"),
  instructions: z.string().optional(),
  paymentMethod: z.enum(["cod", "online"]).default("cod"),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const cakeBookingSchema = z.object({
  sizeId: z.string().min(1, "Please select a cake size"),
  flavorId: z.string().min(1, "Please select a flavor"),
  customMessage: z.string().max(60, "Message on cake must be within 60 characters").optional(),
  deliveryDate: z.string().min(1, "Please select requested delivery date").refine((dateStr) => {
    const selected = new Date(dateStr);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2); // 2 days advance minimum
    minDate.setHours(0, 0, 0, 0);
    return selected >= minDate;
  }, "Cake requires at least 2 days advance booking"),
  specialInstructions: z.string().max(200).optional(),
});

export type CakeBookingFormData = z.infer<typeof cakeBookingSchema>;

export const loginSchema = z.object({
  phone: z.string().regex(bdPhoneRegex, "Enter valid 11-digit phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(bdPhoneRegex, "Enter valid 11-digit phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z
  .object({
    phone: z.string().regex(bdPhoneRegex, "Enter valid 11-digit phone number"),
    otp: z.string().length(6, "Enter the 6-digit OTP code"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
