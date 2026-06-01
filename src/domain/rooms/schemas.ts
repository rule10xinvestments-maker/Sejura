import { z } from "zod";

export const roomFormSchema = z.object({
  name: z.string().trim().min(2, "Adauga un nume de cel putin 2 caractere."),
  max_guests: z.coerce
    .number({ invalid_type_error: "Adauga numarul maxim de oaspeti." })
    .int("Numarul de oaspeti trebuie sa fie intreg.")
    .min(1, "Camera trebuie sa accepte cel putin un oaspete.")
    .max(30, "Verifica numarul maxim de oaspeti."),
  base_price_per_night: z.coerce
    .number({ invalid_type_error: "Adauga pretul pe noapte." })
    .int("Pretul trebuie sa fie un numar intreg.")
    .min(1, "Pretul pe noapte trebuie sa fie mai mare decat 0."),
  status: z.enum(["active", "inactive"], {
    errorMap: () => ({ message: "Alege statusul camerei." })
  })
});
