/**
 * DateTimeUtils.js
 * Helpers for formatting dates and times across the app.
 */

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const activityDate = new Date(date);
  const diff = now - activityDate;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return activityDate.toLocaleDateString();
  if (days > 1) return `${days} days ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 30) return `${seconds} seconds ago`;
  return 'Just now';
};
