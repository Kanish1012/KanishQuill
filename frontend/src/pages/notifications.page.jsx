import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import NotificationCard from "../components/notification-card.component";
import LoadMoreDataBtn from "../components/load-more.component";

const Notifications = () => {
    // Get user auth context
    let {
        userAuth,
        setUserAuth,
        userAuth: { access_token, new_notification_available },
    } = useContext(UserContext);

    const [filter, setFilter] = useState("all"); // Notification type filter
    const [notifications, setNotifications] = useState(null); // Notification state
    let filters = ["all", "like", "comment", "reply"]; // Available filter options

    // Fetch notifications from server
    const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/notifications",
                { page, filter, deletedDocCount },
                { headers: { Authorization: `Bearer ${access_token}` } }
            )
            .then(async ({ data: { notifications: data } }) => {
                // Clear new notification badge if needed
                if (new_notification_available) {
                    setUserAuth({
                        ...userAuth,
                        new_notification_available: false,
                    });
                }

                // Format and merge paginated data
                let formatedData = await filterPaginationData({
                    state: notifications,
                    data,
                    page,
                    countRoute: "/all-notifications-count",
                    data_to_send: { filter },
                    user: access_token,
                });

                setNotifications(formatedData);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    // Handle filter button click
    const handleFilter = (e) => {
        let btn = e.target;
        setFilter(btn.innerHTML);
        setNotifications(null); // Reset on filter change
    };

    // Fetch notifications on mount or filter change
    useEffect(() => {
        if (access_token) {
            fetchNotifications({ page: 1 });
        }
    }, [access_token, filter]);

    return (
        <div>
            <h1 className="max-md:hidden">Recent Notifications</h1>

            {/* Filter buttons */}
            <div className="my-8 flex gap-6">
                {filters.map((filtername, i) => {
                    return (
                        <button
                            key={i}
                            className={
                                "py-2 " +
                                (filter === filtername
                                    ? "btn-dark"
                                    : "btn-light")
                            }
                            onClick={handleFilter}
                        >
                            {filtername}
                        </button>
                    );
                })}
            </div>

            {/* Show loader, notifications, or fallback */}
            {notifications == null ? (
                <Loader />
            ) : (
                <>
                    {notifications.results.length ? (
                        notifications.results.map((notification, i) => {
                            return (
                                <AnimationWrapper
                                    key={i}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <NotificationCard
                                        data={notification}
                                        index={i}
                                        notificationState={{
                                            notifications,
                                            setNotifications,
                                        }}
                                    />
                                </AnimationWrapper>
                            );
                        })
                    ) : (
                        <NoDataMessage message="Nothing available" />
                    )}

                    {/* Load more button */}
                    <LoadMoreDataBtn
                        state={notifications}
                        fetchDataFun={fetchNotifications}
                        additionalParam={{
                            deletedDocCount: notifications.deletedDocCount,
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default Notifications;
