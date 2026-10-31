import { useState } from 'react';
import { generateConciergeCheckoutUrl } from '../../api/admin';
import { errMsg } from './statusStyles';

// Concierge queue: negotiated prices, generated payment links and copy buttons.
export function useConciergeLinks(notify) {
  const [prices, setPrices] = useState({});
  const [links, setLinks] = useState({});
  const [linkLoading, setLinkLoading] = useState({});

  const setPrice = (draftId, value) => setPrices((prev) => ({ ...prev, [draftId]: value }));

  const generateLink = async (referenceCode, draftId) => {
    const finalAmount = prices[draftId];
    if (!finalAmount || finalAmount <= 0) {
      notify('Please enter a valid negotiated price.');
      return;
    }

    setLinkLoading((prev) => ({ ...prev, [draftId]: true }));
    try {
      const res = await generateConciergeCheckoutUrl({ referenceCode, finalAmount });
      const checkoutUrl = res.data?.data?.checkoutUrl || res.data?.checkoutUrl || res?.checkoutUrl;
      if (checkoutUrl) {
        setLinks((prev) => ({ ...prev, [draftId]: checkoutUrl }));
      } else {
        notify('The payment link could not be created. Please try again.');
      }
    } catch (error) {
      console.error(error);
      notify(errMsg(error, 'Failed to generate link.'));
    } finally {
      setLinkLoading((prev) => ({ ...prev, [draftId]: false }));
    }
  };

  const copyLink = (text) => {
    navigator.clipboard?.writeText(text);
    notify('Payment link copied. Paste it to the guest on WhatsApp.', 'success');
  };

  const copyReference = (referenceCode) => {
    navigator.clipboard?.writeText(referenceCode);
    notify(`Reference ${referenceCode} copied.`, 'success');
  };

  return { prices, links, linkLoading, setPrice, generateLink, copyLink, copyReference };
}
