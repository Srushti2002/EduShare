import  { useEffect, useState } from "react";
import axios from "axios";
import EditableProfileInfo from "../../components/EditableProfileInfo";
import maleImg from "../../assets/maleImg.jpg";
import femaleImg from "../../assets/femaleImg.jpg";
import otherImg from "../../assets/otherImg.png";
import { useDispatch, useSelector } from "react-redux";
import { setGender, setUser } from "../../store/userSlice";
import { Link } from "react-router-dom";


export default function StudentProfile() {
  const dispatch = useDispatch();
  const [student, setStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [mentors, setMentors] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const token = localStorage.getItem("token");
  const [overallProgress, setOverallProgress] = useState(0);

    const API_BASE_URL =
    import.meta.env.NODE_ENV === "development"
      ? import.meta.env.VITE_BACKEND_URL // Hosted API
      : import.meta.env.VITE_BACKEND_URL_PROD;  

  // Redux state
  const name = useSelector((state) => state.user.name);
  const bio = useSelector((state) => state.user.bio);
  const gender = useSelector((state) => state.user.gender);

  useEffect(() => {
    if (!token) {
      setError("No token found. Please login again.");
      return;
    }

    // Fetch student profile
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudent(res.data);
        dispatch(setUser({
          name: res.data.name,
          bio: res.data.bio,
          role: res.data.role,
          email: res.data.email,
        }));
        dispatch(setGender(res.data.gender || "other"));
        setError("");
      } catch (err) {
        setError("Failed to load profile.");
      }
    };

    // Fetch overall progress (average score) from backend
    const fetchOverallProgress = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/overallProgress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOverallProgress(res.data.overallProgress ?? 0);
      } catch (err) {
        setOverallProgress(0);
      }
    };

    // Fetch mentors the student follows
    const fetchMentors = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/mentors/following`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMentors(res.data);
      } catch (err) {
        setMentors([]);
      }
    };

    // Fetch playlists the student is enrolled in
    const fetchPlaylists = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/playlist/enrolled`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPlaylists(res.data);
      } catch (err) {
        setPlaylists([]);
      }
    };

    fetchProfile();
    fetchOverallProgress();
    fetchMentors();
    fetchPlaylists();
    // eslint-disable-next-line
  }, [token, dispatch]);


  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = { name, bio, gender };
      const res = await axios.put(
        `${API_BASE_URL}/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudent(res.data);
      dispatch(setUser({
        name: res.data.name,
        bio: res.data.bio,
        role: res.data.role,
        email: res.data.email,
      }));
      dispatch(setGender(res.data.gender || "other"));
      setEditMode(false);
      setError("");
    } catch (err) {
      setError("Failed to update profile.");
    }
  };

  const getProfileImg = () => {
    if (gender === "female") return femaleImg;
    else if (gender === "male") return maleImg;
    else return otherImg;
  };

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!student) return <div>Loading...</div>;

  return (
    <div className="flex flex-col justify-center bg-[#1F1F1F] items-center text-white flex-1">
      <div className="w-3/5 flex flex-col px-10 py-10 justify-between bg-[#181818] max-lg:w-3/4 max-sm:w-full max-sm:px-10 max-sm:bg-[#1F1F1F]">
        <h2 className="text-3xl font-bold mb-6">Student Profile</h2>
        
        <div className="flex flex-row items-center justify-around bg-[#232323] gap-10 p-10 mb-6 max-md:flex-col max-sm:bg-[#181818] max-md:text-center">
          {/* <div className="flex flex-rows items-center gap-10"> */}
            <img
              src={getProfileImg()}
              alt="Profile"
              style={{ width: 100, height: 100, borderRadius: "50%", marginBottom: 20 }}
            />
            <EditableProfileInfo
              editMode={editMode}
              name={name}
              setName={(val) => dispatch(setUser({ name: val }))}
              bio={bio}
              setBio={(val) => dispatch(setUser({ bio: val }))}
              gender={gender}
              setGender={(val) => dispatch(setGender(val))}
              fields={[]} // students don't have fields
              setFields={() => {}}
              role="student"
              handleUpdate={handleUpdate}
              setEditMode={setEditMode}
              error={error}
            />
          {/* </div> */}
          
          {/* Overall Progress (Time-based) */}
          <div className="flex flex-col items-center ml-8 max-md:ml-0 max-md:mt-6">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#444"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#22c55e"
                strokeWidth="6"
                fill="none"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - (overallProgress || 0) / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s' }}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dy=".3em"
                fontSize="1.3em"
                fill="#fff"
                fontWeight="bold"
              >
                {Math.round(overallProgress || 0)}%
              </text>
            </svg>
            <span className="mt-2 text-sm text-center text-gray-300" title="Time-based progress across all enrolled playlists">Overall Progress</span>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">Mentors You Follow</h3>
        {mentors.length === 0 ? (
          <p>You are not following any mentors yet.</p>
        ) : (
          <ul className="">
            {mentors.map((mentor) => (
              <li key={mentor._id}
                className="mb-4 bg-[#232323] rounded p-4 flex flex-row items-center justify-between max-sm:bg-[#181818]">
                {mentor.name}
                <Link to={`/mentor/${mentor._id}`}
                  className="mt-2 md:mt-0 md:ml-4 px-4 py-1 bg-green-700 hover:bg-green-900 text-white rounded ">
                  <button style={{ marginLeft: 10 }}>View</button>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h3 className="text-xl font-semibold mb-4">Playlists You're Enrolled In</h3>
        {playlists.length === 0 ? (
          <p>You haven't enrolled in any playlists yet.</p>
        ) : (
          <ul>
            {playlists.map((pl) => (
              <li key={pl._id}
                className="mb-4 bg-[#232323] rounded p-4 flex flex-row items-center justify-between max-sm:bg-[#181818]">
                <div className="flex flex-col gap-2 flex-1">
                  <span className="font-semibold">{pl.title}</span>
                </div>
                <Link to={`/view-playlist/${pl._id}`}>
                  <button
                    className="mt-2 md:mt-0 md:ml-4 px-4 py-1 bg-blue-700 hover:bg-blue-900 text-white rounded"
                  >Continue</button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}