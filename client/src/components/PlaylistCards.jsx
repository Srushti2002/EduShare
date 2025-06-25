import React from "react";
import { useNavigate } from "react-router-dom";

export default function PlaylistCards({
  playlists,
  isSelf,
  loggedInUserRole,
  studentEnrolled,
  handleToggleEnroll,
}) {
  const navigate = useNavigate();

  return (
    <>
      <h3 className="text-xl font-semibold mb-4">Playlists</h3>
      <ul>
        {playlists.map((pl) => (
          <li
            key={pl._id}
            className="mb-4 bg-[#232323] rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between max-sm:bg-[#181818] cursor-pointer"
            onClick={() => navigate(`/view-playlist/${pl._id}`)}
          >
            <div>
              <div className="text-purple-400 font-semibold hover:text-purple-700">
                {pl.title}
              </div>
              <span className="block text-gray-300">{pl.description}</span>
            </div>
            {!isSelf && loggedInUserRole === "student" && (
              <button
                className={`mt-2 md:mt-0 md:ml-4 px-4 py-1 rounded text-white ${
                  studentEnrolled.includes(pl._id)
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-purple-700 hover:bg-purple-800"
                }`}
                onClick={e => {
                  e.stopPropagation();
                  handleToggleEnroll(pl._id);
                }}
              >
                {studentEnrolled.includes(pl._id) ? "Unenroll" : "Enroll"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}