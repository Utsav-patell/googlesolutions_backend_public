const jwt = require('jsonwebtoken');


const generateToken = (userId,role,email)=>{
    if(!process.env.JWT_SECRET){
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const payload = {userId,role,email};

    return jwt.sign(payload,process.env.JWT_SECRET)
};


module.exports = generateToken;