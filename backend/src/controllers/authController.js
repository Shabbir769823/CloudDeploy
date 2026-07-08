import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { sendEmail } from '../services/emailService.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'clouddeploy_secret_key_12345';

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const user = await UserModel.create({
      id: userId,
      name,
      email,
      password: hashedPassword,
      role: role || 'developer'
    });

    // Send registration welcome email
    await sendEmail(
      email,
      'Welcome to CloudDeploy!',
      `<h2>Welcome to CloudDeploy, ${name}!</h2><p>Your account is ready. Please log in and connect your GitHub repo to begin deploying.</p>`
    );

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.json({
        twoFactorRequired: true,
        userId: user.id,
        message: 'Two-factor authentication code required.'
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Remove password hash from response
    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await UserModel.updateProfile(req.user.id, {
      name,
      email,
      password: hashedPassword
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Return 200 for security reasons but do nothing
      return res.json({ message: 'If email exists, reset instructions have been sent.' });
    }

    const resetToken = crypto.randomUUID().substring(0, 8).toUpperCase();
    
    await sendEmail(
      email,
      'Password Reset Request - CloudDeploy',
      `<h2>Password Reset Verification</h2><p>You requested a password reset. Use verification code: <strong>${resetToken}</strong> to reset your password.</p>`
    );

    res.json({ message: 'Reset token successfully generated and emailed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request password reset.' });
  }
};

export const verifyEmail = async (req, res) => {
  // Simple verification simulation
  res.json({ success: true, message: 'Email verified successfully.' });
};

// 2FA Methods (Simulated for final-year project presentation)
export const setup2FA = async (req, res) => {
  try {
    // Generate simulated authenticator secret
    const secret = crypto.randomBytes(10).toString('hex').toUpperCase();
    // Generate simulated QR code image source using raw base64 or placeholder
    const qrCodeUrl = `otpauth://totp/CloudDeploy:${req.user.id}?secret=${secret}&issuer=CloudDeploy`;

    await UserModel.update2FA(req.user.id, { secret, enabled: false });

    res.json({
      secret,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set up 2FA.' });
  }
};

export const verify2FA = async (req, res) => {
  const { code, userId } = req.body;
  const currentUserId = userId || (req.user ? req.user.id : null);

  if (!code || !currentUserId) {
    return res.status(400).json({ error: 'Verification code and user details required.' });
  }

  try {
    const user = await UserModel.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // In a production app, verify TOTP token.
    // For demo purposes, any 6-digit code or '123456' is considered valid.
    if (code === '123456' || code.length === 6) {
      // Enable 2FA in db if it was setting up
      if (!user.twoFactorEnabled) {
        await UserModel.update2FA(currentUserId, { secret: null, enabled: true });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token, user });
    } else {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }
  } catch (err) {
    res.status(500).json({ error: '2FA Verification failed.' });
  }
};
