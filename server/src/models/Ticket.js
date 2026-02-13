import mongoose from 'mongoose';

const { Schema } = mongoose;

const TicketSchema = new Schema({
  // Logged-in app tickets: user present; public tickets: user omitted
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  // Source of ticket
  source: { type: String, enum: ['public', 'app'], default: 'app' },
  // Sender meta
  senderName: { type: String, required: true },
  senderEmail: { type: String },
  senderRole: { type: String, enum: ['student', 'mentor', 'admin', 'public'] },
  // Content
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open' },
  createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

export default mongoose.model('Ticket', TicketSchema);
