import { useEffect, useState } from 'react'
import { conectarWebSocket, onNotificacion } from '../services/websocket'

const listenersGlobal = new Set()

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
    return () => limpiar()
  }, [idUsuario])

  return notificacionKey
}
