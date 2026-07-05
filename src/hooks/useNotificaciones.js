import { useEffect, useState } from 'react'
import { conectarWebSocket, onNotificacion, getEstadoWS } from '../services/websocket'

const listenersGlobal = new Set()
const POLL_INTERVAL = 15000

export function emitirRefetchGlobal() {
  listenersGlobal.forEach((cb) => cb())
}

export function useRefetchGlobal() {
  const [key, setKey] = useState(0)

  useEffect(() => {
    const handler = () => setKey((k) => k + 1)
    listenersGlobal.add(handler)
    return () => listenersGlobal.delete(handler)
  }, [])

  return key
}

export function useNotificaciones(idUsuario) {
  const [notificacionKey, setNotificacionKey] = useState(0)

  useEffect(() => {
    if (!idUsuario) return
    const limpiar = onNotificacion(() => {
      setNotificacionKey((k) => k + 1)
      emitirRefetchGlobal()
    })
    conectarWebSocket(idUsuario)

    const interval = setInterval(() => {
      if (!getEstadoWS().conectado) {
        setNotificacionKey((k) => k + 1)
        emitirRefetchGlobal()
      }
    }, POLL_INTERVAL)

    return () => {
      limpiar()
      clearInterval(interval)
    }
  }, [idUsuario])

  return notificacionKey
}
