import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Select = ({ children, value, onValueChange, defaultValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (itemValue, itemLabel) => {
    setSelectedValue(itemValue);
    setSelectedLabel(itemLabel);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(itemValue);
    }
  };

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          isOpen,
          setIsOpen,
          selectedValue,
          selectedLabel,
          onSelect: handleSelect
        })
      )}
    </div>
  );
};

const SelectTrigger = ({ className, children, isOpen, setIsOpen, ...props }) => {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen && setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
    </button>
  );
};

const SelectValue = ({ placeholder, selectedValue, selectedLabel }) => {
  return (
    <span className={selectedValue ? "" : "text-muted-foreground"}>
      {selectedLabel || selectedValue || placeholder}
    </span>
  );
};

const SelectContent = ({ className, children, isOpen, onSelect, selectedValue }) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { onSelect, selectedValue })
      )}
    </div>
  );
};

const SelectItem = ({ className, children, value, onSelect, selectedValue }) => {
  const isSelected = selectedValue === value;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => onSelect && onSelect(value, children)}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
