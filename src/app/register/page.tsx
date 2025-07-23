'use client';

// import Link from "next/link";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  // FormDescription,
  FormField,
  FormItem,
  // FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { formSchema, type RegisterForm } from './types';

export default function Register() {
  // 1. Define your form.
  const form = useForm<RegisterForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: RegisterForm) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    // eslint-disable-next-line no-console
    console.log(values);
  }
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-2 py-4 md:p-24'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 p-4 bg-secondary/25 rounded-lg w-full lg:w-1/4'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className='bg-input'
                    type='email'
                    placeholder='Email'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className='bg-input'
                    placeholder='Username'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type='password'
                    className='bg-input'
                    placeholder='Password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            variant={'outline'}
            size={'full'}
            type='submit'>
            Register
          </Button>
        </form>
      </Form>
    </main>
  );
}
