import { io } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_API_URL || 'https://backend-coffe-lifee-production-191b.up.railway.app'

let socket = null
let notificacionCallbacks = []
let estadoGlobal = { conectado: false, ultimaNotificacion: null }

export function conectarWebSocket(idUsuario) {
  if (socket?.connected) {
    console.log('[WS] Ya conectado, re-emitiendo unirse')
    socket.emit('unirse', idUsuario)
    return socket
  }

  const token = localStorage.getItem('cl_token')
  if (!token) { console.warn('[WS] No hay token'); return null }
  if (!idUsuario) { console.warn('[WS] No hay idUsuario'); return null }

  console.log('[WS] Conectando a', WS_URL, 'con usuario', idUsuario)

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('[WS] Conectado, ID socket:', socket.id)
    estadoGlobal.conectado = true
    socket.emit('unirse', idUsuario)
    console.log('[WS] Emitido unirse:', idUsuario)
  })

  socket.on('notificacion', (data) => {
    console.log('[WS] NOTIFICACIÓN RECIBIDA:', JSON.stringify(data))
    estadoGlobal.ultimaNotificacion = data
    notificacionCallbacks.forEach((cb) => cb(data))
  })

  socket.on('disconnect', (reason) => {
    console.log('[WS] Desconectado:', reason)
    estadoGlobal.conectado = false
  })

  socket.on('connect_error', (err) => {
    console.error('[WS] Error conexión:', err.message)
    estadoGlobal.conectado = false
  })

  return socket
}

export function desconectarWebSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    estadoGlobal.conectado = false
  }
}

export function onNotificacion(callback) {
  notificacionCallbacks.push(callback)
  return () => {
    notificacionCallbacks = notificacionCallbacks.filter((cb) => cb !== callback)
  }
}

export function getSocket() { return socket }

export function getEstadoWS() { return estadoGlobal }
