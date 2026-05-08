import axios from "axios";

const API_URL = "http://localhost:3333/analisis_ia";

// ==========================
// OBTENER TODOS
// ==========================
export const getAnalisis = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// ==========================
// CREAR
// ==========================
export const createAnalisis = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// ==========================
// ACTUALIZAR
// ==========================
export const updateAnalisis = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

// ==========================
// ELIMINAR
// ==========================
export const deleteAnalisis = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// ==========================
// OBTENER UNO
// ==========================
export const getAnalisisById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};