
import api from "../../services/api";

export const getPrioridades = async () => {
  const response = await api.get("/cat_prioridades");
  return response.data;
};

export const createPrioridad = async (data) => {
  const response = await api.post(
    "/cat_prioridades",
    data
  );

  return response.data;
};

export const deletePrioridad = async (id) => {
  const response = await api.delete(
    `/cat_prioridades/${id}`
  );

  return response.data;
};