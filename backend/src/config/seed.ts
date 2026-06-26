import Category from '../models/category.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import Coupon from '../models/coupon.model';

export const seedDatabase = async () => {
  try {
    // 1. Check if seed is already done by checking products
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log('Database already has data. Skipping seeder...');
      return;
    }

    console.log('Seeding database with FreshKart demo dataset...');

    // 2. Clear collections (optional, but clean for first seed)
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    
    // Check if we need to seed users (don't delete existing users if any, just check count)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Seed default accounts
      const adminUser = new User({
        name: 'FreshKart Admin',
        email: 'admin@freshkart.com',
        password: 'admin123', // Will be hashed via User pre-save hook
        role: 'admin',
        phone: '9876543210',
        isVerified: true
      });

      const customerUser = new User({
        name: 'John Doe',
        email: 'user@freshkart.com',
        password: 'user123',
        role: 'customer',
        phone: '8765432109',
        isVerified: true,
        addresses: [
          {
            label: 'Home',
            street: 'Flat 402, Sunshine Heights, Koramangala',
            city: 'Bengaluru',
            state: 'Karnataka',
            zipCode: '560034',
            country: 'India',
            coordinates: { lat: 12.9352, lng: 77.6245 },
            isDefault: true
          }
        ]
      });

      const deliveryUser = new User({
        name: 'Rohan Sharma (Driver)',
        email: 'driver@freshkart.com',
        password: 'driver123',
        role: 'delivery',
        phone: '7654321098',
        isVerified: true
      });

      await adminUser.save();
      await customerUser.save();
      await deliveryUser.save();
      console.log('Seeded default accounts: admin@freshkart.com, user@freshkart.com, driver@freshkart.com');
    }

    // 3. Seed Categories
    const categoriesData = [
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh farm-picked fruits and vegetables' },
      { name: 'Dairy & Bread', slug: 'dairy-bread', description: 'Fresh milk, butter, cheese, and breads' },
      { name: 'Snacks & Munchies', slug: 'snacks-munchies', description: 'Chips, biscuits, chocolates, and namkeen' },
      { name: 'Bakery', slug: 'bakery', description: 'Cakes, croissants, and fresh bakes' },
      { name: 'Beverages', slug: 'beverages', description: 'Soft drinks, fruit juices, tea, and coffee' }
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${categories.length} core categories.`);

    const getCatId = (slug: string) => categories.find((c) => c.slug === slug)?._id;

    // 4. Seed Products
    const productsData = [
      // Fruits & Vegetables
      {
        name: 'Fresh Red Onion',
        slug: 'fresh-red-onion',
        description: 'Premium quality farm-fresh red onions. Rich in flavor and perfect for daily culinary needs.',
        price: 45,
        discountPrice: 38,
        unit: '1 kg',
        images: ['https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('fruits-vegetables'),
        stock: 120,
        isTrending: true
      },
      {
        name: 'Organic Banana (Robusta)',
        slug: 'organic-banana',
        description: 'Fresh, sweet Robusta bananas sourced from organic farms. Rich source of potassium and energy.',
        price: 60,
        discountPrice: 48,
        unit: '6 pcs',
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('fruits-vegetables'),
        stock: 80,
        isTrending: false
      },
      {
        name: 'Fresh Tomato (Hybrid)',
        slug: 'fresh-tomato',
        description: 'Bright red, juicy hybrid tomatoes. Perfect for curries, salads, and soups.',
        price: 35,
        discountPrice: 28,
        unit: '500 g',
        images: ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('fruits-vegetables'),
        stock: 150,
        isTrending: true
      },
      {
        name: 'Royal Gala Apple',
        slug: 'royal-gala-apple',
        description: 'Sweet, crisp, and aromatic apples imported from Chile. Ideal for snacks and desserts.',
        price: 180,
        discountPrice: 159,
        unit: '4 pcs',
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('fruits-vegetables'),
        stock: 50,
        isTrending: true
      },

      // Dairy & Bread
      {
        name: 'Fresh Toned Milk',
        slug: 'fresh-toned-milk',
        description: 'Pasteurized toned milk with 3.0% fat and 8.5% SNF. Ideal for daily tea, coffee, and consumption.',
        price: 32,
        discountPrice: 30,
        unit: '500 ml',
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('dairy-bread'),
        stock: 200,
        isTrending: true
      },
      {
        name: 'Amul Salted Butter',
        slug: 'amul-salted-butter',
        description: 'The classic delicious taste of Amul Butter. Utterly butterly delicious breakfast companion.',
        price: 105,
        discountPrice: 102,
        unit: '100 g',
        images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('dairy-bread'),
        stock: 90,
        isTrending: true
      },
      {
        name: 'Fresh Malai Paneer',
        slug: 'fresh-malai-paneer',
        description: 'Soft, velvety fresh cottage cheese. High-protein dairy product perfect for subzis and grills.',
        price: 90,
        discountPrice: 82,
        unit: '200 g',
        images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('dairy-bread'),
        stock: 75,
        isTrending: true
      },

      // Snacks & Munchies
      {
        name: 'Classic Salted Potato Chips',
        slug: 'classic-salted-chips',
        description: 'Crisp and crunchy potato chips salted to perfection. The ultimate party and travel snack.',
        price: 20,
        unit: '50 g',
        images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('snacks-munchies'),
        stock: 300,
        isTrending: true
      },
      {
        name: 'Chocolate Chip Cookies',
        slug: 'chocolate-chip-cookies',
        description: 'Crisp baked cookies loaded with delicious real chocolate chips. Perfect snack with milk.',
        price: 45,
        discountPrice: 39,
        unit: '150 g',
        images: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('snacks-munchies'),
        stock: 140,
        isTrending: false
      },

      // Bakery
      {
        name: 'Whole Wheat Bread',
        slug: 'whole-wheat-bread',
        description: 'Freshly baked sliced loaf made of 100% whole wheat flour. Healthy bread for sandwiches.',
        price: 50,
        discountPrice: 45,
        unit: '400 g',
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('bakery'),
        stock: 60,
        isTrending: true
      },
      {
        name: 'Butter Croissant',
        slug: 'butter-croissant',
        description: 'Flaky, buttery, golden crescent-shaped pastry. Baked fresh and ready for breakfast spreads.',
        price: 75,
        discountPrice: 65,
        unit: '1 pc',
        images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('bakery'),
        stock: 30,
        isTrending: false
      },

      // Beverages
      {
        name: 'Coca-Cola Soft Drink',
        slug: 'coca-cola-bottle',
        description: 'Original refreshing taste Coca-Cola. Best served chilled at gatherings or afternoon resets.',
        price: 70,
        discountPrice: 62,
        unit: '1.25 L',
        images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('beverages'),
        stock: 180,
        isTrending: true
      },
      {
        name: '100% Orange Fruit Juice',
        slug: 'orange-fruit-juice',
        description: 'Real juice extracts from premium oranges. No added sugar or artificial preservatives.',
        price: 120,
        discountPrice: 99,
        unit: '1 L',
        images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400'],
        category: getCatId('beverages'),
        stock: 100,
        isTrending: false
      }
    ];

    await Product.insertMany(productsData);
    console.log(`Seeded ${productsData.length} products with stock and metadata.`);

    // 5. Seed Coupons
    const couponsData = [
      {
        code: 'WELCOME100',
        discountType: 'flat',
        discountValue: 100,
        minOrderValue: 499,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true
      },
      {
        code: 'FRESH30',
        discountType: 'percentage',
        discountValue: 30,
        minOrderValue: 299,
        maxDiscount: 120,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        code: 'SUPERDEAL',
        discountType: 'percentage',
        discountValue: 50,
        minOrderValue: 599,
        maxDiscount: 200,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];

    await Coupon.insertMany(couponsData);
    console.log(`Seeded ${couponsData.length} promotional coupons.`);
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seed execution:', error);
  }
};
