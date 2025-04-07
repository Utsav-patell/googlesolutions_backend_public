const redisClient = require("../config/redis");
const Admin = require("../models/admin");
const Organization = require("../models/organizations");
const User = require("../models/users");
const { getFromRedis, setToRedis } = require("../utils/redis-utils");

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password"); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getOrganizations = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const cacheKey = `organizations:${page}:${limit}`;
    try {
    
        const cachedData = await getFromRedis(cacheKey);
        
        if (cachedData) {
     
            return res.status(200).json(cachedData);
        }

    
        const organizations = await Organization.find({isActive:true})
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('organizationName organizationAddress');

        if (organizations.length === 0) {
            return res.status(404).json({ message: "No organizations found" });
        }

        await setToRedis(cacheKey, organizations, 3600);

        res.status(200).json(organizations);
    } catch (error) {
        console.error("Error fetching organizations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { name, organizationName, organizationAddress, purpose, location } = req.body;

        let updatedData = {};

if (name) updatedData.name = name; 

        if (location && location.type === "Point" && Array.isArray(location.coordinates)) {
            updatedData.location = location;
        }

        if (role === "organization") {
            if (organizationName) updatedData.organizationName = organizationName;
            if (organizationAddress) updatedData.organizationAddress = organizationAddress;
        } else if (role === "admin") {
            if (purpose) updatedData.purpose = purpose;
        }

        delete updatedData.email;
        delete updatedData.role;

        let updatedUser;
        if (role === "organization") {
            updatedUser = await Organization.findByIdAndUpdate(userId, updatedData, { new: true }).select('-password');

            if (updatedUser) {
                const pattern = "organizations:*"; 
                const keys = await redisClient.keys(pattern);
            
                if (keys.length > 0) {
                    await redisClient.del(...keys);
                }
            }
        } else if (role === "admin") {
            updatedUser = await Admin.findByIdAndUpdate(userId, updatedData, { new: true }).select('-password');
        } else {
            updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select('-password');
        }

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated—like giving old tech a new life through recycling!",
            user: updatedUser,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
  
module.exports = {getProfile, getOrganizations, updateProfile};