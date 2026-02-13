/**
 * Format a timestamp into a user-friendly "last seen" string
 * @param {Date|string} timestamp - The last seen timestamp
 * @returns {string} - Formatted last seen string
 */
export const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Last seen recently";

    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Less than 1 minute
    if (diffMins < 1) {
        return "Last seen just now";
    }

    // Less than 1 hour
    if (diffMins < 60) {
        return `Last seen ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than 24 hours
    if (diffHours < 24) {
        return `Last seen ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
        lastSeen.getDate() === yesterday.getDate() &&
        lastSeen.getMonth() === yesterday.getMonth() &&
        lastSeen.getFullYear() === yesterday.getFullYear()
    ) {
        return `Last seen yesterday at ${lastSeen.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`;
    }

    // Less than 7 days (show day name and time)
    if (diffDays < 7) {
        return `Last seen ${lastSeen.toLocaleDateString('en-US', { weekday: 'long' })} at ${lastSeen.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`;
    }

    // More than 24 hours - show full date with month and year
    return `Last seen ${lastSeen.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })} at ${lastSeen.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })}`;
};
