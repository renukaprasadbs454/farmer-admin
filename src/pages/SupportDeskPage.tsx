import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  MapPin,
  Mic,
  Image,
  Video,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  fetchAdminConversationsApi,
  fetchAdminConversationDetailsApi,
  replyAdminConversationApi,
} from '../services/api';

export default function SupportDeskPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadConversations();
  }, [filterStatus, searchQuery]);

  const loadConversations = async () => {
    try {
      setLoadingList(true);
      const res: any = await fetchAdminConversationsApi(filterStatus, searchQuery);
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
        if (res.data.length > 0 && !selectedConvId) {
          setSelectedConvId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      loadChatDetails(selectedConvId);
    }
  }, [selectedConvId]);

  const loadChatDetails = async (id: string) => {
    try {
      setLoadingChat(true);
      const res: any = await fetchAdminConversationDetailsApi(id);
      if (res.success && res.data) {
        setActiveConversation(res.data);
        // Update unread badge in list
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadAdmin: 0 } : c))
        );
      }
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendReply = async () => {
    if (!selectedConvId || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const res: any = await replyAdminConversationApi(selectedConvId, replyText.trim());
      if (res.success && res.data) {
        setReplyText('');
        // Append to active conversation
        setActiveConversation((prev: any) => ({
          ...prev,
          messages: [...(prev?.messages || []), res.data],
        }));
        // Update list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? { ...c, lastMessageText: res.data.text, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (e) {
      console.error('Failed to send reply:', e);
    } finally {
      setSendingReply(false);
    }
  };

  const handleQuickTemplate = (template: string) => {
    setReplyText((prev) => (prev ? `${prev} ${template}` : template));
  };

  const toggleAudio = (msgId: string, url?: string) => {
    if (playingAudioId === msgId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (url) {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setPlayingAudioId(null);
        setPlayingAudioId(msgId);
      } else {
        // Simulated audio playback for mock audio
        setPlayingAudioId(msgId);
        setTimeout(() => setPlayingAudioId(null), 4000);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Agri Help Desk & Farmer Chat</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time consultation, voice queries, and crop diagnosis</p>
          </div>
        </div>

        <button
          onClick={loadConversations}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Farmer Conversation List */}
        <div className="w-96 border-r border-slate-200 flex flex-col bg-slate-50/40">
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search farmer name, phone, query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
              />
            </div>
            <div className="flex gap-1.5">
              {(['ALL', 'OPEN', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingList && conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No farmer conversations found</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const unread = conv.unreadAdmin > 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {conv.farmerName ? conv.farmerName.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 leading-tight">
                              {conv.farmerName || 'Farmer'}
                            </span>
                            {unread && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {conv.farmerPhone || 'No phone'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 font-medium pl-10">
                      {conv.lastMessageText || 'No messages yet'}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pl-10 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        {conv.regionName || 'Cluster'}
                      </span>
                      <span>&bull;</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {conv._count?.messages || 0} msgs
                      </span>
                      {unread && (
                        <span className="ml-auto bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
                          {conv.unreadAdmin} new
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header: Farmer Metadata */}
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {activeConversation.farmerName
                    ? activeConversation.farmerName.charAt(0).toUpperCase()
                    : 'F'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {activeConversation.farmerName || 'Farmer'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Verified Farmer
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {activeConversation.farmerPhone || 'N/A'}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {activeConversation.regionName || 'Agricultural Zone'}
                    </span>
                    {activeConversation.userProfile?.farmerProfile?.primaryCrops?.length ? (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-700 font-bold">
                          🌾 {activeConversation.userProfile.farmerProfile.primaryCrops.join(', ')}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Help Desk
                </span>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {loadingChat ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Loading chat history...
                </div>
              ) : activeConversation.messages?.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No messages yet in this conversation.</p>
                </div>
              ) : (
                activeConversation.messages?.map((msg: any) => {
                  const isAdmin = msg.senderRole === 'ADMIN';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          {isAdmin ? '🛡️ ' + msg.senderName : '👨‍🌾 ' + msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-lg p-3.5 rounded-2xl shadow-2xs text-sm ${
                          isAdmin
                            ? 'bg-slate-900 text-white rounded-tr-xs'
                            : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                        }`}
                      >
                        {/* 1. Voice Note Message */}
                        {msg.type === 'VOICE' && (
                          <div className="flex items-center gap-3 py-1">
                            <button
                              onClick={() => toggleAudio(msg.id, msg.mediaUrl)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isAdmin
                                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {playingAudioId === msg.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="font-bold text-xs">
                                  Voice Note ({msg.durationSeconds ? `${msg.durationSeconds}s` : '0:15'})
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {[3, 7, 5, 9, 4, 8, 3, 6, 8, 4, 7, 5].map((h, i) => (
                                  <div
                                    key={i}
                                    style={{ height: `${h * 2}px` }}
                                    className={`w-1 rounded-full ${
                                      isAdmin ? 'bg-slate-600' : 'bg-emerald-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Image Upload Message */}
                        {msg.type === 'IMAGE' && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-slate-200/60 bg-black/5">
                            <img
                              src={
                                msg.mediaUrl ||
                                'https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=600'
                              }
                              alt="Crop attachment"
                              className="w-full max-h-64 object-cover hover:scale-105 transition-transform cursor-pointer"
                            />
                            <div className="p-1.5 px-2 bg-black/40 text-white text-[10px] flex items-center gap-1 font-semibold">
                              <Image className="w-3 h-3" />
                              Crop / Field Photo Attachment
                            </div>
                          </div>
                        )}

                        {/* 3. Video Upload Message */}
                        {msg.type === 'VIDEO' && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-slate-200/60 bg-black">
                            <video
                              src={msg.mediaUrl || undefined}
                              controls
                              className="w-full max-h-64"
                            />
                            <div className="p-1.5 px-2 bg-black/40 text-white text-[10px] flex items-center gap-1 font-semibold">
                              <Video className="w-3 h-3" />
                              Field Video Recording
                            </div>
                          </div>
                        )}

                        {/* Text Body */}
                        {msg.text && (
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">
                            {msg.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Advice:
              </span>
              {[
                'Neem Oil 1500ppm @ 3ml/L recommended.',
                'Hold spraying; rain forecasted in 24 hours.',
                'Tractor operator has been dispatched to your field.',
                'Please share a close-up photo of the leaf underside.',
              ].map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => handleQuickTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all whitespace-nowrap shadow-2xs"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Admin Reply Input Bar */}
            <div className="p-4 px-6 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="flex items-center gap-3"
              >
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    placeholder="Type official agricultural advice or response to the farmer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="w-full px-4 py-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-semibold">Select a conversation from the left to read and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
