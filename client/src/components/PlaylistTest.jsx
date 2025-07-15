import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function PlaylistTest() {
  const { id } = useParams();
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({}); // { [mcqIdx]: optionIdx }
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/playlist/${id}/generate-mcqs`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMcqs(res.data.mcqs); // Split MCQs by double newline
      } catch (err) {
        setMcqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMCQs();
  }, [id, token]);

  if (loading) return <div className="text-white text-center mt-8">Loading MCQs...</div>;
  if (!mcqs.length) return <div className="text-white text-center mt-8">No MCQs found.</div>;

   const getCorrectIdx = (ans) => {
    const map = { A: 0, B: 1, C: 2, D: 3 };
    return map[ans];
  };
  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#181818] rounded-lg shadow text-white mt-8">
      <h2 className="text-2xl font-bold mb-6">MCQ Test</h2>
      {mcqs.map((mcq, idx) => {
        const correctIdx = getCorrectIdx(mcq.ans);
        const userSelected = selected[idx];

        return (
            <div key={idx} className="mb-6 bg-[#232323] rounded p-4">
            <div className="font-semibold mb-2">{idx + 1}. {mcq.question}</div>
            <div className="flex flex-col gap-2">
              {mcq.options.map((opt, optIdx) => {
                let optionColor = "bg-[#181818] hover:bg-purple-800 border-gray-500";
                if (userSelected !== undefined) {
                  if (optIdx === correctIdx) optionColor = "bg-green-700";
                  else if (optIdx === userSelected) optionColor = "bg-red-700";
                  else optionColor = "bg-[#181818]";
                }
                return (
                  <button
                    key={optIdx}
                    className={`w-full text-left px-4 py-2 rounded ${optionColor} text-white border border-gray-300 transition`}
                    disabled={userSelected !== undefined}
                    onClick={() => setSelected({ ...selected, [idx]: optIdx })}
                  >
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}