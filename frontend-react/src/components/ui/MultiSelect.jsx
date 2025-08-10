import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const MultiSelect = ({ options, values, onChange, placeholder = 'Select...', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const selectedLabels = options.filter(opt => values.includes(opt.value)).map(opt => opt.label).join(', ');

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'ring-2 ring-blue-500',
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={values.length ? '' : 'text-muted-foreground'}>
          {selectedLabels || placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center px-2 py-1 cursor-pointer hover:bg-accent rounded">
              <input
                type="checkbox"
                checked={values.includes(opt.value)}
                onChange={() => handleToggle(opt.value)}
                className="mr-2 accent-blue-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
