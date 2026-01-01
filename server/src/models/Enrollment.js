import mongoose from 'mongoose';

const { Schema } = mongoose;

const EnrollmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

export default mongoose.model('Enrollment', EnrollmentSchema);
