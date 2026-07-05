export const ESTADOS_ROYA = ['Sano', 'Bajo', 'Medio', 'Alto', 'Critico']

export const ESTADO_COLORS = {
  Sano: '#2e7d32',
  Bajo: '#fbc02d',
  Medio: '#f57c00',
  Alto: '#d32f2f',
  Critico: '#6a1b9a',
}

export const ESTADO_ICONS = {
  Sano: '🟢',
  Bajo: '🟡',
  Medio: '🟠',
  Alto: '🔴',
  Critico: '💀',
}

export const normalizarEstado = (nombre) => {
  if (!nombre) return 'Sano'
  const n = nombre.toLowerCase().trim()
  if (n.includes('sano')) return 'Sano'
  if (n.includes('bajo')) return 'Bajo'
  if (n.includes('medio')) return 'Medio'
  if (n.includes('alto')) return 'Alto'
  if (n.includes('critico') || n.includes('crítico')) return 'Critico'
  return 'Sano'
}
