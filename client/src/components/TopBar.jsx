import React, { useEffect, useState } from "react";
import axios from "axios";
import UserMenu from "./UserMenu";
import { useSelector, useDispatch } from "react-redux";
import { setGender } from "../store/userSlice";

export default function TopBar() {
  const gender = useSelector((state) => state.user.gender);
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const [profileUrl, setProfileUrl] = useState("/profile");
  const [dashboardUrl, setDashboardUrl] = useState("/student-dashboard");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(setGender(res.data.gender || "other"));
        setUserId(res.data._id); 
        console.log("User ID:", res.data._id);

        if (res.data.role === "mentor") {
          setProfileUrl("/profile");
          setDashboardUrl("/mentor-dashboard");
        } else {
          setProfileUrl("/student-profile");
          setDashboardUrl("/student-dashboard");
        }
      } catch (err) {
        dispatch(setGender("male"));
        setProfileUrl("/profile");
      }
    };
    if (token) fetchProfile();
  }, [token, dispatch]);

  return (
    // <div className="w-full h-full bg-[#1F1F1F] text-white">
      <UserMenu gender={gender} profileUrl={profileUrl} dashboardUrl={dashboardUrl} userId={userId} token={token} />
    // </div>
  );
}