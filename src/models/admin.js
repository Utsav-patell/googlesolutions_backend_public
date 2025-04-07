const { mongoose } = require("mongoose");
const User = require("./users");


// Todo: Add admin attributes as they are decided.
const Admin = User.discriminator("admin", new mongoose.Schema({
    purpose:{
        type:String,
        required:true
    }
}));
// Note: Admin is different from AdminSchema as we are using discriminator, 
// So it directly converts it to model so here it is Admin and that is why we 
// named it Admin


module.exports = Admin;