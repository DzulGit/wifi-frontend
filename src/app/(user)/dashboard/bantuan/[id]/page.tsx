'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import { Send, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DetailBantuanPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;
  
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}`);
      const resData = data.data || data;
      setTicket(resData);
      // Backend pakai 'replies'
      setMessages(resData.replies || []);
    } catch (e) { router.push('/dashboard/bantuan'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (ticketId) fetchData(); }, [ticketId]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Backend pakai isFromAdmin (boolean)
  const lastTwoAreUser = messages.slice(-2).length === 2 && messages.slice(-2).every(m => m.isFromAdmin === false);
  const isBlocked = lastTwoAreUser || ticket?.status === 'CLOSED' || ticket?.status === 'RESOLVED';

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isBlocked) return;
    setIsSending(true);
    try {
      // Pastikan endpoint ini sesuai controller Fikar, biasanya '/tickets/:id/reply' atau '/tickets/:id/messages'
      const { data } = await api.post(`/tickets/${ticketId}/reply`, { 
        message: inputText, 
        isFromAdmin: false 
      });
      setMessages([...messages, data.data || data]);
      setInputText('');
    } catch (e) { toast.error('Gagal kirim pesan'); }
    finally { setIsSending(false); }
  };

  if (isLoading) return <UserLayoutWrapper title="Loading..."><div className="text-center py-20 animate-pulse text-[#F5A623]">Memuat Obrolan...</div></UserLayoutWrapper>;

  return (
    <UserLayoutWrapper title="Detail Laporan">
      <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 bg-[#1f1f1f] border-b border-white/5 flex justify-between items-center">
          <button onClick={() => router.push('/dashboard/bantuan')} className="text-white/50 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Kembali</button>
          <div className="text-right">
            {/* Backend pakai 'title' */}
            <h2 className="text-white font-bold">{ticket?.title}</h2>
            <span className="text-[10px] text-[#F5A623] font-bold uppercase">{ticket?.status?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#141414]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.isFromAdmin === false ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[70%] text-sm ${m.isFromAdmin === false ? 'bg-[#F5A623] text-black font-medium' : 'bg-[#2a2a2a] text-white border border-white/10'}`}>
                {/* Backend pakai 'message' */}
                {m.message}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-[#1f1f1f] border-t border-white/5">
          {lastTwoAreUser && <div className="text-[10px] text-red-400 mb-2 text-center flex items-center justify-center gap-1"><AlertCircle size={12}/> Tunggu balasan admin sebelum mengirim pesan lagi.</div>}
          <form onSubmit={onSend} className="flex gap-2">
            <input disabled={isBlocked} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={isBlocked ? "Menunggu balasan..." : "Tulis pesan..."} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#F5A623] disabled:opacity-50" />
            <button disabled={isBlocked || !inputText.trim()} className="bg-[#F5A623] text-black p-3 rounded-xl disabled:opacity-50"><Send size={20}/></button>
          </form>
        </div>
      </div>
    </UserLayoutWrapper>
  );
}