import { useEffect, useState } from "react";
import axios from "axios";

import { Link } from "react-router-dom";

const MentorDashboard = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [editingId, setEditingId] = useState(null);

     const API_BASE_URL =
    import.meta.env.MODE === "development"
      ? import.meta.env.VITE_BACKEND_URL // Hosted API
      : import.meta.env.VITE_BACKEND_URL_PROD;  
      
  const token = localStorage.getItem("token");
  console.log(`Token : ${token}`);

  // Fetch existing playlists
  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/playlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(res.data);
      console.log("Fetched playlists:", res.data);
    } catch (err) {
      console.error("Error fetching playlists:", err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !url) {
      return alert("Please fill all fields");
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/playlist/${editingId}`,
          { title, description, url },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditingId(null);
      } else {
        await axios.post(
          `${API_BASE_URL}/playlist`,
          { title, description, url },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setTitle("");
      setDescription("");
      setUrl("");
      fetchPlaylists();
    } catch (err) {
        console.error("Error saving playlist:", err.response?.data || err.message);
    }
  };

  const handleEdit = (playlist) => {
    setTitle(playlist.title);
    setDescription(playlist.description);
    setUrl(playlist.url);
    setEditingId(playlist._id);
  };

  // console.log(playlists.title);
  // console.log(playlists.description);
  // console.log(playlists.url);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/playlist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlaylists();
    } catch (err) {
      console.error("Error deleting playlist:", err);
    }
  };

  return (
  <div className="flex flex-col justify-center bg-[#1F1F1F] text-white flex-1">
    <div className="flex flex-col justify-center px-20 max-sm:px-4 max-sm:pt-10">
      <h2 className="text-3xl font-bold mb-8 text-center">Mentor Dashboard</h2>

    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-7">
      <input
        type="text"
        placeholder="Playlist Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full p-3 rounded bg-[#444444] text-white placeholder-white border-0  focus:outline-none focus:ring-0"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="w-full p-3 rounded bg-[#444444] text-white placeholder-white border-0 focus:outline-none focus:ring-0"
      />
      <input
        type="url"
        placeholder="Playlist URL (YouTube, Udemy...)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className="w-full p-3 rounded bg-[#444444] text-white placeholder-white border-0 focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        className="w-50 bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2 rounded transition"
      >
        {editingId ? "Update Playlist" : "Add Playlist"}
      </button>
    </form>

    <h3 className="text-xl font-semibold mb-5 max-sm:text-center">Your Playlists</h3>
    <div className="flex flex-row flex-wrap gap-4 max-sm:justify-center">
    {playlists.length === 0 ? (
      <p className="text-gray-400">No playlists added yet.</p>
    ) : (
      playlists.map((playlist) => (
        <div
          key={playlist._id}
          className="flex flex-col items-center w-70 text-center border border-[#444444] bg-[#181818] p-4 mb-4 rounded-lg max-sm:w-9/10"
        >
          <h4 className="text-lg mb-2 font-bold">{playlist.title}</h4>
          <p className="mb-3 text-gray-300">{playlist.description}</p>
          <Link
            to={`/view-playlist/${playlist._id}`}
            className="text-purple-400 hover:underline"
          >
            View Playlist
          </Link>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleEdit(playlist)}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(playlist._id)}
              className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))
    )}
    </div>
    </div>
    
  </div>
);
};

export default MentorDashboard;
