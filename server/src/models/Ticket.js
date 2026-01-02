import mongoose from 'mongoose';

const { Schema } = mongoose;

const TicketSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['student', 'mentor', 'admin'], required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open' },
  createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

export default mongoose.model('Ticket', TicketSchema);
