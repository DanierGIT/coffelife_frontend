/**
 * api.js — Expertos
 * Usa el servicio central (axios + JWT automático) en lugar de fetch desnudo.
 */
import api from '../../../services/api'

export const getExpertos = async () => {
  const res = await api.get('/expertos')
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
}

export const createExperto = async (data) => {
  const res = await api.post('/expertos', data)
  return res.data
}

export const updateExperto = async (id, data) => {
  const res = await api.put(`/expertos/${id}`, data)
  return res.data
}

export const deleteExperto = async (id) => {
  const res = await api.delete(`/expertos/${id}`)
  return res.data
}
