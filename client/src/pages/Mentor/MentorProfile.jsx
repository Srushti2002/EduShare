import React, { useEffect, useState } from "react";
import axios from "axios";
import EditableProfileInfo from "../../components/EditableProfileInfo";
import maleImg from "../../assets/maleImg.jpg";
import femaleImg from "../../assets/femaleImg.jpg";
import otherImg from "../../assets/otherImg.png";
import { useDispatch, useSelector } from "react-redux";
import { setGender, setFields, setUser } from "../../store/userSlice";
import { useParams } from "react-router-dom";
import PlaylistCards from "../../components/PlaylistCards";

export default function MentorProfile({ mentorId: propMentorId }) {
  const dispatch = useDispatch();
  const params = useParams();
  const mentorId = propMentorId || params.mentorId || params.id;
  const [mentor, setMentor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [isSelf, setIsSelf] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [studentEnrolled, setStudentEnrolled] = useState([]);
  const token = localStorage.getItem("token");
  const [loggedInUserId, setLoggedInUserId] = useState("");
  const [loggedInUserRole, setLoggedInUserRole] = useState("");

  // Redux state
  const name = useSelector((state) => state.user.name);
  const bio = useSelector((state) => state.user.bio);
  const gender = useSelector((state) => state.user.gender);
  const fields = useSelector((state) => state.user.fields);
  const role = useSelector((state) => state.user.role);

  useEffect(() => {
    if (!token) {
      setError("No token found. Please login again.");
      return;
    }
    const fetchSelf = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLoggedInUserId(res.data._id);
        setLoggedInUserRole(res.data.role);
        dispatch(setGender(res.data.gender || "other"));
        dispatch(setFields(res.data.fields || []));
        dispatch(setUser({
          name: res.data.name,
          bio: res.data.bio,
          role: res.data.role,
          email: res.data.email,
        }));
        if (res.data.role === "student") {
          setStudentEnrolled(res.data.followingPlaylists || []);
        }
      } catch (err) {
        setLoggedInUserId("");
        setLoggedInUserRole("");
      }
    };
    const fetchMentor = async () => {
      try {
        const url = mentorId
          ? `${import.meta.env.VITE_BACKEND_URL}/profile/${mentorId}`
          : `${import.meta.env.VITE_BACKEND_URL}/profile`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMentor(res.data);
        // dispatch(setUser({
        //   name: res.data.name,
        //   bio: res.data.bio,
        //   role: res.data.role,
        //   email: res.data.email,
        // }));
        // dispatch(setGender(res.data.gender || ""));
        // dispatch(setFields(res.data.fields || []));
        setError("");
      } catch (err) {
        setError("Failed to load profile.");
      }
    };
    const fetchPlaylists = async () => {
      try {
        const url = mentorId
          ? `${import.meta.env.VITE_BACKEND_URL}/playlist?mentorId=${mentorId}`
          : `${import.meta.env.VITE_BACKEND_URL}/playlist`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaylists(res.data);
      } catch (err) {
        setPlaylists([]);
      }
    };
    fetchSelf();
    fetchMentor();
    fetchPlaylists();
  }, [token, mentorId, dispatch]);

  useEffect(() => {
    if (mentor && loggedInUserId) {
      setIsSelf(String(loggedInUserId) === String(mentor._id));
    }
  }, [mentor, loggedInUserId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = { name, bio, gender };
      if (role === "mentor") updateData.fields = fields;
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMentor(res.data);
      dispatch(setUser({
        name: res.data.name,
        bio: res.data.bio,
        role: res.data.role,
        email: res.data.email,
      }));
      dispatch(setGender(res.data.gender || "other"));
      dispatch(setFields(res.data.fields || []));
      setEditMode(false);
      setError("");
    } catch (err) {
      setError("Failed to update profile.");
    }
  };

  // const handleEnroll = async (playlistId) => {
  //   await axios.post(
  //     `${import.meta.env.VITE_BACKEND_URL}/playlist/enroll`,
  //     { playlistId },
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );
  //   setStudentEnrolled((prev) => [...prev, playlistId]);
  // };

  // const handleUnenroll = async (playlistId) => {
  //   await axios.post(
  //     `${import.meta.env.VITE_BACKEND_URL}/playlist/unenroll`,
  //     { playlistId },
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );
  //   setStudentEnrolled((prev) => prev.filter((id) => id !== playlistId));
  // };

  const handleToggleEnroll = async (playlistId) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/playlist/toggleEnroll`,
      { playlistId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setStudentEnrolled((prev) =>
      prev.includes(playlistId)
        ? prev.filter((id) => id !== playlistId)
        : [...prev, playlistId]
    );
  } catch (err) {
    // Optionally handle error
  }
};

const getProfileImg = () => {
  if (mentor?.gender === "female") return femaleImg;
  else if (mentor?.gender === "male") return maleImg;
  else return otherImg;
};

  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;
  if (!mentor) return <div className="text-white text-center mt-8">Loading...</div>;

  return (
    <div className="flex flex-col justify-center bg-[#1F1F1F] items-center text-white flex-1">
      <div className="w-3/5 flex flex-col px-10 py-10 justify-between bg-[#181818] max-lg:w-3/4 max-sm:w-full max-sm:px-10 max-sm:bg-[#1F1F1F]">
        <h2 className="text-3xl font-bold mb-6">Mentor Profile</h2>
        <div className="flex flex-row items-center justify-center bg-[#232323] gap-10 p-10 mb-6 max-md:flex-col max-sm:bg-[#181818]">
          <img
            src={getProfileImg()}
            alt="Profile"
            className="w-1/3 h-1/3 rounded-full object-cover"
          />
          {isSelf ? (
            <EditableProfileInfo
              editMode={editMode}
              name={name}
              setName={(val) => dispatch(setUser({ name: val }))}
              bio={bio}
              setBio={(val) => dispatch(setUser({ bio: val }))}
              gender={gender}
              setGender={(val) => dispatch(setGender(val))}
              fields={fields}
              setFields={(val) => dispatch(setFields(val))}
              role={role}
              handleUpdate={handleUpdate}
              setEditMode={setEditMode}
              error={error}
            />
          ) : (
            <div className="w-full">
              <p className="mb-6"><span className="font-semibold">Name:</span> {mentor.name}</p>
              <p className="mb-2"><span className="font-semibold">Gender:</span> {mentor.gender || "Not specified"}</p>
              <p className="mb-2"><span className="font-semibold">Bio:</span> {mentor.bio || "No bio yet"}</p>
              {mentor.role === "mentor" && (
              <p className="mb-2">
                <span className="font-semibold">Fields:</span>{" "}
                {Array.isArray(mentor.fields) && mentor.fields.length > 0 ? mentor.fields.join(", ") : "N/A"}
              </p>
            )}
            </div>
          )}
        </div>

        <PlaylistCards
          playlists={playlists}
          isSelf={isSelf}
          loggedInUserRole={loggedInUserRole}
          studentEnrolled={studentEnrolled}
          handleToggleEnroll={handleToggleEnroll}
        />
      </div>
    </div>
  );
}