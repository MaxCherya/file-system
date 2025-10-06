/*
    Switch button is used only
    for toggling scenarious.
    It has two states: active and inactive.
    When active, it is not clickable and has a different style.
    When inactive, it is clickable and has a different style.
*/

const SwitchButton: React.FC<{ onClick?: () => void; label: string; className?: string, isActive: boolean }> = ({ onClick, label, className = "", isActive }) => {

    const handleClick = () => {
        if (!isActive && onClick) {
            onClick();
        }
    }

    return (
        <button onClick={handleClick} className={`${isActive ? 'bg-blue-600' : 'bg-gray-400'} 
            p-2 text-white rounded-lg ${isActive ? 'hover:bg-blue-700' : 'hover:bg-gray-500'} 
            ${isActive ? 'cursor-not-allowed' : 'cursor-pointer'}  
            transition duration-300 ${className}`
        }>
            {label}
        </button>
    );
}

export default SwitchButton;