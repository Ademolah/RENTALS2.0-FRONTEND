import { useCallback, useEffect, useRef, useState } from 'react';
import { useObjectUrls } from './useMedia';

const HIDDEN_TOAST = { visible: false, message: '', type: 'success' };

// Small in-modal toast that hides itself after 4 seconds.
export function useModalToast() {
  const [toast, setToast] = useState(HIDDEN_TOAST);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ visible: true, message, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(HIDDEN_TOAST), 4000);
  }, []);

  return { toast, showToast };
}

// Load a listing when the editor opens, hold the form, and save it back.
//   fetchById(id) -> response      toForm(response) -> form values (or null to keep the current ones)
//   fetchById and toForm must be stable (module-level) functions.
//   buildPayload(form) -> FormData  save(id, payload) -> promise
export function useEditListing({
  isOpen, id, initialForm, fetchById, toForm, loadFailMessage, buildPayload, save, successMessage, failMessage, onSuccess, onClose,
}) {
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast } = useModalToast();
  const newUrls = useObjectUrls(formData.newImages);

  useEffect(() => {
    if (!isOpen || !id) return undefined;
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const response = await fetchById(id);
        const next = toForm(response);
        if (active && next) setFormData(next);
      } catch {
        if (active) showToast(loadFailMessage, 'error');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isOpen, id, fetchById, toForm, loadFailMessage, showToast]);

  const patch = (fields) => setFormData((prev) => ({ ...prev, ...fields }));

  const addImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setFormData((prev) => ({ ...prev, newImages: [...prev.newImages, ...files] }));
  };
  const removeExisting = (index) => setFormData((prev) => ({ ...prev, existingImages: prev.existingImages.filter((_, i) => i !== index) }));
  const removeNew = (index) => setFormData((prev) => ({ ...prev, newImages: prev.newImages.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await save(id, buildPayload(formData));
      showToast(successMessage, 'success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      showToast(error.response?.data?.message || failMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData, setFormData, patch, isLoading, isSubmitting, toast, newUrls, handleSubmit, addImages, removeExisting, removeNew,
  };
}
