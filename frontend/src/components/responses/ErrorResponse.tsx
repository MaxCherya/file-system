const ErrorResponse: React.FC<{ error: Error }> = ({ error }) => {
    return <div className="text-red-500">Error: {(error as Error).message}</div>
}

export default ErrorResponse;