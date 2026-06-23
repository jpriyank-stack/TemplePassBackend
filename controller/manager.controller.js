import bcrypt from "bcryptjs";
import path from "path";
import dayjs from 'dayjs';
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
      payment_status: "completed",
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

// API 1: Verify/Scan Ticket - Get User Data (Read Only)
export const verifyTicket = async (req, res) => {
  try {
    const { ticket_id } = req.body;

    // Validation
    if (!ticket_id) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Ticket ID is required",
      });
    }

    // Find ticket by ticket_id
    const ticket = await ticketModel.findOne({ ticket_id });

    if (!ticket) {
      return sendResponse({
        res,
        statusCode: 404,
        error: "❌ Ticket not found",
      });
    }

    // Check if ticket is already consumed
    if (ticket.ticket_status === "consumed") {
      return sendResponse({
        res,
        statusCode: 400,
        error: "❌ Ticket already consumed. Entry not allowed.",
      });
    }

    // Check if ticket is cancelled
    if (ticket.ticket_status === "cancelled") {
      return sendResponse({
        res,
        statusCode: 400,
        error: "❌ Ticket has been cancelled.",
      });
    }

    // Check if payment is completed
    if (ticket.payment_status !== "completed") {
      return sendResponse({
        res,
        statusCode: 400,
        error: "❌ Payment not completed. Entry not allowed.",
      });
    }

    // Get user details
    const user = await userModel.findById(ticket.user_id);

    return sendResponse({
      res,
      statusCode: 200,
      message: "✓ Ticket Verified - Proceed to Confirm",
      data: {
        user: {
          name: user.name,
          mobile_no: user.mobile_no,
          total_persons: user.total_no_of_persons,
          age: user.age,
        },
        ticket: {
          ticket_id: ticket.ticket_id,
          visit_date: formatDate(ticket.visit_date),
          payment_mode: ticket.payment_mode,
          amount: ticket.amount,
          ticket_status: ticket.ticket_status,
        },
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Failed to verify ticket",
      error: error.message,
    });
  }
};

