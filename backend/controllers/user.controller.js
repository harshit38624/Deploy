import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcrypt";
import {v2 as cloudinary} from "cloudinary";

export const getUserProfile = async (req, res) => {
    const {username} = req.params;

    try {
        const user = await User.findOne({username}).select("-password");

        if (!user) {
            return res.status(404).send({error: "User not found"});
        }

        res.status(200).json({user});
    } catch (error) {
        console.error("Error in getUserProfile", error.message);
        res.status(500).send({error: "Internal server error"});
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id == req.user._id) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) {
            return res.status(400).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            return res.status(200).json({ message: "User unfollowed successfully" }); // Use return to ensure only one response is sent
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });

            await newNotification.save();
            return res.status(200).json({ message: "User followed successfully" }); // Use return here too
        }
    } catch (error) {
        console.error("Error in followUnfollowUser:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getSuggestedUser =async (req, res) => {
    try {
        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: {$ne: userId, $nin: usersFollowedByMe.following},
                }
            },
            {$sample:{size:10}}
        ])

        const suggestedUsers = users.slice(0, 4);

        suggestedUsers.forEach(user => user.password = null);

        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.error("Error in getSuggestedUser:", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const updateUser = async (req, res) => {
    const {
        fullName,
        email,
        username,
        currentPassword,
        newPassword,
        bio,
        link
    } = req.body;

    let { profileImg, coverImg } = req.body;
    const userId = req.user._id;

    try {
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Handle email update
        if (email && email !== user.email) {
            const existingUserWithEmail = await User.findOne({ email });
            if (existingUserWithEmail) {
                return res.status(400).json({ error: "Email is already in use by another account" });
            }
            user.email = email;
        }

        // Handle password update
        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid password" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Password must be longer than 6 characters" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Handle profile image upload
        if (profileImg) {
            if (user.profileImg) {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        // Handle cover image upload
        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        // Update other user fields
        user.fullName = fullName || user.fullName;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        // Save updated user
        user = await user.save();

        // Prevent password from being sent in the response
        user.password = null;

        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error in updateUser:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

