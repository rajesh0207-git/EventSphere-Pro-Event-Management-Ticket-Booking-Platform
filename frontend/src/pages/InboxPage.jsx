import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Search, User as UserIcon, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getConversations, getChatHistory, sendMessage } from '../services/messageService';

const InboxPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const initContactUserId = location.state?.contactUserId;
  const initContactUserName = location.state?.contactUserName;

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
      // Poll every 5 seconds for new messages
      pollRef.current = setInterval(() => fetchMessages(selectedUser.user_id, true), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      let convs = res.data;
      
      if (initContactUserId && !initializedRef.current) {
        initializedRef.current = true;
        const existingConv = convs.find(c => c.user_id === initContactUserId);
        if (existingConv) {
          setSelectedUser(existingConv);
        } else {
          const tempConv = {
            user_id: initContactUserId,
            full_name: initContactUserName || 'User',
            last_message: '',
            last_message_at: null,
            unread_count: 0
          };
          convs = [tempConv, ...convs];
          setSelectedUser(tempConv);
        }
        window.history.replaceState({}, document.title);
      }
      
      setConversations(convs);
    } catch {} finally { setLoadingConvs(false); }
  };

  const fetchMessages = async (userId, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await getChatHistory(userId);
      setMessages(res.data);
      // Update unread count in conversation list
      setConversations(prev =>
        prev.map(c => c.user_id === userId ? { ...c, unread_count: 0 } : c)
      );
    } catch {} finally { if (!silent) setLoadingMsgs(false); }
  };

  const handleSelectConversation = (conv) => {
    setSelectedUser(conv);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    try {
      const res = await sendMessage(selectedUser.user_id, { content: newMessage.trim() });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      // Refresh conversations
      fetchConversations();
    } catch {} finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConvs = conversations.filter(c =>
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString();
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const avatarColors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500'];
  const getColor = (id) => avatarColors[(id || 0) % avatarColors.length];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <MessageSquare size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">Chat with organizers and attendees</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`flex flex-col border-r border-gray-100 ${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No conversations yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start messaging organizers from an event page</p>
                </div>
              ) : (
                filteredConvs.map(conv => (
                  <button
                    key={conv.user_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-indigo-50/50 transition-all text-left border-b border-gray-50 ${selectedUser?.user_id === conv.user_id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className={`w-10 h-10 ${getColor(conv.user_id)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-semibold">{getInitials(conv.full_name || conv.email || `User #${conv.user_id}`)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm text-gray-900 truncate">{conv.full_name || conv.email || `User #${conv.user_id}`}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center font-bold">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex flex-col flex-1 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare size={36} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Select a conversation</h3>
                <p className="text-gray-400 text-sm">Choose someone from your inbox to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
                  <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSelectedUser(null)}>
                    <ArrowLeft size={18} className="text-gray-600" />
                  </button>
                  <div className={`w-9 h-9 ${getColor(selectedUser.user_id)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-semibold">{getInitials(selectedUser.full_name || selectedUser.email || `User #${selectedUser.user_id}`)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedUser.full_name || selectedUser.email || `User #${selectedUser.user_id}`}</p>
                    <p className="text-xs text-emerald-500 font-medium">● Active</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                          }`}>
                            <p>{m.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                              {formatTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-3">
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send)"
                      rows={1}
                      className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
