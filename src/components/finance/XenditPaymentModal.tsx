"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Copy, ChevronLeft, ChevronDown, CheckCircle2, ShieldCheck, Loader2, Building2, CreditCard, Smartphone, Store, Clock, Wallet, Banknote, QrCode, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface XenditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  title?: string;
}

interface PaymentMethodItem {
  id: string;
  name: string;
  logo?: string;
  icon?: React.ReactNode;
}

interface PaymentGroup {
  id: string;
  group: string;
  icon: React.ReactNode;
  items: PaymentMethodItem[];
}

const PAYMENT_METHODS: PaymentGroup[] = [
  {
    id: "cc",
    group: "Credit / Debit Card",
    icon: <CreditCard className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "cc_visa", name: "Visa / Mastercard / JCB / Amex", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
    ]
  },
  {
    id: "va",
    group: "Virtual Account",
    icon: <Building2 className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "va_bca", name: "BCA", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
      { id: "va_mandiri", name: "Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Bank_Mandiri_Baru.svg" },
      { id: "va_bni", name: "BNI", logo: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg" },
      { id: "va_bri", name: "BRI", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg" },
      { id: "va_permata", name: "PermataBank", logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/PermataBank_logo.svg" },
      { id: "va_cimb", name: "CIMB Niaga", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/CIMB_Niaga_logo.svg" },
      { id: "va_bsi", name: "BSI", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Bank_Syariah_Indonesia.svg" },
      { id: "va_bjb", name: "BJB", logo: "https://upload.wikimedia.org/wikipedia/commons/0/03/Bank_BJB_logo.svg" },
      { id: "va_sampoerna", name: "Sahabat Sampoerna", icon: <Building2 className="h-4 w-4 text-gray-400" /> },
    ]
  },
  {
    id: "ewallet",
    group: "E-Wallet (ID)",
    icon: <Smartphone className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "ew_ovo", name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/OVO_logo.svg" },
      { id: "ew_dana", name: "DANA", logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
      { id: "ew_linkaja", name: "LinkAja", logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg" },
      { id: "ew_shopeepay", name: "ShopeePay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee_logo.svg" },
      { id: "ew_astrapay", name: "AstraPay", icon: <Wallet className="h-4 w-4 text-gray-400" /> },
      { id: "ew_jenius", name: "JeniusPay", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Jenius_logo.svg" },
    ]
  },
  {
    id: "intl",
    group: "International Payments",
    icon: <Globe className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "intl_paypal", name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
      { id: "intl_gcash", name: "GCash (PH)", logo: "https://upload.wikimedia.org/wikipedia/commons/5/52/GCash_logo.svg" },
      { id: "intl_maya", name: "Maya (PH)", icon: <Wallet className="h-4 w-4 text-gray-400" /> },
      { id: "intl_alipay", name: "Alipay", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Alipay_logo.svg" },
      { id: "intl_wechat", name: "WeChat Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a4/WeChat_Pay_logo.svg" },
    ]
  },
  {
    id: "qris",
    group: "QRIS",
    icon: <QrCode className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "qris", name: "QRIS", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" },
    ]
  },
  {
    id: "retail",
    group: "Retail Outlet",
    icon: <Store className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "rt_alfamart", name: "Alfamart", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg" },
      { id: "rt_indomaret", name: "Indomaret", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png" },
    ]
  },
  {
    id: "paylater",
    group: "Paylater / Installment",
    icon: <Banknote className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "pl_akulaku", name: "Akulaku", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Akulaku_logo.svg" },
      { id: "pl_kredivo", name: "Kredivo", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Kredivo_logo.svg" },
      { id: "pl_indodana", name: "Indodana", icon: <Wallet className="h-4 w-4 text-gray-400" /> },
      { id: "pl_uangme", name: "UangMe", icon: <Wallet className="h-4 w-4 text-gray-400" /> },
    ]
  },
  {
    id: "directdebit",
    group: "Direct Debit",
    icon: <CreditCard className="h-5 w-5 text-gray-500" />,
    items: [
      { id: "dd_bca", name: "BCA OneKlik", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
      { id: "dd_bri", name: "BRI Direct Debit", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg" },
      { id: "dd_mandiri", name: "Mandiri Direct Debit", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Bank_Mandiri_Baru.svg" },
    ]
  }
];

export function XenditPaymentModal({ isOpen, onClose, amount, onSuccess, title = "Nusantara International Academy" }: XenditPaymentModalProps) {
  const [step, setStep] = useState<"select" | "detail" | "otp" | "processing" | "success">("select");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodItem | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("va"); // Virtual Account default
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours
  
  const [activeInstructionTab, setActiveInstructionTab] = useState<string>("atm");
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const [orderId, setOrderId] = useState("");
  const [vaNumber, setVaNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedMethod(null);
      setTimeLeft(24 * 60 * 60);
      setIsProcessing(false);
      setOtpValue("");
      setOrderId(`INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
      setVaNumber("8890" + Math.random().toString().substring(2, 10));
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

  const handleSelectMethod = (method: PaymentMethodItem) => {
    setSelectedMethod(method);
    setStep("detail");
  };

  const handleSimulatePaymentAction = () => {
    if (selectedMethod?.id.startsWith("cc") || selectedMethod?.id.startsWith("dd_")) {
       setStep("otp");
       return;
    }
    setIsProcessing(true);
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setIsProcessing(false);
    }, 3000);
  };

  const handleOtpSubmit = () => {
    setIsProcessing(true);
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setIsProcessing(false);
    }, 3000);
  };

  const handleCloseSuccess = () => {
    onSuccess();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 bg-black/60 backdrop-blur-sm font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[440px] h-[100dvh] sm:h-[85dvh] sm:max-h-[850px] bg-white sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Xendit Style Header */}
        <div className="flex-none bg-[#041444] text-white z-10 relative">
           {/* Top nav area */}
           <div className="px-4 py-3 flex items-center justify-between">
              {(step === "detail" || step === "otp") && (
                <button onClick={() => setStep(step === "otp" ? "detail" : "select")} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors">
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
              )}
              {step !== "detail" && step !== "otp" && <div />} {/* Spacer for alignment */}
              
              {step !== "success" && step !== "processing" && (
                <button onClick={onClose} className="p-1 -mr-1 rounded-full hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              )}
           </div>

           {/* Brand and Amount */}
           {(step === "select" || step === "detail") && (
             <div className="px-6 pb-6 pt-2 text-center">
                <p className="text-sm font-medium text-blue-200 mb-1">{title}</p>
                <div className="flex justify-center items-center">
                   <span className="text-3xl font-bold tracking-tight">
                     <span className="text-xl font-normal mr-1">Rp</span>
                     {amount.toLocaleString('id-ID')}
                   </span>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                   <span className="text-xs text-blue-100">Order ID:</span>
                   <span className="text-xs font-mono font-bold">{orderId}</span>
                </div>
             </div>
           )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar relative">
          {step === "select" && (
            <div className="p-4 space-y-3 pb-8">
              <p className="text-sm font-bold text-gray-900 px-1 mb-1">Select a payment method</p>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                {PAYMENT_METHODS.map((group) => (
                  <div key={group.id} className="bg-white">
                    <button
                      onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {group.icon}
                        <span className="font-semibold text-gray-800 text-sm">{group.group}</span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedGroup === group.id ? "rotate-180" : ""}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedGroup === group.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-gray-50/50"
                        >
                          <div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
                            {group.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSelectMethod(item)}
                                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors group"
                              >
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  {item.logo ? (
                                     <div className="h-5 w-12 flex items-center justify-end">
                                        <img src={item.logo} alt={item.name} className="max-h-full max-w-full object-contain" />
                                     </div>
                                  ) : (
                                     item.icon
                                  )}
                                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
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

              {/* Secure Footer */}
              <div className="mt-8 flex flex-col items-center justify-center gap-2 pb-4">
                 <div className="flex items-center gap-1.5 text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Secured by Xendit</span>
                 </div>
                 <div className="flex gap-2 opacity-30 grayscale pointer-events-none">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-3" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="h-3" />
                 </div>
              </div>
            </div>
          )}

          {step === "detail" && (
            <div className="flex flex-col h-full bg-white">
              {/* Timer Bar */}
              <div className="bg-orange-50 border-b border-orange-100 px-4 py-2.5 flex items-center justify-center gap-2">
                 <Clock className="h-4 w-4 text-orange-500" />
                 <span className="text-sm text-orange-800 font-medium">Complete payment in <span className="font-bold">{formatTime(timeLeft)}</span></span>
              </div>

              <div className="p-5 flex-1">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment Method</p>
                       <h2 className="text-base font-bold text-gray-900">{selectedMethod?.name}</h2>
                    </div>
                    {selectedMethod?.logo && (
                       <img src={selectedMethod.logo} alt="" className="h-6 object-contain max-w-[80px]" />
                    )}
                 </div>

                 {/* Detail Render based on type */}
                 {selectedMethod?.id.startsWith("va_") ? (
                   <div className="space-y-6">
                     <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Virtual Account Number</p>
                        <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                           <span className="text-xl font-bold font-mono tracking-widest text-gray-900">{vaNumber}</span>
                           <button onClick={() => handleCopy(vaNumber)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                              <Copy className="h-4 w-4" /> Copy
                           </button>
                        </div>
                     </div>

                     <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto custom-scrollbar hide-scroll-bar">
                           {["ATM", "m-Banking", "i-Banking"].map(tab => (
                             <button
                               key={tab}
                               onClick={() => setActiveInstructionTab(tab.toLowerCase())}
                               className={`flex-1 min-w-[90px] py-3 text-xs font-semibold text-center transition-colors whitespace-nowrap ${activeInstructionTab === tab.toLowerCase() ? "text-blue-700 border-b-2 border-blue-700 bg-white" : "text-gray-500 hover:text-gray-700"}`}
                             >
                               {tab}
                             </button>
                           ))}
                        </div>
                        <div className="p-4 text-sm text-gray-600 space-y-4 bg-white">
                           {activeInstructionTab === "atm" && (
                              <>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">1</div><p>Insert your ATM Card and enter PIN</p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">2</div><p>Select <span className="font-semibold">Other Transactions</span> \u003e <span className="font-semibold">Transfer</span> \u003e <span className="font-semibold">Virtual Account</span></p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">3</div><p>Enter the VA number <span className="font-mono font-semibold">{vaNumber}</span></p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">4</div><p>Verify the total amount <span className="font-semibold">Rp {amount.toLocaleString('id-ID')}</span> and confirm</p></div>
                              </>
                           )}
                           {activeInstructionTab === "m-banking" && (
                              <>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">1</div><p>Log in to your Mobile Banking app</p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">2</div><p>Select <span className="font-semibold">Transfer</span> \u003e <span className="font-semibold">Virtual Account</span></p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">3</div><p>Enter the VA number <span className="font-mono font-semibold">{vaNumber}</span></p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">4</div><p>Input your PIN to confirm the payment of <span className="font-semibold">Rp {amount.toLocaleString('id-ID')}</span></p></div>
                              </>
                           )}
                           {activeInstructionTab === "i-banking" && (
                              <>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">1</div><p>Log in to your Internet Banking portal</p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">2</div><p>Navigate to <span className="font-semibold">Fund Transfer</span> \u003e <span className="font-semibold">Virtual Account</span></p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">3</div><p>Input the VA number <span className="font-mono font-semibold">{vaNumber}</span></p></div>
                                 <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">4</div><p>Authorize the transaction of <span className="font-semibold">Rp {amount.toLocaleString('id-ID')}</span> using your token</p></div>
                              </>
                           )}
                        </div>
                     </div>
                   </div>
                 ) : selectedMethod?.id === "qris" ? (
                   <div className="space-y-6 flex flex-col items-center pt-2">
                     <p className="text-sm text-gray-600 text-center px-4">Open your E-Wallet or Mobile Banking app and scan this QR code to pay.</p>
                     <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm inline-block">
                        <div className="w-52 h-52 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 grid grid-cols-7 grid-rows-7 gap-1 p-2 opacity-40">
                              {Array.from({length: 49}).map((_, i) => (
                                 <div key={i} className={`bg-white rounded-sm ${Math.random() > 0.4 ? 'opacity-100' : 'opacity-0'}`} />
                              ))}
                           </div>
                           <div className="w-14 h-14 bg-white rounded-xl z-10 flex items-center justify-center shadow-lg p-2">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="w-full h-full object-contain" />
                           </div>
                        </div>
                     </div>
                   </div>
                 ) : selectedMethod?.id.startsWith("ew_") || selectedMethod?.id.startsWith("intl_") ? (
                   <div className="space-y-6 pt-4 text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <Globe className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Redirecting to {selectedMethod.name}</h3>
                      <p className="text-sm text-gray-600">Please complete the payment in the {selectedMethod.name} app or website. Make sure you have sufficient balance.</p>
                   </div>
                 ) : selectedMethod?.id.startsWith("cc") || selectedMethod?.id.startsWith("dd_") ? (
                   <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-gray-700">Card Number</label>
                         <input type="text" placeholder="1234 5678 9101 1121" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Expiry Date</label>
                            <input type="text" placeholder="MM/YY" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">CVV</label>
                            <input type="password" placeholder="123" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" />
                         </div>
                      </div>
                   </div>
                 ) : selectedMethod?.id.startsWith("rt_") ? (
                   <div className="space-y-6 pt-4">
                      <div className="text-center mb-6">
                         <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Store className="h-8 w-8 text-blue-600" />
                         </div>
                         <h3 className="text-lg font-bold text-gray-900">Pay at {selectedMethod.name}</h3>
                         <p className="text-sm text-gray-600">Show this payment code to the cashier at any {selectedMethod.name} store.</p>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                         <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Payment Code</p>
                         <p className="text-3xl font-bold font-mono tracking-widest text-gray-900 mb-4">{vaNumber}</p>
                         <div className="w-full flex justify-center">
                            <div className="w-48 h-12 bg-black flex items-center justify-center opacity-80" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, white 2px, white 4px)" }}></div>
                         </div>
                      </div>
                      <div className="p-4 text-sm text-gray-600 space-y-3">
                         <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">1</div><p>Go to the nearest {selectedMethod.name} store.</p></div>
                         <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">2</div><p>Tell the cashier you want to make a <span className="font-semibold">Xendit Payment</span>.</p></div>
                         <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-none font-bold text-xs mt-0.5">3</div><p>Provide the payment code and pay <span className="font-semibold">Rp {amount.toLocaleString('id-ID')}</span>.</p></div>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6 pt-4 text-center">
                      <p className="text-sm text-gray-600">Please follow the instructions from <span className="font-bold">{selectedMethod?.name}</span> to complete your payment.</p>
                   </div>
                 )}
              </div>

              {/* Action Button at the bottom */}
              <div className="p-4 bg-white border-t border-gray-200">
                <button 
                   onClick={handleSimulatePaymentAction}
                   className="w-full h-12 rounded-lg bg-[#041444] hover:bg-[#061d63] active:bg-[#030e30] text-white font-bold text-sm transition-colors shadow-lg"
                >
                  I have completed the payment
                </button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="flex flex-col h-full bg-white relative">
              <div className="p-6 flex-1 flex flex-col justify-center items-center pb-24">
                 <div className="w-full max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-blue-600 p-4 text-white text-center">
                       <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-80" />
                       <h3 className="font-bold text-lg">3D Secure Verification</h3>
                       <p className="text-xs text-blue-100 opacity-90">Your bank requires additional authentication.</p>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                       <p className="text-sm text-gray-600 text-center mb-6">
                         A 6-digit OTP has been sent to your registered mobile number ending in <span className="font-bold text-gray-900">***992</span>.
                       </p>
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-700">Enter OTP (Any 6 digits)</label>
                          <input 
                             type="text" 
                             maxLength={6}
                             placeholder="123456" 
                             value={otpValue}
                             onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                             className="w-full text-center tracking-[0.5em] font-mono text-xl border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" 
                          />
                       </div>
                       <button 
                          onClick={handleOtpSubmit}
                          disabled={otpValue.length !== 6}
                          className="w-full h-12 mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-sm transition-colors"
                       >
                         Authenticate
                       </button>
                    </div>
                 </div>
                 <div className="mt-8 text-center">
                    <button onClick={() => setStep("detail")} className="text-sm font-medium text-gray-500 hover:text-gray-800">
                       Cancel and try another method
                    </button>
                 </div>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center h-[60dvh] text-center space-y-6 p-6">
              <div className="relative">
                 <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
                 <Loader2 className="h-16 w-16 text-[#041444] animate-spin relative z-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-1">Processing Payment</h4>
                <p className="text-sm text-gray-500">Checking your payment status...</p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-6 bg-white">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="mb-6">
                <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center">
                   <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                     <CheckCircle2 className="h-10 w-10" />
                   </div>
                </div>
              </motion.div>
              <h4 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h4>
              <p className="text-sm text-gray-500">Rp {amount.toLocaleString('id-ID')} has been paid using {selectedMethod?.name}</p>
              
              <div className="w-full bg-gray-50 rounded-xl p-5 mt-8 space-y-3 text-left">
                 <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Merchant</span>
                    <span className="font-bold text-gray-900">{title}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Order ID</span>
                    <span className="font-mono text-gray-900">{orderId}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Method</span>
                    <span className="text-gray-900 font-medium">{selectedMethod?.name}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Time</span>
                    <span className="text-gray-900 font-medium">{new Date().toLocaleString('id-ID')}</span>
                 </div>
              </div>

              <div className="w-full mt-8 flex flex-col gap-3">
                 <button 
                   onClick={() => toast.success("Receipt downloaded!")}
                   className="w-full h-12 rounded-lg bg-[#041444] hover:bg-[#061d63] text-white font-bold text-sm transition-colors shadow-lg"
                 >
                   Download Receipt
                 </button>
                 <button 
                   onClick={handleCloseSuccess}
                   className="w-full h-12 rounded-lg border-2 border-[#041444] text-[#041444] hover:bg-gray-50 font-bold text-sm transition-colors"
                 >
                   Back to Merchant
                 </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
