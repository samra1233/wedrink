import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Store, BarChart3, Search, Package, DollarSign, Clock, LogOut, Box, Plus, Minus, RefreshCw, X, History, MapPin, LayoutDashboard, ClipboardList, Wrench, Shirt, ArrowRight, Edit2, Check, Save, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Order {
  id: string;
  franchiseName: string;
  regionName: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount?: number;
  discount?: number;
  discountPercent?: number;
  balanceAdjustment?: number;
  finalAmount: number;
  paymentScreenshot?: string;
  date: string;
  items: { id: string; name: string; quantity: number; price: number; category: 'Raw Material' | 'Equipment' | 'Uniform' }[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'raw' | 'equipment' | 'uniform';
}

const initialInventoryData: InventoryItem[] = [
  // Raw Materials
  { id: 'RAW001', name: 'original ice cream powder', quantity: 1098, type: 'raw' },
  { id: 'RAW002', name: 'matcha ice cream powder', quantity: 691, type: 'raw' },
  { id: 'RAW003', name: 'ice cream cone', quantity: 1088, type: 'raw' },
  { id: 'RAW004', name: 'milk tea powder', quantity: 548, type: 'raw' },
  { id: 'RAW005', name: 'cappuccino powder', quantity: 55, type: 'raw' },
  { id: 'RAW006', name: 'latte powder', quantity: 31, type: 'raw' },
  { id: 'RAW007', name: 'pearl', quantity: 1053, type: 'raw' },
  { id: 'RAW008', name: 'fruit honey', quantity: 594, type: 'raw' },
  { id: 'RAW009', name: 'fructose', quantity: 853, type: 'raw' },
  { id: 'RAW010', name: 'black sugar', quantity: 314, type: 'raw' },
  { id: 'RAW011', name: 'orange juice', quantity: 59, type: 'raw' },
  { id: 'RAW012', name: 'grape juice', quantity: 422, type: 'raw' },
  { id: 'RAW013', name: 'passion fruit juice', quantity: 1504, type: 'raw' },
  { id: 'RAW014', name: 'coconut', quantity: 1716, type: 'raw' },
  { id: 'RAW015', name: 'rasberry juice', quantity: 337, type: 'raw' },
  { id: 'RAW016', name: 'strawberry jam', quantity: 499, type: 'raw' },
  { id: 'RAW017', name: 'chocolate jam', quantity: 402, type: 'raw' },
  { id: 'RAW018', name: 'red grapefruit', quantity: 152, type: 'raw' },
  { id: 'RAW019', name: 'redbean can', quantity: 821, type: 'raw' },
  { id: 'RAW020', name: 'blueberry jam', quantity: 414, type: 'raw' },
  { id: 'RAW021', name: 'pinkpeach jam', quantity: 935, type: 'raw' },
  { id: 'RAW022', name: 'mongo smoothie powder', quantity: 259, type: 'raw' },
  { id: 'RAW023', name: 'mango jam', quantity: 281, type: 'raw' },
  { id: 'RAW024', name: 'jasmine tea', quantity: 141, type: 'raw' },
  { id: 'RAW025', name: 'grape fruit can', quantity: 821, type: 'raw' },
  { id: 'RAW026', name: 'black tea', quantity: 82, type: 'raw' },
  { id: 'RAW027', name: 'sour plum powder', quantity: 57, type: 'raw' },
  { id: 'RAW028', name: 'peach jelly', quantity: 673, type: 'raw' },
  { id: 'RAW029', name: 'pudding', quantity: 145, type: 'raw' },
  { id: 'RAW030', name: '500pp cup', quantity: 194, type: 'raw' },
  { id: 'RAW031', name: '700pp cup', quantity: 667, type: 'raw' },
  { id: 'RAW032', name: 'super bucket', quantity: 755, type: 'raw' },
  { id: 'RAW033', name: 'Sundae U cup', quantity: 418, type: 'raw' },
  { id: 'RAW034', name: 'Thick straw', quantity: 341, type: 'raw' },
  { id: 'RAW035', name: 'thin straw', quantity: 54, type: 'raw' },
  { id: 'RAW036', name: 'Spherical lid', quantity: 277, type: 'raw' },
  { id: 'RAW037', name: 'sealing rolls', quantity: 134, type: 'raw' },
  { id: 'RAW038', name: 'long spoon', quantity: 132, type: 'raw' },
  { id: 'RAW039', name: 'special spoon', quantity: 362, type: 'raw' },
  { id: 'RAW040', name: 'single cup bag', quantity: 0, type: 'raw' },
  { id: 'RAW041', name: 'double cup bag', quantity: 0, type: 'raw' },
  { id: 'RAW042', name: 'four cup bag', quantity: 0, type: 'raw' },
  { id: 'RAW043', name: '16A paper cup', quantity: 76, type: 'raw' },
  { id: 'RAW044', name: 'plasitc lid', quantity: 74, type: 'raw' },

  // Equipment
  { id: 'EQP001', name: 'Ice Cream Machine', quantity: 8, type: 'equipment' },
  { id: 'EQP002', name: 'Ice Making Machine', quantity: 9, type: 'equipment' },
  { id: 'EQP003', name: 'Sealing Machine', quantity: 52, type: 'equipment' },
  { id: 'EQP004', name: 'Hot Water Machine', quantity: 29, type: 'equipment' },
  { id: 'EQP005', name: 'Refrigerator', quantity: 7, type: 'equipment' },
  { id: 'EQP006', name: 'Freezer', quantity: 14, type: 'equipment' },
  { id: 'EQP007', name: 'Fructose machine', quantity: 52, type: 'equipment' },
  { id: 'EQP008', name: 'RO-Water purifiers', quantity: 9, type: 'equipment' },
  { id: 'EQP009', name: 'Pure water machine storage tank', quantity: 10, type: 'equipment' },
  { id: 'EQP010', name: 'Ice Cream Model', quantity: 9, type: 'equipment' },
  { id: 'EQP011', name: 'Pearl Cooker', quantity: 6, type: 'equipment' },
  { id: 'EQP012', name: 'Slicer', quantity: 2, type: 'equipment' },
  { id: 'EQP013', name: 'Blender', quantity: 21, type: 'equipment' },
  { id: 'EQP014', name: 'Weight measurer 1g', quantity: 80, type: 'equipment' },
  { id: 'EQP015', name: 'Weight measurer 0.1g', quantity: 219, type: 'equipment' },
  { id: 'EQP016', name: 'Lemon stick', quantity: 17, type: 'equipment' },
  { id: 'EQP017', name: 'Stainless steel bucket', quantity: 153, type: 'equipment' },
  { id: 'EQP018', name: 'S.S steel bucket (small)', quantity: 151, type: 'equipment' },
  { id: 'EQP019', name: 'Thermos', quantity: 399, type: 'equipment' },
  { id: 'EQP020', name: 'Leaky net', quantity: 267, type: 'equipment' },
  { id: 'EQP021', name: 'Egg stirrer', quantity: 221, type: 'equipment' },
  { id: 'EQP022', name: 'Big Ice Shovel', quantity: 78, type: 'equipment' },
  { id: 'EQP023', name: 'Measuring spoon', quantity: 1580, type: 'equipment' },
  { id: 'EQP024', name: 'Can openner', quantity: 431, type: 'equipment' },
  { id: 'EQP025', name: 'Bar spoons', quantity: 331, type: 'equipment' },
  { id: 'EQP026', name: '5000ml measure cup', quantity: 360, type: 'equipment' },
  { id: 'EQP027', name: '2000ml measure cup', quantity: 360, type: 'equipment' },
  { id: 'EQP028', name: '300ml measure cup', quantity: 457, type: 'equipment' },
  { id: 'EQP029', name: 'Leaky bag', quantity: 330, type: 'equipment' },
  { id: 'EQP030', name: 'Chocolate Presser', quantity: 104, type: 'equipment' },
  { id: 'EQP031', name: 'Sugar pressure flask', quantity: 144, type: 'equipment' },
  { id: 'EQP032', name: 'Stainless steel spoon', quantity: 253, type: 'equipment' },
  { id: 'EQP033', name: 'Stainless steel colander', quantity: 252, type: 'equipment' },
  { id: 'EQP034', name: 'Cup holder', quantity: 128, type: 'equipment' },
  { id: 'EQP035', name: 'Powder box', quantity: 451, type: 'equipment' },
  { id: 'EQP036', name: 'Straw organizer', quantity: 127, type: 'equipment' },
  { id: 'EQP037', name: 'Thermometer', quantity: 192, type: 'equipment' },
  { id: 'EQP038', name: 'Timer', quantity: 367, type: 'equipment' },
  { id: 'EQP039', name: 'Sealing clip', quantity: 132, type: 'equipment' },
  { id: 'EQP040', name: 'Towels', quantity: 59, type: 'equipment' },
  { id: 'EQP041', name: 'Shake Cup-700cc', quantity: 132, type: 'equipment' },
  { id: 'EQP042', name: 'Curtain', quantity: 69, type: 'equipment' },
  { id: 'EQP043', name: 'Pool 1500*620*800', quantity: 12, type: 'equipment' },
  { id: 'EQP044', name: 'Shelving (large)', quantity: 72, type: 'equipment' },
  { id: 'EQP045', name: '2m Light box', quantity: 9, type: 'equipment' },
  { id: 'EQP046', name: '3m Light box', quantity: 26, type: 'equipment' },
  { id: 'EQP047', name: 'Plastic doll', quantity: 5, type: 'equipment' },
  { id: 'EQP048', name: 'A set of cash register', quantity: 74, type: 'equipment' },
  { id: 'EQP049', name: '20 inches PP filter cartridge', quantity: 31, type: 'equipment' },
  { id: 'EQP050', name: 'PP cotton integrated filter cartridge', quantity: 32, type: 'equipment' },
  { id: 'EQP051', name: '20 inches UDF filter cartridge', quantity: 28, type: 'equipment' },
  { id: 'EQP052', name: '20 inches resin filter cartridge', quantity: 29, type: 'equipment' },
  { id: 'EQP053', name: 'RO membrane filter cartridge', quantity: 48, type: 'equipment' },
  { id: 'EQP054', name: '4 meter Arches', quantity: 10, type: 'equipment' },
  { id: 'EQP055', name: '6 meter Arches', quantity: 0, type: 'equipment' },
  { id: 'EQP056', name: 'Doll', quantity: 10, type: 'equipment' },
  { id: 'EQP057', name: 'Ice cream machine dasher rubber sleeve', quantity: 0, type: 'equipment' },

  // Uniform
  { id: 'UNI001', name: 'clothes (S)', quantity: 45, type: 'uniform' },
  { id: 'UNI002', name: 'clothes (M)', quantity: 1, type: 'uniform' },
  { id: 'UNI003', name: 'clothes (L)', quantity: 14, type: 'uniform' },
  { id: 'UNI004', name: 'clothes (XL)', quantity: 97, type: 'uniform' },
  { id: 'UNI005', name: 'clothes (XXL)', quantity: 0, type: 'uniform' },
  { id: 'UNI006', name: 'apron', quantity: 166, type: 'uniform' },
  { id: 'UNI007', name: 'hat', quantity: 98, type: 'uniform' },
  { id: 'UNI008', name: 'sleeve', quantity: 161, type: 'uniform' },
  { id: 'UNI009', name: 'Jacket (M)', quantity: 59, type: 'uniform' },
  { id: 'UNI010', name: 'Jacket (L)', quantity: 197, type: 'uniform' },
  { id: 'UNI011', name: 'Jacket (XL)', quantity: 14, type: 'uniform' },
  { id: 'UNI012', name: 'Blue Shirts S', quantity: 11, type: 'uniform' },
  { id: 'UNI013', name: 'Blue Shirts M', quantity: 20, type: 'uniform' },
  { id: 'UNI014', name: 'Blue Shirts L', quantity: 24, type: 'uniform' },
  { id: 'UNI015', name: 'Blue Shirts XL', quantity: 14, type: 'uniform' },
  { id: 'UNI016', name: 'Blue Shirts XXL', quantity: 10, type: 'uniform' },
  { id: 'UNI017', name: 'office Jackets M', quantity: 0, type: 'uniform' },
  { id: 'UNI018', name: 'office Jackets L', quantity: 0, type: 'uniform' },
  { id: 'UNI019', name: 'office Jackets XL', quantity: 0, type: 'uniform' },
];

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'franchise' | 'region' | 'inventory' | 'revenue'>('orders');
  const [selectedFranchiseForDetail, setSelectedFranchiseForDetail] = useState<string | null>(null);
  const [inventoryCategory, setInventoryCategory] = useState<'all' | 'raw' | 'equipment' | 'uniform'>('all');
  const [franchiseCategoryFilter, setFranchiseCategoryFilter] = useState<'all' | 'Raw Material' | 'Equipment' | 'Uniform'>('all');
  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending'>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedLedger, setExpandedLedger] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', quantity: 0, type: 'raw' });
  const [ledgerDateFilter, setLedgerDateFilter] = useState("");
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState("");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
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

  const seedInventory = async () => {
    setIsSeeding(true);
    try {
      for (const item of initialInventoryData) {
        await setDoc(doc(db, "inventory", item.id), item);
      }
      alert("Inventory initialized successfully!");
    } catch (error) {
      console.error("Error seeding inventory:", error);
      alert("Failed to initialize inventory.");
    } finally {
      setIsSeeding(false);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status'], items: Order['items']) => {
    await updateDoc(doc(db, "orders", orderId), { status });
    
    if (status === 'Cancelled') {
      for (const item of items) {
        const invDocRef = doc(db, "inventory", item.id);
        const invDoc = await getDoc(invDocRef);
        if (invDoc.exists()) {
          const currentQty = invDoc.data().quantity;
          await updateDoc(invDocRef, { quantity: currentQty + item.quantity });
        }
      }
    }
  };

  const adjustInventory = async (itemId: string, delta: number) => {
    const invDocRef = doc(db, "inventory", itemId);
    const invDoc = await getDoc(invDocRef);
    if (invDoc.exists()) {
      const currentQty = invDoc.data().quantity;
      await updateDoc(invDocRef, { quantity: Math.max(0, currentQty + delta) });
    }
  };

  const setInventoryQuantity = async (itemId: string, newQty: number) => {
    if (isNaN(newQty) || newQty < 0) return;
    const invDocRef = doc(db, "inventory", itemId);
    await updateDoc(invDocRef, { quantity: newQty });
  };

  const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    const invDocRef = doc(db, "inventory", itemId);
    await updateDoc(invDocRef, updates);
    setEditingItem(null);
  };

  const addNewInventoryItem = async () => {
    if (!newItem.name || !newItem.type) return;
    const id = `${newItem.type?.toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    await setDoc(doc(db, "inventory", id), { ...newItem, id });
    setIsAddingItem(false);
    setNewItem({ name: '', quantity: 0, type: 'raw' });
  };

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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.franchiseName.toLowerCase().includes(search.toLowerCase()) || 
                            o.regionName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = orderFilter === 'all' || (orderFilter === 'pending' && o.status === 'Pending');
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, orderFilter]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    return { totalRevenue, pendingOrders, totalOrders: orders.length };
  }, [orders]);

  const franchiseReport = useMemo(() => {
    const report: Record<string, { 
      total: number, 
      monthly: Record<string, { 
        total: number, 
        categories: Record<string, number>, 
        daily: Record<string, { 
          displayDate: string,
          total: number, 
          categories: Record<string, number>, 
          itemSummary: Record<string, Record<string, { quantity: number, total: number }>>,
          orders: Order[] 
        }> 
      }>, 
      categories: Record<string, number>,
      history: Order[] 
    }> = {};
    
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      
      const orderDate = new Date(order.date);
      const orderMonth = orderDate.toISOString().slice(0, 7); // YYYY-MM
      const orderDay = orderDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const dayDisplay = orderDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      // Apply Filters
      if (ledgerDateFilter && orderDay !== ledgerDateFilter) return;
      if (ledgerMonthFilter && orderMonth !== ledgerMonthFilter) return;

      if (!report[order.franchiseName]) {
        report[order.franchiseName] = { 
          total: 0, 
          monthly: {}, 
          categories: { 'Raw Material': 0, 'Equipment': 0, 'Uniform': 0 },
          history: [] 
        };
      }
      report[order.franchiseName].total += order.finalAmount;
      report[order.franchiseName].history.push(order);
      
      const monthYear = orderDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!report[order.franchiseName].monthly[monthYear]) {
        report[order.franchiseName].monthly[monthYear] = {
          total: 0,
          categories: { 'Raw Material': 0, 'Equipment': 0, 'Uniform': 0 },
          daily: {}
        };
      }

      report[order.franchiseName].monthly[monthYear].total += order.finalAmount;
      if (!report[order.franchiseName].monthly[monthYear].daily[orderDay]) {
        report[order.franchiseName].monthly[monthYear].daily[orderDay] = {
          displayDate: dayDisplay,
          total: 0,
          categories: { 'Raw Material': 0, 'Equipment': 0, 'Uniform': 0 },
          itemSummary: { 'Raw Material': {}, 'Equipment': {}, 'Uniform': {} } as Record<string, Record<string, { quantity: number, total: number }>>,
          orders: []
        };
      }
      report[order.franchiseName].monthly[monthYear].daily[orderDay].total += order.finalAmount;
      report[order.franchiseName].monthly[monthYear].daily[orderDay].orders.push(order);

      // Calculate category totals for this order
      order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (report[order.franchiseName].categories[item.category] !== undefined) {
          report[order.franchiseName].categories[item.category] += itemTotal;
          report[order.franchiseName].monthly[monthYear].categories[item.category] += itemTotal;
          report[order.franchiseName].monthly[monthYear].daily[orderDay].categories[item.category] += itemTotal;
          
          // Aggregate items for daily summary
          const dailyItems = report[order.franchiseName].monthly[monthYear].daily[orderDay].itemSummary[item.category];
          if (!dailyItems[item.name]) {
            dailyItems[item.name] = { quantity: 0, total: 0 };
          }
          dailyItems[item.name].quantity += item.quantity;
          dailyItems[item.name].total += itemTotal;
        }
      });
    });
    
    Object.values(report).forEach(r => {
      r.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.entries(report).map(([name, data]) => ({ name, ...data }));
  }, [orders, ledgerDateFilter, ledgerMonthFilter]);

  const regionReport = useMemo(() => {
    const report: Record<string, { 
      total: number, 
      monthly: Record<string, number>, 
      categories: Record<string, number>,
      history: Order[],
      franchises: Record<string, {
        total: number,
        categories: Record<string, number>
      }>
    }> = {};
    
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;

      const orderDate = new Date(order.date);
      const orderMonth = orderDate.toISOString().slice(0, 7); // YYYY-MM
      const orderDay = orderDate.toISOString().slice(0, 10); // YYYY-MM-DD

      // Apply Filters
      if (ledgerDateFilter && orderDay !== ledgerDateFilter) return;
      if (ledgerMonthFilter && orderMonth !== ledgerMonthFilter) return;

      if (!report[order.regionName]) {
        report[order.regionName] = { 
          total: 0, 
          monthly: {}, 
          categories: { 'Raw Material': 0, 'Equipment': 0, 'Uniform': 0 },
          history: [],
          franchises: {}
        };
      }
      report[order.regionName].total += order.finalAmount;
      report[order.regionName].history.push(order);
      
      if (!report[order.regionName].franchises[order.franchiseName]) {
        report[order.regionName].franchises[order.franchiseName] = {
          total: 0,
          categories: { 'Raw Material': 0, 'Equipment': 0, 'Uniform': 0 }
        };
      }
      report[order.regionName].franchises[order.franchiseName].total += order.finalAmount;

      // Calculate category totals for this order
      order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (report[order.regionName].categories[item.category] !== undefined) {
          report[order.regionName].categories[item.category] += itemTotal;
          report[order.regionName].franchises[order.franchiseName].categories[item.category] += itemTotal;
        }
      });
      
      const monthYear = orderDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      report[order.regionName].monthly[monthYear] = (report[order.regionName].monthly[monthYear] || 0) + order.finalAmount;
    });
    
    Object.values(report).forEach(r => {
      r.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.entries(report).map(([name, data]) => ({ name, ...data }));
  }, [orders, ledgerDateFilter, ledgerMonthFilter]);

  const groupedOrdersByDate = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    orders.forEach(order => {
      const dateStr = new Date(order.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(order);
    });
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [orders]);

  return (
    <div className="flex bg-slate-50 min-h-screen selection:bg-teal-100 selection:text-teal-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-40 shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-teal-50 shrink-0">
              <img src="/Logo.png" alt="WEDRINK" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">WEDRINK</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'orders', icon: LayoutDashboard, label: 'Live Orders' },
              { id: 'history', icon: History, label: 'Order History' },
              { id: 'franchise', icon: Store, label: 'Franchise Ledger' },
              { id: 'region', icon: MapPin, label: 'Region Reports' },
              { id: 'revenue', icon: DollarSign, label: 'Revenue Ledger' },
              { id: 'inventory', icon: Box, label: 'Inventory' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedFranchiseForDetail(null);
                }} 
                className={`w-full px-4 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-teal-50 text-teal-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-teal-600' : 'text-slate-400'}`} />
                <span className="text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 bg-teal-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
          {activeTab === 'inventory' && (
            <button 
              onClick={seedInventory} 
              disabled={isSeeding}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} /> 
              <span className="text-xs">{isSeeding ? 'Initializing...' : 'Reset Inventory'}</span>
            </button>
          )}
          <button 
            onClick={() => signOut(auth)} 
            className="w-full px-4 py-3.5 rounded-2xl bg-white text-red-600 border border-red-100 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" /> 
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto max-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab === 'orders' ? 'Live Orders' : activeTab.replace(/([A-Z])/g, ' $1')}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === 'orders' && 'Real-time order management and tracking'}
              {activeTab === 'history' && 'Complete historical record of all transactions'}
              {activeTab === 'franchise' && 'Detailed financial ledger for each franchise'}
              {activeTab === 'region' && 'Performance analysis by geographic region'}
              {activeTab === 'inventory' && 'Stock level monitoring and management'}
            </p>
          </div>

          {activeTab === 'orders' && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">System Online</span>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { id: 'total', label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'teal' },
                  { id: 'pending', label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'yellow' },
                  { id: 'revenue', label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'green' }
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (stat.id === 'total') setOrderFilter('all');
                      if (stat.id === 'pending') setOrderFilter('pending');
                      if (stat.id === 'revenue') setActiveTab('revenue');
                    }}
                    className={`bg-white p-8 rounded-[2.5rem] shadow-sm border flex items-center gap-6 group hover:shadow-xl hover:shadow-${stat.color}-900/5 transition-all cursor-pointer ${
                      (stat.id === 'total' && orderFilter === 'all') || (stat.id === 'pending' && orderFilter === 'pending') 
                        ? `border-${stat.color}-400 ring-4 ring-${stat.color}-50` 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-16 h-16 bg-${stat.color}-50 text-${stat.color}-600 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <stat.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by franchise or region..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pl-16 pr-6 py-5 bg-white rounded-[2rem] border border-slate-200 shadow-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium text-slate-700" 
                />
              </div>

              <div className="grid gap-6">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border border-slate-100 group-hover:border-teal-100 transition-all shadow-sm overflow-hidden">
                        <img src="/Logo.png" alt="WEDRINK" className="w-12 h-12 object-contain" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900 group-hover:text-teal-600 transition-colors">{order.franchiseName}</h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3" /> {order.regionName} 
                          <span className="text-slate-300">•</span> 
                          <Clock className="w-3 h-3" /> {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                      <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <select 
                          value={order.status}
                          onChange={(e) => {
                            if (e.target.value === 'Cancelled') {
                              setOrderToCancel(order);
                            } else {
                              updateStatus(order.id, e.target.value as Order['status'], order.items);
                            }
                          }}
                          className={`appearance-none px-4 py-2 rounded-xl font-bold text-sm focus:outline-none transition-all cursor-pointer border-2 ${
                            order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 hover:border-yellow-200' :
                            order.status === 'Processing' ? 'bg-teal-50 text-teal-700 border-teal-100 hover:border-teal-200' :
                            order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-200' :
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100 hover:border-green-200' :
                            'bg-red-50 text-red-700 border-red-100 hover:border-red-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                        <p className="font-black text-2xl text-slate-900">Rs. {order.finalAmount.toLocaleString()}</p>
                      </div>

                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        className="ml-auto md:ml-0 p-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center gap-2"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {groupedOrdersByDate.map(([date, dateOrders]) => (
              <div key={date} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-4">{date}</h2>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid gap-4">
                  {dateOrders.map(order => (
                    <div key={order.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                          <ClipboardList className="w-7 h-7 text-slate-400 group-hover:text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-slate-900 group-hover:text-teal-600 transition-colors">{order.franchiseName}</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> {order.regionName}
                            <span className="text-slate-200">•</span>
                            <Clock className="w-3 h-3" /> {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 w-full md:w-auto">
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'Processing' ? 'bg-teal-100 text-teal-700' :
                            order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                          <p className="font-black text-xl text-slate-900">Rs. {order.finalAmount.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedOrder(order)} 
                          className="ml-auto md:ml-0 p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupedOrdersByDate.length === 0 && (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <History className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No History Found</h3>
                <p className="text-slate-500 mt-2">Your order history will appear here once orders are processed.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'revenue' && (
          <motion.div 
            key="revenue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Total Revenue Ledger</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Detailed breakdown of all transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cumulative Revenue</p>
                <p className="text-4xl font-black text-green-600">Rs. {stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Franchise</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">{new Date(order.date).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.date).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-8 py-6 font-mono text-xs text-slate-500">#{order.id.slice(-8)}</td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">{order.franchiseName}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600">{order.regionName}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="font-black text-slate-900">Rs. {order.finalAmount.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                            order.status === 'Processing' ? 'bg-teal-50 text-teal-700' :
                            order.status === 'Shipped' ? 'bg-purple-50 text-purple-700' :
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">No Revenue Data</h3>
                  <p className="text-slate-500 mt-2">Revenue will appear here once orders are placed.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {(activeTab === 'franchise' || activeTab === 'region' || activeTab === 'inventory') && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {activeTab !== 'inventory' && (
              <div className="space-y-8">
                {/* Ledger Filters */}
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-teal-100 shadow-xl shadow-teal-900/5 flex flex-wrap items-center gap-6 sticky top-0 z-30">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/40 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search franchise..." 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      className="w-full pl-12 pr-4 py-3 bg-teal-50/50 rounded-xl border border-teal-100 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  {activeTab === 'franchise' && (
                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                      {(['all', 'Raw Material', 'Equipment', 'Uniform'] as const).map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setFranchiseCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-xl font-bold capitalize transition-all text-xs ${
                            franchiseCategoryFilter === cat ? 'bg-teal-600 text-white shadow-md shadow-teal-100' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest mb-1 ml-1">Month Filter</label>
                      <input 
                        type="month" 
                        value={ledgerMonthFilter}
                        onChange={(e) => {
                          setLedgerMonthFilter(e.target.value);
                          setLedgerDateFilter(""); // Clear date filter if month is picked
                        }}
                        className="px-4 py-2.5 bg-teal-50/50 rounded-xl border border-teal-100 text-sm font-black text-teal-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest mb-1 ml-1">Date Filter</label>
                      <input 
                        type="date" 
                        value={ledgerDateFilter}
                        onChange={(e) => {
                          setLedgerDateFilter(e.target.value);
                          setLedgerMonthFilter(""); // Clear month filter if date is picked
                        }}
                        className="px-4 py-2.5 bg-teal-50/50 rounded-xl border border-teal-100 text-sm font-black text-teal-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                    {(ledgerDateFilter || ledgerMonthFilter) && (
                      <button 
                        onClick={() => {
                          setLedgerDateFilter("");
                          setLedgerMonthFilter("");
                        }}
                        className="mt-5 p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-teal-900/5 transition-all">
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"><DollarSign className="w-7 h-7" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                      <p className="text-2xl font-black text-slate-900">Rs. {(activeTab === 'franchise' ? franchiseReport : regionReport).reduce((sum, item) => sum + item.total, 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-teal-900/5 transition-all">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"><Package className="w-7 h-7" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Raw Materials</p>
                      <p className="text-2xl font-black text-slate-900">Rs. {(activeTab === 'franchise' ? franchiseReport : regionReport).reduce((sum, item) => sum + item.categories['Raw Material'], 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-teal-900/5 transition-all">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"><Wrench className="w-7 h-7" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment</p>
                      <p className="text-2xl font-black text-slate-900">Rs. {(activeTab === 'franchise' ? franchiseReport : regionReport).reduce((sum, item) => sum + item.categories['Equipment'], 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-teal-900/5 transition-all">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"><Shirt className="w-7 h-7" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uniforms</p>
                      <p className="text-2xl font-black text-slate-900">Rs. {(activeTab === 'franchise' ? franchiseReport : regionReport).reduce((sum, item) => sum + item.categories['Uniform'], 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-8">
              {activeTab === 'inventory' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                      {(['all', 'raw', 'equipment', 'uniform'] as const).map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setInventoryCategory(cat)}
                          className={`px-6 py-2.5 rounded-xl font-bold capitalize transition-all text-sm ${
                            inventoryCategory === cat ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setIsAddingItem(true)}
                      className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Item
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {inventory
                      .filter(item => inventoryCategory === 'all' || item.type === inventoryCategory)
                      .map(item => (
                      <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-900/5 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-teal-50 transition-colors" />
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                                item.type === 'raw' ? 'bg-teal-50 text-teal-600' : 
                                item.type === 'equipment' ? 'bg-purple-50 text-purple-600' : 
                                'bg-orange-50 text-orange-600'
                              }`}>
                                {item.type === 'raw' ? <Package className="w-7 h-7" /> : 
                                 item.type === 'equipment' ? <Wrench className="w-7 h-7" /> : 
                                 <Shirt className="w-7 h-7" />}
                              </div>
                              <div>
                                <h3 className="font-black text-lg text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">{item.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="bg-slate-50 rounded-3xl p-6 flex items-center justify-between border border-slate-100 group-hover:border-teal-100 transition-colors">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Stock</p>
                              <div className="flex items-baseline gap-2">
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => setInventoryQuantity(item.id, parseInt(e.target.value))}
                                  className={`w-24 bg-transparent text-3xl font-black focus:outline-none focus:text-teal-600 transition-colors ${
                                    item.quantity < 10 ? 'text-red-600' : 'text-slate-900'
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-400 uppercase">Units</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => adjustInventory(item.id, 1)}
                                className="p-2.5 bg-white text-slate-400 hover:text-teal-600 hover:shadow-md rounded-xl transition-all border border-slate-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => adjustInventory(item.id, -1)}
                                className="p-2.5 bg-white text-slate-400 hover:text-red-600 hover:shadow-md rounded-xl transition-all border border-slate-100"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {item.quantity < 10 && (
                            <div className="mt-6 flex items-center gap-3 text-red-500 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-200" />
                              <p className="text-[10px] font-black uppercase tracking-[0.15em]">Critical Stock Level</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab !== 'inventory' && (
                selectedFranchiseForDetail ? (
                  <div className="space-y-10">
                    {/* Franchise Detail View */}
                    <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border border-teal-50 shadow-sm overflow-hidden">
                          <img src="/Logo.png" alt="WEDRINK" className="w-12 h-12 object-contain" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedFranchiseForDetail}</h2>
                          <p className="text-sm text-slate-500 font-medium mt-1">Comprehensive Purchase Ledger</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedFranchiseForDetail(null)}
                        className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-3"
                      >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                        Back to Network
                      </button>
                    </div>

                    {/* Monthly Records */}
                    <div className="grid gap-10">
                      {Object.entries(franchiseReport.find(f => f.name === selectedFranchiseForDetail)?.monthly || {}).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([month, data]: [string, any]) => (
                        <div key={month} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                            <div>
                              <h3 className="text-3xl font-black">{month}</h3>
                              <p className="text-teal-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Monthly Performance Summary</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Investment</p>
                              <p className="text-4xl font-black text-white">Rs. {data.total.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="p-10 space-y-10">
                            {/* Category Breakdown for the Month */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {[
                                { label: 'Raw Material', icon: Package, color: 'teal' },
                                { label: 'Equipment', icon: Wrench, color: 'purple' },
                                { label: 'Uniform', icon: Shirt, color: 'orange' }
                              ].filter(cat => franchiseCategoryFilter === 'all' || cat.label === franchiseCategoryFilter).map(cat => (
                                <div key={cat.label} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                                  <div className="relative z-10">
                                    <div className={`w-12 h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                                      <cat.icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{cat.label}</p>
                                    <p className="text-3xl font-black text-slate-900">Rs. {data.categories[cat.label].toLocaleString()}</p>
                                    <div className="mt-6 w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                                      <div 
                                        className={`h-full bg-${cat.color}-500 rounded-full transition-all duration-1000`} 
                                        style={{ width: `${(data.categories[cat.label] / (franchiseCategoryFilter === 'all' ? data.total : data.categories[cat.label]) * 100) || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Daily Records for the Month */}
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-teal-600" />
                                Daily Transaction Log
                              </h4>
                              <div className="space-y-6">
                                {Object.entries(data.daily as Record<string, any>).sort((a, b) => b[0].localeCompare(a[0])).map(([dayKey, dayData]) => {
                                  // Skip days where the selected category has 0 purchases
                                  if (franchiseCategoryFilter !== 'all' && dayData.categories[franchiseCategoryFilter] === 0) return null;
                                  
                                  return (
                                  <div key={dayKey} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-teal-100 transition-all overflow-hidden">
                                    <div className="bg-slate-50 p-8 flex justify-between items-center border-b border-slate-100">
                                      <div>
                                        <p className="text-xl font-black text-slate-900">{dayData.displayDate}</p>
                                        <div className="flex gap-4 mt-2">
                                          {['Raw Material', 'Equipment', 'Uniform'].filter(cat => franchiseCategoryFilter === 'all' || cat === franchiseCategoryFilter).map(cat => (
                                            dayData.categories[cat] > 0 && (
                                              <span key={cat} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                  cat === 'Raw Material' ? 'bg-teal-500' : 
                                                  cat === 'Equipment' ? 'bg-purple-500' : 'bg-orange-500'
                                                }`} />
                                                {cat}: Rs. {dayData.categories[cat].toLocaleString()}
                                              </span>
                                            )
                                          ))}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Total</p>
                                        <p className="text-2xl font-black text-teal-600">Rs. {(franchiseCategoryFilter === 'all' ? dayData.total : dayData.categories[franchiseCategoryFilter]).toLocaleString()}</p>
                                      </div>
                                    </div>
                                    <div className="p-8 space-y-8">
                                      {/* Aggregated Daily Items Grouped by Category */}
                                      <div className="grid grid-cols-1 gap-8">
                                        {['Raw Material', 'Equipment', 'Uniform'].filter(cat => franchiseCategoryFilter === 'all' || cat === franchiseCategoryFilter).map(cat => (
                                          Object.keys(dayData.itemSummary[cat]).length > 0 && (
                                            <div key={cat} className="space-y-4">
                                              <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                  cat === 'Raw Material' ? 'bg-teal-100 text-teal-600' : 
                                                  cat === 'Equipment' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                  {cat === 'Raw Material' ? <Package className="w-4 h-4" /> : 
                                                   cat === 'Equipment' ? <Wrench className="w-4 h-4" /> : <Shirt className="w-4 h-4" />}
                                                </div>
                                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">{cat} Purchases</h5>
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <span className="text-xs font-black text-slate-900">Rs. {dayData.categories[cat].toLocaleString()}</span>
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {Object.entries(dayData.itemSummary[cat]).map(([itemName, details]: [string, any]) => (
                                                  <div key={itemName} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group/item hover:bg-white hover:border-teal-100 transition-all">
                                                    <span className="text-sm text-slate-600 font-bold">{itemName}</span>
                                                    <div className="flex items-center gap-4">
                                                      <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">x{details.quantity}</span>
                                                      <span className="text-sm font-black text-slate-900">Rs. {details.total.toLocaleString()}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        ))}
                                      </div>

                                      {/* Individual Orders List */}
                                      <div className="pt-8 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction History</h5>
                                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {dayData.orders.filter((o: any) => franchiseCategoryFilter === 'all' || o.items.some((i: any) => i.category === franchiseCategoryFilter)).length} Orders
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {dayData.orders
                                            .filter((o: any) => franchiseCategoryFilter === 'all' || o.items.some((i: any) => i.category === franchiseCategoryFilter))
                                            .map((order: any) => (
                                            <div key={order.id} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-slate-50 hover:bg-white border border-transparent hover:border-teal-100 transition-all group">
                                              <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-teal-50 transition-colors">
                                                  <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-teal-600" />
                                                </div>
                                                <div>
                                                  <p className="font-black text-slate-900 text-sm">Order #{order.id.slice(-6)}</p>
                                                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{order.items.length} Items</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <p className="font-black text-slate-900">Rs. {order.finalAmount.toLocaleString()}</p>
                                                <button 
                                                  onClick={() => setSelectedOrder(order)}
                                                  className="p-2 text-teal-600 hover:bg-teal-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                >
                                                  <ArrowRight className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )})}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {(activeTab === 'franchise' 
                      ? franchiseReport.filter(f => (franchiseCategoryFilter === 'all' || f.categories[franchiseCategoryFilter] > 0) && f.name.toLowerCase().includes(search.toLowerCase())) 
                      : regionReport.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
                    ).map(item => (
                      <div key={item.name} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-900/5 transition-all">
                        <div 
                          className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-50 transition-colors gap-6"
                          onClick={() => {
                            if (activeTab === 'franchise') {
                              setSelectedFranchiseForDetail(item.name);
                            } else {
                              setExpandedLedger(expandedLedger === item.name ? null : item.name);
                            }
                          }}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border border-slate-100 group-hover:border-teal-100 transition-all shadow-sm overflow-hidden">
                              {activeTab === 'franchise' ? (
                                <img src="/Logo.png" alt="WEDRINK" className="w-12 h-12 object-contain" />
                              ) : (
                                <MapPin className="w-8 h-8 text-teal-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-2xl text-slate-900 tracking-tight">{item.name}</h3>
                              <div className="flex flex-wrap gap-3 mt-2">
                                {['Raw Material', 'Equipment', 'Uniform'].map(cat => (
                                  item.categories[cat] > 0 && (
                                    <span key={cat} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                      franchiseCategoryFilter === cat 
                                        ? 'bg-teal-50 text-teal-600 border-teal-200' 
                                        : 'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                      {cat.split(' ')[0]}: Rs. {item.categories[cat].toLocaleString()}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-10 w-full md:w-auto">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {franchiseCategoryFilter === 'all' ? 'Cumulative Sales' : `${franchiseCategoryFilter} Sales`}
                              </p>
                              <p className="text-3xl font-black text-teal-600">
                                Rs. {(franchiseCategoryFilter === 'all' ? item.total : item.categories[franchiseCategoryFilter]).toLocaleString()}
                              </p>
                            </div>
                            {activeTab === 'franchise' ? (
                              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                                <ArrowRight className="w-6 h-6" />
                              </div>
                            ) : (
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedLedger === item.name ? 'bg-teal-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                <Plus className={`w-6 h-6 transition-transform ${expandedLedger === item.name ? 'rotate-45' : ''}`} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {activeTab === 'region' && expandedLedger === item.name && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="p-10 border-t border-slate-100 bg-slate-50/50 space-y-10"
                          >
                            {/* Category Breakdown */}
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-teal-600" />
                                Category Performance
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                  { label: 'Raw Material', icon: Package, color: 'teal' },
                                  { label: 'Equipment', icon: Wrench, color: 'purple' },
                                  { label: 'Uniform', icon: Shirt, color: 'orange' }
                                ].map(cat => (
                                  <div key={cat.label} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-teal-200 transition-all">
                                    <div className="relative z-10">
                                      <div className={`w-12 h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                                        <cat.icon className="w-6 h-6" />
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{cat.label}</p>
                                      <p className="text-3xl font-black text-slate-900">Rs. {item.categories[cat.label].toLocaleString()}</p>
                                      <div className="mt-6 w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                          className={`h-full bg-${cat.color}-500 rounded-full transition-all duration-1000`} 
                                          style={{ width: `${(item.categories[cat.label] / item.total * 100) || 0}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Franchises Breakdown */}
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Store className="w-5 h-5 text-teal-600" />
                                Franchises in Region
                              </h4>
                              <div className="grid gap-6">
                                {Object.entries(item.franchises as Record<string, { total: number, categories: Record<string, number> }>).sort((a, b) => b[1].total - a[1].total).map(([franchiseName, data]) => (
                                  <div key={franchiseName} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-teal-200 transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                          <img src="/Logo.png" alt="WEDRINK" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                          <h5 className="font-black text-xl text-slate-900">{franchiseName}</h5>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Sales</p>
                                        </div>
                                      </div>
                                      <p className="text-2xl font-black text-teal-600">Rs. {data.total.toLocaleString()}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {[
                                        { label: 'Raw Material', icon: Package, color: 'teal' },
                                        { label: 'Equipment', icon: Wrench, color: 'purple' },
                                        { label: 'Uniform', icon: Shirt, color: 'orange' }
                                      ].map(cat => (
                                        <div key={cat.label} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 bg-${cat.color}-100 text-${cat.color}-600 rounded-lg flex items-center justify-center`}>
                                              <cat.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{cat.label}</span>
                                          </div>
                                          <span className="text-sm font-black text-slate-900">Rs. {data.categories[cat.label].toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* Modals */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">Edit Item</h3>
                  <p className="text-teal-400 font-bold uppercase text-xs tracking-widest mt-1">Inventory Management</p>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                  <input 
                    type="text" 
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all appearance-none"
                  >
                    <option value="raw">Raw Material</option>
                    <option value="equipment">Equipment</option>
                    <option value="uniform">Uniform</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                  <input 
                    type="number" 
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <button 
                  onClick={() => updateInventoryItem(editingItem.id, editingItem)}
                  className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Item Modal */}
      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">New Item</h3>
                  <p className="text-teal-400 font-bold uppercase text-xs tracking-widest mt-1">Add to Inventory</p>
                </div>
                <button onClick={() => setIsAddingItem(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter item name..."
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all appearance-none"
                  >
                    <option value="raw">Raw Material</option>
                    <option value="equipment">Equipment</option>
                    <option value="uniform">Uniform</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Initial Quantity</label>
                  <input 
                    type="number" 
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <button 
                  onClick={addNewInventoryItem}
                  className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black">Order Details</h3>
                <p className="text-teal-400 font-bold uppercase text-xs tracking-widest mt-1">#{selectedOrder.id.slice(-8)}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => exportOrderToPDF(selectedOrder)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                  title="Export PDF"
                >
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button 
                  onClick={() => exportOrderToExcel(selectedOrder)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-2xl transition-colors ml-2">
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Franchise</p>
                  <p className="text-xl font-black text-slate-900">{selectedOrder.franchiseName}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{selectedOrder.regionName}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date & Time</p>
                  <p className="text-xl font-black text-slate-900">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{new Date(selectedOrder.date).toLocaleTimeString()}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-teal-600" />
                  Order Items
                </h4>
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700">Rs. {item.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-black text-teal-600">Rs. {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {((selectedOrder.discount && selectedOrder.discount > 0) || (selectedOrder.balanceAdjustment && selectedOrder.balanceAdjustment > 0)) && (
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-3">
                    {selectedOrder.totalAmount && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Subtotal</span>
                        <span className="font-black text-slate-900">Rs. {selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.discount && selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">
                          Discount Applied {selectedOrder.discountPercent ? `(${selectedOrder.discountPercent}%)` : ''}
                        </span>
                        <span className="font-black text-green-600">- Rs. {selectedOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.balanceAdjustment && selectedOrder.balanceAdjustment > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Balance Used</span>
                        <span className="font-black text-blue-600">- Rs. {selectedOrder.balanceAdjustment.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-teal-100">
                  <div>
                    <p className="text-xs font-bold text-teal-100 uppercase tracking-widest mb-1">Final Amount Paid</p>
                    <p className="text-4xl font-black">Rs. {selectedOrder.finalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`px-6 py-2 rounded-2xl font-black uppercase tracking-widest text-sm ${
                    selectedOrder.status === 'Delivered' ? 'bg-white/20 text-white' : 'bg-white text-teal-600'
                  }`}>
                    {selectedOrder.status}
                  </div>
                </div>
              </div>

              {selectedOrder.paymentScreenshot && (
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Payment Proof</h4>
                  <div className="rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-lg">
                    <img src={selectedOrder.paymentScreenshot} alt="Payment Screenshot" className="w-full h-auto" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <button 
                  onClick={() => {
                    setOrderToCancel(selectedOrder);
                  }}
                  className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Cancel Order
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] max-w-md w-full p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
                <X className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Cancel Order?</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Are you sure you want to cancel this order? All items will be automatically returned to the inventory stock.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setOrderToCancel(null)} 
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  No, Keep it
                </button>
                <button 
                  onClick={() => {
                    updateStatus(orderToCancel.id, 'Cancelled', orderToCancel.items);
                    if (selectedOrder?.id === orderToCancel.id) {
                      setSelectedOrder({...selectedOrder, status: 'Cancelled'});
                    }
                    setOrderToCancel(null);
                  }}
                  className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
