import { z } from "zod";
const name = z
  .string()
  .trim()
  .min(1, "Укажите имя и фамилию")
  .max(80)
  .regex(/^[\p{L}\p{M}\s.'’\-]+$/u, "Используйте буквы в имени");
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Проверьте e-mail")
  .max(254);
export const passwordSchema = z
  .string()
  .min(12, "Пароль должен содержать не менее 12 символов")
  .max(128, "Пароль слишком длинный");
const birthDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value + "T00:00:00Z");
    return (
      !isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01" &&
      date <= new Date()
    );
  }, "Проверьте дату рождения");
export const registrationSchema = z
  .object({
    firstName: name,
    lastName: name,
    middleName: z.string().trim().max(80).optional().default(""),
    birthDate,
    email: emailSchema,
    password: passwordSchema,
    requestedRole: z.enum(["STUDENT", "TEACHER"]),
    groupId: z.string().uuid().optional(),
    studentNumber: z.string().trim().min(1).max(30).optional(),
    remember: z.boolean().default(false),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.requestedRole === "STUDENT" && (!v.groupId || !v.studentNumber))
      c.addIssue({
        code: "custom",
        message: "Укажите группу и номер студенческого билета",
      });
  });
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
    remember: z.boolean().default(false),
  })
  .strict();
export const profileSchema = z
  .object({
    firstName: name,
    lastName: name,
    middleName: z.string().trim().max(80).optional().default(""),
  })
  .strict();
export const tokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Некорректная ссылка");
