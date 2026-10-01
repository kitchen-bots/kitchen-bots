import { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldQuestion } from 'lucide-react';
import { Button } from '../components/ui/button';
import { type Page } from '../App';

export default function ForgotPasswordPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6">
      <div className="w-full max-w-[480px] bg-white rounded-[40px] border border-[#F1F5F9] shadow-[0_30px_80px_rgba(0,0,0,0.05)] p-10 md:p-12 relative overflow-hidden">
        
        {/* BACKGROUND ACCENTS */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-kb-tertiary opacity-5 blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-kb-primary opacity-5 blur-[60px]" />

        <Button 
          variant="link"
          onClick={() => onNavigate('login')}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#111827] text-[12px] font-bold uppercase tracking-widest mb-10 transition-colors group p-0 h-auto"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Button>

        {!isSent ? (
          <>
            <div className="mb-10">
              <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-6 text-kb-tertiary border border-[#F1F5F9]">
                <ShieldQuestion size={28} />
              </div>
              <h1 className="text-[32px] font-bold font-['Outfit'] text-[#111827] mb-2 leading-tight">Forgotten <br /> Security Credentials?</h1>
              <p className="text-[15px] text-[#64748B] font-['DM_Sans'] leading-relaxed">
                Enter your registered engineering email address and we'll send a secure reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#64748B] uppercase tracking-widest font-['Outfit']">Company Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@kitchenbots.in" 
                    className="w-full h-[56px] pl-12 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[15px] focus:outline-none focus:border-kb-tertiary focus:bg-white transition-all font-['DM_Sans']"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full shadow-xl shadow-black/10"
              >
                {isSubmitting ? 'Authenticating...' : 'Send Recovery Link'}
                {!isSubmitting && <Send className="w-5 h-5" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="w-20 h-20 bg-[#F0FDF4] rounded-[24px] flex items-center justify-center mx-auto mb-8 text-kb-primary shadow-lg shadow-kb-primary border border-[#DCFCE7]">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-[28px] font-bold font-['Outfit'] text-[#111827] mb-4">Check Your Inbox</h2>
            <p className="text-[15px] text-[#64748B] leading-relaxed mb-10 font-['DM_Sans']">
              A secure recovery link has been dispatched to <br/>
              <span className="font-bold text-[#111827]">{email}</span>. <br/>
              Valid for the next 60 minutes.
            </p>
            <Button 
              variant="link"
              onClick={() => setIsSent(false)}
              className="text-kb-tertiary hover:text-[#D18509] text-[14px] font-bold uppercase tracking-widest p-0 h-auto"
            >
              Didn't receive it? Dispatch Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
