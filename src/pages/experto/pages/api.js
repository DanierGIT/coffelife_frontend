const API = "http://localhost:3333";

// =========================
// GET
// =========================
export const getExpertos = async () => {
  const res = await fetch(`${API}/expertos`);
  const data = await res.json();
  return data.data || data;
};

// =========================
// POST
// =========================
export const createExperto = async (data) => {
  const res = await fetch(`${API}/expertos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

// =========================
// PUT
// =========================
export const updateExperto = async (id, data) => {
  const res = await fetch(`${API}/expertos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

// =========================
// DELETE
// =========================
export const deleteExperto = async (id) => {
  const res = await fetch(`${API}/expertos/${id}`, {
    method: "DELETE",
  });

  return res.json();
};