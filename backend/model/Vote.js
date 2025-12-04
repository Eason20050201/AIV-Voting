const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votedOptionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // 記錄投給哪個選項 ID
  votedAt: { type: Date, default: Date.now }
});

// 依然保留唯一索引，確保一人一票
voteSchema.index({ poll: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);