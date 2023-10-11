"use client";
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
import { useState } from 'react';
import { markdown } from "../../lib/markdown";

const formSchema = z.object({
  prompt: z.string().min(1, {message: 'Prompt cannot be empty'}),
});

export default function AI() {
  const [output, setOutput] = useState('Enter a prompt below');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: ""
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const prompt = encodeURI(values.prompt);
    fetch(`http://localhost:8000/gpt?prompt=${prompt}&model=gpt-4`).then(data => {
      data.json().then(d => {
        const content = d['choices'][0]['message']['content'];
        // eslint-disable-next-line no-console
        console.log(content);
        const rendered = markdown.render(content);
        setOutput(rendered);
      });
    });
  };

  return (
    <main className='flex min-h-screen flex-col items-center p-2 py-4 md:p-24'>
      <div className='text-center pb-4'>
        <h2 className='scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>
          ChatGPT 4
        </h2>
        <p className='text-sm text-muted-foreground'>
          Send a prompt to ChatGPT!
        </p>
      </div>
      <div className='space-y-4 p-4 bg-secondary/25 rounded-lg w-full mb-4 overflow-x-auto text-sm' dangerouslySetInnerHTML={{__html: output}} >
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 p-4 bg-secondary/25 rounded-lg w-full'>
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input className='bg-input' placeholder='Prompt' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button variant={'outline'} size={'full'} type="submit" disabled={!form.formState.isValid}>Send</Button>
        </form>
      </Form>
    </main>
  );
}