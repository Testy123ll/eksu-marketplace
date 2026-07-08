export function getCourseCode(id: string, category: string, type?: string): string {
  let prefix = 'GEN'
  const cat = (category || '').toLowerCase()
  const t = (type || '').toLowerCase()

  if (cat.includes('textbook') || cat.includes('education')) {
    prefix = 'TXB'
  } else if (cat.includes('electronic') || cat.includes('laptop') || cat.includes('phone')) {
    prefix = 'ELC'
  } else if (cat.includes('accommodation') || cat.includes('hostel') || cat.includes('sublet') || t === 'accommodation') {
    prefix = 'ACM'
  } else if (
    cat.includes('academic') ||
    cat.includes('creative') ||
    cat.includes('service') ||
    cat.includes('tech') ||
    cat.includes('tutorial') ||
    cat.includes('photo') ||
    cat.includes('video') ||
    cat.includes('transport') ||
    t === 'service'
  ) {
    prefix = 'SVC'
  } else if (
    cat.includes('clothing') ||
    cat.includes('accessories') ||
    cat.includes('fashion') ||
    cat.includes('apparel') ||
    cat.includes('shoes')
  ) {
    prefix = 'FSH'
  } else if (cat.includes('furniture')) {
    prefix = 'FTR'
  } else if (cat.includes('sport')) {
    prefix = 'SPT'
  } else if (cat.includes('food') || cat.includes('drink') || cat.includes('grocery')) {
    prefix = 'FDN'
  } else if (cat.includes('health') || cat.includes('beauty') || cat.includes('cosmetic')) {
    prefix = 'HLT'
  }

  // Generate a deterministic 3-digit number from UUID
  let hash = 0
  if (id) {
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
  }
  const num = Math.abs(hash % 900) + 100 // Range 100 - 999
  return `${prefix}-${num}`
}
