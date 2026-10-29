import { z } from "zod";

export const personalization = {
  maxLength: 16,
  allowedCharacters: /^[A-Z0-9 ._-]+$/,
  help: "Use letters, numbers, spaces, full stops, hyphens or underscores.",
} as const;

export function normalizeJerseyName(value: string) {
  return value.normalize("NFKC").toUpperCase().replace(/\s+/g, " ").trim();
}

export const jerseyNameSchema = z
  .string()
  .max(128)
  .transform(normalizeJerseyName)
  .pipe(
    z
      .string()
      .min(1, "Enter the name to print on your jersey.")
      .max(
        personalization.maxLength,
        `Use ${personalization.maxLength} characters or fewer.`,
      )
      .regex(personalization.allowedCharacters, personalization.help),
  );

export const cartItemSchema = z
  .object({
    variantId: z.enum(["black", "white"]),
    size: z.string().trim().min(1, "Choose a size.").max(40),
    printedName: jerseyNameSchema,
    quantity: z.number().int().min(1).max(5),
  })
  .strict();

export const checkoutInputSchema = z
  .object({
    items: z.array(cartItemSchema).min(1).max(20),
    idempotencyKey: z.string().uuid(),
    termsAccepted: z.literal(true),
  })
  .strict();

export type CartSelection = z.infer<typeof cartItemSchema>;
