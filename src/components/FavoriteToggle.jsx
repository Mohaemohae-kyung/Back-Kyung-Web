import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { getFavoriteIds, isFavoriteExpert, requestFavoriteToggle, saveFavoriteIds } from '../utils/favorites';

export default function FavoriteToggle({ expertId, label = false }) {
  const [active, setActive] = useState(() => isFavoriteExpert(expertId));

  const toggle = async event => {
    event.preventDefault();
    event.stopPropagation();

    if (!expertId) return;

    const id = String(expertId);

    try {
      const result = await requestFavoriteToggle(id);
      const favorite = result?.favorite;

      setActive(favorite);

      const current = getFavoriteIds();

      if (favorite) {
        saveFavoriteIds(Array.from(new Set([...current, id])));
      } else {
        saveFavoriteIds(current.filter(x => x !== id));
      }
    } catch {
      alert('찜 처리에 실패했어요.');
    }
  };

  return (
    <button
      type="button"
      className={`favorite-btn ${active ? 'active' : ''} ${label ? 'with-label' : ''}`}
      onClick={toggle}
      aria-label={active ? '찜 취소' : '찜하기'}
    >
      <Bookmark size={label ? 18 : 20} fill={active ? 'currentColor' : 'none'} />
      {label && <span>{active ? '찜 취소' : '찜하기'}</span>}
    </button>
  );
}