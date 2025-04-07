const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        
        const { role } = req.user;  // Access the role from the authenticated user (set by authenticate middleware)
        
        // Check if the user's role matches the required role(s)
        if (allowedRoles.includes(role)) {
            return next();
        }

        // If not authorized, send a 403 Forbidden response
        return res.status(403).json({ message: "Access denied—like trying to recycle restricted materials. You don't have the right permissions for this action." });
    };
};

module.exports = checkRole;
