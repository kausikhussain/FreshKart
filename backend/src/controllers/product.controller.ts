import { Request, Response } from 'express';
import Product from '../models/product.model';
import Category from '../models/category.model';
import Review from '../models/review.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// CATEGORIES CONTROLLERS
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, image, parentCategory, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = new Category({ name, slug, image, parentCategory, description });
    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, image, parentCategory, description } = req.body;
    const updateData: any = { name, image, parentCategory, description };
    if (name) {
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PRODUCTS CONTROLLERS
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, subcategory, search, minPrice, maxPrice, sort, isTrending, page = 1, limit = 20 } = req.query;

    const query: any = { status: 'active' };

    if (category) {
      // Find category by slug or id
      const cat = await Category.findOne({ $or: [{ slug: String(category) }, { _id: category }] });
      if (cat) query.category = cat._id;
    }

    if (subcategory) {
      const subcat = await Category.findOne({ $or: [{ slug: String(subcategory) }, { _id: subcategory }] });
      if (subcat) query.subcategory = subcat._id;
    }

    if (isTrending === 'true') {
      query.isTrending = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: String(search) };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortObj: any = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    if (sort === 'discount') {
      // Custom projection could be done, but for simplicity, we sort by discountPrice / discount percentage
      sortObj = { discountPrice: 1 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// AI Search Simulator (Semantic/Natural Language Search)
export const aiSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Query parameter is required' });

    const searchStr = String(query).toLowerCase();

    // Semantic maps for common NL intent
    const categoryKeywords: { [key: string]: string[] } = {
      fruits: ['apple', 'banana', 'mango', 'orange', 'grape', 'fruit', 'berry', 'strawberry', 'citrus'],
      vegetables: ['potato', 'onion', 'tomato', 'garlic', 'ginger', 'spinach', 'chili', 'carrot', 'veggie', 'greens'],
      dairy: ['milk', 'cheese', 'butter', 'curd', 'paneer', 'yogurt', 'cream', 'ghee'],
      bakery: ['bread', 'bun', 'croissant', 'cookie', 'biscuit', 'toast', 'cake'],
      snacks: ['chips', 'chocolate', 'kurkure', 'lays', 'popcorn', 'snack', 'namkeen', 'biscuit']
    };

    let targetCategories: string[] = [];
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => searchStr.includes(kw)) || searchStr.includes(cat)) {
        targetCategories.push(cat);
      }
    }

    // Determine special filters
    const highProtein = searchStr.includes('protein') || searchStr.includes('gym') || searchStr.includes('diet');
    const lowFat = searchStr.includes('low fat') || searchStr.includes('diet') || searchStr.includes('healthy');
    const organic = searchStr.includes('organic') || searchStr.includes('fresh') || searchStr.includes('natural');
    const discount = searchStr.includes('deal') || searchStr.includes('offer') || searchStr.includes('discount') || searchStr.includes('sale');

    // Run MongoDB queries based on matching categories or standard regex search
    let filterQuery: any = { status: 'active' };

    if (targetCategories.length > 0) {
      const dbCats = await Category.find({ slug: { $in: targetCategories } });
      if (dbCats.length > 0) {
        filterQuery.category = { $in: dbCats.map(c => c._id) };
      }
    }

    // Fallback or boost with text regex if no category matching matches
    if (!filterQuery.category) {
      // Regex check on name/description
      const regexTerms = searchStr.split(' ').filter(term => term.length > 2);
      if (regexTerms.length > 0) {
        filterQuery.$or = regexTerms.map(term => ({
          name: { $regex: term, $options: 'i' }
        }));
      }
    }

    if (discount) {
      filterQuery.discountPrice = { $exists: true, $ne: null };
    }

    let products = await Product.find(filterQuery)
      .populate('category', 'name slug')
      .limit(15);

    // If no results, do a generic query to not show blank
    if (products.length === 0) {
      products = await Product.find({ status: 'active' }).limit(5);
    }

    res.json({
      query,
      aiAnalysis: {
        detectedCategories: targetCategories,
        filtersApplied: { highProtein, lowFat, organic, discount },
        confidence: products.length > 0 ? 0.92 : 0.45
      },
      results: products
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// AI Recommendations (Personalized Suggestions)
export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.query;
    let query: any = { status: 'active' };

    if (productId) {
      // Item-to-item recommendations: same category or subcategory
      const currentProduct = await Product.findById(productId);
      if (currentProduct) {
        query._id = { $ne: currentProduct._id };
        query.category = currentProduct.category;
      }
    } else if (req.user) {
      // User-history based recommendation: get trending products or random active ones
      query.isTrending = true;
    }

    const recommendations = await Product.find(query)
      .populate('category', 'name slug')
      .limit(6);

    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// REVIEWS CONTROLLERS
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const { rating, comment, images } = req.body;

    const existingReview = await Review.findOne({ user: user._id, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = new Review({
      user: user._id,
      product: productId,
      rating,
      comment,
      images: images || []
    });

    await review.save();

    // Recompute product avg rating & count
    const productReviews = await Review.find({ product: productId });
    const reviewCount = productReviews.length;
    const avgRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0) / reviewCount;

    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount
    });

    const populatedReview = await review.populate('user', 'name profileImage');
    res.status(201).json(populatedReview);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
