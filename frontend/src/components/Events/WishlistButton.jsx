import { useState, useEffect } from 'react';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '../../services/wishlistService';
import { useAuth } from '../../context/AuthContext';

const WishlistButton = ({ eventId, className = "" }) => {
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchStatus = async () => {
      try {
        const res = await checkWishlistStatus(eventId);
        setIsWishlisted(res.data.is_wishlisted);
      } catch (err) {
        console.error("Failed to check wishlist status", err);
      }
    };
    fetchStatus();
  }, [eventId, isAuthenticated]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert("Please login to add events to your wishlist.");
      return;
    }
    setLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(eventId);
        setIsWishlisted(false);
      } else {
        await addToWishlist(eventId);
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Wishlist action failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full backdrop-blur-md shadow-sm border border-white/20 transition-all duration-300 transform active:scale-95 ${
        isWishlisted 
          ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
          : 'bg-black/40 text-white hover:bg-black/60'
      } ${className}`}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isWishlisted ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 transition-transform duration-300 transform hover:scale-110"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
};

export default WishlistButton;
