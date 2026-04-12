import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, setDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Store, BarChart3, Search, Package, DollarSign, Clock, LogOut, Box, Plus, Minus, RefreshCw, X, History, MapPin, LayoutDashboard, ClipboardList, Wrench, Shirt, ArrowRight, Edit2, Check, Save, Trash2, FileText, FileSpreadsheet, Users, Menu } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { regions } from "../data";

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
  paymentScreenshots?: string[];
  date: string;
  items: { id: string; name: string; quantity: number; price: number; category: 'Raw Material' | 'Equipment' | 'Uniform' }[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  type: 'raw' | 'equipment' | 'uniform';
}

const initialInventoryData: InventoryItem[] = [
  // Raw Materials
  { id: 'RAW001', name: 'original ice cream powder', quantity: 1098, type: 'raw', price: 46800, unit: 'carton' },
  { id: 'RAW002', name: 'matcha ice cream powder', quantity: 691, type: 'raw', price: 53600, unit: 'carton' },
  { id: 'RAW003', name: 'ice cream cone', quantity: 1088, type: 'raw', price: 8270, unit: 'carton' },
  { id: 'RAW004', name: 'milk tea powder', quantity: 548, type: 'raw', price: 53000, unit: 'carton' },
  { id: 'RAW005', name: 'cappuccino powder', quantity: 55, type: 'raw', price: 75200, unit: 'carton' },
  { id: 'RAW006', name: 'latte powder', quantity: 31, type: 'raw', price: 75200, unit: 'carton' },
  { id: 'RAW007', name: 'pearl', quantity: 1053, type: 'raw', price: 14000, unit: 'carton' },
  { id: 'RAW008', name: 'fruit honey', quantity: 594, type: 'raw', price: 30800, unit: 'carton' },
  { id: 'RAW009', name: 'fructose', quantity: 853, type: 'raw', price: 18000, unit: 'carton' },
  { id: 'RAW010', name: 'black sugar', quantity: 314, type: 'raw', price: 26800, unit: 'carton' },
  { id: 'RAW011', name: 'orange juice', quantity: 59, type: 'raw', price: 69200, unit: 'carton' },
  { id: 'RAW012', name: 'grape juice', quantity: 422, type: 'raw', price: 29200, unit: 'carton' },
  { id: 'RAW013', name: 'passion fruit juice', quantity: 1504, type: 'raw', price: 33600, unit: 'carton' },
  { id: 'RAW014', name: 'coconut', quantity: 1716, type: 'raw', price: 15600, unit: 'carton' },
  { id: 'RAW015', name: 'rasberry juice', quantity: 337, type: 'raw', price: 48400, unit: 'carton' },
  { id: 'RAW016', name: 'strawberry jam', quantity: 499, type: 'raw', price: 16800, unit: 'carton' },
  { id: 'RAW017', name: 'chocolate jam', quantity: 402, type: 'raw', price: 35000, unit: 'carton' },
  { id: 'RAW018', name: 'red grapefruit', quantity: 152, type: 'raw', price: 30400, unit: 'carton' },
  { id: 'RAW019', name: 'redbean can', quantity: 821, type: 'raw', price: 9600, unit: 'carton' },
  { id: 'RAW020', name: 'blueberry jam', quantity: 414, type: 'raw', price: 23600, unit: 'carton' },
  { id: 'RAW021', name: 'pinkpeach jam', quantity: 935, type: 'raw', price: 29600, unit: 'carton' },
  { id: 'RAW022', name: 'mongo smoothie powder', quantity: 259, type: 'raw', price: 49200, unit: 'carton' },
  { id: 'RAW023', name: 'mango jam', quantity: 281, type: 'raw', price: 32000, unit: 'carton' },
  { id: 'RAW024', name: 'jasmine tea', quantity: 141, type: 'raw', price: 79200, unit: 'carton' },
  { id: 'RAW025', name: 'grape fruit can', quantity: 821, type: 'raw', price: 18800, unit: 'carton' },
  { id: 'RAW026', name: 'black tea', quantity: 82, type: 'raw', price: 72000, unit: 'carton' },
  { id: 'RAW027', name: 'sour plum powder', quantity: 57, type: 'raw', price: 30000, unit: 'carton' },
  { id: 'RAW028', name: 'peach jelly', quantity: 673, type: 'raw', price: 10000, unit: 'carton' },
  { id: 'RAW029', name: 'pudding', quantity: 145, type: 'raw', price: 53600, unit: 'carton' },
  { id: 'RAW030', name: '500pp cup', quantity: 194, type: 'raw', price: 21000, unit: 'carton' },
  { id: 'RAW031', name: '700pp cup', quantity: 667, type: 'raw', price: 26000, unit: 'carton' },
  { id: 'RAW032', name: 'super bucket', quantity: 755, type: 'raw', price: 22000, unit: 'carton' },
  { id: 'RAW033', name: 'Sundae U cup', quantity: 418, type: 'raw', price: 21000, unit: 'carton' },
  { id: 'RAW034', name: 'Thick straw', quantity: 341, type: 'raw', price: 20000, unit: 'carton' },
  { id: 'RAW035', name: 'thin straw', quantity: 54, type: 'raw', price: 12000, unit: 'carton' },
  { id: 'RAW036', name: 'Spherical lid', quantity: 277, type: 'raw', price: 16400, unit: 'carton' },
  { id: 'RAW037', name: 'sealing rolls', quantity: 134, type: 'raw', price: 46400, unit: 'carton' },
  { id: 'RAW038', name: 'long spoon', quantity: 132, type: 'raw', price: 26000, unit: 'carton' },
  { id: 'RAW039', name: 'special spoon', quantity: 362, type: 'raw', price: 7200, unit: 'carton' },
  { id: 'RAW040', name: 'single cup bag', quantity: 0, type: 'raw', price: 39600, unit: 'carton' },
  { id: 'RAW041', name: 'double cup bag', quantity: 0, type: 'raw', price: 35600, unit: 'carton' },
  { id: 'RAW042', name: 'four cup bag', quantity: 0, type: 'raw', price: 35600, unit: 'carton' },
  { id: 'RAW043', name: '16A paper cup', quantity: 76, type: 'raw', price: 16400, unit: 'carton' },
  { id: 'RAW044', name: 'plasitc lid', quantity: 74, type: 'raw', price: 15500, unit: 'carton' },

  // Equipment
  { id: 'EQP001', name: 'Ice Cream Machine', quantity: 8, type: 'equipment', price: 1472000, unit: 'pcs' },
  { id: 'EQP002', name: 'Ice Making Machine', quantity: 9, type: 'equipment', price: 1024000, unit: 'pcs' },
  { id: 'EQP003', name: 'Sealing Machine', quantity: 52, type: 'equipment', price: 220000, unit: 'pcs' },
  { id: 'EQP004', name: 'Hot Water Machine', quantity: 29, type: 'equipment', price: 132000, unit: 'pcs' },
  { id: 'EQP005', name: 'Refrigerator', quantity: 7, type: 'equipment', price: 624000, unit: 'pcs' },
  { id: 'EQP006', name: 'Freezer', quantity: 14, type: 'equipment', price: 272000, unit: 'pcs' },
  { id: 'EQP007', name: 'Fructose machine', quantity: 52, type: 'equipment', price: 152000, unit: 'pcs' },
  { id: 'EQP008', name: 'RO-Water purifiers', quantity: 9, type: 'equipment', price: 220000, unit: 'pcs' },
  { id: 'EQP009', name: 'Pure water machine storage tank', quantity: 10, type: 'equipment', price: 50000, unit: 'pcs' },
  { id: 'EQP010', name: 'Ice Cream Model', quantity: 9, type: 'equipment', price: 54000, unit: 'pcs' },
  { id: 'EQP011', name: 'Pearl Cooker', quantity: 6, type: 'equipment', price: 67200, unit: 'pcs' },
  { id: 'EQP012', name: 'Slicer', quantity: 2, type: 'equipment', price: 7520, unit: 'pcs' },
  { id: 'EQP013', name: 'Blender', quantity: 21, type: 'equipment', price: 83400, unit: 'pcs' },
  { id: 'EQP014', name: 'Weight measurer 1g', quantity: 80, type: 'equipment', price: 17200, unit: 'pcs' },
  { id: 'EQP015', name: 'Weight measurer 0.1g', quantity: 219, type: 'equipment', price: 2760, unit: 'pcs' },
  { id: 'EQP016', name: 'Lemon stick', quantity: 17, type: 'equipment', price: 3920, unit: 'pcs' },
  { id: 'EQP017', name: 'Stainless steel bucket', quantity: 153, type: 'equipment', price: 8000, unit: 'pcs' },
  { id: 'EQP018', name: 'S.S steel bucket (small)', quantity: 151, type: 'equipment', price: 1720, unit: 'pcs' },
  { id: 'EQP019', name: 'Thermos', quantity: 399, type: 'equipment', price: 11680, unit: 'pcs' },
  { id: 'EQP020', name: 'Leaky net', quantity: 267, type: 'equipment', price: 2000, unit: 'pcs' },
  { id: 'EQP021', name: 'Egg stirrer', quantity: 221, type: 'equipment', price: 1400, unit: 'pcs' },
  { id: 'EQP022', name: 'Big Ice Shovel', quantity: 78, type: 'equipment', price: 1520, unit: 'pcs' },
  { id: 'EQP023', name: 'Measuring spoon', quantity: 1580, type: 'equipment', price: 40, unit: 'pcs' },
  { id: 'EQP024', name: 'Can openner', quantity: 431, type: 'equipment', price: 1160, unit: 'pcs' },
  { id: 'EQP025', name: 'Bar spoons', quantity: 331, type: 'equipment', price: 360, unit: 'pcs' },
  { id: 'EQP026', name: '5000ml measure cup', quantity: 360, type: 'equipment', price: 1800, unit: 'pcs' },
  { id: 'EQP027', name: '2000ml measure cup', quantity: 360, type: 'equipment', price: 1200, unit: 'pcs' },
  { id: 'EQP028', name: '300ml measure cup', quantity: 457, type: 'equipment', price: 720, unit: 'pcs' },
  { id: 'EQP029', name: 'Leaky bag', quantity: 330, type: 'equipment', price: 600, unit: 'pcs' },
  { id: 'EQP030', name: 'Chocolate Presser', quantity: 104, type: 'equipment', price: 880, unit: 'pcs' },
  { id: 'EQP031', name: 'Sugar pressure flask', quantity: 144, type: 'equipment', price: 1600, unit: 'pcs' },
  { id: 'EQP032', name: 'Stainless steel spoon', quantity: 253, type: 'equipment', price: 1450, unit: 'pcs' },
  { id: 'EQP033', name: 'Stainless steel colander', quantity: 252, type: 'equipment', price: 680, unit: 'pcs' },
  { id: 'EQP034', name: 'Cup holder', quantity: 128, type: 'equipment', price: 8400, unit: 'pcs' },
  { id: 'EQP035', name: 'Powder box', quantity: 451, type: 'equipment', price: 800, unit: 'pcs' },
  { id: 'EQP036', name: 'Straw organizer', quantity: 127, type: 'equipment', price: 8400, unit: 'pcs' },
  { id: 'EQP037', name: 'Thermometer', quantity: 192, type: 'equipment', price: 1680, unit: 'pcs' },
  { id: 'EQP038', name: 'Timer', quantity: 367, type: 'equipment', price: 880, unit: 'pcs' },
  { id: 'EQP039', name: 'Sealing clip', quantity: 132, type: 'equipment', price: 640, unit: 'pcs' },
  { id: 'EQP040', name: 'Towels', quantity: 59, type: 'equipment', price: 1200, unit: 'pcs' },
  { id: 'EQP041', name: 'Shake Cup-700cc', quantity: 132, type: 'equipment', price: 1000, unit: 'pcs' },
  { id: 'EQP042', name: 'Curtain', quantity: 69, type: 'equipment', price: 2400, unit: 'pcs' },
  { id: 'EQP043', name: 'Pool 1500*620*800', quantity: 12, type: 'equipment', price: 103600, unit: 'pcs' },
  { id: 'EQP044', name: 'Shelving (large)', quantity: 72, type: 'equipment', price: 73000, unit: 'pcs' },
  { id: 'EQP045', name: '2m Light box', quantity: 9, type: 'equipment', price: 146000, unit: 'pcs' },
  { id: 'EQP046', name: '3m Light box', quantity: 26, type: 'equipment', price: 220000, unit: 'pcs' },
  { id: 'EQP047', name: 'Plastic doll', quantity: 5, type: 'equipment', price: 200000, unit: 'pcs' },
  { id: 'EQP048', name: 'A set of cash register', quantity: 74, type: 'equipment', price: 260000, unit: 'pcs' },
  { id: 'EQP049', name: '20 inches PP filter cartridge', quantity: 31, type: 'equipment', price: 800, unit: 'pcs' },
  { id: 'EQP050', name: 'PP cotton integrated filter cartridge', quantity: 32, type: 'equipment', price: 960, unit: 'pcs' },
  { id: 'EQP051', name: '20 inches UDF filter cartridge', quantity: 28, type: 'equipment', price: 2000, unit: 'pcs' },
  { id: 'EQP052', name: '20 inches resin filter cartridge', quantity: 29, type: 'equipment', price: 3000, unit: 'pcs' },
  { id: 'EQP053', name: 'RO membrane filter cartridge', quantity: 48, type: 'equipment', price: 19200, unit: 'pcs' },
  { id: 'EQP054', name: '4 meter Arches', quantity: 10, type: 'equipment', price: 15000, unit: 'pcs' },
  { id: 'EQP055', name: '6 meter Arches', quantity: 0, type: 'equipment', price: 20000, unit: 'pcs' },
  { id: 'EQP056', name: 'Doll', quantity: 10, type: 'equipment', price: 5000, unit: 'pcs' },
  { id: 'EQP057', name: 'Ice cream machine dasher rubber sleeve', quantity: 0, type: 'equipment', price: 500, unit: 'pcs' },

  // Uniform
  { id: 'UNI001', name: 'clothes (S)', quantity: 45, type: 'uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI002', name: 'clothes (M)', quantity: 1, type: 'uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI003', name: 'clothes (L)', quantity: 14, type: 'uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI004', name: 'clothes (XL)', quantity: 97, type: 'uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI005', name: 'clothes (XXL)', quantity: 0, type: 'uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI006', name: 'apron', quantity: 166, type: 'uniform', price: 1790, unit: 'pcs' },
  { id: 'UNI007', name: 'hat', quantity: 98, type: 'uniform', price: 860, unit: 'pcs' },
  { id: 'UNI008', name: 'sleeve', quantity: 161, type: 'uniform', price: 430, unit: 'pair' },
  { id: 'UNI009', name: 'Jacket (M)', quantity: 59, type: 'uniform', price: 3600, unit: 'pcs' },
  { id: 'UNI010', name: 'Jacket (L)', quantity: 197, type: 'uniform', price: 3600, unit: 'pcs' },
  { id: 'UNI011', name: 'Jacket (XL)', quantity: 14, type: 'uniform', price: 3600, unit: 'pcs' },
  { id: 'UNI012', name: 'Blue Shirts S', quantity: 11, type: 'uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI013', name: 'Blue Shirts M', quantity: 20, type: 'uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI014', name: 'Blue Shirts L', quantity: 24, type: 'uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI015', name: 'Blue Shirts XL', quantity: 14, type: 'uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI016', name: 'Blue Shirts XXL', quantity: 10, type: 'uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI017', name: 'office Jackets M', quantity: 0, type: 'uniform', price: 4000, unit: 'pcs' },
  { id: 'UNI018', name: 'office Jackets L', quantity: 0, type: 'uniform', price: 4000, unit: 'pcs' },
  { id: 'UNI019', name: 'office Jackets XL', quantity: 0, type: 'uniform', price: 4000, unit: 'pcs' },
];

