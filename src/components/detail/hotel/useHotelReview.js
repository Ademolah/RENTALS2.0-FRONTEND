import { useState } from 'react';
import { createPropertyReviewApi } from '../../../api/reviews';

// Review dialog state and submission. `reviewsKey` changes after a successful review so the list reloads.
export function useHotelReview({ hotel, setHotel, user, toast }) {
  const [reviewsKey, setReviewsKey] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (reviewForm.rating === 0) {
      setReviewError('Please select a rating score.');
      return;
    }
    if (reviewForm.comment.trim().length < 10) {
      setReviewError('Please provide a comment of at least 10 characters.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const token = user?.token || localStorage.getItem('rentals_token');
      const res = await createPropertyReviewApi(hotel._id, reviewForm, token);

      if (res.success) {
        setReviewsKey((k) => k + 1);
        setHotel((prev) => ({
          ...prev,
          rating: res.updatedPropertyStats?.rating || prev.rating,
          reviewsCount: res.updatedPropertyStats?.numReviews || prev.reviewsCount + 1,
        }));
        setShowReviewModal(false);
        setReviewForm({ rating: 0, comment: '' });
        toast.show('Review submitted successfully!');
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return {
    reviewsKey, showReviewModal, setShowReviewModal,
    reviewForm, setReviewForm, isSubmittingReview, reviewError, handleReviewSubmit,
  };
}
