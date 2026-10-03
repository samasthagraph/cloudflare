export function getCleanAudioUrl(url: string) {
  if (!url) return '';
  if (url.includes('/https%3A%2F%2F')) {
    const parts = url.split('/https%3A%2F%2F');
    return 'https://' + decodeURIComponent(parts[1]);
  }
  if (url.includes('/http%3A%2F%2F')) {
    const parts = url.split('/http%3A%2F%2F');
    return 'http://' + decodeURIComponent(parts[1]);
  }
  return url;
}
