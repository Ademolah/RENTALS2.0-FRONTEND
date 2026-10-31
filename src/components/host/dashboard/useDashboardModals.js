import { useState } from 'react';

// Which "add" / "edit" modals are open on the host dashboard.
export function useDashboardModals() {
  const [open, setOpen] = useState({ bank: false, property: false, car: false, hotel: false, vip: false });
  const [editing, setEditing] = useState({ car: null, property: null, hotel: null, vip: null });

  const openModal = (key) => setOpen((prev) => ({ ...prev, [key]: true }));
  const closeModal = (key) => setOpen((prev) => ({ ...prev, [key]: false }));
  const startEditing = (key, id) => setEditing((prev) => ({ ...prev, [key]: id }));
  const stopEditing = (key) => setEditing((prev) => ({ ...prev, [key]: null }));

  return { open, editing, openModal, closeModal, startEditing, stopEditing };
}
