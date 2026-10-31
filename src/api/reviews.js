import axios from 'axios';
import { API_URL } from '../lib/config';
import { apiClient } from './client';


export const getPropertyReviewsApi = async (propertyId) => {
  const response = await axios.get(`${API_URL}/reviews/${propertyId}`);
  return response.data;
};

export const createPropertyReviewApi = async (propertyId, reviewData, token) => {
  const response = await axios.post(
    `${API_URL}/reviews/${propertyId}`,
    reviewData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// Works for shortlets, hotels and VIP venues (same GET /reviews/:id the mobile app uses).
// Reviewer identity is deliberately dropped: guests and hosts never see each other's details.
export async function getListingReviews(listingId) {
  const res = await apiClient.get(`/reviews/${listingId}`);
  const raw = Array.isArray(res.data?.reviews) ? res.data.reviews : [];
  const items = raw
    .map((r) => ({
      id: String(r._id ?? `${r.createdAt}-${r.rating}`),
      rating: Number(r.rating) || 0,
      comment: String(r.comment ?? ''),
      createdAt: Date.parse(r.createdAt) || 0,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  return { items, summary: summarizeReviews(items) };
}

export function summarizeReviews(items, fallback) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of items) {
    distribution[Math.min(5, Math.max(1, Math.round(r.rating)))]++;
  }
  const count = items.length || fallback?.count || 0;
  const average = items.length
    ? items.reduce((s, r) => s + r.rating, 0) / items.length
    : fallback?.rating || 0;
  return { average, count, distribution };
}
