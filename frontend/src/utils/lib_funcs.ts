'use client';

export const toggleFunction = (setVal: React.Dispatch<React.SetStateAction<boolean>>) => {
    setVal(prev => !prev);
};