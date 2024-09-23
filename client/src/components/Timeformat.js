const TimeDisplay = ({ datetimeString }) => {
    // Parse the datetime string to a Date object
    const date = new Date(datetimeString);

    // Format the time part
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
    });

    return <span>{formattedTime}</span>;
}

export default TimeDisplay;