interface FranchiseUser {
  id: string;
  email: string;
  password?: string;
  regionId: string;
  regionName: string;
  franchiseId: string;
  franchiseName: string;
  balance?: number;
  discountPercent?: number;
}

interface AdminPermissions {
  orders: boolean;
  history: boolean;
  franchise: boolean;
  region: boolean;
  inventory: boolean;
  revenue: boolean;
  users: boolean;
  admins: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  permissions: AdminPermissions;
  password?: string;
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [franchiseUsers, setFranchiseUsers] = useState<FranchiseUser[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'franchise' | 'region' | 'inventory' | 'revenue' | 'users' | 'admins'>('orders');
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
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<FranchiseUser>>({ email: '', password: '', regionId: '', franchiseId: '', balance: 0, discountPercent: 0 });
  const [editingUser, setEditingUser] = useState<FranchiseUser | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState<Partial<AdminUser>>({
    email: '',
    password: '',
    role: 'admin',
    permissions: {
      orders: true,
      history: true,
      franchise: false,
      region: false,
      inventory: false,
      revenue: false,
      users: false,
      admins: false
    }
  });
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<FranchiseUser | null>(null);

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    const originalOrder = orders.find(o => o.id === editingOrder.id);
    if (!originalOrder) return;

    const totalAmount = editingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = (totalAmount * (editingOrder.discountPercent || 0)) / 100;
    const finalAmount = totalAmount - discount - (editingOrder.balanceAdjustment || 0);
    
    try {
      const batch = writeBatch(db);
      
      // Adjust inventory based on item changes
      if (originalOrder.status !== 'Cancelled') {
        const itemDiffs: { [id: string]: number } = {};
        
        // Original items (negative diff means we "return" them conceptually)
        originalOrder.items.forEach(item => {
          itemDiffs[item.id] = (itemDiffs[item.id] || 0) - item.quantity;
        });
        
        // New items (positive diff means we deduct them)
        editingOrder.items.forEach(item => {
          itemDiffs[item.id] = (itemDiffs[item.id] || 0) + item.quantity;
        });

        const changedItemIds = Object.keys(itemDiffs).filter(id => itemDiffs[id] !== 0);
        
        if (changedItemIds.length > 0) {
          const inventorySnaps = await Promise.all(
            changedItemIds.map(id => getDoc(doc(db, "inventory", id)))
          );
          
          inventorySnaps.forEach((snap, index) => {
            if (snap.exists()) {
              const id = changedItemIds[index];
              const diff = itemDiffs[id];
              const currentInvQty = snap.data().quantity;
              batch.update(doc(db, "inventory", id), {
                quantity: currentInvQty - diff
              });
            }
          });
        }
      }

      batch.update(doc(db, "orders", editingOrder.id), {
        items: editingOrder.items,
        discountPercent: editingOrder.discountPercent,
        balanceAdjustment: editingOrder.balanceAdjustment,
        totalAmount,
        discount,
        finalAmount
      });

      await batch.commit();
      setEditingOrder(null);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const addItemToEditingOrder = (product: any) => {
    if (!editingOrder) return;
    const existingItem = editingOrder.items.find(i => i.id === product.id);
    if (existingItem) {
      setEditingOrder({
        ...editingOrder,
        items: editingOrder.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      });
    } else {
      setEditingOrder({
        ...editingOrder,
        items: [...editingOrder.items, { ...product, quantity: 1 }]
      });
    }
  };

  const removeItemFromEditingOrder = (itemId: string) => {
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      items: editingOrder.items.filter(i => i.id !== itemId)
    });
  };

