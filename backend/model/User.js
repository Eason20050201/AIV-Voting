// 使用者：管理身份與角色

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // 帳號不能重複
    trim: true
  },

  password: {
    type: String,
    required: true
  },
  // 關鍵欄位：區分身份
  role: {
    type: String,
    enum: ['voter', 'organizer'], // 限制只能是這兩個值
    default: 'voter',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);