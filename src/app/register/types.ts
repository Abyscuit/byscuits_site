import * as z from 'zod';

export const formSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  email: z.string().email({ message: 'Email is not valid' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
});

export type RegisterForm = z.infer<typeof formSchema>; 