  const updateItemQuantityInEditingOrder = (itemId: string, delta: number) => {
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      items: editingOrder.items.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    });
  };
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "franchiseUsers"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FranchiseUser));
      setFranchiseUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "adminUsers"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
      setAdminUsers(usersData);
      
      const current = usersData.find(u => u.email === auth.currentUser?.email);
      if (current) {
        setCurrentAdmin(current);
      } else if (auth.currentUser?.email === "samra20020413@gmail.com") {
        const superAdmin: AdminUser = {
          id: auth.currentUser.uid,
          email: auth.currentUser.email!,
          role: 'super_admin',
          permissions: {
            orders: true,
            history: true,
            franchise: true,
            region: true,
            inventory: true,
            revenue: true,
            users: true,
            admins: true
          }
        };
        setCurrentAdmin(superAdmin);
        setDoc(doc(db, "adminUsers", auth.currentUser.uid), superAdmin);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) return;
    try {
      const secondaryApp = initializeApp(getApp().options, 'secondary');
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newAdmin.email, newAdmin.password);
      
      const adminData: AdminUser = {
        id: userCredential.user.uid,
        email: newAdmin.email,
        role: 'admin',
        permissions: newAdmin.permissions as AdminPermissions,
        password: newAdmin.password
      };
      
      await setDoc(doc(db, "adminUsers", userCredential.user.uid), adminData);
      setIsAddingAdmin(false);
      setNewAdmin({
        email: '',
        password: '',
        role: 'admin',
        permissions: {
          orders: true,
          history: true,
          franchise: false,
          region: false,
          inventory: false,
          revenue: false,
          users: false,
          admins: false
        }
      });
      await secondaryAuth.signOut();
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Failed to add admin user.");
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;
    try {
      await updateDoc(doc(db, "adminUsers", editingAdmin.id), {
        permissions: editingAdmin.permissions
      });
      setEditingAdmin(null);
    } catch (error) {
      console.error("Error updating admin:", error);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(db, "adminUsers", adminId));
      setAdminToDelete(null);
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
  };

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
    const batch = writeBatch(db);
    const orderRef = doc(db, "orders", orderId);
    batch.update(orderRef, { status });
    
    if (status === 'Cancelled') {
      // Fetch all inventory docs in parallel
      const inventorySnapshots = await Promise.all(
        items.map(item => getDoc(doc(db, "inventory", item.id)))
      );

      inventorySnapshots.forEach((invDoc, index) => {
        if (invDoc.exists()) {
          const item = items[index];
          const currentQty = invDoc.data().quantity;
          const invDocRef = doc(db, "inventory", item.id);
          batch.update(invDocRef, { quantity: currentQty + item.quantity });
        }
      });
    }
    
    await batch.commit();
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

  const deleteInventoryItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "inventory", itemId));
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting inventory item:", error);
    }
  };

  const addNewInventoryItem = async () => {
    if (!newItem.name || !newItem.type || newItem.price === undefined || !newItem.unit) return;
    const id = `${newItem.type?.toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    await setDoc(doc(db, "inventory", id), { ...newItem, id });
    setIsAddingItem(false);
    setNewItem({ name: '', quantity: 0, type: 'raw', price: 0, unit: '' });
  };

  const addUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.regionId || !newUser.franchiseId) return;
    
    const region = regions.find(r => r.id === newUser.regionId);
    const franchise = region?.franchises.find(f => f.id === newUser.franchiseId);
    
    if (!region || !franchise) return;

    const emailLower = newUser.email.toLowerCase().trim();

    try {
      // Create user in Firebase Auth using a secondary app instance
      // This prevents the current admin from being logged out
      const secondaryConfig = {
        apiKey: "AIzaSyAakFasuwjBerQkZu6KVMzH1SE-c_F8qK0",
        authDomain: "wedrink-2bf78.firebaseapp.com",
        projectId: "wedrink-2bf78",
        storageBucket: "wedrink-2bf78.firebasestorage.app",
        messagingSenderId: "197930332464",
        appId: "1:197930332464:web:7140973f02afa3a4c9d8f5",
      };

      const secondaryApp = getApps().find(app => app.name === 'secondary') || initializeApp(secondaryConfig, 'secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      await createUserWithEmailAndPassword(secondaryAuth, emailLower, newUser.password);
      
      // Save to Firestore
      await addDoc(collection(db, "franchiseUsers"), {
        email: emailLower,
        password: newUser.password,
        regionId: region.id,
        regionName: region.name,
        franchiseId: franchise.id,
        franchiseName: franchise.name,
        balance: newUser.balance || 0,
        discountPercent: newUser.discountPercent || 0
      });
      
      setIsAddingUser(false);
      setNewUser({ email: '', password: '', regionId: '', franchiseId: '', balance: 0, discountPercent: 0 });
    } catch (error: any) {
      console.error("Error adding user: ", error);
      alert(error.message || "Failed to create user account.");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "franchiseUsers", userId));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  };

  const updateUser = async (userId: string, updates: Partial<FranchiseUser>) => {
    try {
      await updateDoc(doc(db, "franchiseUsers", userId), updates);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user: ", error);
    }
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

  const exportInventoryToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136);
    doc.text("WEDRINK INVENTORY REPORT", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["ID", "Name", "Category", "Quantity"];
    const tableRows = inventory.map(item => [
      item.id,
      item.name,
      item.type.toUpperCase(),
      item.quantity.toString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }
    });

    doc.save(`Inventory_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportInventoryToExcel = () => {
    const worksheetData = [
      ["WEDRINK INVENTORY REPORT"],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      ["ID", "Name", "Category", "Quantity"],
      ...inventory.map(item => [item.id, item.name, item.type, item.quantity])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportFranchiseLedgerToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136);
    doc.text("FRANCHISE PURCHASE LEDGER", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["Franchise Name", "Raw Material", "Equipment", "Uniform", "Total Investment"];
    const tableRows = franchiseReport.map(item => [
      item.name,
      `Rs. ${item.categories['Raw Material'].toLocaleString()}`,
      `Rs. ${item.categories['Equipment'].toLocaleString()}`,
      `Rs. ${item.categories['Uniform'].toLocaleString()}`,
      `Rs. ${item.total.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }
    });

    doc.save(`Franchise_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportFranchiseLedgerToExcel = () => {
    const worksheetData = [
      ["FRANCHISE PURCHASE LEDGER"],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      ["Franchise Name", "Raw Material", "Equipment", "Uniform", "Total Investment"],
      ...franchiseReport.map(item => [
        item.name,
        item.categories['Raw Material'],
        item.categories['Equipment'],
        item.categories['Uniform'],
        item.total
      ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Franchise Ledger");
    XLSX.writeFile(workbook, `Franchise_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportRegionReportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136);
    doc.text("REGION PERFORMANCE REPORT", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["Region Name", "Raw Material", "Equipment", "Uniform", "Total Sales"];
    const tableRows = regionReport.map(item => [
      item.name,
      `Rs. ${item.categories['Raw Material'].toLocaleString()}`,
      `Rs. ${item.categories['Equipment'].toLocaleString()}`,
      `Rs. ${item.categories['Uniform'].toLocaleString()}`,
      `Rs. ${item.total.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }
    });

    doc.save(`Region_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportRegionReportToExcel = () => {
    const worksheetData = [
      ["REGION PERFORMANCE REPORT"],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      ["Region Name", "Raw Material", "Equipment", "Uniform", "Total Sales"],
      ...regionReport.map(item => [
        item.name,
        item.categories['Raw Material'],
        item.categories['Equipment'],
        item.categories['Uniform'],
        item.total
      ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Region Report");
    XLSX.writeFile(workbook, `Region_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportRevenueLedgerToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136);
    doc.text("WEDRINK REVENUE LEDGER", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Revenue: Rs. ${stats.totalRevenue.toLocaleString()}`, 14, 34);

    const tableColumn = ["Date", "Order ID", "Franchise", "Region", "Amount", "Status"];
    const tableRows = orders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Pending')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(order => [
        new Date(order.date).toLocaleDateString(),
        `#${order.id.slice(-8)}`,
        order.franchiseName,
        order.regionName,
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

    doc.save(`Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportRevenueLedgerToExcel = () => {
    const worksheetData = [
      ["WEDRINK REVENUE LEDGER"],
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Total Revenue: Rs. ${stats.totalRevenue.toLocaleString()}`],
      [],
      ["Date", "Order ID", "Franchise", "Region", "Amount", "Status"],
      ...orders
        .filter(o => o.status !== 'Cancelled' && o.status !== 'Pending')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(order => [
          new Date(order.date).toLocaleDateString(),
          `#${order.id.slice(-8)}`,
          order.franchiseName,
          order.regionName,
          order.finalAmount,
          order.status
        ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Ledger");
    XLSX.writeFile(workbook, `Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportOrderHistoryToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136);
    doc.text("WEDRINK ORDER HISTORY", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumn = ["Date", "Order ID", "Franchise", "Region", "Amount", "Status"];
    const tableRows = orders
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(order => [
        new Date(order.date).toLocaleDateString(),
        `#${order.id.slice(-8)}`,
        order.franchiseName,
        order.regionName,
        `Rs. ${order.finalAmount.toLocaleString()}`,
        order.status
      ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }
    });

    doc.save(`Order_History_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportOrderHistoryToExcel = () => {
    const worksheetData = [
      ["WEDRINK ORDER HISTORY"],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      ["Date", "Order ID", "Franchise", "Region", "Amount", "Status"],
      ...orders
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(order => [
          new Date(order.date).toLocaleDateString(),
          `#${order.id.slice(-8)}`,
          order.franchiseName,
          order.regionName,
          order.finalAmount,
          order.status
        ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order History");
    XLSX.writeFile(workbook, `Order_History_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Exclude Cancelled and Delivered from Live Orders
      if (o.status === 'Cancelled' || o.status === 'Delivered') return false;
      
      const matchesSearch = o.franchiseName.toLowerCase().includes(search.toLowerCase()) || 
                            o.regionName.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = orderFilter === 'all' || (orderFilter === 'pending' && o.status === 'Pending');
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, orderFilter]);

  const stats = useMemo(() => {
    const verifiedOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Pending');
    const totalRevenue = verifiedOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const liveOrdersCount = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered').length;
    return { totalRevenue, pendingOrders, totalOrders: liveOrdersCount };
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
      if (order.status === 'Cancelled' || order.status === 'Pending') return;
      
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
      if (order.status === 'Cancelled' || order.status === 'Pending') return;

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

  if (!currentAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen selection:bg-teal-100 selection:text-teal-900 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-teal-50">
            <img src="/Logo.png" alt="WEDRINK" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">WEDRINK</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-600"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="hidden lg:flex items-center gap-4 mb-10">
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
              { id: 'orders', icon: LayoutDashboard, label: 'Live Orders', permission: 'orders' },
              { id: 'history', icon: History, label: 'Order History', permission: 'history' },
              { id: 'franchise', icon: Store, label: 'Franchise Ledger', permission: 'franchise' },
              { id: 'region', icon: MapPin, label: 'Region Reports', permission: 'region' },
              { id: 'revenue', icon: DollarSign, label: 'Revenue Ledger', permission: 'revenue' },
              { id: 'inventory', icon: Box, label: 'Inventory', permission: 'inventory' },
              { id: 'users', icon: Users, label: 'User Management', permission: 'users' },
              { id: 'admins', icon: Wrench, label: 'Admin Management', permission: 'admins' }
            ].filter(tab => currentAdmin?.permissions[tab.permission as keyof AdminPermissions]).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedFranchiseForDetail(null);
                  setIsMobileMenuOpen(false);
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto max-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab === 'orders' ? 'Live Orders' : activeTab.replace(/([A-Z])/g, ' $1')}
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
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
              <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-widest">System Online</span>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={exportOrderHistoryToPDF}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-white text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-[10px] md:text-xs"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                PDF
              </button>
              <button 
                onClick={exportOrderHistoryToExcel}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-white text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-[10px] md:text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel
              </button>
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
                    className={`bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border flex items-center gap-4 md:gap-6 group hover:shadow-xl hover:shadow-${stat.color}-900/5 transition-all cursor-pointer ${
                      (stat.id === 'total' && orderFilter === 'all') || (stat.id === 'pending' && orderFilter === 'pending') 
                        ? `border-${stat.color}-400 ring-4 ring-${stat.color}-50` 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 md:w-16 md:h-16 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl md:rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <stat.icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-xl md:text-3xl font-black text-slate-900">{stat.value}</p>
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
                  <div key={order.id} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all group">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center border border-slate-100 group-hover:border-teal-100 transition-all shadow-sm overflow-hidden">
                        <img src="/Logo.png" alt="WEDRINK" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg md:text-xl text-slate-900 group-hover:text-teal-600 transition-colors">{order.franchiseName}</h3>
                        <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3" /> {order.regionName} 
                          <span className="text-slate-300 hidden sm:inline">•</span> 
                          <Clock className="w-3 h-3" /> {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto">
                      <div className="flex flex-col items-start md:items-end">
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
                          className={`appearance-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm focus:outline-none transition-all cursor-pointer border-2 ${
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

                      <div className="flex flex-col items-start md:items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                        <p className="font-black text-xl md:text-2xl text-slate-900">Rs. {order.finalAmount.toLocaleString()}</p>
                      </div>

                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        className="p-3 md:p-4 bg-teal-600 text-white rounded-xl md:rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
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
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-green-600">
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Revenue Ledger</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Detailed breakdown of all transactions</p>
                </div>
              </div>
              <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cumulative Revenue</p>
                  <p className="text-2xl md:text-4xl font-black text-green-600">Rs. {stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={exportRevenueLedgerToPDF}
                    className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                    title="Export PDF"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    PDF
                  </button>
                  <button 
                    onClick={exportRevenueLedgerToExcel}
                    className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                    title="Export Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Excel
                  </button>
                </div>
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
                    {orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Pending').slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((order) => (
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
                <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-teal-100 shadow-xl shadow-teal-900/5 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 sticky top-0 z-30">
                  <div className="flex-1 min-w-0 relative">
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
                    <div className="flex overflow-x-auto gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm no-scrollbar">
                      {(['all', 'Raw Material', 'Equipment', 'Uniform'] as const).map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setFranchiseCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-xl font-bold capitalize transition-all text-[10px] md:text-xs whitespace-nowrap ${
                            franchiseCategoryFilter === cat ? 'bg-teal-600 text-white shadow-md shadow-teal-100' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-end gap-3 md:gap-4">
                    <div className="flex-1 flex flex-col min-w-[120px]">
                      <label className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest mb-1 ml-1">Month</label>
                      <input 
                        type="month" 
                        value={ledgerMonthFilter}
                        onChange={(e) => {
                          setLedgerMonthFilter(e.target.value);
                          setLedgerDateFilter(""); // Clear date filter if month is picked
                        }}
                        className="w-full px-4 py-2.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs md:text-sm font-black text-teal-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-[120px]">
                      <label className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest mb-1 ml-1">Date</label>
                      <input 
                        type="date" 
                        value={ledgerDateFilter}
                        onChange={(e) => {
                          setLedgerDateFilter(e.target.value);
                          setLedgerMonthFilter(""); // Clear month filter if date is picked
                        }}
                        className="w-full px-4 py-2.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs md:text-sm font-black text-teal-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                    {(ledgerDateFilter || ledgerMonthFilter) && (
                      <button 
                        onClick={() => {
                          setLedgerDateFilter("");
                          setLedgerMonthFilter("");
                        }}
                        className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={activeTab === 'franchise' ? exportFranchiseLedgerToPDF : exportRegionReportToPDF}
                        className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                        title="Export PDF"
                      >
                        <FileText className="w-4 h-4 text-teal-600" />
                      </button>
                      <button 
                        onClick={activeTab === 'franchise' ? exportFranchiseLedgerToExcel : exportRegionReportToExcel}
                        className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                        title="Export Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 md:gap-6 group hover:shadow-xl hover:shadow-teal-900/5 transition-all">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"><DollarSign className="w-6 h-6 md:w-7 md:h-7" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                      <p className="text-xl md:text-2xl font-black text-slate-900">Rs. {(activeTab === 'franchise' ? franchiseReport : regionReport).reduce((sum, item) => sum + item.total, 0).toLocaleString()}</p>
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
                    <div className="flex gap-2">
                      <button 
                        onClick={exportInventoryToPDF}
                        className="p-4 bg-white text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                        title="Export PDF"
                      >
                        <FileText className="w-5 h-5 text-teal-600" />
                        PDF
                      </button>
                      <button 
                        onClick={exportInventoryToExcel}
                        className="p-4 bg-white text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
                        title="Export Excel"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Excel
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {inventory
                      .filter(item => inventoryCategory === 'all' || item.type === inventoryCategory)
                      .map(item => (
                      <div key={item.id} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-900/5 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 group-hover:bg-teal-50 transition-colors" />
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6 md:mb-8">
                            <div className="flex items-center gap-4 md:gap-5">
                              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                                item.type === 'raw' ? 'bg-teal-50 text-teal-600' : 
                                item.type === 'equipment' ? 'bg-purple-50 text-purple-600' : 
                                'bg-orange-50 text-orange-600'
                              }`}>
                                {item.type === 'raw' ? <Package className="w-6 h-6 md:w-7 md:h-7" /> : 
                                 item.type === 'equipment' ? <Wrench className="w-6 h-6 md:w-7 md:h-7" /> : 
                                 <Shirt className="w-6 h-6 md:w-7 md:h-7" />}
                              </div>
                              <div>
                                <h3 className="font-black text-base md:text-lg text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">{item.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.type}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditingItem(item)}
                                className="p-2 md:p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setItemToDelete(item)}
                                className="p-2 md:p-3 bg-slate-50 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-between border border-slate-100 group-hover:border-teal-100 transition-colors">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Stock</p>
                              <div className="flex items-baseline gap-2">
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => setInventoryQuantity(item.id, parseInt(e.target.value))}
                                  className={`w-16 md:w-24 bg-transparent text-2xl md:text-3xl font-black focus:outline-none focus:text-teal-600 transition-colors ${
                                    item.quantity < 10 ? 'text-red-600' : 'text-slate-900'
                                  }`}
                                />
                                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Units</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => adjustInventory(item.id, 1)}
                                className="p-2 md:p-2.5 bg-white text-slate-400 hover:text-teal-600 hover:shadow-md rounded-lg md:rounded-xl transition-all border border-slate-100"
                              >
                                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => adjustInventory(item.id, -1)}
                                className="p-2 md:p-2.5 bg-white text-slate-400 hover:text-red-600 hover:shadow-md rounded-lg md:rounded-xl transition-all border border-slate-100"
                              >
                                <Minus className="w-3 h-3 md:w-4 md:h-4" />
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
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center border border-teal-50 shadow-sm overflow-hidden">
                          <img src="/Logo.png" alt="WEDRINK" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">{selectedFranchiseForDetail}</h2>
                          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Comprehensive Purchase Ledger</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedFranchiseForDetail(null)}
                        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-3 text-sm"
                      >
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                        Back to Network
                      </button>
                    </div>

                    {/* Monthly Records */}
                    <div className="grid gap-10">
                      {Object.entries(franchiseReport.find(f => f.name === selectedFranchiseForDetail)?.monthly || {}).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([month, data]: [string, any]) => (
                        <div key={month} className="bg-white rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="bg-slate-900 p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                              <h3 className="text-2xl md:text-3xl font-black">{month}</h3>
                              <p className="text-teal-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Monthly Performance Summary</p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Investment</p>
                              <p className="text-2xl md:text-4xl font-black text-white">Rs. {data.total.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="p-6 md:p-10 space-y-8 md:space-y-10">
                            {/* Category Breakdown for the Month */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                              {[
                                { label: 'Raw Material', icon: Package, color: 'teal' },
                                { label: 'Equipment', icon: Wrench, color: 'purple' },
                                { label: 'Uniform', icon: Shirt, color: 'orange' }
                              ].filter(cat => franchiseCategoryFilter === 'all' || cat.label === franchiseCategoryFilter).map(cat => (
                                <div key={cat.label} className="bg-slate-50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                                  <div className="relative z-10">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6`}>
                                      <cat.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{cat.label}</p>
                                    <p className="text-2xl md:text-3xl font-black text-slate-900">Rs. {data.categories[cat.label].toLocaleString()}</p>
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
                      <div key={item.name} className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-900/5 transition-all">
                        <div 
                          className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-50 transition-colors gap-6"
                          onClick={() => {
                            if (activeTab === 'franchise') {
                              setSelectedFranchiseForDetail(item.name);
                            } else {
                              setExpandedLedger(expandedLedger === item.name ? null : item.name);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center border border-slate-100 group-hover:border-teal-100 transition-all shadow-sm overflow-hidden">
                              {activeTab === 'franchise' ? (
                                <img src="/Logo.png" alt="WEDRINK" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                              ) : (
                                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-lg md:text-2xl text-slate-900 tracking-tight">{item.name}</h3>
                              <div className="flex flex-wrap gap-2 md:gap-3 mt-2">
                                {['Raw Material', 'Equipment', 'Uniform'].map(cat => (
                                  item.categories[cat] > 0 && (
                                    <span key={cat} className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
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
                          <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 w-full md:w-auto">
                            <div className="text-left md:text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {franchiseCategoryFilter === 'all' ? 'Cumulative Sales' : `${franchiseCategoryFilter} Sales`}
                              </p>
                              <p className="text-xl md:text-3xl font-black text-teal-600">
                                Rs. {(franchiseCategoryFilter === 'all' ? item.total : item.categories[franchiseCategoryFilter]).toLocaleString()}
                              </p>
                            </div>
                            {activeTab === 'franchise' ? (
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${expandedLedger === item.name ? 'bg-teal-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                <Plus className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${expandedLedger === item.name ? 'rotate-45' : ''}`} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {activeTab === 'region' && expandedLedger === item.name && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="p-6 md:p-10 border-t border-slate-100 bg-slate-50/50 space-y-8 md:space-y-10"
                          >
                            {/* Category Breakdown */}
                            <div>
                              <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                                Category Performance
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                                {[
                                  { label: 'Raw Material', icon: Package, color: 'teal' },
                                  { label: 'Equipment', icon: Wrench, color: 'purple' },
                                  { label: 'Uniform', icon: Shirt, color: 'orange' }
                                ].map(cat => (
                                  <div key={cat.label} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-teal-200 transition-all">
                                    <div className="relative z-10">
                                      <div className={`w-10 h-10 md:w-12 md:h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6`}>
                                        <cat.icon className="w-5 h-5 md:w-6 md:h-6" />
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{cat.label}</p>
                                      <p className="text-2xl md:text-3xl font-black text-slate-900">Rs. {item.categories[cat.label].toLocaleString()}</p>
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

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Franchise Users</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage portal access</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Region</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Franchise</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {franchiseUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900">{user.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600">
                          {user.password || '••••••••'}
                        </code>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                          {user.regionName}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold">
                          {user.franchiseName}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-teal-600">Rs. {(user.balance || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-600">{user.discountPercent || 0}%</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setUserToDelete(user)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {franchiseUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-slate-500 font-bold">
                        No users assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {activeTab === 'admins' && currentAdmin?.role === 'super_admin' && (
          <motion.div 
            key="admins"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Management</h2>
                <p className="text-slate-500 font-medium mt-1">Manage sub-admins and their permissions</p>
              </div>
              <button 
                onClick={() => setIsAddingAdmin(true)}
                className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
              >
                <Plus className="w-5 h-5" />
                Add New Admin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {adminUsers.filter(u => u.role !== 'super_admin').map(admin => (
                <div key={admin.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                      <Wrench className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 truncate max-w-[150px]">{admin.email}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Admin</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(admin.permissions).map(([key, value]) => (
                        value && (
                          <span key={key} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                            {key}
                          </span>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setEditingAdmin(admin)}
                      className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Permissions
                    </button>
                    <button 
                      onClick={() => setAdminToDelete(admin)}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>

    {/* Modals */}
    {isAddingAdmin && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-black text-slate-900">Add New Admin</h3>
            <button onClick={() => setIsAddingAdmin(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                placeholder="admin@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="text"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                placeholder="Set Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {Object.keys(newAdmin.permissions || {}).map((perm) => (
                  <label key={perm} className="flex items-center gap-3 p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl border border-slate-100 cursor-pointer hover:bg-teal-50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={(newAdmin.permissions as any)[perm]}
                      onChange={(e) => setNewAdmin({
                        ...newAdmin,
                        permissions: {
                          ...newAdmin.permissions as AdminPermissions,
                          [perm]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[10px] md:text-xs font-bold text-slate-600 capitalize">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleAddAdmin}
              disabled={!newAdmin.email || !newAdmin.password}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              Create Admin
            </button>
          </div>
        </motion.div>
      </div>
    )}

    {editingAdmin && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-black text-slate-900">Edit Permissions</h3>
            <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Editing Access For</p>
              <p className="font-black text-slate-900 text-sm">{editingAdmin.email}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {Object.keys(editingAdmin.permissions).map((perm) => (
                <label key={perm} className="flex items-center gap-3 p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl border border-slate-100 cursor-pointer hover:bg-teal-50 transition-colors">
                  <input 
                    type="checkbox"
                    checked={(editingAdmin.permissions as any)[perm]}
                    onChange={(e) => setEditingAdmin({
                      ...editingAdmin,
                      permissions: {
                        ...editingAdmin.permissions,
                        [perm]: e.target.checked
                      }
                    })}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-[10px] md:text-xs font-bold text-slate-600 capitalize">{perm}</span>
                </label>
              ))}
            </div>

            <button 
              onClick={handleUpdateAdmin}
              className="w-full bg-teal-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-200"
            >
              Update Permissions
            </button>
          </div>
        </motion.div>
      </div>
    )}

      {/* Modals */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl md:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-slate-900 p-6 md:p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl md:text-2xl font-black">Add User</h3>
                  <p className="text-teal-400 font-bold uppercase text-[10px] md:text-xs tracking-widest mt-1">Franchise Access</p>
                </div>
                <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Gmail Address</label>
                  <input 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="franchise@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <input 
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Set Password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Region</label>
                  <select 
                    value={newUser.regionId}
                    onChange={(e) => setNewUser({...newUser, regionId: e.target.value, franchiseId: ''})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Region</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                {newUser.regionId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Franchise</label>
                    <select 
                      value={newUser.franchiseId}
                      onChange={(e) => setNewUser({...newUser, franchiseId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Franchise</option>
                      {regions.find(r => r.id === newUser.regionId)?.franchises.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Initial Balance (Rs.)</label>
                    <input 
                      type="number"
                      value={newUser.balance}
                      onChange={(e) => setNewUser({...newUser, balance: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Discount (%)</label>
                    <input 
                      type="number"
                      value={newUser.discountPercent}
                      onChange={(e) => setNewUser({...newUser, discountPercent: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={addUser}
                  disabled={!newUser.email || !newUser.password || !newUser.regionId || !newUser.franchiseId}
                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 disabled:opacity-50"
                >
                  Save User
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-black">Edit Order</h3>
                  <p className="text-teal-400 font-bold uppercase text-xs tracking-widest mt-1">{editingOrder.franchiseName} - #{editingOrder.id.slice(-8)}</p>
                </div>
                <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-teal-600" />
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {editingOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rs. {item.price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
                              <button 
                                onClick={() => updateItemQuantityInEditingOrder(item.id, -1)}
                                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-teal-600 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-bold text-slate-900">{item.quantity}</span>
                              <button 
                                onClick={() => updateItemQuantityInEditingOrder(item.id, 1)}
                                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-teal-600 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeItemFromEditingOrder(item.id)}
                              className="p-2 text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {editingOrder.items.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold text-sm">No items in order</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Add More Items</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {inventory.map(item => (
                        <button
                          key={item.id}
                          onClick={() => addItemToEditingOrder({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            unit: item.unit,
                            category: (item.type === 'raw' ? 'Raw Material' : item.type === 'equipment' ? 'Equipment' : 'Uniform')
                          })}
                          className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
                        >
                          <p className="font-bold text-slate-900 text-xs group-hover:text-teal-600 transition-colors">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">Rs. {item.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-teal-400">Financial Adjustments</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Discount Percent (%)</label>
                        <input 
                          type="number"
                          value={editingOrder.discountPercent || 0}
                          onChange={(e) => setEditingOrder({...editingOrder, discountPercent: Number(e.target.value)})}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Balance Adjustment (Rs.)</label>
                        <input 
                          type="number"
                          value={editingOrder.balanceAdjustment || 0}
                          onChange={(e) => setEditingOrder({...editingOrder, balanceAdjustment: Number(e.target.value)})}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold">Rs. {editingOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Discount</span>
                        <span className="font-bold text-green-400">- Rs. {((editingOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * (editingOrder.discountPercent || 0)) / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Balance Used</span>
                        <span className="font-bold text-teal-400">- Rs. {(editingOrder.balanceAdjustment || 0).toLocaleString()}</span>
                      </div>
                      <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                        <span className="font-black uppercase tracking-widest text-sm">Final Amount</span>
                        <span className="text-3xl font-black text-teal-400">
                          Rs. {(
                            editingOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) - 
                            (editingOrder.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * (editingOrder.discountPercent || 0) / 100) - 
                            (editingOrder.balanceAdjustment || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpdateOrder}
                    className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black text-xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-900/20 flex items-center justify-center gap-3"
                  >
                    <Save className="w-6 h-6" />
                    Save Order Changes
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Customer will see these changes in their portal
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">Edit Franchise User</h3>
                  <p className="text-teal-400 font-bold uppercase text-xs tracking-widest mt-1">{editingUser.email}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Balance (Rs.)</label>
                    <input 
                      type="number"
                      value={editingUser.balance}
                      onChange={(e) => setEditingUser({...editingUser, balance: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Discount (%)</label>
                    <input 
                      type="number"
                      value={editingUser.discountPercent}
                      onChange={(e) => setEditingUser({...editingUser, discountPercent: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => updateUser(editingUser.id, { balance: editingUser.balance, discountPercent: editingUser.discountPercent })}
                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all shadow-lg shadow-teal-200"
                >
                  Update User
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Price (Rs.)</label>
                    <input 
                      type="number" 
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                    <input 
                      type="text" 
                      value={editingItem.unit}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                      placeholder="e.g. carton"
                    />
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Price (Rs.)</label>
                    <input 
                      type="number" 
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                    <input 
                      type="text" 
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-all"
                      placeholder="e.g. carton"
                    />
                  </div>
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

            <div className="p-4 md:p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Franchise</p>
                  <p className="text-lg md:text-xl font-black text-slate-900">{selectedOrder.franchiseName}</p>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">{selectedOrder.regionName}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date & Time</p>
                  <p className="text-lg md:text-xl font-black text-slate-900">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">{new Date(selectedOrder.date).toLocaleTimeString()}</p>
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
                  <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-100 space-y-3">
                    {selectedOrder.totalAmount && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Subtotal</span>
                        <span className="font-black text-slate-900">Rs. {selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrder.discount && selectedOrder.discount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">
                          Discount {selectedOrder.discountPercent ? `(${selectedOrder.discountPercent}%)` : ''}
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-teal-600 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white shadow-xl shadow-teal-100 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mb-1">Final Amount Paid</p>
                    <p className="text-2xl md:text-4xl font-black">Rs. {selectedOrder.finalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`px-4 md:px-6 py-2 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-sm ${
                    selectedOrder.status === 'Delivered' ? 'bg-white/20 text-white' : 'bg-white text-teal-600'
                  }`}>
                    {selectedOrder.status}
                  </div>
                </div>
              </div>

              {selectedOrder.paymentScreenshots && selectedOrder.paymentScreenshots.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Payment Proof</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedOrder.paymentScreenshots.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-2xl md:rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-lg hover:border-teal-500 transition-all">
                        <img src={url} alt={`Payment Proof ${idx + 1}`} className="w-full h-32 md:h-40 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6">
                <button 
                  onClick={() => setEditingOrder(selectedOrder)}
                  className="px-6 md:px-8 py-3 md:py-4 bg-teal-50 text-teal-600 rounded-xl md:rounded-2xl font-black hover:bg-teal-100 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                  Edit Order
                </button>
                <button 
                  onClick={() => {
                    setOrderToCancel(selectedOrder);
                  }}
                  className="px-6 md:px-8 py-3 md:py-4 bg-red-50 text-red-600 rounded-xl md:rounded-2xl font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
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

        {/* Delete Inventory Item Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] max-w-md w-full p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Delete Item?</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Are you sure you want to delete <span className="text-slate-900 font-bold">"{itemToDelete.name}"</span>? This action cannot be undone.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setItemToDelete(null)} 
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteInventoryItem(itemToDelete.id)}
                  className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete User Modal */}
        {userToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] max-w-md w-full p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Delete User?</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Are you sure you want to delete <span className="text-slate-900 font-bold">"{userToDelete.email}"</span>? This action cannot be undone.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setUserToDelete(null)} 
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteUser(userToDelete.id)}
                  className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Admin Modal */}
        {adminToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] max-w-md w-full p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Delete Admin?</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Are you sure you want to delete <span className="text-slate-900 font-bold">"{adminToDelete.email}"</span>? This action cannot be undone.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setAdminToDelete(null)} 
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteAdmin(adminToDelete.id)}
                  className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
