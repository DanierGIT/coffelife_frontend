import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#d32f2f' }}>Error al cargar la página</h2>
          <p style={{ color: '#666' }}>{this.state.error?.message || 'Error desconocido'}</p>
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', color: '#1976d2' }}>Ver detalle técnico</summary>
            <pre style={{ fontSize: 12, marginTop: 8, background: '#f5f5f5', padding: 12, borderRadius: 8, overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '8px 24px', background: '#097300', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
