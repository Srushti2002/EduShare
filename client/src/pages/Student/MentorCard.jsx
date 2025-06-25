import React from "react";
import { useNavigate } from "react-router-dom";

export default function MentorCard({ mentor, following, onToggleFollow }) {
  const navigate = useNavigate();

  return (
    <div
    className="flex flex-col items-center w-70 h-50 text-center text-white border border-purple-700 bg-[#181818] p-4 mb-4 rounded-lg"
      onClick={() => navigate(`/mentor/${mentor._id}`)}
      
    >
      <div className="flex-1 w-full flex flex-col justify-evenly items-center">
        <h4 className="">{mentor.name}</h4>
        <p className="">
          {/* <span className="font-semibold">Field:</span>{" "} */}
          {Array.isArray(mentor.fields) && mentor.fields.length > 0
            ? mentor.fields.join(", ")
            : "N/A"}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFollow(mentor._id);
        }}
        className={`px-4 py-1 rounded text-white font-semibold transition ${
          following
            ? "bg-green-600 hover:bg-red-700 cursor-pointer"
            : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}