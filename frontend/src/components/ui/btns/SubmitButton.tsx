/*
    This component is used for
    submit buttons throughtou the app.
    It is not recommended to use it as modal or something else than
    submitting a form.
*/

const SubmitButton: React.FC<{ onClick?: () => void; label: string; className?: string, isSubmitting: boolean, loadLabel: string; }> = ({ onClick, label, className = "", loadLabel, isSubmitting }) => {
    return (
        <button
            type="submit"
            className={`bg-green-600 p-2 text-white rounded-lg hover:bg-green-700 transition duration-300 cursor-pointer ${className}`}
            disabled={isSubmitting}
            onClick={onClick}
        >
            {isSubmitting ? loadLabel : label}
        </button>
    );
}

export default SubmitButton;