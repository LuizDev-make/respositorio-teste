import React, { useState, useEffect } from 'react';
import { Input, InputProps } from './Input';

interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChangeText'> {
  value: number; // in cents
  onChangeValue: (cents: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = React.memo(({
  value,
  onChangeValue,
  ...rest
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Fallback inline formatter
  const formatMoney = (cents: number) => {
    const amount = (cents / 100).toFixed(2);
    const [intPart, decimalPart] = amount.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${formattedInt},${decimalPart}`;
  };

  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatMoney(value));
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    const numericText = text.replace(/\D/g, '');
    
    if (numericText === '') {
      onChangeValue(0);
      setDisplayValue(formatMoney(0));
      return;
    }

    const cents = parseInt(numericText, 10);
    onChangeValue(cents);
    setDisplayValue(formatMoney(cents));
  };

  return (
    <Input
      value={displayValue}
      onChangeText={handleChangeText}
      keyboardType="numeric"
      {...rest}
    />
  );
});
