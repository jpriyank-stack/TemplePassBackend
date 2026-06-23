import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticket_id: {
    type: String,
    required: true,
    unique: true,
  },
  qr_code_path: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: true,
  },
  visit_date: {
    type: Date,
    required: true,
  },
  payment_mode: {
    type: String,
    enum: ['cash', 'online'],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  amount: {
    type: Number,
    required: true,
  },
  ticket_status: {
    type: String,
    enum: ['booked', 'consumed', 'cancelled', 'expired'],
    default: 'booked',
  },
  entry_scanned_at: {
    type: Date,
  },
  scanned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for faster queries
ticketSchema.index({ ticket_id: 1 });
ticketSchema.index({ qr_code: 1 });
ticketSchema.index({ user_id: 1 });
ticketSchema.index({ ticket_status: 1 });

const ticketModel = mongoose.model('Ticket', ticketSchema);
export default ticketModel;