"use client";
 
// import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  // FormDescription,
  FormField,
  FormItem,
  // FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
 
// const DISCORD_OAUTH = 'https://discord.com/api/oauth2/authorize?client_id=824046366639783945&redirect_uri=https%3A%2F%2Fapi.byscuitbros.com%2Fauthorize&response_type=code&scope=identify%20guilds%20email';
const DISCORD_OAUTH = 'https://discord.com/api/oauth2/authorize?client_id=824046366639783945&redirect_uri=http%3A%2F%2Flocalhost:3000%2Fauthorize&response_type=code&scope=identify%20guilds%20email';

const formSchema = z.object({
  username: z.string().min(1, {message: 'Username is required'}),
  password: z.string().min(1, {message: 'Password is required'}),
});

export default function Login() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    },
  });
 
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    // eslint-disable-next-line no-console
    console.log(values);
  };
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-2 py-4 md:p-24'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 p-4 bg-secondary/25 rounded-lg w-full lg:w-1/4'>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input className='bg-input' placeholder='Username' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type='password' className='bg-input' placeholder='Password' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button variant={'outline'} size={'full'} type="submit">Login</Button>
          <hr />
          <div className='flex items-center justify-between'>
            <Link href={DISCORD_OAUTH}><small>Discord Login</small></Link>
            <Link href={'/register'}><small>Create account</small></Link>
            <Link href={'/'}><small>Forgot Password</small></Link>
          </div>
        </form>
      </Form>
    </main>
  );
}
