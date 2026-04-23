export interface Product {
  id: string;
  name: string;
  category: 'Raw Material' | 'Equipment' | 'Uniform';
  price: number;
  unit: string;
}

export interface Franchise {
  id: string;
  name: string;
  city: string;
}

export interface Region {
  id: string;
  name: string;
  franchises: Franchise[];
   accountDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber?: string;
    iban?: string;
  };
}

export const regions: Region[] = [
  {
    id: 'reg-isb',
    name: 'Islamabad',
     accountDetails: {
      bankName: 'Meezan Bank',
      accountTitle: 'Wedrink Islamabad Office',
      iban: '000123456789'
    franchises: [
      { id: 'f-isb-1', name: 'G-9 Markaz (Tehzeeb)', city: 'Islamabad' },
      { id: 'f-isb-2', name: 'I-8 Markaz (Pakland)', city: 'Islamabad' },
      { id: 'f-isb-3', name: 'G-11 Markaz (Arshad Plaza)', city: 'Islamabad' },
      { id: 'f-isb-4', name: 'E-11/2 (Puran Arcade)', city: 'Islamabad' },
      { id: 'f-isb-5', name: 'F-6 Super Market', city: 'Islamabad' },
      { id: 'f-isb-6', name: 'F-10 Markaz (Amanat Plaza)', city: 'Islamabad' },
      { id: 'f-isb-7', name: 'Elysium Tower', city: 'Islamabad' },
      { id: 'f-isb-8', name: 'DHA Phase 2 (Sir Syed Blvd)', city: 'Islamabad' },
     //{ id: 'f-isb-9', name: 'Bahria Enclave', city: 'Islamabad' },
      { id: 'f-isb-10', name: 'F-11 Markaz (Liberty Mall)', city: 'Islamabad' },
      { id: 'f-isb-11', name: 'Blue Area (The Allegiance)', city: 'Islamabad' },
      { id: 'f-isb-12', name: 'Gulberg Greens (Samama Star)', city: 'Islamabad' },
      { id: 'f-isb-13', name: 'Centaurus Mall', city: 'Islamabad' },
      { id: 'f-isb-14', name: 'D-12 Markaz', city: 'Islamabad' },
      { id: 'f-isb-15', name: 'F-8 Markaz', city: 'Islamabad' },
     // { id: 'f-isb-16', name: 'B-17', city: 'Islamabad' },
     //{ id: 'f-isb-17', name: 'F-7 Markaz', city: 'Islamabad' },
     //{ id: 'f-isb-18', name: 'G-13 Markaz', city: 'Islamabad' },
     //{ id: 'f-isb-19', name: 'Top City', city: 'Islamabad' },
      { id: 'f-isb-20', name: 'Wah Cantt', city: 'Islamabad' },
    ]
  },
  {
    id: 'reg-rwp',
    name: 'Rawalpindi',
       accountDetails: {
      bankName: 'Meezan Bank',
      accountTitle: 'Wedrink Islamabad Office',
      iban: '000123456789'
    franchises: [
      { id: 'f-rwp-1', name: 'Bahria Ph 7 (Fortune Plaza)', city: 'Rawalpindi' },
      { id: 'f-rwp-2', name: 'Satellite Town (D-Block)', city: 'Rawalpindi' },
      { id: 'f-rwp-3', name: 'Bahria Ph 4 (Corniche Road)', city: 'Rawalpindi' },
      { id: 'f-rwp-4', name: 'PWD (D Heights)', city: 'Rawalpindi' },
      { id: 'f-rwp-5', name: 'Saddar (Adam G Road)', city: 'Rawalpindi' },
      { id: 'f-rwp-6', name: 'Giga Mall', city: 'Rawalpindi' },
    ]
  },
  {
    id: 'reg-lhr',
    name: 'Lahore',
     accountDetails: {
      bankName: 'Meezan Bank',
      accountTitle: 'DB LINK (PRIVATE) LIMITED',
      iban: 'PK74MEZN0002460104429936'
    franchises: [
      { id: 'f-lhr-1', name: 'Barkat Market', city: 'Lahore' },
      { id: 'f-lhr-2', name: 'Model Town Link Road', city: 'Lahore' },
      { id: 'f-lhr-3', name: 'DHA Rahber (Pine Ave)', city: 'Lahore' },
      { id: 'f-lhr-4', name: 'Bahria Grand Masjid', city: 'Lahore' },
      { id: 'f-lhr-5', name: 'Guldasht Town', city: 'Lahore' },
      { id: 'f-lhr-6', name: 'Saddar Gol Chakar', city: 'Lahore' },
      { id: 'f-lhr-7', name: 'Gulberg 2 (Main Market)', city: 'Lahore' },
      { id: 'f-lhr-8', name: 'DHA Phase 1 (H Block)', city: 'Lahore' },
      { id: 'f-lhr-9', name: 'DHA Phase 5 (Plaza A)', city: 'Lahore' },
      { id: 'f-lhr-10', name: 'Allama Iqbal Town (AIT)', city: 'Lahore' },
     //{ id: 'f-lhr-11', name: 'Dolmen Mall', city: 'Lahore' },
     // { id: 'f-lhr-12', name: 'Emporium Mall (Johar Town)', city: 'Lahore' },
      { id: 'f-lhr-13', name: 'DHA Phase 4 (DD Plaza)', city: 'Lahore' },
     //{ id: 'f-lhr-14', name: 'Liberty Gole Chakar', city: 'Lahore' },
      { id: 'f-lhr-15', name: 'Main PIA Road', city: 'Lahore' },
      { id: 'f-lhr-16', name: 'Cavalry Ground', city: 'Lahore' },
      { id: 'f-lhr-17', name: 'Shalimar Link Road', city: 'Lahore' },
     //{ id: 'f-lhr-18', name: 'DHA Phase 6 (MB)', city: 'Lahore' },
     //{ id: 'f-lhr-19', name: 'Johar Town (G-1 Market)', city: 'Lahore' },
     //{ id: 'f-lhr-20', name: 'Lake City', city: 'Lahore' },
     //{ id: 'f-lhr-21', name: 'Packages Mall', city: 'Lahore' },
      { id: 'f-lhr-22', name: 'Johar Town (Nazria-e-Pak)', city: 'Lahore' },
     //{ id: 'f-lhr-23', name: 'Raiwind Road', city: 'Lahore' },
      { id: 'f-lhr-24', name: 'Jail Road', city: 'Lahore' },
      { id: 'f-lhr-25', name: 'Mall Road', city: 'Lahore' },
      { id: 'f-lhr-26', name: 'DHA Raya', city: 'Lahore' },
    ]
  },
  {
    id: 'reg-fsd',
    name: 'Faisalabad',
       accountDetails: {
      bankName: 'Meezan Bank',
      accountTitle: 'Wedrink Faisalabad Office',
      iban: '000123456789'
    franchises: [
      { id: 'f-fsd-1', name: 'Lyallpur Galleria', city: 'Faisalabad' },
    //{ id: 'f-fsd-2', name: 'Kohinoor Susan Road', city: 'Faisalabad' },
      { id: 'f-fsd-3', name: 'Gulberg Road', city: 'Faisalabad' },
    ]
  },
  {
    id: 'reg-gjt',
    name: 'Gujrat',
       accountDetails: {
      bankName: 'Meezan Bank',
      accountTitle: 'Wedrink Gujrat Office',
      iban: '000123456789'
    franchises: [
      { id: 'f-gjt-1', name: 'Gujrat Gymkhana', city: 'Gujrat' },
    ]
  },
  {
    id: 'reg-qta',
    name: 'Quetta',
    franchises: [
      { id: 'f-qta-1', name: 'Airport Road (Business Center)', city: 'Quetta' },
     // { id: 'f-qta-2', name: 'Millennium Mall', city: 'Quetta' },
    ]
  },
  {
    id: 'reg-psh',
    name: 'Peshawar',
    franchises: [
      { id: 'f-psh-1', name: 'Shami Road', city: 'Peshawar' },
      { id: 'f-psh-2', name: 'Ring Road (HBK Arena)', city: 'Peshawar' },
      { id: 'f-psh-3', name: 'University Road', city: 'Peshawar' },
    ]
  },
  {
    id: 'reg-khi',
    name: 'Karachi',
    franchises: [
      { id: 'f-khi-1', name: 'Bahadurabad', city: 'Karachi' },
      { id: 'f-khi-2', name: 'Saddar', city: 'Karachi' },
     // { id: 'f-khi-3', name: 'Dolmen Mall', city: 'Karachi' },
     // { id: 'f-khi-4', name: 'Lucky One Mall', city: 'Karachi' },
    ]
  },
  {
    id: 'reg-mul',
    name: 'Multan',
    franchises: [
      { id: 'f-mul-1', name: 'DHA Multan (Ritz Arcade)', city: 'Multan' },
      { id: 'f-mul-2', name: 'Model Town (Block B)', city: 'Multan' },
      { id: 'f-mul-3', name: 'Bosan Road', city: 'Multan' },
     // { id: 'f-mul-4', name: 'Cantt', city: 'Multan' },
     // { id: 'f-mul-5', name: 'Gulshan Market', city: 'Multan' },
    ]
  },
  {
    id: 'reg-grw',
    name: 'Gujranwala',
    franchises: [
      //{ id: 'f-grw-1', name: 'Wapda Town Link Road', city: 'Gujranwala' },
      { id: 'f-grw-2', name: 'Sialkot Bypass (Canal Sq)', city: 'Gujranwala' },
      { id: 'f-grw-3', name: 'Satellite Town (Hafiz Mall)', city: 'Gujranwala' },
      { id: 'f-grw-4', name: 'Fazal Centre Rahwali', city: 'Gujranwala' },
    ]
  },
  {
    id: 'reg-mrd',
    name: 'Mardan',
    franchises: [
      { id: 'f-mrd-1', name: 'Nowshera Road', city: 'Mardan' },
    ]
  },
  {
    id: 'reg-sgd',
    name: 'Sargodha',
    franchises: [
      //{ id: 'f-sgd-1', name: 'University Road', city: 'Sargodha' },
    ]
  },
  {
    id: 'reg-skt',
    name: 'Sialkot',
    franchises: [
      { id: 'f-skt-1', name: 'Wazirabad Road', city: 'Sialkot' },
     // { id: 'f-skt-2', name: 'Cantt', city: 'Sialkot' },
    ]
  },
  {
    id: 'reg-jhl',
    name: 'Jhelum',
    franchises: [
      { id: 'f-jhl-1', name: 'Old GT Road', city: 'Jhelum' },
    ]
  },
  {
    id: 'reg-bwp',
    name: 'Bahawalpur',
    franchises: [
      { id: 'f-bwp-1', name: 'Model Town A (Orion Tower)', city: 'Bahawalpur' },
    ]
  },
  {
    id: 'reg-mbd',
    name: 'Mandi Bahauddin',
    franchises: [
      { id: 'f-mbd-1', name: 'Phalia Road', city: 'Mandi Bahauddin' },
    ]
  },
  {
    id: 'reg-wzd',
    name: 'Wazirabad',
    franchises: [
      { id: 'f-wzd-1', name: 'Gulshan Colony', city: 'Wazirabad' },
    ]
  },
  {
    id: 'reg-khn',
    name: 'Kharian',
    franchises: [
     // { id: 'f-khn-1', name: 'Old GT Road', city: 'Kharian' },
    ]
  },
  {
    id: 'reg-shw',
    name: 'Sahiwal',
    franchises: [
     // { id: 'f-shw-1', name: 'Sahiwal Branch', city: 'Sahiwal' },
    ]
  },
  {
    id: 'reg-hfz',
    name: 'Hafizabad',
    franchises: [
      { id: 'f-hfz-1', name: 'Madhrian Wala Road', city: 'Hafizabad' },
    ]
  },
  {
    id: 'reg-mre',
    name: 'Murree',
    franchises: [
     { id: 'f-mre-1', name: 'Express Way', city: 'Murree' },
    ]
  },
  //{
    //id: 'reg-swt',
    //name: 'Swat',
    //franchises: [
      //{ id: 'f-swt-1', name: 'Mingora GT Road', city: 'Swat' },
    //]
  //},
  {
    id: 'reg-mtw',
    name: 'Motorway',
    franchises: [
      { id: 'f-mtw-1', name: 'Hakla North Side', city: 'Motorway' },
      //{ id: 'f-mtw-2', name: 'Bhera Service Area (IN)', city: 'Motorway' },
      //{ id: 'f-mtw-3', name: 'Bhera Service Area (OUT)', city: 'Motorway' },
    ]
  }
];

export const products: Product[] = [
  // Raw Materials
  { id: 'RAW001', name: 'original ice cream powder', category: 'Raw Material', price: 46800, unit: 'carton' },
  { id: 'RAW002', name: 'matcha ice cream powder', category: 'Raw Material', price: 53600, unit: 'carton' },
  { id: 'RAW003', name: 'ice cream cone', category: 'Raw Material', price: 8270, unit: 'carton' },
  { id: 'RAW004', name: 'milk tea powder', category: 'Raw Material', price: 53000, unit: 'carton' },
  { id: 'RAW005', name: 'cappuccino powder', category: 'Raw Material', price: 75200, unit: 'carton' },
  { id: 'RAW006', name: 'latte powder', category: 'Raw Material', price: 75200, unit: 'carton' },
  { id: 'RAW007', name: 'pearl', category: 'Raw Material', price: 14000, unit: 'carton' },
  { id: 'RAW008', name: 'fruit honey', category: 'Raw Material', price: 30800, unit: 'carton' },
  { id: 'RAW009', name: 'fructose', category: 'Raw Material', price: 18000, unit: 'carton' },
  { id: 'RAW010', name: 'black sugar', category: 'Raw Material', price: 26800, unit: 'carton' },
  { id: 'RAW011', name: 'orange juice', category: 'Raw Material', price: 69200, unit: 'carton' },
  { id: 'RAW012', name: 'grape juice', category: 'Raw Material', price: 29200, unit: 'carton' },
  { id: 'RAW013', name: 'passion fruit juice', category: 'Raw Material', price: 33600, unit: 'carton' },
  { id: 'RAW014', name: 'coconut', category: 'Raw Material', price: 15600, unit: 'carton' },
  { id: 'RAW015', name: 'rasberry juice', category: 'Raw Material', price: 48400, unit: 'carton' },
  { id: 'RAW016', name: 'strawberry jam', category: 'Raw Material', price: 16800, unit: 'carton' },
  { id: 'RAW017', name: 'chocolate jam', category: 'Raw Material', price: 35000, unit: 'carton' },
  { id: 'RAW018', name: 'red grapefruit', category: 'Raw Material', price: 30400, unit: 'carton' },
  { id: 'RAW019', name: 'redbean can', category: 'Raw Material', price: 9600, unit: 'carton' },
  { id: 'RAW020', name: 'blueberry jam', category: 'Raw Material', price: 23600, unit: 'carton' },
  { id: 'RAW021', name: 'pinkpeach jam', category: 'Raw Material', price: 29600, unit: 'carton' },
  { id: 'RAW022', name: 'mongo smoothie powder', category: 'Raw Material', price: 49200, unit: 'carton' },
  { id: 'RAW023', name: 'mango jam', category: 'Raw Material', price: 32000, unit: 'carton' },
  { id: 'RAW024', name: 'jasmine tea', category: 'Raw Material', price: 79200, unit: 'carton' },
  { id: 'RAW025', name: 'grape fruit can', category: 'Raw Material', price: 18800, unit: 'carton' },
  { id: 'RAW026', name: 'black tea', category: 'Raw Material', price: 72000, unit: 'carton' },
  { id: 'RAW027', name: 'sour plum powder', category: 'Raw Material', price: 30000, unit: 'carton' },
  { id: 'RAW028', name: 'peach jelly', category: 'Raw Material', price: 10000, unit: 'carton' },
  { id: 'RAW029', name: 'pudding', category: 'Raw Material', price: 53600, unit: 'carton' },
  { id: 'RAW030', name: '500pp cup', category: 'Raw Material', price: 21000, unit: 'carton' },
  { id: 'RAW031', name: '700pp cup', category: 'Raw Material', price: 26000, unit: 'carton' },
  { id: 'RAW032', name: 'super bucket', category: 'Raw Material', price: 22000, unit: 'carton' },
  { id: 'RAW033', name: 'Sundae U cup', category: 'Raw Material', price: 21000, unit: 'carton' },
  { id: 'RAW034', name: 'Thick straw', category: 'Raw Material', price: 20000, unit: 'carton' },
  { id: 'RAW035', name: 'thin straw', category: 'Raw Material', price: 12000, unit: 'carton' },
  { id: 'RAW036', name: 'Spherical lid', category: 'Raw Material', price: 16400, unit: 'carton' },
  { id: 'RAW037', name: 'sealing rolls', category: 'Raw Material', price: 46400, unit: 'carton' },
  { id: 'RAW038', name: 'long spoon', category: 'Raw Material', price: 26000, unit: 'carton' },
  { id: 'RAW039', name: 'special spoon', category: 'Raw Material', price: 7200, unit: 'carton' },
  { id: 'RAW040', name: 'single cup bag', category: 'Raw Material', price: 39600, unit: 'carton' },
  { id: 'RAW041', name: 'double cup bag', category: 'Raw Material', price: 35600, unit: 'carton' },
  { id: 'RAW042', name: 'four cup bag', category: 'Raw Material', price: 35600, unit: 'carton' },
  { id: 'RAW043', name: '16A paper cup', category: 'Raw Material', price: 16400, unit: 'carton' },
  { id: 'RAW044', name: 'plasitc lid', category: 'Raw Material', price: 15500, unit: 'carton' },

  // Equipment
  { id: 'EQP001', name: 'Ice Cream Machine', category: 'Equipment', price: 1472000, unit: 'pcs' },
  { id: 'EQP002', name: 'Ice Making Machine', category: 'Equipment', price: 1024000, unit: 'pcs' },
  { id: 'EQP003', name: 'Sealing Machine', category: 'Equipment', price: 220000, unit: 'pcs' },
  { id: 'EQP004', name: 'Hot Water Machine', category: 'Equipment', price: 132000, unit: 'pcs' },
  { id: 'EQP005', name: 'Refrigerator', category: 'Equipment', price: 624000, unit: 'pcs' },
  { id: 'EQP006', name: 'Freezer', category: 'Equipment', price: 272000, unit: 'pcs' },
  { id: 'EQP007', name: 'Fructose machine', category: 'Equipment', price: 152000, unit: 'pcs' },
  { id: 'EQP008', name: 'RO-Water purifiers', category: 'Equipment', price: 220000, unit: 'pcs' },
  { id: 'EQP009', name: 'Pure water machine storage tank', category: 'Equipment', price: 50000, unit: 'pcs' },
  { id: 'EQP010', name: 'Ice Cream Model', category: 'Equipment', price: 54000, unit: 'pcs' },
  { id: 'EQP011', name: 'Pearl Cooker', category: 'Equipment', price: 67200, unit: 'pcs' },
  { id: 'EQP012', name: 'Slicer', category: 'Equipment', price: 7520, unit: 'pcs' },
  { id: 'EQP013', name: 'Blender', category: 'Equipment', price: 83400, unit: 'pcs' },
  { id: 'EQP014', name: 'Weight measurer 1g', category: 'Equipment', price: 17200, unit: 'pcs' },
  { id: 'EQP015', name: 'Weight measurer 0.1g', category: 'Equipment', price: 2760, unit: 'pcs' },
  { id: 'EQP016', name: 'Lemon stick', category: 'Equipment', price: 3920, unit: 'pcs' },
  { id: 'EQP017', name: 'Stainless steel bucket', category: 'Equipment', price: 8000, unit: 'pcs' },
  { id: 'EQP018', name: 'S.S steel bucket (small)', category: 'Equipment', price: 1720, unit: 'pcs' },
  { id: 'EQP019', name: 'Thermos', category: 'Equipment', price: 11680, unit: 'pcs' },
  { id: 'EQP020', name: 'Leaky net', category: 'Equipment', price: 2000, unit: 'pcs' },
  { id: 'EQP021', name: 'Egg stirrer', category: 'Equipment', price: 1400, unit: 'pcs' },
  { id: 'EQP022', name: 'Big Ice Shovel', category: 'Equipment', price: 1520, unit: 'pcs' },
  { id: 'EQP023', name: 'Measuring spoon', category: 'Equipment', price: 40, unit: 'pcs' },
  { id: 'EQP024', name: 'Can openner', category: 'Equipment', price: 1160, unit: 'pcs' },
  { id: 'EQP025', name: 'Bar spoons', category: 'Equipment', price: 360, unit: 'pcs' },
  { id: 'EQP026', name: '5000ml measure cup', category: 'Equipment', price: 1800, unit: 'pcs' },
  { id: 'EQP027', name: '2000ml measure cup', category: 'Equipment', price: 1200, unit: 'pcs' },
  { id: 'EQP028', name: '300ml measure cup', category: 'Equipment', price: 720, unit: 'pcs' },
  { id: 'EQP029', name: 'Leaky bag', category: 'Equipment', price: 600, unit: 'pcs' },
  { id: 'EQP030', name: 'Chocolate Presser', category: 'Equipment', price: 880, unit: 'pcs' },
  { id: 'EQP031', name: 'Sugar pressure flask', category: 'Equipment', price: 1600, unit: 'pcs' },
  { id: 'EQP032', name: 'Stainless steel spoon', category: 'Equipment', price: 1450, unit: 'pcs' },
  { id: 'EQP033', name: 'Stainless steel colander', category: 'Equipment', price: 680, unit: 'pcs' },
  { id: 'EQP034', name: 'Cup holder', category: 'Equipment', price: 8400, unit: 'pcs' },
  { id: 'EQP035', name: 'Powder box', category: 'Equipment', price: 800, unit: 'pcs' },
  { id: 'EQP036', name: 'Straw organizer', category: 'Equipment', price: 8400, unit: 'pcs' },
  { id: 'EQP037', name: 'Thermometer', category: 'Equipment', price: 1680, unit: 'pcs' },
  { id: 'EQP038', name: 'Timer', category: 'Equipment', price: 880, unit: 'pcs' },
  { id: 'EQP039', name: 'Sealing clip', category: 'Equipment', price: 640, unit: 'pcs' },
  { id: 'EQP040', name: 'Towels', category: 'Equipment', price: 1200, unit: 'pcs' },
  { id: 'EQP041', name: 'Shake Cup-700cc', category: 'Equipment', price: 1000, unit: 'pcs' },
  { id: 'EQP042', name: 'Curtain', category: 'Equipment', price: 2400, unit: 'pcs' },
  { id: 'EQP043', name: 'Pool 1500*620*800', category: 'Equipment', price: 103600, unit: 'pcs' },
  { id: 'EQP044', name: 'Shelving (large)', category: 'Equipment', price: 73000, unit: 'pcs' },
  { id: 'EQP045', name: '2m Light box', category: 'Equipment', price: 146000, unit: 'pcs' },
  { id: 'EQP046', name: '3m Light box', category: 'Equipment', price: 220000, unit: 'pcs' },
  { id: 'EQP047', name: 'Plastic doll', category: 'Equipment', price: 200000, unit: 'pcs' },
  { id: 'EQP048', name: 'A set of cash register', category: 'Equipment', price: 260000, unit: 'pcs' },
  { id: 'EQP049', name: '20 inches PP filter cartridge', category: 'Equipment', price: 800, unit: 'pcs' },
  { id: 'EQP050', name: 'PP cotton integrated filter cartridge', category: 'Equipment', price: 960, unit: 'pcs' },
  { id: 'EQP051', name: '20 inches UDF filter cartridge', category: 'Equipment', price: 2000, unit: 'pcs' },
  { id: 'EQP052', name: '20 inches resin filter cartridge', category: 'Equipment', price: 3000, unit: 'pcs' },
  { id: 'EQP053', name: 'RO membrane filter cartridge', category: 'Equipment', price: 19200, unit: 'pcs' },
  { id: 'EQP054', name: '4 meter Arches', category: 'Equipment', price: 15000, unit: 'pcs' },
  { id: 'EQP055', name: '6 meter Arches', category: 'Equipment', price: 20000, unit: 'pcs' },
  { id: 'EQP056', name: 'Doll', category: 'Equipment', price: 5000, unit: 'pcs' },
  { id: 'EQP057', name: 'Ice cream machine dasher rubber sleeve', category: 'Equipment', price: 500, unit: 'pcs' },

  // Uniform
  { id: 'UNI001', name: 'clothes (S)', category: 'Uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI002', name: 'clothes (M)', category: 'Uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI003', name: 'clothes (L)', category: 'Uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI004', name: 'clothes (XL)', category: 'Uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI005', name: 'clothes (XXL)', category: 'Uniform', price: 1720, unit: 'pcs' },
  { id: 'UNI006', name: 'apron', category: 'Uniform', price: 1790, unit: 'pcs' },
  { id: 'UNI007', name: 'hat', category: 'Uniform', price: 860, unit: 'pcs' },
  { id: 'UNI008', name: 'sleeve', category: 'Uniform', price: 430, unit: 'pair' },
  { id: 'UNI009', name: 'Jacket (M)', category: 'Uniform', price: 3600, unit: 'pcs' },
  { id: 'UNI010', name: 'Jacket (L)', category: 'Uniform', price: 3600, unit: 'pcs' },
  { id: 'UNI011', name: 'Jacket (XL)', category: 'Uniform', price: 3600, unit: 'pcs' },
  { id: 'UNI012', name: 'Blue Shirts S', category: 'Uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI013', name: 'Blue Shirts M', category: 'Uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI014', name: 'Blue Shirts L', category: 'Uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI015', name: 'Blue Shirts XL', category: 'Uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI016', name: 'Blue Shirts XXL', category: 'Uniform', price: 2300, unit: 'pcs' },
  { id: 'UNI017', name: 'office Jackets M', category: 'Uniform', price: 4000, unit: 'pcs' },
  { id: 'UNI018', name: 'office Jackets L', category: 'Uniform', price: 4000, unit: 'pcs' },
  { id: 'UNI019', name: 'office Jackets XL', category: 'Uniform', price: 4000, unit: 'pcs' },
];
