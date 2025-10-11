import { z } from "zod";

export const landingPageSchema = z.object({
  hero: z.object({
    title: z.string().min(1, "A title is required"),
    subtitle: z.string().optional(),
  }),
  products: z
    .array(
      z.object({
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        price: z.string().optional(),
        images: z
          .array(
            z.object({
              url: z.string().url({ message: "Invalid URL format." }),
            }),
          )
          .optional(),
        videos: z
          .array(
            z.object({
              url: z.string().url({ message: "Invalid URL format." }),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  services: z
    .array(
      z.object({
        name: z.string().min(1, "Service name is required"),
        description: z.string().optional(),
      }),
    )
    .optional(),
  footer: z.object({
    twitter: z
      .string()
      .url({ message: "Invalid URL format." })
      .optional()
      .or(z.literal("")),
    instagram: z
      .string()
      .url({ message: "Invalid URL format." })
      .optional()
      .or(z.literal("")),
    facebook: z
      .string()
      .url({ message: "Invalid URL format." })
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    hours: z.string().optional(),
    privacyPolicy: z
      .string()
      .url({ message: "Invalid URL format." })
      .optional()
      .or(z.literal("")),
    termsOfService: z
      .string()
      .url({ message: "Invalid URL format." })
      .optional()
      .or(z.literal("")),
  }),
});

export type LandingPageData = z.infer<typeof landingPageSchema>;
