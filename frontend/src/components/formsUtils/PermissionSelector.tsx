'use client';

import { PERM, PermissionKey } from '@/constants/backend';
import React, { useMemo, useState } from 'react';

interface Props {
    value?: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
    disabled?: boolean;
}

/**
 * Reusable permission selector.
 * - Displays checkboxes for READ, WRITE, DELETE, ADMIN
 * - Returns bitmask (0–15) via onChange callback
 */
const PermissionSelector: React.FC<Props> = ({
    value,
    defaultValue = PERM.READ | PERM.WRITE | PERM.DELETE,
    onChange,
    disabled = false,
}) => {
    const [local, setLocal] = useState<number>(value ?? defaultValue);

    React.useEffect(() => {
        if (value !== undefined) setLocal(value);
    }, [value]);

    const isChecked = (key: PermissionKey) => (local & PERM[key]) === PERM[key];

    const toggle = (key: PermissionKey) => {
        const newMask = isChecked(key) ? local & ~PERM[key] : local | PERM[key];
        setLocal(newMask);
        onChange?.(newMask);
    };

    const activeFlags = useMemo(
        () =>
            (Object.keys(PERM) as PermissionKey[]).filter((k) =>
                isChecked(k)
            ),
        [local]
    );

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">
                Permissions
            </p>

            <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PERM) as PermissionKey[]).map((key) => (
                    <label
                        key={key}
                        className={`flex items-center cursor-pointer gap-2 rounded-lg border border-gray-300 p-2 hover:bg-gray-50 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                        <input type="checkbox" checked={isChecked(key)} onChange={() => toggle(key)} disabled={disabled} />
                        <span className="text-sm">{key}</span>
                    </label>
                ))}
            </div>

            <div className="text-xs text-gray-500">
                Active: {activeFlags.join(', ') || 'None'}
                <span className="ml-2">Mask: <span className="font-mono">{local}</span></span>
            </div>
        </div>
    );
};

export default PermissionSelector;