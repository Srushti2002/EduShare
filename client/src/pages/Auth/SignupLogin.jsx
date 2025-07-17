import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const fieldOptions = [
  "Web Development",
  "Data Science",
  "AI",
  "Cloud",
  "Mobile Development",
  "Cybersecurity",
  "DevOps",
  "UI/UX",
  "Other",
];

const SignupLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    fields: [],
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const API_BASE_URL =
    import.meta.env.NODE_ENV === "development"
      ? import.meta.env.VITE_BACKEND_URL // Hosted API
      : import.meta.env.VITE_BACKEND_URL_PROD;

  useEffect(() => {
    function handleClickOutside(event) {
   
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // ...your existing handlers...

  // Add this handler for checkbox selection
  const handleFieldCheckbox = (field) => {
    setFormData((prev) => {
      const fields = prev.fields.includes(field)
        ? prev.fields.filter((f) => f !== field)
        : [...prev.fields, field];
      return { ...prev, fields };
    });
  };


  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({ name: "", email: "", password: "", role: "student", fields: [] });
  };

  const handleChange = (e) => {
    const { name, value, options, multiple } = e.target;
    if (name === "fields") {
      // Handle multi-select
      const selected = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);
      setFormData((prev) => ({ ...prev, fields: selected }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/signup`;
      const submitData = { ...formData };
      if (isLogin || formData.role !== "mentor") {
        delete submitData.fields;
      }
      const { data } = await axios.post(url, submitData);

      if (data.token) {
        localStorage.setItem("token", data.token);
      } else {
        alert("Token missing in response");
        return;
      }
      // alert(`${isLogin ? "Login" : "Signup"} successful!`);

      if (data.role === "mentor") {
        window.location.href = "/mentor-dashboard";
      } else {
        window.location.href = "/student-dashboard";
      }
    } catch (error) {
      console.error("Error:", error.response?.data?.error || error.message);
      alert(error.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="bg-[#444444] h-screen flex justify-center items-center md:p-0 sm:px-4">
      <div className="bg-[#1F1F1F] shadow-md flex flex-col px-7 py-9 rounded-2xl justify-center text-white max-w-[400px] w-1/2
            max-sm:w-full max-sm:max-w-full max-sm:h-full max-sm:rounded-none">
        <h2 className="text-2xl font-bold mb-4 text-center">{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div>
                {/* <label>Name</label> */}
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mb-5 w-full border-0 border-b-1 pb-3 border-purple-500 focus:border-b-2 placeholder-white focus:outline-none focus:ring-0"
                  placeholder="Name"
                />
              </div>
              <div>
                {/* <label>Role</label> */}
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="mb-5 bg-[#1F1F1F] text-white pb-3 w-full border-0 border-b-1 border-purple-500 focus:border-b-2 placeholder-white focus:outline-none focus:ring-0"
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>
              {formData.role === "mentor" && (
            <div className="relative" ref={dropdownRef}>
              {/* <label>Fields</label> */}
              <div
                className={"mb-5 w-full border-0 border-b-1 pb-3 border-purple-500 bg-[#1F1F1F] py-2 px-0 cursor-pointer text-white"
                  // ${formData.fields.length === 0 ? "text-white" : "text-white"}`
              }
                onClick={() => setDropdownOpen((open) => !open)}
              >
                {formData.fields.length > 0
                  ? formData.fields.join(", ")
                  : "Select fields"}
              </div>
              {dropdownOpen && (
                <div className="dropdown-scrollbar absolute z-10 w-full bg-[#1F1F1F] border border-purple-500 rounded mt-1 placeholder-white max-h-48 overflow-y-auto">
                  {fieldOptions.map((field) => (
                    <label
                      key={field}
                      className="flex items-center px-3 py-2 placeholder-white hover:bg-purple-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.fields.includes(field)}
                        onChange={() => handleFieldCheckbox(field)}
                        className="mr-2 accent-purple-600"
                      />
                      {field}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
          <div>
            {/* <label>Email</label> */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mb-5 w-full pb-3 border-0 border-b-1 border-purple-500 focus:border-b-2 placeholder-white focus:outline-none focus:ring-0"
            />
          </div>
          <div>
            {/* <label>Password</label> */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="pb-3 mb-7 w-full  border-0 border-b-1 border-purple-500 focus:border-b-2 placeholder-white focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2 rounded transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <p className="text-center mt-7">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleForm}
            className="text-purple-400 hover:text-purple-300"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupLogin;