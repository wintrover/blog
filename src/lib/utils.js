export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function truncateText(text, wordLimit = 30) {
  const words = text.replace(/<[^>]*>/g, '').split(/\s+/)
  if (words.length <= wordLimit) return text
  return words.slice(0, wordLimit).join(' ') + '...'
}

export function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-')
}