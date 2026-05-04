import axios from "axios";

// URL base del backend. Cambia esto si el backend corre en otro puerto u host.
const api = axios.create({
  baseURL: "http://localhost:3333",
  withCredentials: true,
});

export default api;
