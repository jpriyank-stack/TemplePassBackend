import bcrypt from "bcryptjs";
import { adminModel, managerModel } from "../common/index.module.js";
import { sendResponse, createAdminJWT } from "../utils/helpers.js";

// Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Please fill all fields",
        error: "Missing required fields",
      });
    }

    if (password !== confirmPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Passwords do not match",
        error: "Password mismatch",
      });
    }

    const adminExists = await adminModel.findOne({ email });
    if (adminExists) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Email already registered",
        error: "Duplicate email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await adminModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createAdminJWT(admin._id, admin.email);

    sendResponse({
      res,
      statusCode: 201,
      message: "Admin registered successfully",
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Please provide email and password",
        error: "Missing credentials",
      });
    }

    const admin = await adminModel.findOne({ email }).select("+password");
    if (!admin) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid email or password",
        error: "Admin not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid email or password",
        error: "Wrong password",
      });
    }

    if (!admin.isActive) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Admin account is deactivated",
        error: "Account inactive",
      });
    }

    const token = createAdminJWT(admin._id, admin.email);

    sendResponse({
      res,
      statusCode: 200,
      message: "Login successful",
      token,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Check Token Validity
export const checkToken = async (req, res) => {
  try {
    const admin = req.admin;

    return sendResponse({
      res,
      statusCode: 200,
      message: "Token is valid",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          is_active: admin.is_active,
        },
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Token check failed",
      error: error.message,
    });
  }
};

export const addManager = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    const adminId = req.admin._id;

    // Validation
    if (!name || !email || !mobile || !password || !confirmPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Missing required fields",
      });
    }

    if (password !== confirmPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Passwords do not match",
      });
    }

    // Check if email already exists
    const emailExists = await managerModel.findOne({ email });
    if (emailExists) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Email already registered",
      });
    }

    // Check if mobile already exists
    const mobileExists = await managerModel.findOne({ mobile });
    if (mobileExists) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Mobile number already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create manager
    const manager = await managerModel.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      adminId: adminId,
    });

    return sendResponse({
      res,
      statusCode: 201,
      message: "Manager added successfully",
      data: {
        manager: {
          id: manager._id,
          name: manager.name,
          email: manager.email,
          mobile: manager.mobile,
          is_active: manager.is_active,
        },
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Failed to add manager",
      error: error.message,
    });
  }
};
