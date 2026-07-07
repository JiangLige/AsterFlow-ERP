type EmptyStateProps = {
    title: string;
    description?: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="empty-state" role="status">
            <strong>{title}</strong>
            {description && <p className="muted">{description}</p>}
        </div>
    );
}