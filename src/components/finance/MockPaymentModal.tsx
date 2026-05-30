"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Copy, ChevronLeft, ChevronDown, CheckCircle2, ShieldCheck, Loader2, Building2, CreditCard, Smartphone, Store, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  title?: string;
}

const PAYMENT_METHODS = [
  {
    group: "Virtual Account",
    icon: <Building2 className="h-5 w-5 text-blue-600" />,
    items: [
      { id: "bca_va", name: "BCA Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
      { id: "mandiri_va", name: "Mandiri Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Bank_Mandiri_Baru.svg" },
      { id: "bni_va", name: "BNI Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg" },
      { id: "bri_va", name: "BRIVA", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg" },
      { id: "permata_va", name: "Permata Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/PermataBank_logo.svg" },
      { id: "cimb_va", name: "CIMB Niaga Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/CIMB_Niaga_logo.svg" },
      { id: "other_va", name: "Other Banks", icon: <Building2 className="h-5 w-5 text-gray-500" /> },
    ]
  },
  {
    group: "E-Wallet & QRIS",
    icon: <Smartphone className="h-5 w-5 text-green-500" />,
    items: [
      { id: "gopay", name: "GoPay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
      { id: "shopeepay", name: "ShopeePay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee_logo.svg" },
      { id: "ovo", name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/OVO_logo.svg" },
      { id: "dana", name: "DANA", logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
      { id: "linkaja", name: "LinkAja", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg" },
      { id: "qris", name: "QRIS", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" },
    ]
  },
  {
    group: "Credit / Debit Card",
    icon: <CreditCard className="h-5 w-5 text-orange-500" />,
    items: [
      { id: "cc", name: "Credit/Debit Card", icons: ["https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg", "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"] },
    ]
  },
  {
    group: "Over the Counter",
    icon: <Store className="h-5 w-5 text-red-500" />,
    items: [
      { id: "indomaret", name: "Indomaret", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png" },
      { id: "alfamart", name: "Alfamart", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg" },
    ]
  }
];

export function MockPaymentModal({ isOpen, onClose, amount, onSuccess, title = "School Payment" }: MockPaymentModalProps) {
  const [step, setStep] = useState<"select" | "detail" | "processing" | "success">("select");
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Virtual Account");
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours
  
  const [activeInstructionTab, setActiveInstructionTab] = useState<string>("atm");

  const orderId = `INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const vaNumber = "8890" + Math.random().toString().substring(2, 10);

  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedMethod(null);
      setTimeLeft(24 * 60 * 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step === "success") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectMethod = (method: any) => {
    setSelectedMethod(method);
    setStep("detail");
  };

  const handleConfirmPayment = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[420px] h-[100dvh] sm:h-[85dvh] sm:max-h-[800px] bg-white sm:rounded-[24px] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header - Midtrans Style */}
        <div className="flex-none bg-white border-b border-gray-100 z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === "detail" && (
                <button onClick={() => setStep("select")} className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="h-6 w-6 text-gray-700" />
                </button>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-gray-900 text-sm">Academy-Pay</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {(step === "select" || step === "detail") && (
            <div className="px-4 py-3 bg-gray-50/50 flex justify-between items-center border-t border-gray-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Amount</span>
                <span className="text-base font-bold text-gray-900">Rp {amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Order ID</span>
                <span className="text-xs font-mono text-gray-700">{orderId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {step === "select" && (
            <div className="p-4 space-y-4 pb-8">
              <h2 className="text-sm font-bold text-gray-900 px-1 mb-2">Select Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((group) => (
                  <div key={group.group} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
                      className="w-full px-4 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {group.icon}
                        <span className="font-bold text-gray-900 text-sm">{group.group}</span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedGroup === group.group ? "rotate-180" : ""}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedGroup === group.group && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="flex flex-col divide-y divide-gray-100 bg-gray-50/50">
                            {group.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSelectMethod(item)}
                                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors group"
                              >
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  {item.logo && <img src={item.logo} alt={item.name} className="h-4 object-contain max-w-[60px]" />}
                                  {item.icons && item.icons.map((icon, i) => (
                                    <img key={i} src={icon} alt="" className="h-4 object-contain" />
                                  ))}
                                  {item.icon && item.icon}
                                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 ml-1" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "detail" && (
            <div className="p-4 space-y-6 pb-24">
              <div className="text-center space-y-1 mt-2">
                 <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gray-50 mb-2">
                    {selectedMethod?.logo ? (
                      <img src={selectedMethod.logo} alt="" className="h-6 object-contain max-w-[80px]" />
                    ) : selectedMethod?.icons ? (
                      <div className="flex gap-2">
                        {selectedMethod.icons.map((icon: string, i: number) => (
                           <img key={i} src={icon} alt="" className="h-6 object-contain" />
                        ))}
                      </div>
                    ) : (
                      <Building2 className="h-6 w-6 text-gray-400" />
                    )}
                 </div>
                 <h2 className="text-lg font-bold text-gray-900">{selectedMethod?.name}</h2>
                 <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-orange-600 bg-orange-50 w-max mx-auto px-3 py-1 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    Complete payment in {formatTime(timeLeft)}
                 </div>
              </div>

              {selectedMethod?.id.includes("va") ? (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                     <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Virtual Account Number</p>
                     <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-[0.1em]">{vaNumber}</span>
                        <button onClick={() => handleCopy(vaNumber)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors" title="Copy VA Number">
                           <Copy className="h-5 w-5" />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <h3 className="text-sm font-bold text-gray-900 px-1">How to pay</h3>
                     <div className="border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gray-50">
                           {["ATM", "Mobile Banking", "Internet Banking"].map(tab => (
                             <button
                               key={tab}
                               onClick={() => setActiveInstructionTab(tab.toLowerCase())}
                               className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${activeInstructionTab === tab.toLowerCase() ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"}`}
                             >
                               {tab.split(" ")[0]}
                             </button>
                           ))}
                        </div>
                        <div className="p-4 text-sm text-gray-600 space-y-3 bg-white">
                           <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-none font-bold text-xs">1</div><p>Select <span className="font-bold">Transfer</span> \u003e <span className="font-bold">Virtual Account</span></p></div>
                           <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-none font-bold text-xs">2</div><p>Enter the VA number <span className="font-mono font-bold">{vaNumber}</span></p></div>
                           <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-none font-bold text-xs">3</div><p>Verify the amount <span className="font-bold">Rp {amount.toLocaleString('id-ID')}</span> and merchant <span className="font-bold">Academy-Pay</span></p></div>
                           <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-none font-bold text-xs">4</div><p>Follow instructions to complete payment</p></div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : selectedMethod?.id === "qris" ? (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                     <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Scan QR Code</p>
                     <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 mb-4 inline-block">
                        {/* Mock QR Code */}
                        <div className="w-48 h-48 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-1 p-2 opacity-50">
                              {Array.from({length: 36}).map((_, i) => (
                                 <div key={i} className={`bg-white rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                              ))}
                           </div>
                           <div className="w-12 h-12 bg-white rounded-xl z-10 flex items-center justify-center shadow-lg">
                              <span className="font-black text-[10px] text-blue-600">QRIS</span>
                           </div>
                        </div>
                     </div>
                     <p className="text-sm text-gray-600">Open your E-Wallet or Mobile Banking app and scan the QR code above.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center space-y-3">
                     <p className="text-sm text-gray-600">Follow the instructions in your <span className="font-bold text-gray-900">{selectedMethod?.name}</span> app to authorize the payment of <span className="font-bold text-gray-900">Rp {amount.toLocaleString('id-ID')}</span>.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6 p-6">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <div>
                <h4 className="text-lg font-bold text-gray-900">Verifying Payment</h4>
                <p className="text-sm text-gray-500 mt-1">Please do not close this window...</p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6 p-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </motion.div>
              <div>
                <h4 className="text-2xl font-black text-gray-900">Payment Successful</h4>
                <p className="text-sm text-gray-500 mt-2">Rp {amount.toLocaleString('id-ID')} has been paid</p>
              </div>
              
              <div className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 text-left space-y-3 mt-4">
                 <div className="flex justify-between text-sm"><span className="text-gray-500">Order ID</span><span className="font-mono font-medium text-gray-900">{orderId}</span></div>
                 <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span><span className="font-medium text-gray-900">{selectedMethod?.name}</span></div>
                 <div className="flex justify-between text-sm"><span className="text-gray-500">Time</span><span className="font-medium text-gray-900">{new Date().toLocaleTimeString()}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === "detail" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
            <button 
               onClick={handleConfirmPayment}
               className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition-colors shadow-lg shadow-blue-600/20"
            >
              Check Payment Status
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
