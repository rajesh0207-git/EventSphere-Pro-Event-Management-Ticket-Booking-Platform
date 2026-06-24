import { useState } from 'react';
import { initiatePayment, confirmPayment } from '../../services/paymentService';
import { formatCurrency } from '../../utils/helpers';

const PaymentModal = ({ booking, event, ticket, onClose, onSuccess }) => {
  const [method, setMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null); // null, true, false
  const [txnDetails, setTxnDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusText('Initiating secure transaction...');

    try {
      // 1. Initiate Payment
      const initRes = await initiatePayment(booking.id, method);
      const paymentId = initRes.data.id;

      // Simulate network processing with status updates
      setTimeout(async () => {
        setStatusText('Contacting issuer bank...');
        
        setTimeout(async () => {
          setStatusText('Authenticating secure tokens...');
          
          setTimeout(async () => {
            try {
              // 2. Confirm Payment
              const confirmRes = await confirmPayment(paymentId, true);
              setTxnDetails(confirmRes.data);
              setPaymentSuccess(true);
              setLoading(false);
            } catch (err) {
              setPaymentSuccess(false);
              setLoading(false);
            }
          }, 1000);
        }, 1000);
      }, 1000);

    } catch (err) {
      alert(err.response?.data?.detail || 'Payment initiation failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col transform transition-all duration-300 scale-100">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Secure Checkout</h3>
          {!loading && !paymentSuccess && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Processing State */}
        {loading && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="font-semibold text-gray-800 text-lg mb-2">Processing Payment</p>
            <p className="text-sm text-gray-500 animate-pulse">{statusText}</p>
          </div>
        )}

        {/* Success Screen */}
        {!loading && paymentSuccess === true && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-gray-950 mb-2">Payment Confirmed!</h4>
            <p className="text-gray-500 text-sm mb-6">Your transaction was successful. Digital ticket generated.</p>
            
            <div className="bg-gray-50 rounded-2xl p-4 w-full text-left text-sm mb-8 space-y-2 border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Transaction ID</span><span className="font-mono font-semibold text-gray-900">{txnDetails?.transaction_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-semibold text-gray-900">{txnDetails?.method}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Charged</span><span className="font-semibold text-gray-900">{formatCurrency(txnDetails?.amount)}</span></div>
            </div>

            <button
              onClick={onSuccess}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              View Ticket
            </button>
          </div>
        )}

        {/* Main Payment Form */}
        {!loading && paymentSuccess === null && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Bill Summary */}
            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
              <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Checkout Summary</p>
              <h4 className="font-semibold text-gray-900 mt-1 truncate">{event.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{ticket?.name} &middot; Qty: {booking.quantity}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-indigo-100">
                <span className="text-sm text-gray-600 font-medium">Amount Due:</span>
                <span className="text-lg font-bold text-indigo-700">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition ${
                    method === 'CARD' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition ${
                    method === 'UPI' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  UPI ID
                </button>
              </div>
            </div>

            {/* Form Inputs */}
            {method === 'CARD' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="***"
                      maxLength={3}
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">UPI Address</label>
                <input
                  type="text"
                  required
                  placeholder="username@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-medium"
                />
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Pay {formatCurrency(booking.total_amount)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
