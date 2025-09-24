import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface OptionSelectorProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  id: string;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({ label, options, value, onChange, id }) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#2c0e0e] border border-[#441c1c] text-white text-sm rounded-lg focus:ring-[#EDCB05] focus:border-[#EDCB05] block w-full p-2.5"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};