import api from '../../../../services/api'

export const getData = async (endpoint) => {
  const res = await api.get(endpoint)
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
}

export const createData = async (endpoint, data) => {
  const res = await api.post(endpoint, data)
  return res.data
}

export const updateData = async (endpoint, id, data) => {
  const res = await api.put(`${endpoint}/${id}`, data)
  return res.data
}

export const deleteData = async (endpoint, id) => {
  const res = await api.delete(`${endpoint}/${id}`)
  return res.data
}