'use client';
import { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  // FormDescription,
  FormField,
  FormItem,
  // FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { markdown } from '@/lib/markdown';
import { Textarea } from '@/components/ui/textarea';

const models = [
  {
    value: 'gpt-4o',
    label: 'ChatGPT 4',
  },
  {
    value: 'chatgpt-4o-latest',
    label: 'ChatGPT 4 latest',
  },
  {
    value: 'gpt-4o-mini',
    label: 'ChatGPT 4 Mini',
  },
  {
    value: 'gpt-4-turbo',
    label: 'ChatGPT 4 Turbo',
  },
  {
    value: 'gpt-3.5-turbo',
    label: 'ChatGPT 3.5 Turbo',
  },
];

const formSchema = z.object({
  prompt: z.string().min(1, { message: 'Prompt cannot be empty' }),
});

export default function AI() {
  const [output, setOutput] = useState('Enter a prompt below');
  const [loading, setLoading] = useState(false);
  const selectedModel = useRef(models[0].value);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const prompt = encodeURI(values.prompt);
    fetch(
      `http://localhost:8000/gpt?prompt=${prompt}&model=${selectedModel.current}`
    )
      .then(data => {
        data.json().then(d => {
          const content = d['choices'][0]['message']['content']; // Refactor this
          const rendered = markdown.render(content);
          setOutput(rendered);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }

  return (
    <main className='flex min-h-screen flex-col items-center p-2 py-4 md:px-24'>
      <div className='text-center pb-4'>
        <h2 className='scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>
          ChatGPT 4
        </h2>
        <p className='text-sm text-muted-foreground'>
          Send a prompt to ChatGPT!
        </p>
        <Combobox
          values={models}
          placeholder='Select a model'
          emptyValue='No model found.'
          defaultValue={models[0].value}
          selectedValue={selectedModel}
        />
      </div>
      <div
        className='space-y-4 p-4 bg-secondary/25 rounded-lg w-full mb-4 overflow-x-auto text-sm 2xl:w-5/6'
        dangerouslySetInnerHTML={{ __html: output }}></div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 p-4 bg-secondary/25 rounded-lg w-full 2xl:w-5/6'>
          <FormField
            control={form.control}
            name='prompt'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    className='bg-input'
                    placeholder='Prompt'
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
            type='submit'
            disabled={!form.formState.isValid || loading}>
            {loading ? 'Waiting for response...' : 'Send'}
          </Button>
        </form>
      </Form>
    </main>
  );
}
