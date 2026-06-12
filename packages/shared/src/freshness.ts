export function formatRelativeMinutes(updatedAt: string) {
  const minutesAgo = Math.max(
    0,
    Math.round((Date.now() - new Date(updatedAt).getTime()) / 60_000),
  );

  if (minutesAgo === 0) {
    return "updated just now";
  }

  if (minutesAgo === 1) {
    return "updated 1 minute ago";
  }

  return `updated ${minutesAgo} minutes ago`;
}
