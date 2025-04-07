const { default: mongoose } = require("mongoose");
const { comparePassword, hashPassword } = require("../utils/password-utils");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        match:[/\S+@\S+\.\S+/, 'is invalid']
    },
    location: {
      type: {
          type: String,
          enum: ["Point"],
      },
      coordinates: {
          type: [Number],
          index: "2dsphere",
      },
      name: { type: String },
  },
    password: {
        type: String,
        required: true,
        minlength: 6
      },
      role: {
        type: String,
        enum: ['user', 'organization','admin'],
        default: 'user'
      },
      isVerified: {
        type: Boolean,
        default: false, 
      },
      isActive:{
        type:Boolean,
        default:true
      },
      coins: {
        type: Number,
        default: function () {
            return this.role === "user" ? 0 : undefined;
        },
        min: 0,
    }
},{discriminatorKey:"role",timestamps:true});


// this is a Mongoose middleware or hook, so whenever a document will be saved using save() method, 
// it will first check weather the password feild is modified, if yes then it will hash it and then save the document.
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    try {
      this.password = await hashPassword(this.password);
      next();
    } catch (err) {
      next(err);
    }
  });

// Will be used to compare current documents plain password with hashed password during login 
  userSchema.methods.comparePassword = async function (enteredPassword) {
    try {
      return await comparePassword(enteredPassword, this.password);
    } catch (err) {
      throw new Error('Password comparison failed');
    }
  };

const User = mongoose.model('User', userSchema);
module.exports = User;
