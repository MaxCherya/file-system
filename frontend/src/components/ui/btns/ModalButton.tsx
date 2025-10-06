/*
    This component is used for
    modal buttons throughtou the app.
    It is not recommended to use it as submit or something else than
    opening a modal.
*/

const ModalButton: React.FC<{ onClick?: () => void; label: string; className?: string }> = ({ onClick, label, className = "" }) => {
    return (
        <button onClick={onClick} className={`bg-green-600 p-2 text-white rounded-lg hover:bg-green-700 transition duration-300 cursor-pointer ${className}`}>
            {label}
        </button>
    );
}

export default ModalButton;