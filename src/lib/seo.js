import { useEffect } from 'react';

export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = `${title} | Rentals Africa`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);
}
