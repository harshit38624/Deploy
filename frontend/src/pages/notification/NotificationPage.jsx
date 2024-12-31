import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "../../components/common/LoadingSpinner";

import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";

const NotificationPage = () => {
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to fetch notifications");
            }
            return await res.json();
        },
    });

    // Delete notifications
    const { mutate: deleteNotifications, isLoading: isDeleting } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/notifications", { method: "DELETE" });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete notifications");
            }
            return await res.json();
        },
        onSuccess: () => {
            toast.success("Notifications deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: (error) => {
            toast.error(error.message || "An unexpected error occurred");
        },
    });

    return (
        <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <p className="font-bold">Notifications</p>
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="m-1">
                        <IoSettingsOutline className="w-4" />
                    </div>
                    <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                        <li>
                            <button
                                onClick={() => deleteNotifications()}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete all notifications"}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center h-full items-center">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && notifications?.length === 0 && (
                <div className="text-center p-4 font-bold">No notifications 🤔</div>
            )}

            {/* Notifications List */}
            {notifications?.map((notification) => {
                const username = notification.from?.username || "Unknown";
                const profileImg = notification.from?.profileImg || "/avatar-placeholder.png";

                return (
                    <div className="border-b border-gray-700" key={notification._id}>
                        <div className="flex gap-2 p-4">
                            {notification.type === "follow" && <FaUser className="w-7 h-7 text-primary" />}
                            {notification.type === "like" && <FaHeart className="w-7 h-7 text-red-500" />}
                            <Link to={`/profile/${username}`}>
                                <div className="avatar">
                                    <div className="w-8 rounded-full">
                                        <img src={profileImg} alt={username} />
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <span className="font-bold">@{username}</span>{" "}
                                    {notification.type === "follow"
                                        ? "followed you"
                                        : "liked your post"}
                                </div>
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default NotificationPage;
