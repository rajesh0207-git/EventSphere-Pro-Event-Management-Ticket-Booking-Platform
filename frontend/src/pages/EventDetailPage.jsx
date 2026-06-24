import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Trash2, Send, TrendingUp, Radio } from 'lucide-react';
import { getEvent, getEventImages, uploadGalleryImage, deleteImage, toggleStream } from '../services/eventService';
import { createBooking } from '../services/bookingService';
import { validateCoupon } from '../services/couponService';
import { useAuth, AuthContext } from '../context/AuthContext';
import { formatDateTime, formatCurrency } from '../utils/helpers';
import WishlistButton from '../components/Events/WishlistButton';
import PaymentModal from '../components/Payment/PaymentModal';
import { getEventReviews, createReview, deleteReview } from '../services/reviewService';
import { getTickets } from '../services/ticketService';


// ─── Star Rating Input ─────────────────────────────────────────────────────────
const StarInput = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="transition-transform hover:scale-110"
      >
        <Star
          size={24}
          className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      </button>
    ))}
  </div>
);

// ─── Star Display ──────────────────────────────────────────────────────────────
const StarDisplay = ({ rating, size = 16 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
      />
    ))}
  </div>
);

// ─── Reviews Section ───────────────────────────────────────────────────────────
const ReviewsSection = ({ eventId, isAuthenticated, user }) => {
  const [reviewData, setReviewData] = useState({ average_rating: 0, total_reviews: 0, reviews: [] });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await getEventReviews(eventId);
      setReviewData(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [eventId]);

  const hasReviewed = user && reviewData.reviews.some(r => r.user_id === user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await createReview(eventId, { rating, comment });
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      fetchReviews();
    } catch {}
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarColors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500'];
  const getColor = (id) => avatarColors[(id || 0) % avatarColors.length];

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      {/* Header with aggregate */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Reviews & Ratings</h2>
        </div>
        {reviewData.total_reviews > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-xl border border-yellow-100">
            <StarDisplay rating={reviewData.average_rating} size={14} />
            <span className="font-bold text-gray-900">{reviewData.average_rating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({reviewData.total_reviews})</span>
          </div>
        )}
      </div>

      {/* Submit Review */}
      {isAuthenticated && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-indigo-50/60 to-purple-50/30 border border-indigo-100 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Leave a Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Your Rating</label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
          {submitError && <p className="text-red-500 text-sm mb-3">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {hasReviewed && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-700 font-medium">
          ✓ You have already reviewed this event.
        </div>
      )}

      {!isAuthenticated && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-500">
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link> to leave a review.
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : reviewData.reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          <Star size={32} className="mx-auto mb-2 text-gray-200" />
          No reviews yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {reviewData.reviews.map(r => (
            <div key={r.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
              <div className={`flex-shrink-0 w-10 h-10 ${getColor(r.user_id)} rounded-full flex items-center justify-center`}>
                {r.profile_picture_url ? (
                  <img src={r.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">{getInitials(r.user_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.user_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarDisplay rating={r.rating} size={13} />
                      <span className="text-xs text-gray-400">{formatTime(r.created_at)}</span>
                    </div>
                  </div>
                  {user && r.user_id === user.id && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-300 hover:text-red-500 transition p-1"
                      title="Delete review"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const EventDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isOwner = user && event && (event.organizer_id === user.id || user.role === 'ADMIN');

  const fetchData = async () => {
    try {
      const [eventRes, ticketsRes, imagesRes] = await Promise.all([getEvent(id), getTickets(id), getEventImages(id)]);
      setEvent(eventRes.data);
      setTickets(ticketsRes.data || []);
      setImages(imagesRes.data || []);
    } catch {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await validateCoupon(promoCode.toUpperCase(), id);
      setAppliedCoupon({ code: promoCode.toUpperCase(), discount_percentage: res.data.discount_percentage });
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedTicket) { setError('Please select a ticket'); return; }

    const selectedTicketObj = tickets.find(t => t.id === selectedTicket);
    if (!selectedTicketObj) return;

    if (event.event_type !== 'ONLINE') {
      navigate(`/events/${id}/seats`, { 
        state: { 
          ticket: selectedTicketObj, 
          couponCode: appliedCoupon?.code, 
          discountPercentage: appliedCoupon?.discount_percentage 
        } 
      });
      return;
    }

    setBooking(true);
    setError('');
    setMessage('');
    try {
      const payload = { event_id: parseInt(id), ticket_id: selectedTicket, quantity };
      if (appliedCoupon) {
        payload.coupon_code = appliedCoupon.code;
      }
      const res = await createBooking(payload);
      setCreatedBooking(res.data);
      if (selectedTicketObj.price > 0) {
        setShowPaymentModal(true);
      } else {
        setMessage('Booking confirmed!');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadGalleryImage(parseInt(id), formData, 'gallery');
      fetchData();
    } catch {
      setError('Failed to upload image');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await deleteImage(imageId);
      setImages(images.filter(i => i.id !== imageId));
    } catch {
      setError('Failed to delete image');
    }
  };

  const handleToggleStream = async () => {
    try {
      await toggleStream(id);
      fetchData(); // Refresh event to get updated is_streaming_live
    } catch {
      setError('Failed to toggle live stream');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!event) return <div className="text-center py-16 text-gray-500">Event not found</div>;

  const galleryImages = images.filter(i => i.image_type !== 'banner');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {message && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Banner */}
      {event.banner_url ? (
        <div className="relative mb-8">
          <img src={event.banner_url} alt={event.title} className="h-64 w-full object-cover rounded-xl" />
          <WishlistButton eventId={event.id} className="absolute top-4 right-4 z-10" />
        </div>
      ) : (
        <div className="h-64 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-8 relative">
          <WishlistButton eventId={event.id} className="absolute top-4 right-4 z-10" />
          <h1 className="text-4xl font-bold text-white text-center px-4">{event.title}</h1>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Details + Reviews */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                event.event_type === 'ONLINE' ? 'bg-green-100 text-green-700' :
                event.event_type === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>{event.event_type}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">{event.status}</span>
              {event.is_featured && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">Featured</span>}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <dl className="space-y-3">
              <div className="flex"><dt className="w-32 text-gray-500 text-sm">Date & Time</dt><dd className="text-gray-900 text-sm">{formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}</dd></div>
              {event.location && <div className="flex"><dt className="w-32 text-gray-500 text-sm">Location</dt><dd className="text-gray-900 text-sm">{event.location}</dd></div>}
              {event.virtual_link && <div className="flex"><dt className="w-32 text-gray-500 text-sm">Virtual Link</dt><dd className="text-sm"><a href={event.virtual_link} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">{event.virtual_link}</a></dd></div>}
              {event.capacity && <div className="flex"><dt className="w-32 text-gray-500 text-sm">Capacity</dt><dd className="text-gray-900 text-sm">{event.capacity} attendees</dd></div>}
              {(event.event_type === 'ONLINE' || event.event_type === 'HYBRID') && (
                <div className="pt-4 border-t border-gray-100">
                  <Link to={`/events/${id}/live`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition">
                    <Radio size={18} className={event.is_streaming_live ? "animate-pulse" : ""} />
                    {event.is_streaming_live ? "Join Live Stream Now" : "Enter Stream Waiting Room"}
                  </Link>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Organizer</h2>
              <p className="text-gray-500 text-sm">Have questions about this event?</p>
            </div>
            {(!user || user.id !== event.organizer_id) && (
              <button
                onClick={() => {
                  if (!isAuthenticated) navigate('/login');
                  else navigate('/inbox', { state: { contactUserId: event.organizer_id, contactUserName: event.organizer_name || 'Organizer' } });
                }}
                className="flex items-center gap-2 px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-medium whitespace-nowrap"
              >
                <MessageSquare size={16} /> Contact Organizer
              </button>

            )}
          </div>

          {/* Organizer Actions */}
          {isOwner && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizer Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link to={`/events/${id}/edit`} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">Edit Event</Link>
                <Link to={`/events/${id}/tickets`} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition">Manage Tickets</Link>
                <Link to={`/events/${id}/analytics`} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
                  <TrendingUp size={14} /> Analytics
                </Link>
                {(event.event_type === 'ONLINE' || event.event_type === 'HYBRID') && (
                  <button onClick={handleToggleStream} className={`flex items-center gap-1.5 px-4 py-2 text-white text-sm rounded-lg transition ${event.is_streaming_live ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    <Radio size={14} className={event.is_streaming_live ? "animate-pulse" : ""} /> 
                    {event.is_streaming_live ? 'End Live Stream' : 'Start Live Stream'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Gallery */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Gallery</h2>
              {isOwner && (
                <label className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg cursor-pointer hover:bg-indigo-700">
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                </label>
              )}
            </div>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {galleryImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                    {isOwner && (
                      <button onClick={() => handleDeleteImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition text-xs">x</button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No gallery images yet.</p>
            )}
          </div>

          {/* Reviews Section */}
          <ReviewsSection eventId={id} isAuthenticated={isAuthenticated} user={user} />
        </div>

        {/* Booking Card */}
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Get Tickets</h3>
            {tickets.length === 0 ? (
              <p className="text-gray-500 text-sm">No tickets available yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {tickets.map((t) => (
                  <label
                    key={t.id}
                    className={`block p-3 border rounded-lg cursor-pointer transition ${
                      selectedTicket === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="ticket" className="hidden" checked={selectedTicket === t.id} onChange={() => setSelectedTicket(t.id)} />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.type} · {t.quantity - t.sold_count} left</p>
                      </div>
                      <p className="font-semibold text-gray-900">{t.price > 0 ? formatCurrency(t.price) : 'Free'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {tickets.length > 0 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono text-sm" placeholder="Enter code" />
                    <button type="button" onClick={handleApplyCoupon} disabled={validatingCoupon || !promoCode}
                      className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-50">
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-emerald-600 text-xs mt-1 font-medium">✓ {appliedCoupon.discount_percentage}% discount applied</p>
                  )}
                </div>

                <button onClick={handleBook} disabled={booking || !selectedTicket}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {booking ? 'Booking...' : isAuthenticated ? 'Book Now' : 'Login to Book'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createdBooking && (
        <PaymentModal
          booking={createdBooking}
          event={event}
          ticket={tickets.find(t => t.id === selectedTicket)}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            navigate(`/tickets/${createdBooking.id}`);
          }}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
