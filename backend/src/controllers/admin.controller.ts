import { Request, Response } from 'express';
import Product from '../models/product.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import Coupon from '../models/coupon.model';
import Category from '../models/category.model';

// PRODUCT CRUD
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, discountPrice, unit, images, category, subcategory, stock, isTrending } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const product = new Product({
      name,
      slug,
      description,
      price,
      discountPrice,
      unit,
      images: images || ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'], // default grocery bag
      category,
      subcategory,
      stock,
      isTrending: !!isTrending,
      status: 'active'
    });

    await product.save();
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, discountPrice, unit, images, category, subcategory, stock, isTrending, status } = req.body;

    const updateData: any = { description, price, discountPrice, unit, images, category, subcategory, stock, isTrending, status };

    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// DASHBOARD ANALYTICS
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalRevenueResult = await Order.aggregate([
      { $match: { 'paymentDetails.status': 'paid', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.grandTotal' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();

    // Low stock items (stock < 10)
    const lowStockItems = await Product.find({ stock: { $lt: 10 } })
      .populate('category', 'name')
      .limit(5);

    // Sales trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totals.grandTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Popular categories distribution
    const categorySales = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.name',
          value: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { value: -1 } }
    ]);

    res.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts
      },
      lowStockItems,
      salesTrend: salesTrend.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders
      })),
      categorySales: categorySales.map((item) => ({
        name: item._id,
        value: item.value
      }))
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// COUPONS CRUD
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon already exists' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      expiryDate: new Date(expiryDate),
      usageLimit
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// CUSTOMER MANAGEMENT
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email phone createdAt')
      .sort({ createdAt: -1 });
    
    // Enrich with order statistics
    const enrichedCustomers = await Promise.all(
      customers.map(async (cust) => {
        const orderCount = await Order.countDocuments({ user: cust._id });
        const totalSpentResult = await Order.aggregate([
          { $match: { user: cust._id, 'paymentDetails.status': 'paid' } },
          { $group: { _id: null, total: { $sum: '$totals.grandTotal' } } }
        ]);
        return {
          id: cust._id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          joinedAt: cust.createdAt,
          orderCount,
          totalSpent: totalSpentResult[0]?.total || 0
        };
      })
    );

    res.json(enrichedCustomers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
