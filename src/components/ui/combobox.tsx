'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type Option = {
  value: string;
  label: string;
};

type Props = {
  placeholder: string;
  defaultValue: string | undefined;
  emptyValue: string;
  values: Option[];
  selectedValue: React.MutableRefObject<string>;
};

export function Combobox({
  placeholder,
  values,
  emptyValue,
  defaultValue,
  selectedValue,
}: Readonly<Props>) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue ?? '');

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-[200px] justify-between'>
          {value
            ? values.find(values => values.value === value)?.label
            : `${placeholder}`}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyValue}</CommandEmpty>
            <CommandGroup>
              {values.map(values => (
                <CommandItem
                  key={values.value}
                  value={values.value}
                  onSelect={currentValue => {
                    setValue(
                      currentValue === value
                        ? (defaultValue ?? '')
                        : currentValue
                    );
                    setOpen(false);
                    selectedValue.current = currentValue;
                  }}>
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === values.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {values.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
