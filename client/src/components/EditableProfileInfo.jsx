import React from "react";

export default function EditableProfileInfo({
  editMode,
  name,
  setName,
  bio,
  setBio,
  gender,
  setGender,
  fields,
  setFields,
  role,
  handleUpdate,
  setEditMode,
  error,
}) {
  return (
    <>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {!editMode ? (
        <div className="w-full leading-[1.5]">
          <p className="mb-2">
            <span className="font-semibold">Name : </span> {name}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Gender : </span> {gender || "Not specified"}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Bio : </span> {bio || "No bio yet"}
          </p>
          {role === "mentor" && (
            <p className="mb-2">
              <span className="font-semibold">Fields : </span>{" "}
              {Array.isArray(fields) && fields.length > 0 ? fields.join(", ") : "N/A"}
            </p>
          )}
          <button
            className="mt-3 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded transition"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="bg-[#232323] rounded p-4 w-full flex flex-col justify-center max-sm:bg-[#181818]">
          <div className="mb-4 flex flex-col">
            <label className="mb-1 font-semibold">Name:</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 rounded bg-[#1F1F1F] text-white border border-purple-500 focus:border-purple-400 focus:outline-none placeholder-white"
              placeholder="Name"
            />
          </div>
          <div className="mb-4 flex flex-col">
            <label className="mb-1 font-semibold">Bio:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2 rounded bg-[#1F1F1F] text-white border border-purple-500 focus:border-purple-400 focus:outline-none placeholder-white"
              placeholder="Bio"
            />
          </div>
          <div className="mb-4 flex flex-col">
            <label className="mb-1 font-semibold">Gender:</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 rounded bg-[#1F1F1F] text-white border border-purple-500 focus:border-purple-400 focus:outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {role === "mentor" && (
            <div className="mb-4 flex flex-col">
              <label className="mb-1 font-semibold">Fields:</label>
              <select
                multiple
                value={fields}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  setFields(selected);
                }}
                className="dropdown-scrollbar w-full p-2 rounded bg-[#1F1F1F] text-white border border-purple-500 focus:border-purple-400 focus:outline-none"
                style={{ height: 80 }}
              >
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="AI">AI</option>
                <option value="Cloud">Cloud</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="DevOps">DevOps</option>
                <option value="UI/UX">UI/UX</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}