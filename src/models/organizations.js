const { default: mongoose } = require("mongoose");
const User = require("./users");


// Todo: Add Organization attributes as they are decided.
const Organization = User.discriminator( "organization",new mongoose.Schema({
    organizationName:{
        type:String,
        required:true,
        trim:true,
    },
    organizationAddress:{
        type:String,
        required:true,
        trim:true
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }], 
    averageRating: { type: Number, default: 0 }
    
}));


module.exports = Organization;