// API 2: Confirm Entry - Update Ticket Status (Write Only)
export const confirmAndConsumeTicket = async (req, res) => {
  try {
    const { ticket_id } = req.body;
    const managerId = req.manager._id;

    if (!ticket_id) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "Ticket ID is required",
      });
    }

    // Atomic update - prevents double scan
    const ticket = await ticketModel.findOneAndUpdate(
      {
        ticket_id,
        ticket_status: { $ne: "consumed" },
      },
      {
        $set: {
          ticket_status: "consumed",
          entry_scanned_at: new Date(),
          scanned_by: managerId,
        },
      },
      {
        new: true,
      },
    );

    if (!ticket) {
      return sendResponse({
        res,
        statusCode: 400,
        error: "❌ Ticket already consumed or not found",
      });
    }

    const user = await userModel.findById(ticket.user_id);

    return sendResponse({
      res,
      statusCode: 200,
      message: "✅ Entry Confirmed - Ticket Consumed",
      data: {
        user: {
          name: user.name,
          mobile_no: user.mobile_no,
          total_persons: user.total_no_of_persons,
        },
        ticket: {
          ticket_id: ticket.ticket_id,
          ticket_status: ticket.ticket_status,
          entry_scanned_at: ticket.entry_scanned_at,
          scanned_by: managerId,
        },
      },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Failed to confirm entry",
      error: error.message,
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const managerId = req.manager._id;
    
    // Get today's date range using dayjs
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

    // Get all tickets created by this manager today
    const todayTickets = await ticketModel.find({
      manager_id: managerId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Calculate stats
    const totalGenerated = todayTickets.length;
    const totalConsumed = todayTickets.filter(
      (t) => t.ticket_status === "consumed"
    ).length;
    const totalPending = todayTickets.filter(
      (t) => t.ticket_status === "booked"
    ).length;
    const totalCancelled = todayTickets.filter(
      (t) => t.ticket_status === "cancelled"
    ).length;

    // Separate cash and online tickets (COUNT ALL regardless of payment_status)
    const cashTickets = todayTickets.filter((t) => t.payment_mode === "cash");
    const onlineTickets = todayTickets.filter((t) => t.payment_mode === "online");

    // Calculate total revenue (only from completed payments)
    const totalRevenue = todayTickets
      .filter((t) => t.payment_status === "completed")
      .reduce((sum, ticket) => sum + ticket.amount, 0);

    // Calculate cash breakdown (count all, revenue only completed)
    const cashCount = cashTickets.length;
    const cashRevenue = cashTickets
      .filter((t) => t.payment_status === "completed")
      .reduce((sum, ticket) => sum + ticket.amount, 0);

    // Calculate online breakdown (count all, revenue only completed)
    const onlineCount = onlineTickets.length;
    const onlineRevenue = onlineTickets
      .filter((t) => t.payment_status === "completed")
      .reduce((sum, ticket) => sum + ticket.amount, 0);

    // Get current date and time using dayjs
    const currentDate = dayjs().format('DD MMMM YYYY');
    const currentTime = dayjs().format('HH:mm:ss');

    return sendResponse({
      res,
      statusCode: 200,
      message: "Dashboard stats retrieved successfully",
      data: {
        dateTime: {
          date: currentDate,
          time: currentTime,
        },
        summary: {
          totalGenerated,
          totalConsumed,
          totalPending,
          totalCancelled,
          totalRevenue,
        },
        paymentBreakdown: {
          cash: {
            tickets: cashCount,
            revenue: cashRevenue,
          },
          online: {
            tickets: onlineCount,
            revenue: onlineRevenue,
          },
        },
        conversion: {
          conversionRate:
            totalGenerated > 0
              ? ((totalConsumed / totalGenerated) * 100).toFixed(2) + "%"
              : "0%",
        },
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};;

export const getPassHistory = async (req, res) => {
  try {
    const managerId = req.manager._id;
    
    // Get today's date range using dayjs
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

    // Get all tickets created by this manager today with populated references
    const tickets = await ticketModel
      .find({
        manager_id: managerId,
        createdAt: { $gte: today, $lt: tomorrow },
      })
      .populate('user_id', 'name mobile_no total_no_of_persons')
      .populate('scanned_by', 'name email')
      .sort({ createdAt: -1 });

    // Format the data
    const passHistory = tickets.map((ticket) => ({
      ticket_id: ticket.ticket_id,
      user_name: ticket.user_id.name,
      mobile_no: ticket.user_id.mobile_no,
      total_persons: ticket.user_id.total_no_of_persons,
      amount: ticket.amount,
      payment_mode: ticket.payment_mode,
      ticket_status: ticket.ticket_status,
      created_at: dayjs(ticket.createdAt).format('DD MMM YYYY HH:mm:ss'),
      entry_scanned_at: ticket.entry_scanned_at
        ? dayjs(ticket.entry_scanned_at).format('DD MMM YYYY HH:mm:ss')
        : null,
      scanned_by: ticket.scanned_by ? ticket.scanned_by.name : null,
    }));

    // Calculate summary
    const summary = {
      total_passes_created: tickets.length,
      total_consumed: tickets.filter((t) => t.ticket_status === 'consumed').length,
      total_pending: tickets.filter((t) => t.ticket_status === 'booked').length,
      total_cancelled: tickets.filter((t) => t.ticket_status === 'cancelled').length,
      total_revenue: tickets
        .filter((t) => t.payment_status === 'completed')
        .reduce((sum, ticket) => sum + ticket.amount, 0),
    };

    return sendResponse({
      res,
      statusCode: 200,
      message: 'Pass history retrieved successfully',
      data: {
        summary,
        passes: passHistory,
      },
    });
  } catch (error) {
    sendResponse({
      res,
      statusCode: 500,
      message: 'Failed to fetch pass history',
      error: error.message,
    });
  }
};