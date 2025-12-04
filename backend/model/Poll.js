// 投票活動：題目、選項、截止日

const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: { type: String, required: true },
  // 這個欄位在「開票 (Tallied)」之前，數值應該保持 0 或不回傳給前端
  votesCount: { type: Number, default: 0 }
});

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  options: [optionSchema],
  deadline: { type: Date, required: true },
  
  // 新增：目前總投票數 (可選擇是否要在投票期間顯示，通常顯示這個不影響結果秘密性)
  totalVotes: { type: Number, default: 0 },

  // 新增：活動狀態
  // 'active': 進行中 (只能投，看不到結果)
  // 'ended': 已截止 (不能投，但還沒開票，等待系統計算)
  // 'tallied': 已開票 (可以看結果)
  status: {
    type: String,
    enum: ['active', 'ended', 'tallied'],
    default: 'active'
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Poll', pollSchema);