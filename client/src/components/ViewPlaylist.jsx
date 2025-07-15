import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';

export default function ViewPlaylist() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [progress, setProgress] = useState({});
  const [enrolled, setEnrolled] = useState(false);
  const [role, setRole] = useState("");
  const token = localStorage.getItem('token');
  const saveTimeout = useRef();

  useEffect(() => {
    const fetchPlaylist = async () => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/playlist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylist(res.data);

      const videoRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/playlist/youtube-videos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideos(videoRes.data);
    };

    const fetchProfile = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRole(res.data.role);
      if (res.data.followingPlaylists && res.data.followingPlaylists.includes(id)) {
        setEnrolled(true);
      }
    };

    fetchPlaylist();
    fetchProfile();
  }, [id, token]);

  // Fetch progress from backend
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/progress/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProgress(res.data.progress || {});
      } catch (err) {
        setProgress({});
      }
    };
    fetchProgress();
  }, [id, token]);

  // Save progress to backend
  useEffect(() => {
    if (role === "student") {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        console.log("Saving progress:", progress); // <-- Add this
        console.log("Overall progress:", overallProgress); // <-- Add this
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/progress`,
          { playlistId: id, progress, overallPlaylistProgress: overallProgress },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }, 1000); // save after 1s of inactivity
    }
    return () => clearTimeout(saveTimeout.current);
  }, [progress, id, token, role, enrolled]);

  // Unified toggle enroll/unenroll
  const handleToggleEnroll = async () => {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/playlist/toggleEnroll`,
      { playlistId: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEnrolled((prev) => !prev);
  };

  const handleWatch = async (videoId) => {
    if (role === "student" && !enrolled) {
      await handleToggleEnroll();
    }
    setCurrentVideo(`https://www.youtube.com/watch?v=${videoId}`);
    setProgress((prev) => ({
      ...prev,
      [videoId]: prev[videoId] || 0,
    }));
  };

  const handleProgress = (state) => {
    if (currentVideo) {
      const videoId = currentVideo.split('v=')[1];
      const watchedPercent = state.played * 100;
      setProgress((prev) => ({
        ...prev,
        [videoId]: Math.max(prev[videoId] || 0, watchedPercent), 
      }));
    }
  };

  const totalVideos = videos.length;
  const totalProgress = totalVideos
    ? videos.reduce((sum, video) => sum + (progress[video.videoId] || 0), 0)
    : 0;
  const overallProgress = totalVideos ? totalProgress / totalVideos : 0;

  const uniqueVideos = videos.filter(
    (video, index, self) =>
      index === self.findIndex(v => v.videoId === video.videoId)
  );

  if (!playlist) return <div className="text-white text-center mt-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#181818] rounded-lg shadow text-white mt-8 max-sm:bg-[#1F1F1F]">
      {/* Combined Progress Bar */}
      {role === "student" && totalVideos > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">Overall Progress</span>
            <span className="text-sm text-gray-300">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-3 overflow-hidden">
            <div
              className="bg-purple-600 h-3 rounded"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-2">{playlist.title}</h1>
      <p className="mb-6 text-gray-300">{playlist.description}</p>
      {role === "student" && (
        !enrolled ? (
          <button
            onClick={handleToggleEnroll}
            className="mb-6 px-6 py-2 bg-purple-700 hover:bg-purple-800 rounded text-white font-semibold transition"
          >
            Enroll in this Playlist
          </button>
        ) : (
          <div className="mb-6 flex items-center gap-4">
            <div className="text-green-400 font-semibold">You are enrolled in this playlist.</div>
            {/* <button
              onClick={handleToggleEnroll}
              className="px-4 py-1 bg-red-700 hover:bg-red-800 rounded text-white font-semibold transition"
            >
              Unenroll
            </button> */}
          </div>
        )
      )}
      <h3 className="text-xl font-semibold mb-4">Videos</h3>
      <ul className="mb-8">
        {uniqueVideos.length > 0 ? (
          uniqueVideos.map((video) => (
            <React.Fragment key={video.videoId}>
              <li className="mb-6 bg-[#232323] rounded p-4 flex flex-col justify-between md:flex-row md:items-center md:justify-between max-sm:bg-[#181818]">
                <div className="w-full flex flex-row items-center justify-between">
                  <span className="font-semibold">{video.title}</span>
                  <button
                    className="ml-4 px-4 py-1 bg-blue-700 hover:bg-blue-800 rounded text-white font-semibold transition"
                    onClick={() => {
                      handleWatch(video.videoId);
                    }}
                  >
                    Watch
                  </button>
                </div>
                {role === "student" && (
                  <div className="flex items-center gap-2 mt-2 md:mt-0 md:ml-4">
                    <div className="w-52 bg-gray-700 rounded h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${progress[video.videoId] || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-300">
                      {Math.round(progress[video.videoId] || 0)}%
                    </span>
                  </div>
                )}
              </li>
              {/* Show player right after the selected video */}
              {currentVideo === `https://www.youtube.com/watch?v=${video.videoId}` && (
                <div className="mb-8 flex flex-col items-center">
                  <div className="w-full rounded overflow-hidden mb-2 relative">
                    <button
                      className="absolute top-2 right-2 z-10 bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-600"
                      onClick={() => setCurrentVideo(null)}
                    >
                      Minimize ▲
                    </button>
                    <ReactPlayer
                      url={currentVideo}
                      controls
                      width="100%"
                      height="360px"
                      playing
                      onProgress={handleProgress}
                      onReady={(player) => {
                        const videoId = currentVideo.split('v=')[1];
                        const seconds = ((progress[videoId] || 0) / 100) * player.getDuration();
                        if (seconds > 5) { // Optional: only seek if > 5 seconds progress
                          player.seekTo(seconds, "seconds");
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        ) : (
          <li className="text-gray-400">No videos found in this playlist.</li>
        )}
      </ul>

      {role === "student" && enrolled && Math.round(overallProgress) === 100 && (
        <button
          className="mb-6 px-6 py-2 bg-green-700 hover:bg-green-800 rounded text-white font-semibold transition"
          onClick={() => window.location.href = `/playlist/${id}/test`}
        >
          Take a Test
        </button>
      )}
    </div>
  );
}