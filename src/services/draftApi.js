import apiClient from "./apiClient.js";

const BASE = "/api/surveyor/sketch-drafts";

function unwrap(res) {
  return res?.data?.data;
}

export async function createDraft(payload) {
  const res = await apiClient.post(BASE, payload);
  return unwrap(res);
}

export async function getDrafts(page = 1, limit = 10) {
  const res = await apiClient.get(BASE, { params: { page, limit } });
  return {
    items: res?.data?.data ?? [],
    meta: res?.data?.meta ?? null,
  };
}

export async function getDraftById(id) {
  const res = await apiClient.get(`${BASE}/${id}`);
  return unwrap(res);
}

export async function updateDraft(id, payload) {
  const res = await apiClient.patch(`${BASE}/${id}`, payload);
  return unwrap(res);
}

export async function deleteDraft(id) {
  const res = await apiClient.delete(`${BASE}/${id}`);
  return unwrap(res);
}

