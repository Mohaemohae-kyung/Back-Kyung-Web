import { api } from '../api/client';

export function getFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem('favoriteExpertIds') || '[]');
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids) {
  localStorage.setItem('favoriteExpertIds', JSON.stringify(ids));
}

export function isFavoriteExpert(expertId) {
  if (!expertId) return false;
  return getFavoriteIds().includes(String(expertId));
}

export async function requestFavoriteToggle(expertId) {
  if (!expertId) return;

  const res = await api.post(`/api/experts/${expertId}/favorite`);
  return res.result || res;
}