import { useState, useMemo, useEffect, ChangeEvent, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Palette, 
  ArrowRight, 
  MapPin, 
  Store, 
  ShoppingCart, 
  FileText, 
  History, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  ChevronRight,
  Search,
  Package,
  Wrench,
  Shirt,
  Calendar,
  Image as ImageIcon,
  Rocket,
  LogOut,
  DollarSign,
  UploadCloud,
  Copy,
  CreditCard,
  FileSpreadsheet,
  X
} from "lucide-react";
import { regions, Region, Franchise, Product } from "../data";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, getDoc, writeBatch } from "firebase/firestore";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface CartItem extends Product {
  quantity: number;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  unit?: string;
  type: 'raw' | 'equipment' | 'uniform';
}

interface Order {
  id: string;
  regionId: string;
  regionName: string;
  franchiseId: string;
  franchiseName: string;
  items: CartItem[];
  totalAmount: number;
  discount: number;
  discountPercent?: number;
  balanceAdjustment: number;
  finalAmount: number;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  paymentScreenshots?: string[];
  userId: string;
}

export default function FranchisePortal() {
  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Product['category']>('Raw Material');
  const [searchQuery, setSearchQuery] = useState("");
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [balanceAdjustment, setBalanceAdjustment] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentScreenshotUrls, setPaymentScreenshotUrls] = useState<string[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isAssigned, setIsAssigned] = useState<boolean | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    if (!auth.currentUser?.email) return;
    
    const emailLower = auth.currentUser.email.toLowerCase();
    const q = query(collection(db, "franchiseUsers"), where("email", "==", emailLower));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        const region = regions.find(r => r.id === userData.regionId);
        const franchise = region?.franchises.find(f => f.id === userData.franchiseId);
        
        if (region && franchise) {
          setSelectedRegion(region);
          setSelectedFranchise(franchise);
          setIsAssigned(true);
          if (step === 1) setStep(2);
        } else {
          setIsAssigned(false);
        }
      } else {
        setIsAssigned(false);
      }
    });
    
    return () => unsubscribe();
  }, [auth.currentUser, step]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "orders"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      ordersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrderHistory(ordersData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const invData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(invData);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = useCallback((product: Product) => {
    const invItem = inventory.find(i => i.id === product.id);
    const maxQty = invItem ? invItem.quantity : Infinity;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (maxQty < 1) return prev;
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [inventory]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    const invItem = inventory.find(i => i.id === id);
    const maxQty = invItem ? invItem.quantity : Infinity;

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, Math.min(item.quantity + delta, maxQty));
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, [inventory]);

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const handlePlaceOrder = async () => {
    setOrderError(null);
    if (!selectedRegion || !selectedFranchise || cart.length === 0 || !auth.currentUser) {
      setOrderError("Please select region, franchise, and add items to cart.");
      return;
    }
    
    setIsPlacingOrder(true);

    const discountAmount = (totalAmount * discountPercent) / 100;
    const finalAmount = totalAmount - discountAmount - balanceAdjustment;

    // Sanitize payload to ensure no undefined values are sent to Firestore
    const newOrder = {
      regionId: selectedRegion.id,
      regionName: selectedRegion.name,
      franchiseId: selectedFranchise.id,
      franchiseName: selectedFranchise.name,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        unit: item.unit
      })),
      totalAmount,
      discount: discountAmount,
      discountPercent,
      balanceAdjustment,
      finalAmount,
      date: new Date().toISOString(),
      status: 'Pending',
      userId: auth.currentUser.uid,
    };

    try {
      const batch = writeBatch(db);
      
      // 1. Create the order document
      const orderRef = doc(collection(db, "orders"));
      batch.set(orderRef, newOrder);
      
      // 2. Prepare inventory updates
      // We need to fetch current quantities first to ensure we don't go negative or overwrite incorrectly
      // However, for speed, we can fetch them in parallel
      const inventorySnapshots = await Promise.all(
        cart.map(item => getDoc(doc(db, "inventory", item.id)))
      );

      inventorySnapshots.forEach((invDoc, index) => {
        if (invDoc.exists()) {
          const item = cart[index];
          const currentQty = invDoc.data().quantity;
          const invDocRef = doc(db, "inventory", item.id);
          batch.update(invDocRef, { quantity: Math.max(0, currentQty - item.quantity) });
        }
      });

      // 3. Commit the batch
      await Promise.race([
        batch.commit(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out. Please check your internet connection.")), 15000)
        )
      ]);
      
      console.log("Order placed and inventory updated successfully");
      
      setCurrentOrderId(orderRef.id);
      setStep(4);
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to place order. Please try again.";
      setOrderError(errorMessage);
      alert(`Order Error: ${errorMessage}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePayment = async (urls: string[]) => {
    if (!currentOrderId || urls.length === 0) {
      setOrderError("Please provide at least one valid screenshot.");
      return;
    }
    setIsProcessingPayment(true);
    setOrderError(null);
    try {
      // Add a 30-second timeout to prevent infinite hanging
      await Promise.race([
        updateDoc(doc(db, "orders", currentOrderId), {
          paymentScreenshots: urls,
          status: 'Processing'
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out. Please check your internet connection or Firebase rules.")), 30000)
        )
      ]);
      
      setStep(5);
    } catch (error) {
      console.error("Error updating payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update payment. Please try again.";
      setOrderError(errorMessage);
      alert(`Payment Error: ${errorMessage}\n\nIf this is a permission error, please check your Firebase Firestore Security Rules.`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetOrder = () => {
    setStep(1);
    setSelectedRegion(null);
    setSelectedFranchise(null);
    setCart([]);
    setCurrentOrderId(null);
    setDiscountPercent(0);
    setBalanceAdjustment(0);
    setPaymentScreenshotUrls([]);
  };

  const exportOrderHistoryToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136);
    doc.text("WEDRINK PURCHASE HISTORY", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Franchise: ${selectedFranchise?.name}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ["Date", "Order ID", "Items", "Amount", "Status"];
    const tableRows = orderHistory.map(order => [
      new Date(order.date).toLocaleDateString(),
      `#${order.id.slice(-8)}`,
      order.items.length.toString(),
      `Rs. ${order.finalAmount.toLocaleString()}`,
      order.status
    ]);

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }
    });

    doc.save(`Purchase_History_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportOrderHistoryToExcel = () => {
    const worksheetData = [
      ["WEDRINK PURCHASE HISTORY"],
      [`Franchise: ${selectedFranchise?.name}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      ["Date", "Order ID", "Items", "Amount", "Status"],
      ...orderHistory.map(order => [
        new Date(order.date).toLocaleDateString(),
        `#${order.id.slice(-8)}`,
        order.items.length,
        order.finalAmount,
        order.status
      ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase History");
    XLSX.writeFile(workbook, `Purchase_History_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const payOrder = (order: Order) => {
    setCurrentOrderId(order.id);
    setPaymentScreenshotUrls(order.paymentScreenshots || []);
    setStep(4);
    setShowHistory(false);
  };

  const categories: { id: Product['category'], icon: any, label: string }[] = [
    { id: 'Raw Material', icon: Package, label: 'Raw Materials' },
    { id: 'Equipment', icon: Wrench, label: 'Equipment' },
    { id: 'Uniform', icon: Shirt, label: 'Uniforms' },
  ];

  const exportOrderToPDF = (order: Order) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text("WEDRINK", 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("INVOICE", 14, 30);
    
    // Order Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Order ID: #${order.id.slice(-8)}`, 14, 40);
    doc.text(`Date: ${new Date(order.date).toLocaleString()}`, 14, 46);
    doc.text(`Franchise: ${order.franchiseName}`, 14, 52);
    doc.text(`Region: ${order.regionName}`, 14, 58);
    doc.text(`Status: ${order.status}`, 14, 64);

    // Items Table
    const tableColumn = ["Item", "Category", "Quantity", "Price", "Total"];
    const tableRows = order.items.map(item => [
      item.name,
      item.category,
      item.quantity.toString(),
      `Rs. ${item.price.toLocaleString()}`,
      `Rs. ${(item.price * item.quantity).toLocaleString()}`
    ]);

    let finalY = 0;
    autoTable(doc, {
      startY: 75,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      didDrawPage: (data) => {
        finalY = data.cursor ? data.cursor.y : 0;
      }
    });

    let currentY = finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    if (order.totalAmount && order.totalAmount !== order.finalAmount) {
      doc.text(`Subtotal: Rs. ${order.totalAmount.toLocaleString()}`, 140, currentY);
      currentY += 6;
    }
    if (order.discount && order.discount > 0) {
      doc.setTextColor(22, 163, 74); // green-600
      const discountLabel = order.discountPercent ? `Discount (${order.discountPercent}%):` : `Discount:`;
      doc.text(`${discountLabel} - Rs. ${order.discount.toLocaleString()}`, 140, currentY);
      currentY += 6;
    }
    if (order.balanceAdjustment && order.balanceAdjustment > 0) {
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(`Balance Used: - Rs. ${order.balanceAdjustment.toLocaleString()}`, 140, currentY);
      currentY += 6;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Final Amount: Rs. ${order.finalAmount.toLocaleString()}`, 140, currentY + 4);

    doc.save(`Invoice_Order_${order.id.slice(-8)}.pdf`);
  };

  const exportOrderToExcel = (order: Order) => {
    const worksheetData: any[][] = [
      ["WEDRINK INVOICE"],
      [],
      ["Order ID", `#${order.id.slice(-8)}`],
      ["Date", new Date(order.date).toLocaleString()],
      ["Franchise", order.franchiseName],
      ["Region", order.regionName],
      ["Status", order.status],
      [],
      ["Item", "Category", "Quantity", "Price", "Total"],
      ...order.items.map(item => [
        item.name,
        item.category,
        item.quantity,
        item.price,
        item.price * item.quantity
      ]),
      []
    ];

    if (order.totalAmount && order.totalAmount !== order.finalAmount) {
      worksheetData.push(["", "", "", "Subtotal", order.totalAmount]);
    }
    if (order.discount && order.discount > 0) {
      const discountLabel = order.discountPercent ? `Discount (${order.discountPercent}%)` : `Discount`;
      worksheetData.push(["", "", "", discountLabel, -order.discount]);
    }
    if (order.balanceAdjustment && order.balanceAdjustment > 0) {
      worksheetData.push(["", "", "", "Balance Used", -order.balanceAdjustment]);
    }
    
    worksheetData.push(["", "", "", "Final Amount", order.finalAmount]);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
    
    XLSX.writeFile(workbook, `Invoice_Order_${order.id.slice(-8)}.xlsx`);
  };

  const filteredProducts = useMemo(() => {
    const mappedProducts: Product[] = inventory.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      unit: item.unit || 'pcs',
      category: (item.type === 'raw' ? 'Raw Material' : item.type === 'equipment' ? 'Equipment' : 'Uniform') as Product['category']
    }));

    return mappedProducts.filter(p => 
      p.category === activeCategory && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCategory, searchQuery, inventory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-20 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/back.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-50/80 via-white/80 to-teal-50/50 backdrop-blur-[2px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setShowHistory(false); resetOrder();}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm border border-slate-100">
                <img src="/Logo.png" alt="WEDRINK Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight block leading-none">WEDRINK</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Franchise Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showHistory ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">Order History</span>
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 max-w-7xl mx-auto relative z-10">
        {isAssigned === false ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-20 text-center space-y-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
            <p className="text-slate-500 leading-relaxed">
              Your email address (<span className="font-bold text-slate-900">{auth.currentUser?.email}</span>) is not assigned to any franchise. 
              Please contact the administrator to grant you access to your franchise portal.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {showHistory ? (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Purchase Records</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={exportOrderHistoryToPDF}
                    className="px-4 py-2 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    PDF
                  </button>
                  <button 
                    onClick={exportOrderHistoryToExcel}
                    className="px-4 py-2 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Excel
                  </button>
                </div>
              </div>
              <div className="grid gap-4">
                {orderHistory.map((order) => (
                  <div key={order.id} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg">Order #{order.id.slice(-8)}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.date).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {order.items.length} items • {order.franchiseName} ({order.regionName})
                      </p>
                      <p className="text-xl font-black text-slate-900 mt-2">Rs. {order.finalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedOrderDetails(order)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                      >
                        <FileText className="w-4 h-4" />
                        Details
                      </button>
                      {(order.status === 'Pending' || order.status === 'Processing') && (
                        <button 
                          onClick={() => payOrder(order)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-teal-200"
                        >
                          <CreditCard className="w-4 h-4" />
                          {order.status === 'Pending' ? 'Pay Now' : 'Update Payment'}
                        </button>
                      )}
                      <button 
                        onClick={() => exportOrderToPDF(order)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                      <button 
                        onClick={() => exportOrderToExcel(order)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-4 max-w-md mx-auto mb-12">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {s}
                    </div>
                    {s < 5 && <div className={`w-12 h-0.5 rounded-full ${step > s ? 'bg-teal-600' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-5xl mx-auto space-y-12"
                >
                  <div className="text-center space-y-4">
                    <motion.div 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="inline-block p-3 bg-teal-50 rounded-2xl mb-2"
                    >
                      <MapPin className="w-8 h-8 text-teal-600" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                      {!selectedRegion ? "Select Your Region" : `Franchises in ${selectedRegion.name}`}
                    </h2>
                    <p className="text-slate-500 max-w-lg mx-auto font-medium">
                      {!selectedRegion 
                        ? "Choose the region where your franchise is located to continue." 
                        : "Select your specific franchise location from the list below."}
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {!selectedRegion ? (
                      <motion.div 
                        key="regions-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {regions.map((region) => (
                          <motion.button
                            key={region.id}
                            variants={itemVariants}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedRegion(region)}
                            className="group relative bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border-2 border-white/20 hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-900/10 transition-all text-left overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10 space-y-4">
                              <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/30 group-hover:rotate-6 transition-transform">
                                <MapPin className="w-7 h-7" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">{region.name}</h3>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">{region.franchises.length} Active Franchises</p>
                              </div>
                              <div className="flex items-center gap-2 text-teal-600 font-bold text-sm pt-2">
                                View Franchises <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="franchises-grid"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex justify-center">
                          <button 
                            onClick={() => {
                              setSelectedRegion(null);
                              setSelectedFranchise(null);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-full font-bold text-sm hover:bg-slate-200 transition-all"
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Back to Regions
                          </button>
                        </div>

                        <motion.div 
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {selectedRegion.franchises.map((franchise) => (
                            <motion.button
                              key={franchise.id}
                              variants={itemVariants}
                              whileHover={{ y: -8, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedFranchise(franchise)}
                              className={`group relative p-8 rounded-[2.5rem] border-2 transition-all text-left overflow-hidden ${
                                selectedFranchise?.id === franchise.id
                                  ? 'border-teal-600 bg-teal-50/50 shadow-xl shadow-teal-900/10'
                                  : 'border-white/20 bg-white/60 backdrop-blur-md hover:border-teal-200 hover:shadow-xl'
                              }`}
                            >
                              <div className="relative z-10 space-y-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all overflow-hidden ${
                                  selectedFranchise?.id === franchise.id ? 'bg-white shadow-lg shadow-teal-600/20' : 'bg-slate-100 group-hover:bg-teal-100'
                                }`}>
                                  <img src="/Logo.png" alt="WEDRINK" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <h3 className={`text-2xl font-black transition-colors ${
                                    selectedFranchise?.id === franchise.id ? 'text-teal-600' : 'text-slate-900'
                                  }`}>{franchise.name}</h3>
                                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">{franchise.city}</p>
                                </div>
                                {selectedFranchise?.id === franchise.id && (
                                  <div className="flex items-center gap-2 text-teal-600 font-black text-sm pt-2">
                                    Selected <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>

                        {selectedFranchise && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-center pt-8"
                          >
                            <button 
                              onClick={() => setStep(2)}
                              className="bg-teal-600 text-white px-16 py-5 rounded-[2rem] font-black text-xl hover:bg-teal-700 transition-all shadow-2xl shadow-teal-600/30 flex items-center gap-4 group active:scale-[0.98]"
                            >
                              Start Ordering
                              <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Header Info */}
                  <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
                        <img src="/Logo.png" alt="WEDRINK" className="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl">{selectedFranchise?.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">{selectedRegion?.name} Region</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-600 transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => setStep(1)}
                        className="px-4 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Product List */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Category Tabs */}
                      <div className="flex p-1.5 bg-slate-200/50 rounded-2xl gap-1">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                              activeCategory === cat.id 
                                ? 'bg-white text-teal-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid sm:grid-cols-2 gap-4"
                      >
                        {filteredProducts.map((product) => {
                          const inCart = cart.find(item => item.id === product.id);
                          return (
                            <motion.div 
                              key={product.id} 
                              variants={itemVariants}
                              whileHover={{ y: -4 }}
                              className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/20 hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-slate-900">{product.name}</h4>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                    {product.category === 'Raw Material' ? 'Per Carton' : `Per ${product.unit}`}
                                  </p>
                                </div>
                                <p className="font-black text-teal-600">Rs. {product.price}</p>
                              </div>
                              {inCart ? (
                                <div className="flex items-center justify-between bg-teal-50 p-2 rounded-xl">
                                  <button 
                                    onClick={() => updateQuantity(product.id, -1)}
                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-teal-600 hover:bg-teal-600 hover:text-white transition-all"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="font-black text-teal-600">{inCart.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(product.id, 1)}
                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-teal-600 hover:bg-teal-600 hover:text-white transition-all"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(product)}
                                  disabled={product.category === 'Raw Material' && inventory.find(i => i.id === product.id)?.quantity === 0}
                                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                    product.category === 'Raw Material' && inventory.find(i => i.id === product.id)?.quantity === 0
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-slate-50 text-slate-600 hover:bg-teal-600 hover:text-white'
                                  }`}
                                >
                                  {product.category === 'Raw Material' && inventory.find(i => i.id === product.id)?.quantity === 0 ? "Out of Stock" : <><Plus className="w-4 h-4" /> Add to Order</>}
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="space-y-6">
                      <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 overflow-hidden sticky top-24">
                        <div className="bg-slate-900 p-6 text-white">
                          <h3 className="font-black text-xl flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6 text-teal-400" />
                            Order Summary
                          </h3>
                        </div>
                        <div className="p-6 space-y-6">
                          {cart.length === 0 ? (
                            <div className="text-center py-12 space-y-3">
                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Package className="text-slate-300 w-6 h-6" />
                              </div>
                              <p className="text-slate-400 text-sm font-medium">Cart is empty</p>
                            </div>
                          ) : (
                            <>
                              <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                <AnimatePresence initial={false}>
                                  {cart.map((item) => (
                                    <motion.div 
                                      key={item.id} 
                                      initial={{ opacity: 0, height: 0, x: -20 }}
                                      animate={{ opacity: 1, height: 'auto', x: 0 }}
                                      exit={{ opacity: 0, height: 0, x: 20 }}
                                      className="flex justify-between items-center group overflow-hidden"
                                    >
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-sm text-slate-900">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                          Rs. {item.price} x {item.quantity}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <p className="font-black text-sm text-slate-900">Rs. {item.price * item.quantity}</p>
                                        <button 
                                          onClick={() => updateQuantity(item.id, -item.quantity)}
                                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                              <div className="pt-6 border-t border-slate-100 space-y-4">
                                <div className="flex justify-between items-end">
                                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount</p>
                                  <p className="text-3xl font-black text-slate-900 leading-none">Rs. {totalAmount.toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={() => setStep(3)}
                                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
                                >
                                  Review Order
                                  <ArrowRight className="w-5 h-5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-3xl mx-auto"
                >
                  <div className="bg-white/60 backdrop-blur-md rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden border border-white/20">
                    {/* Invoice Header */}
                    <div className="bg-slate-900 p-10 text-white flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-white shadow-lg shadow-teal-900/20">
                            <img src="/Logo.png" alt="WEDRINK" className="w-full h-full object-contain p-1" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black tracking-tight">WEDRINK</h2>
                            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.2em]">Official Invoice</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Bill To:</p>
                          <h3 className="text-xl font-black">{selectedFranchise?.name}</h3>
                          <p className="text-sm text-slate-400">{selectedRegion?.name} Region, Pakistan</p>
                        </div>
                      </div>
                      <div className="text-right space-y-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Date</p>
                          <p className="font-bold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                          <p className="font-mono font-bold text-teal-400 text-sm">#WD-{Date.now().toString().slice(-6)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Body */}
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-10"
                    >
                      <motion.table variants={itemVariants} className="w-full">
                        <thead>
                          <tr className="text-left border-b-2 border-slate-100">
                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Item Description</th>
                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Price</th>
                            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {cart.map((item) => (
                            <tr key={item.id}>
                              <td className="py-5">
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                              </td>
                              <td className="py-5 text-center font-bold text-slate-600">{item.quantity}</td>
                              <td className="py-5 text-right font-medium text-slate-600">Rs. {item.price.toLocaleString()}</td>
                              <td className="py-5 text-right font-black text-slate-900">Rs. {(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </motion.table>

                      <motion.div variants={itemVariants} className="mt-10 pt-10 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1 space-y-6">
                          <div className="max-w-[300px] space-y-4">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <Palette className="w-4 h-4 text-teal-600" />
                              Adjustments & Discounts
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Discount (%)</label>
                                <input 
                                  type="number" 
                                  value={discountPercent}
                                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none transition-all"
                                  placeholder="e.g. 10"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Balance Used / Credit (Rs.)</label>
                                <input 
                                  type="number" 
                                  value={balanceAdjustment}
                                  onChange={(e) => setBalanceAdjustment(Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 outline-none transition-all"
                                  placeholder="e.g. 500"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="max-w-[240px] space-y-2">
                            <h4 className="font-bold text-slate-900 text-sm">Terms & Conditions</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                              Payment is due within 7 days. Please ensure all items are checked upon delivery. 
                              Monthly purchase records are automatically updated in your franchise portal.
                            </p>
                          </div>
                        </div>
                        <div className="w-64 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                            <span className="font-bold text-slate-900">Rs. {totalAmount.toLocaleString()}</span>
                          </div>
                          {discountPercent > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span className="font-bold uppercase tracking-widest text-[10px]">Discount ({discountPercent}%)</span>
                              <span className="font-bold">- Rs. {((totalAmount * discountPercent) / 100).toLocaleString()}</span>
                            </div>
                          )}
                          {balanceAdjustment !== 0 && (
                            <div className="flex justify-between text-sm text-teal-600">
                              <span className="font-bold uppercase tracking-widest text-[10px]">Balance Used</span>
                              <span className="font-bold">- Rs. {Math.abs(balanceAdjustment).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                            <span className="text-slate-900 font-black uppercase tracking-widest text-sm">Net Total</span>
                            <span className="text-3xl font-black text-teal-600 leading-none">
                              Rs. {(totalAmount - (totalAmount * discountPercent / 100) - balanceAdjustment).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Actions */}
                    <div className="p-10 bg-slate-50 flex flex-col gap-4">
                      {orderError && <p className="text-red-500 font-bold text-center">{orderError}</p>}
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setStep(2)}
                          className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                        >
                          Edit Order
                        </button>
                        <button 
                          onClick={handlePlaceOrder}
                          disabled={isPlacingOrder}
                          className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isPlacingOrder ? "Placing Order..." : "Confirm & Place Order"}
                          {!isPlacingOrder && <CheckCircle2 className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto text-center space-y-8"
                >
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="w-20 h-20 bg-teal-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                      <CreditCard className="text-teal-600 w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Payment Details</h2>
                    <p className="text-slate-500 max-w-md mx-auto font-medium">Please transfer the total amount to the bank account below and upload the screenshot.</p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm text-left space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center">
                        <DollarSign className="text-teal-600 w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Amount to Pay</p>
                        <p className="text-3xl font-black text-slate-900">
                          Rs. {(orderHistory.find(o => o.id === currentOrderId)?.finalAmount || (totalAmount - (totalAmount * discountPercent) / 100 - balanceAdjustment)).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Bank Name</p>
                        <p className="font-bold text-slate-900 text-lg">MEEZAN Bank</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Account Title</p>
                        <p className="font-bold text-slate-900 text-lg">DB LINK (PRIVATE) LIMITED</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">IBAN</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono font-bold text-slate-900 text-base break-all bg-white p-3 rounded-xl border border-slate-200 flex-1">PK74MEZN0002460104429936</p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("PK74MEZN0002460104429936");
                              alert("IBAN Copied!");
                            }}
                            className="p-3 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition-all"
                            title="Copy IBAN"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-4 text-left">
                    <label className="block text-sm font-bold text-slate-700">Upload Payment Screenshots (Up to 3)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="relative aspect-square">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  alert("File is too large. Please select an image under 10MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    let width = img.width;
                                    let height = img.height;
                                    const MAX_WIDTH = 800;
                                    
                                    if (width > MAX_WIDTH) {
                                      height = Math.round((height * MAX_WIDTH) / width);
                                      width = MAX_WIDTH;
                                    }
                                    
                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(img, 0, 0, width, height);
                                    
                                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                                    setPaymentScreenshotUrls(prev => {
                                      const newUrls = [...prev];
                                      newUrls[index] = compressedBase64;
                                      return newUrls;
                                    });
                                  };
                                  img.src = reader.result as string;
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden ${paymentScreenshotUrls[index] ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                            {paymentScreenshotUrls[index] ? (
                              <img src={paymentScreenshotUrls[index]} alt="Payment" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-600 text-center px-2">Tap to upload</p>
                              </>
                            )}
                          </div>
                          {paymentScreenshotUrls[index] && (
                            <button 
                              onClick={() => setPaymentScreenshotUrls(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full z-20 shadow-lg"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {orderError && <p className="text-red-500 font-bold">{orderError}</p>}
                  
                  <motion.button 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePayment(paymentScreenshotUrls.filter(Boolean))}
                    disabled={isProcessingPayment || paymentScreenshotUrls.filter(Boolean).length === 0}
                    className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 disabled:opacity-50 transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? "Processing..." : "Submit Payment"}
                  </motion.button>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto text-center space-y-8 py-12"
                >
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-green-100 rounded-[40px] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="text-green-600 w-16 h-16" />
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
                    >
                      <Rocket className="text-teal-600 w-5 h-5" />
                    </motion.div>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black text-slate-900">Order Placed!</h2>
                    <p className="text-slate-500 text-lg leading-relaxed">
                      Your order has been placed successfully. The order status is currently <span className="text-teal-600 font-bold">Processing</span>.
                    </p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm space-y-6 text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Franchise</span>
                        <span className="font-bold text-slate-900">{selectedFranchise?.name}</span>
                      </div>
                      
                      {(() => {
                        const order = orderHistory.find(o => o.id === currentOrderId);
                        if (order && ((order.discount && order.discount > 0) || (order.balanceAdjustment && order.balanceAdjustment > 0))) {
                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                                <span className="font-bold text-slate-900">Rs. {order.totalAmount.toLocaleString()}</span>
                              </div>
                              {order.discount && order.discount > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-400 font-bold uppercase tracking-widest">
                                    Discount {order.discountPercent ? `(${order.discountPercent}%)` : ''}
                                  </span>
                                  <span className="font-bold text-green-600">- Rs. {order.discount.toLocaleString()}</span>
                                </div>
                              )}
                              {order.balanceAdjustment && order.balanceAdjustment > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-400 font-bold uppercase tracking-widest">Balance Used</span>
                                  <span className="font-bold text-blue-600">- Rs. {order.balanceAdjustment.toLocaleString()}</span>
                                </div>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}

                      <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Final Amount</span>
                        <span className="font-black text-teal-600 text-lg">Rs. {(orderHistory.find(o => o.id === currentOrderId)?.finalAmount || totalAmount).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <CheckCircle2 className="text-green-600 w-4 h-4" />
                        Order Status: Processing
                      </h3>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const order = orderHistory.find(o => o.id === currentOrderId);
                        if (order) exportOrderToPDF(order);
                      }}
                      className="flex-1 bg-white text-teal-600 border border-teal-100 py-4 rounded-2xl font-bold hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Download PDF
                    </button>
                    <button 
                      onClick={() => {
                        const order = orderHistory.find(o => o.id === currentOrderId);
                        if (order) exportOrderToExcel(order);
                      }}
                      className="flex-1 bg-white text-teal-600 border border-teal-100 py-4 rounded-2xl font-bold hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      Download Excel
                    </button>
                  </div>

                  <button 
                    onClick={resetOrder}
                    className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-teal-700 transition-all shadow-2xl shadow-teal-600/30 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    Place Another Order
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
        )}
        {selectedOrderDetails && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-black">Order Details</h3>
                  <p className="text-teal-400 font-bold uppercase text-xs tracking-widest mt-1">#{selectedOrderDetails.id.slice(-8)}</p>
                </div>
                <button onClick={() => setSelectedOrderDetails(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Items in Order</h4>
                  <div className="space-y-3">
                    {selectedOrderDetails.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rs. {item.price.toLocaleString()} x {item.quantity}</p>
                        </div>
                        <p className="font-black text-slate-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                    <span className="font-bold">Rs. {selectedOrderDetails.totalAmount.toLocaleString()}</span>
                  </div>
                  {selectedOrderDetails.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Discount ({selectedOrderDetails.discountPercent}%)</span>
                      <span className="font-bold text-green-400">- Rs. {selectedOrderDetails.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrderDetails.balanceAdjustment > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Balance Used</span>
                      <span className="font-bold text-teal-400">- Rs. {selectedOrderDetails.balanceAdjustment.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="font-black uppercase tracking-widest text-sm">Final Amount</span>
                    <span className="text-3xl font-black text-teal-400">Rs. {selectedOrderDetails.finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {selectedOrderDetails.paymentScreenshots && selectedOrderDetails.paymentScreenshots.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Payment Proof</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOrderDetails.paymentScreenshots.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden border border-slate-200 hover:border-teal-500 transition-all">
                          <img src={url} alt={`Payment Proof ${idx + 1}`} className="w-full h-32 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
