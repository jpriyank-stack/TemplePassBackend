import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mobile_no: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    },
    total_no_of_persons: {
        type: Number,
        required: true,
    },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    checked_in_at: {
        type: Date,
    },
}, { timestamps: true });

// Index for faster queries
userSchema.index({ mobile: 1 });

const userModel = mongoose.model('User', userSchema);
export default userModel;