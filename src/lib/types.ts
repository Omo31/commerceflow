export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string; // Legacy, prefer addresses
  avatar: string;
  role: "admin" | "user" | "superadmin";
  createdAt: string;
  campaignSource?: string; // To track marketing campaign source
  status: "active" | "disabled";
  addresses?: ShippingAddress[];
  tags?: string[];
  notes?: string[];
  notificationPreferences?: {
    orderUpdates?: boolean;
    promotions?: boolean;
  };
};

export type OrderStatus =
  | "Pending Review"
  | "Pricing"
  | "Pending Acceptance"
  | "Accepted"
  | "Rejected"
  | "In Cart"
  | "Processing" // Waiting for admin to add shipping cost
  | "Ready for Payment" // Shipping cost added, user can now pay
  | "Shipped"
  | "Completed"
  | "Cancelled";

export type ShippingAddress = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CartItem = {
  id: string;
  productId: string; // This can be the original product ID or a custom order ID
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
  isCustomOrder?: boolean; // Flag to differentiate custom orders in the cart
};

export type OrderItem = {
  name: string;
  quantity: number;
  price?: number; // Price is optional for initial custom order submission
  unitOfMeasure: string;
};

export type OrderHistory = {
  timestamp: string;
  status: OrderStatus;
  notified: boolean;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  serviceCharge: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: ShippingAddress;
  cartId?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  history?: OrderHistory[];
  privateNotes?: string[];
  discountCode?: string;
  discountAmount?: number;
  discountId?: string;
};

export type Payment = {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  status: "Success" | "Failed";
  paymentDate: string;
  transactionId: string;
};

export type Dimensions = {
  length: number;
  width: number;
  height: number;
};

export type ProductVariant = {
  name: string;
  price: number;
  quantity: number;
  sku: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  createdAt?: string;
  updatedAt?: string;
  quantity: number;
  variants: ProductVariant[];
  tags: string[];
  sku: string;
  status: "active" | "draft" | "archived";
  weight: number;
  dimensions: Dimensions;
  relatedProducts: string[];
};

export type Invoice = {
  id: string;
  orderId: string;
  invoiceDate: string;
  dueDate: string;
  amountDue: number;
  status: "sent" | "paid" | "overdue";
};

export type LandingPageContent = {
  id: string;
  heroTitle: string;
  heroDescription: string;
  serviceOfferings: string[];
  [key: string]: any;
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  type: "order" | "general";
  timestamp: any;
  read: boolean;
  link?: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: any; // Can be a Date or a Firestore Timestamp
};
