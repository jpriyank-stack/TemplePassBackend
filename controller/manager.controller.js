import bcrypt from "bcryptjs";
import path from "path";
import {
  managerModel,
  userModel,
  ticketModel,
} from "../common/index.module.js";
import {
  sendResponse,
  createManagerJWT,
  formatDate,
} from "../utils/helpers.js";
import {
  generateTicketId,
  generateQRCodeFile,
} from "../utils/ticketGenerator.js";

export const createUser = async (req, res) => {
  try {
    const { name, mobile_no, total_no_of_persons } = req.body;

    const managerId = req.manager._id;

    if (!name || !mobile_no || !total_no_of_persons) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Missing required fields",
      });
    }

    // Validate mobile
    if (!/^[0-9]{10}$/.test(mobile_no)) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Invalid mobile number",
      });
    }

    // Validate persons count

    const persons = Number(total_no_of_persons);

    if (!Number.isInteger(persons) || persons <= 0) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Total persons must be a positive number",
      });
    }

    let user = await userModel.findOne({
      mobile_no,
    });

    if (user) {
      return sendResponse({
        res,

        statusCode: 200,

        message: "Existing user found",

        data: {
          user: {
            id: user._id,
            name: user.name,
            mobile_no: user.mobile_no,
            total_no_of_persons: user.total_no_of_persons,
          },
        },
      });
    }

    user = await userModel.create({
      name,

      mobile_no,

      total_no_of_persons: persons,

      manager_id: managerId,
    });

    return sendResponse({
      res,

      statusCode: 201,

      message: "User created successfully",

      data: {
        user: {
          id: user._id,
          name: user.name,
          mobile_no: user.mobile_no,
          total_no_of_persons: user.total_no_of_persons,
        },
      },
    });
  } catch (error) {
    return sendResponse({
      res,

      statusCode: 500,

      message: "Failed to create user",

      error: error.message,
    });
  }
};

export const generateTicket = async (req, res) => {
  try {
    const { user_id, visit_date, amount, payment_mode } = req.body;
    const managerId = req.manager._id;

    // Validation
    if (!user_id || !visit_date || !amount || !payment_mode) {
      return sendResponse({
        res,
        statusCode: 400,
        error:
          "Missing required fields: user_id, visit_date, amount, payment_mode",
      });
    }

    if (!["cash", "online"].includes(payment_mode)) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Payment mode must be cash or online",
      });
    }

    // Check if user exists
    const user = await userModel.findById(user_id);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        error: "User not found",
      });
    }

    // Generate Ticket ID
    const ticket_id = generateTicketId();

    // Generate QR Code and Save to Local Folder
    const qrCodePath = await generateQRCodeFile({
      ticket_id,
      user_mobile: user.mobile_no,
      user_name: user.name,
      visit_date,
    });

    // Create Ticket with QR Code Path
    const ticket = await ticketModel.create({
      ticket_id,
      qr_code_path: qrCodePath, // Save file path
      user_id,
      manager_id: managerId,
      visit_date,
      payment_mode,
      payment_status: payment_mode === "cash" ? "completed" : "pending",
      amount,
      ticket_status: "booked",
    });

    return sendResponse({
      res,
      statusCode: 201,
      message: "Ticket and QR Code generated successfully",
      data: {
        ticket: {
          ticket_id: ticket.ticket_id,
          user_name: user.name,
          user_mobile: user.mobile_no,
          total_persons: user.total_no_of_persons,
          visit_date: formatDate(ticket.visit_date),
          amount: ticket.amount,
          payment_mode: ticket.payment_mode,
          payment_status: ticket.payment_status,
          ticket_status: ticket.ticket_status,
        },
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Failed to generate ticket",
      error: error.message,
    });
  }
};

// Login Manager
export const loginManager = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Missing email or password",
      });
    }

    // Find manager by email
    const manager = await managerModel.findOne({ email }).select("+password");

    if (!manager) {
      return sendResponse({
        res,
        statusCode: 401,
        error: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, manager.password);

    if (!isPasswordCorrect) {
      return sendResponse({
        res,
        statusCode: 401,
        error: "Invalid email or password",
      });
    }

    // Check if manager is active
    if (!manager.isActive) {
      return sendResponse({
        res,
        statusCode: 401,
        error: "Manager account is deactivated",
      });
    }

    // Generate token
    const token = createManagerJWT(manager._id, manager.email);

    return sendResponse({
      res,
      statusCode: 200,
      message: "Login successful",
      token,
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        mobile: manager.mobile,
        role: "manager",
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


export const getTicketQRCode = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const ticket = await ticketModel.findOne({
      ticket_id,
    });

    if (!ticket) {
      return sendResponse({
        res,
        statusCode: 404,
        error: "Ticket not found",
      });
    }

    const qrPath = path.join(process.cwd(), ticket.qr_code_path);

    return res.sendFile(qrPath);
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Server Error",
      error: error.message,
    });
  }
};
// Check Token Validity
export const checkToken = async (req, res) => {
  try {
    const manager = req.manager;

    return sendResponse({
      res,
      statusCode: 200,
      message: "Token is valid",
      data: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        is_active: manager.is_active,
        role: "manager",
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
