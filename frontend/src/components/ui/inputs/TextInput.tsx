'use client';

import React from "react";

interface TextInputProps {
    label?: string;
    name?: string;
    type?: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string | null;
    onChange: (value: string) => void;
    className?: string;
}

const TextInput: React.FC<TextInputProps> = ({
    label,
    name,
    type = "text",
    value,
    placeholder,
    disabled = false,
    error = null,
    onChange,
    className = "",
}) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label
                    htmlFor={name}
                    className="text-sm font-medium text-gray-700"
                >
                    {label}
                </label>
            )}
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 transition ${disabled ? "opacity-60 cursor-not-allowed" : "focus:ring-2"
                    } ${error ? "border-red-500 focus:ring-red-500" : ""} ${className}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default TextInput;