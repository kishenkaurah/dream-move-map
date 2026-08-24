import { z } from "zod";

/**
 * Minimum details needed to arrange a planning call. Deliberately excludes any
 * financial or health information.
 */
export const bookingRequestSchema = z.object({
  offerSlug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1, { message: "Please enter your name" }).max(100),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255),
  timezone: z.string().trim().min(1, { message: "Please enter your timezone" }).max(80),
  preferredTimes: z
    .string()
    .trim()
    .min(1, { message: "Tell us a couple of windows that suit you" })
    .max(500),
  helpWith: z.string().trim().max(1000).optional(),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
