import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, IAddress } from '../models/user.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'freshkart_super_secret_key_123';

const generateToken = (user: IUser) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
};

export const signup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Set default verification status
    // For demo/dev purposes, let's auto-verify or generate OTP
    const isVerified = role !== 'delivery'; // auto verify customers, delivery requires admin approval or otp

    const user = new User({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      isVerified,
      addresses: []
    });

    if (!isVerified) {
      // Mock OTP
      user.otp = Math.floor(1000 + Math.random() * 9000).toString();
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    }

    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        otp: user.otp // Return for demo ease
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        addresses: user.addresses
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      addresses: user.addresses,
      profileImage: user.profileImage
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, profileImage } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      addresses: user.addresses,
      profileImage: user.profileImage
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp === otp && user.otpExpiry && user.otpExpiry > new Date()) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      const token = generateToken(user);
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true
        }
      });
    }

    res.status(400).json({ message: 'Invalid or expired OTP' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { googleId, email, name, profileImage } = req.body;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = new User({
        name,
        email,
        role: 'customer',
        googleId,
        isVerified: true,
        profileImage,
        addresses: []
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (profileImage && !user.profileImage) user.profileImage = profileImage;
      await user.save();
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        addresses: user.addresses,
        profileImage: user.profileImage
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAddress: IAddress = req.body;

    if (newAddress.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    } else if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { addressId } = req.params;
    user.addresses = user.addresses.filter((addr: any) => addr._id.toString() !== addressId);
    
    // Ensure at least one address is default if any exist
    if (user.addresses.length > 0 && !user.addresses.some((addr) => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
