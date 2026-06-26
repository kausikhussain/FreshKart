import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  signup,
  login,
  getProfile,
  updateProfile,
  verifyOTP,
  googleLogin,
  addAddress,
  deleteAddress
} from '../controllers/auth.controller';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductBySlug,
  aiSearch,
  getRecommendations,
  getProductReviews,
  addReview
} from '../controllers/product.controller';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  validateCoupon,
  getActiveOrders,
  updateOrderStatus,
  assignDriver,
  verifyDeliveryOtp
} from '../controllers/order.controller';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
  createCoupon,
  getCoupons,
  deleteCoupon,
  getCustomers
} from '../controllers/admin.controller';

const router = Router();

// ================= AUTH ROUTES =================
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/auth/profile', authenticate, getProfile);
router.put('/auth/profile/update', authenticate, updateProfile);
router.post('/auth/otp/verify', verifyOTP);
router.post('/auth/google', googleLogin);
router.post('/auth/address', authenticate, addAddress);
router.delete('/auth/address/:addressId', authenticate, deleteAddress);

// ================= CATEGORY ROUTES =================
router.get('/categories', getCategories);
router.post('/categories', authenticate, authorize('admin'), createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), deleteCategory);

// ================= PRODUCT ROUTES =================
router.get('/products', getProducts);
router.get('/products/ai-search', aiSearch);
router.get('/products/recommendations', authenticate, getRecommendations);
router.get('/products/:slug', getProductBySlug);
router.get('/products/:productId/reviews', getProductReviews);
router.post('/products/:productId/reviews', authenticate, addReview);

// ================= ORDER ROUTES =================
router.post('/orders', authenticate, createOrder);
router.get('/orders/my', authenticate, getMyOrders);
router.post('/orders/coupon/validate', authenticate, validateCoupon);
router.get('/orders/active', authenticate, authorize('admin', 'delivery'), getActiveOrders);
router.get('/orders/:id', authenticate, getOrderById);
router.patch('/orders/:orderId/status', authenticate, authorize('admin', 'delivery'), updateOrderStatus);
router.post('/orders/:orderId/assign', authenticate, authorize('admin', 'delivery'), assignDriver);
router.post('/orders/:orderId/verify-otp', authenticate, authorize('delivery'), verifyDeliveryOtp);

// ================= ADMIN DASHBOARD ROUTES =================
router.post('/admin/products', authenticate, authorize('admin'), createProduct);
router.put('/admin/products/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/admin/products/:id', authenticate, authorize('admin'), deleteProduct);
router.get('/admin/stats', authenticate, authorize('admin'), getDashboardStats);
router.post('/admin/coupons', authenticate, authorize('admin'), createCoupon);
router.get('/admin/coupons', authenticate, authorize('admin'), getCoupons);
router.delete('/admin/coupons/:id', authenticate, authorize('admin'), deleteCoupon);
router.get('/admin/customers', authenticate, authorize('admin'), getCustomers);

export default router;
