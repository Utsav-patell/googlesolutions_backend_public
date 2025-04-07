const User = require('../models/users');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, "-password"); // Exclude password field
        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

       
        if (id === req.user.userId) {
           
            return res.status(403).json({ message: "You cannot deactivate yourself." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({ message: "User deactivated successfully." });
    } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const activateUser = async (req, res) => {
    try {
        const { id } = req.params;

       
        if (id === req.user.userId) {
           
            return res.status(403).json({ message: "You cannot activate yourself." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.isActive = true;
        await user.save();

        res.status(200).json({ message: "User Activated successfully." });
    } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {deactivateUser,getAllUsers,activateUser};