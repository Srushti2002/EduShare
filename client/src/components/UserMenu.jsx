import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import maleImg from "../assets/maleImg.jpg";
import femaleImg from "../assets/femaleImg.jpg";
import otherImg from "../assets/otherImg.png";

export default function UserMenu({ gender = "male", profileUrl = "/profile", dashboardUrl="/student-dashboard" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef();

  const getProfileImg = () => {
    if (gender === "female") return femaleImg;
    if (gender === "other") return otherImg;
    return maleImg;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="w-full h-full bg-[#1F1F1F] text-white pt-5 flex justify-end pr-8">
      <div className="relative inline-block" ref={menuRef}>
        <img
          src={getProfileImg()}
          alt="User"
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
        />
        {open && (
          <div className="absolute right-0 top-12 bg-[#181818] border border-gray-500 rounded-lg shadow-lg z-50 min-w-[140px]">
            <button
              className="w-full px-4 py-2 text-left text-white hover:bg-[#444444] rounded-t-lg"
              onClick={() => {
                setOpen(false);
                navigate(dashboardUrl);
              }}
            >
              Dashboard
            </button>
            <button
              className="w-full px-4 py-2 text-left text-white hover:bg-[#444444]"
              onClick={() => {
                setOpen(false);
                navigate(profileUrl);
              }}
            >
              View Profile
            </button>
            <button
              className="w-full px-4 py-2 text-left text-white hover:bg-[#444444] rounded-b-lg"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}