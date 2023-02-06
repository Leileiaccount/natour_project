const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Plz tell us your name '] },
  email: {
    type: String,
    required: [true, 'Plz provide your email'],
    unique: true,
    validate: [validator.isEmail, 'Please providea valid email!']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'guide-lead'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'plz provide a password'],
    minlength: 3,
    //when querying the data
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'plz provide a password'],
    minlength: 3,
    validate: {
      validator: function(element) {
        // console.log(this.password); // undefined
        return element === this.password;
      },
      message: 'Password are not in line!'
    },
    select: false
  },
  passwordCreatedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  //1) Only run this password only if password was actually modified
  if (!this.isModified('password')) return next();
  //2) Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //3) Delete passwordConfirm field
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordCreatedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function(candidatePW, userPW) {
  return bcrypt.compare(candidatePW, userPW);
};

userSchema.methods.passwordChanged = function(JWTTimeStamp) {
  if (this.passwordCreatedAt) {
    const changeTimeStamp = parseInt(
      this.passwordCreatedAt.getTime() / 1000,
      10
    );
    return changeTimeStamp > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 1000 * 60 * 1000;

  return resetToken;
};

userSchema.pre(/^find/, async function(next) {
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
