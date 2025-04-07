const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
   
    const token = req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      return res.status(401).json({ message: "No token detected—just like an untracked waste item. Ensure it's included to continue." });
    }
  
    try {
   
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
  
      next();  
    } catch (error) {
      return res.status(401).json({ message: "This token is no longer valid—like e-waste that's been improperly discarded. Get a fresh one to continue." });
    }
  };

  module.exports = authenticate;