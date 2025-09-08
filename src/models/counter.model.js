import mongoose from 'mongoose';

// Generic counter collection to hold sequences for different entities.
// _id: name of the sequence (e.g., 'orderNumber')
// seq: last issued number
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
}, { versionKey: false });

// Atomic helper to get next sequence value
counterSchema.statics.getNext = async function(name) {
  const ret = await this.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return ret.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
