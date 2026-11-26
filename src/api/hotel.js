import { apiClient } from './client';

const extractFile = (item) => {
  if (item instanceof File || item instanceof Blob) return item;
  if (item?.file instanceof File || item?.file instanceof Blob) return item.file;
  if (item?.originFileObj instanceof File || item?.originFileObj instanceof Blob) {
    return item.originFileObj;
  }
  return null;
};

const extractUrl = (item) => {
  if (typeof item === 'string' && /^https?:\/\//i.test(item.trim())) {
    return item.trim();
  }
  if (typeof item?.url === 'string' && /^https?:\/\//i.test(item.url.trim())) {
    return item.url.trim();
  }
  if (typeof item?.secure_url === 'string' && /^https?:\/\//i.test(item.secure_url.trim())) {
    return item.secure_url.trim();
  }
  return null;
};

const hasBinaryFiles = (value) => {
  if (extractFile(value)) return true;
  if (Array.isArray(value)) return value.some(hasBinaryFiles);
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasBinaryFiles);
  }
  return false;
};

const toHotelFormData = (payload) => {
  if (!payload || payload instanceof FormData) return payload;
  if (!hasBinaryFiles(payload)) return payload;

  const formData = new FormData();

  // 1. Extract hotel-level File objects vs retained HTTPS URLs
  const rawImages = Array.isArray(payload.images) ? payload.images : [];
  const retainedHotelUrls = [];

  rawImages.forEach((item) => {
    const file = extractFile(item);
    const url = extractUrl(item);
    if (file) {
      formData.append('images', file);
    } else if (url) {
      retainedHotelUrls.push(url);
    }
  });

  if (retainedHotelUrls.length > 0 || Array.isArray(payload.existingImages)) {
    const existing = Array.isArray(payload.existingImages)
      ? payload.existingImages
      : retainedHotelUrls;
    formData.append('existingImages', JSON.stringify(existing));
    formData.append('images', JSON.stringify(retainedHotelUrls));
  }

  // 2. Extract room-level File objects (roomImages_0, roomImages_1, ...) & clean roomTypes
  if (Array.isArray(payload.roomTypes)) {
    const cleanedRooms = payload.roomTypes.map((room, index) => {
      const roomMedia = [
        ...(Array.isArray(room.images) ? room.images : []),
        ...(Array.isArray(room.imageFiles) ? room.imageFiles : []),
      ];
      const retainedRoomUrls = [];

      roomMedia.forEach((item) => {
        const file = extractFile(item);
        const url = extractUrl(item);
        if (file) {
          formData.append(`roomImages_${index}`, file);
        } else if (url) {
          retainedRoomUrls.push(url);
        }
      });

      const { imageFiles, ...restRoom } = room;
      return {
        ...restRoom,
        images: retainedRoomUrls,
      };
    });

    formData.append('roomTypes', JSON.stringify(cleanedRooms));
  }

  // 3. Flatten address for createHotel while keeping JSON address for updateHotel
  if (payload.address && typeof payload.address === 'object') {
    if (payload.address.street !== undefined) {
      formData.append('street', String(payload.address.street));
    }
    if (payload.address.city !== undefined) {
      formData.append('city', String(payload.address.city));
    }
    if (payload.address.state !== undefined) {
      formData.append('state', String(payload.address.state));
    }
    if (payload.address.country !== undefined) {
      formData.append('country', String(payload.address.country));
    }
    formData.append('address', JSON.stringify(payload.address));
  }

  // 4. Append remaining scalar and array fields
  const handledKeys = new Set([
    'images',
    'existingImages',
    'roomTypes',
    'address',
  ]);

  Object.entries(payload).forEach(([key, val]) => {
    if (handledKeys.has(key) || val === undefined || val === null) return;
    if (Array.isArray(val) || typeof val === 'object') {
      formData.append(key, JSON.stringify(val));
    } else {
      formData.append(key, String(val));
    }
  });

  return formData;
};

export const getHotels = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await apiClient.get(`/hotels?${params}`);
  return response.data;
};

export const getHotelById = async (id) => {
  const response = await apiClient.get(`/hotels/${id}`);
  return response.data;
};

export const createHotel = async (hotelData) => {
  const body = toHotelFormData(hotelData);
  const response = await apiClient.post('/hotels', body);
  return response.data;
};

export const updateHotel = async (id, hotelData) => {
  const body = toHotelFormData(hotelData);
  const response = await apiClient.patch(`/hotels/${id}`, body);
  return response.data;
};

export const deleteHotel = async (id) => {
  const response = await apiClient.delete(`/hotels/${id}`);
  return response.data;
};

export const checkHotelRoomAvailability = async (hotelId, roomTypeId, dates) => {
  const params = new URLSearchParams(dates).toString();
  const response = await apiClient.get(
    `/hotels/${hotelId}/rooms/${roomTypeId}/availability?${params}`
  );
  return response.data;
};

export const getLandlordHotelBookings = async () => {
  const response = await apiClient.get('/hotels/landlord/bookings');
  return response.data;
};

export const confirmHotelCheckIn = async (reservationId) => {
  const response = await apiClient.post(
    `/hotels/bookings/${reservationId}/confirm-checkin`,
    {}
  );
  return response.data;
};

export const getLandlordHotels = async () => {
  const response = await apiClient.get('/hotels/landlord/portfolio');
  return response.data;
};

export const getMyHotelBookings = async () => {
  const response = await apiClient.get('/hotels/guest/bookings');
  return response.data;
};

export const confirmHotelGuestCheckIn = async (id) => {
  const response = await apiClient.patch(`/hotels/guest/bookings/${id}/confirm`, {});
  return response.data;
};

export const logHotelWhatsappIntent = async (intentData) => {
  const token = localStorage.getItem('rentals_token');
  return apiClient.post('/hotels/whatsapp-intent', intentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};