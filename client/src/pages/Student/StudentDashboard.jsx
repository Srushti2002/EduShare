import React, { useEffect, useState } from "react";
import axios from "axios";
import MentorCard from "./MentorCard";

export default function StudentDashboard() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mentors, setMentors] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [otherMentors, setOtherMentors] = useState([]);
  const token = localStorage.getItem("token");

    const API_BASE_URL =
    import.meta.env.NODE_ENV === "development"
      ? import.meta.env.VITE_BACKEND_URL // Hosted API
      : import.meta.env.VITE_BACKEND_URL_PROD;  

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [search]);

  const filteredFollowed = followed.filter((mentor) =>
    mentor.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (Array.isArray(mentor.fields) && mentor.fields.join(" ").toLowerCase().includes(debouncedSearch.toLowerCase())) ||
    (mentor.bio && mentor.bio.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  useEffect(() => {
    // Fetch all mentors and student's following list
    const fetchMentors = async () => {
      const res = await axios.get(
        `${API_BASE_URL}/mentors?search=${debouncedSearch}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMentors(res.data);
    };

    const fetchFollowed = async () => {
      const res = await axios.get(
        `${API_BASE_URL}/mentors/following`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowed(res.data);
    };

    fetchMentors();
    fetchFollowed();
  }, [debouncedSearch, token]);

  useEffect(() => {
    // Filter mentors into followed and others
    const followedIds = followed.map((m) => m._id);
    setOtherMentors(mentors.filter((m) => !followedIds.includes(m._id)));
  }, [mentors, followed]);

  // Unified toggle follow/unfollow handler
  const handleToggleFollow = async (mentorId) => {
    await axios.post(
      `${API_BASE_URL}/mentors/toggleFollow`,
      { mentorId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Refresh lists
    const res = await axios.get(
      `${API_BASE_URL}/mentors/following`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setFollowed(res.data);
  };

  return (
    <div className="w-full h-full px-30 pt-10 bg-[#1F1F1F] max-lg:px-15 max-md:px-10 max-sm:px-5">
      <div className="flex flex-col max-md:items-center justify-center">
        <input
          type="text"
          placeholder="Search mentors by name, field, or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-8 p-3 rounded bg-[#444444] text-white placeholder-white border focus:outline-none"
        />

        <h3 className="text-xl font-semibold mb-4 text-white">Mentors You Follow</h3>
        <div className="flex flex-row flex-wrap gap-4 max-sm:justify-center">
          {filteredFollowed.length === 0 ? (
            <p className="w-full text-center text-gray-400">
              You are not following any mentors yet{search ? " matching your search." : "."}
            </p>
          ) : (
            filteredFollowed.map((mentor) => (
              <MentorCard
                key={mentor._id}
                mentor={mentor}
                following={true}
                onToggleFollow={handleToggleFollow}
              />
            ))
          )}
        </div>

        <h3 className="text-xl font-semibold mt-10 mb-4 text-white">Mentors You Can Follow</h3>
        <div className="flex flex-row flex-wrap gap-4 max-sm:justify-center">
          {otherMentors.length === 0 ? (
            <p className="w-full text-center text-gray-400">
              No more mentors to follow{search ? " matching your search." : "."}
            </p>
          ) : (
            otherMentors.map((mentor) => (
              <MentorCard
                key={mentor._id}
                mentor={mentor}
                following={false}
                onToggleFollow={handleToggleFollow}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}