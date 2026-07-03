type EmptyStateProps = {
    title: string;
    description?: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div
            role="status"
            style={{
                marginTop: '1rem',
                padding: '2rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                textAlign: 'center',
                color: '#555',
            }}
        >
            <strong>{title}</strong>
            {description && (
                <p style={{ marginTop: '0.5rem' }}>
                    {description}
                </p>
            )}
        </div>
    );
}