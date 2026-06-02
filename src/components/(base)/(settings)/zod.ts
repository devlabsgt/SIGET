import { z } from "zod";

export const appSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  require_device_authorization: z.boolean().default(false),
  enable_passkeys: z.boolean().default(false),
  manual_usuario_url: z.string().nullable().optional(),
});

export type AppSettingsUpdate = z.infer<typeof appSettingsSchema>;