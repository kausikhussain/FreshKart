import { Response } from 'express';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Coupon from '../models/coupon.model';
import User from '../models/user.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { items, deliveryAddress, paymentGateway, couponCode, deliverySlot } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // 1. Calculate subtotal & validate inventory
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${dbProduct.name}` });
      }

      const activePrice = dbProduct.discountPrice || dbProduct.price;
      subtotal += activePrice * item.quantity;

      validatedItems.push({
        product: dbProduct._id,
        quantity: item.quantity,
        price: activePrice
      });
    }

    // 2. Coupon discount verification
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!appliedCoupon) {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }

      if (appliedCoupon.expiryDate < new Date()) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }

      if (subtotal < appliedCoupon.minOrderValue) {
        return res.status(400).json({
          message: `Minimum order value for this coupon is ₹${appliedCoupon.minOrderValue}`
        });
      }

      if (appliedCoupon.discountType === 'flat') {
        discount = appliedCoupon.discountValue;
      } else if (appliedCoupon.discountType === 'percentage') {
        discount = (subtotal * appliedCoupon.discountValue) / 100;
        if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
          discount = appliedCoupon.maxDiscount;
        }
      }

      // Ensure discount is not greater than subtotal
      discount = Math.min(discount, subtotal);
    }

    // 3. Tax and delivery fees
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const deliveryFee = subtotal > 500 ? 0 : 29; // Free delivery above 500

    const grandTotal = subtotal + tax + deliveryFee - discount;

    // 4. Generate OTP for delivery verification (4 digits)
    const otpForDelivery = Math.floor(1000 + Math.random() * 9000).toString();

    // 5. Create Order object
    const order = new Order({
      user: user._id,
      items: validatedItems,
      deliveryAddress,
      paymentDetails: {
        gateway: paymentGateway || 'cod',
        status: paymentGateway === 'cod' ? 'pending' : 'paid', // auto-pay credit card / stripe simulated payments
        transactionId: paymentGateway !== 'cod' ? `txn_${Math.random().toString(36).substring(2, 11)}` : undefined
      },
      totals: {
        subtotal,
        tax,
        deliveryFee,
        discount,
        grandTotal
      },
      status: 'pending',
      deliverySlot: deliverySlot || 'Within 10 mins',
      otpForDelivery,
      trackingUpdates: [
        {
          status: 'pending',
          note: 'Order placed successfully. Awaiting confirmation.'
        }
      ]
    });

    await order.save();

    // 6. Update inventory stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('items.product', 'name images unit price discountPrice')
      .populate('deliveryPartner', 'name phone profileImage');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate access (Customer owns it, or delivery partner is assigned, or Admin is viewing)
    const isOwner = order.user.toString() === req.user?._id.toString();
    const isAssignedDriver = order.deliveryPartner?.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAssignedDriver && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user?._id })
      .populate('items.product', 'name images unit price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// COUPONS VALIDATION
export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, cartAmount } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code not found or inactive' });
    }

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (cartAmount < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Coupon is applicable for orders above ₹${coupon.minOrderValue}`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    } else {
      discount = (cartAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    res.json({
      code: coupon.code,
      discount,
      minOrderValue: coupon.minOrderValue,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN & DRIVER DISPATCH OPERATIONS
export const getActiveOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return all orders that are not delivered/cancelled for admin, or unassigned/assigned to current driver
    const { role } = req.user!;
    let query: any = {};

    if (role === 'delivery') {
      // Driver can see orders assigned to them, or unassigned orders that are "confirmed" or "packed"
      query = {
        $or: [
          { deliveryPartner: req.user?._id, status: { $ne: 'delivered' } },
          { deliveryPartner: null, status: 'confirmed' },
          { deliveryPartner: null, status: 'packed' }
        ]
      };
    } else if (role === 'admin') {
      // Admin sees everything
      query = {};
    }

    const orders = await Order.find(query)
      .populate('user', 'name phone email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate access
    const isDriver = req.user?.role === 'delivery';
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && isDriver && order.deliveryPartner?.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Access denied: Driver not assigned to this order' });
    }

    order.status = status;
    order.trackingUpdates.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`
    });

    await order.save();

    // Trigger Socket notification from express routes (or through direct socket reference in server)
    const io = req.app.get('socketio');
    if (io) {
      io.to(`order_${order._id}`).emit('orderStatusChanged', {
        orderId: order._id,
        status,
        trackingUpdates: order.trackingUpdates
      });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignDriver = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user?.role === 'admin' ? req.body.driverId : req.user?._id;

    if (!driverId) return res.status(400).json({ message: 'Driver ID is required' });

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'delivery') {
      return res.status(400).json({ message: 'Invalid driver assigned' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.deliveryPartner = driverId;
    order.status = 'confirmed'; // auto transition if pending
    order.trackingUpdates.push({
      status: 'confirmed',
      note: `Delivery partner ${driver.name} assigned to order.`
    });

    await order.save();

    const io = req.app.get('socketio');
    if (io) {
      io.to(`order_${order._id}`).emit('driverAssigned', {
        orderId: order._id,
        driver: {
          id: driver._id,
          name: driver.name,
          phone: driver.phone,
          profileImage: driver.profileImage
        }
      });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyDeliveryOtp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.otpForDelivery !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Verification failed.' });
    }

    order.status = 'delivered';
    order.paymentDetails.status = 'paid'; // paid on COD
    order.trackingUpdates.push({
      status: 'delivered',
      note: 'OTP verified. Order delivered successfully!'
    });

    await order.save();

    const io = req.app.get('socketio');
    if (io) {
      io.to(`order_${order._id}`).emit('orderStatusChanged', {
        orderId: order._id,
        status: 'delivered',
        trackingUpdates: order.trackingUpdates
      });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
