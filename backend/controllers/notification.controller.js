import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ to:userId }).populate({
            "path": "from",
            select: "username profileImg"
        });

        await Notification.updateMany({to: userId}, {read: true});
        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error getting notifications from notification", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.deleteMany({to: userId});

        res.status(200).json({message: "Notification deleted successfully"});
    } catch (error) {
        console.log("Error deleting notification", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}