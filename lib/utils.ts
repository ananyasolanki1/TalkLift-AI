export const formatPrettyDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const suffix = (d: number) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return `${day}${suffix(day)} ${month} ${year}, ${time}`;
    } catch (e) {
        return dateStr;
    }
};
