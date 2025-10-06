'use client'

import React, { useState } from "react";

interface Props {
    icon: string;
    hoverIcon: string;
    title: string;
    onClick?: () => void;
}

const ListComponent: React.FC<Props> = ({ icon, hoverIcon, title, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="border-b-[0.5px] border-t-[0.5px] hover:text-white hover:bg-blue-600 cursor-pointer w-full p-2 flex flex-row gap-4 items-center transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <img src={isHovered ? hoverIcon : icon} className="w-5 h-5" />
            <p>{title}</p>
        </div>
    );
};

export default ListComponent;