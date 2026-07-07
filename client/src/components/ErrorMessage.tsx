type ErrorMessageProps = {
    message: string;
};

export default function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) {
        return null;
    }

    return (
        <div className="alert alert-danger" role="alert">
            {message}
        </div>
    );
}