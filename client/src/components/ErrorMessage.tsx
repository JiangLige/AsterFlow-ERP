type ErrorMessageProps = {
    message: string;
};

export default function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="alert"
            style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                border: '1px solid #f5c2c7',
                background: '#f8d7da',
                color: '#842029',
                borderRadius: '4px',
            }}
        >
            {message}
        </div>
    );
}