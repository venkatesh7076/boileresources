import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function ScheduleCalendar() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState("class");
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    examType: "midterm",
  });

  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/auth/me", { withCredentials: true });
        setUserId(res.data._id);
      } catch (err) {
        console.error("❌ Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:5001/api/calendar/${userId}`, { withCredentials: true })
      .then((res) => {
        const formatted = res.data.map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(formatted);
      })
      .catch((err) => {
        console.error("❌ Failed to load events:", err);
      });
  }, [userId]);

  const handleCreateEvent = async () => {
    const { title, date, startTime, endTime, examType } = formData;
    if (!title || !startTime || !endTime || !date) return;

    const [sh, sm] = startTime.split(":");
    const [eh, em] = endTime.split(":");

    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);

    const displayTitle = eventType === "exam" ? `${title} (${examType})` : title;

    const payload = {
      userId,
      title: displayTitle,
      start,
      end,
      type: eventType,
      examType: eventType === "exam" ? examType : null
    };

    try {
      const res = await axios.post("http://localhost:5001/api/calendar", payload, {
        withCredentials: true,
      });

      setEvents((prev) => [
        ...prev,
        {
          ...res.data,
          start: new Date(res.data.start),
          end: new Date(res.data.end),
        },
      ]);
      setFormData({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        examType: "midterm",
      });
      setShowForm(false);
    } catch (err) {
      console.error("❌ Failed to create event:", err);
    }
  };

  const CustomAgendaEvent = ({ event }) => (
    <div className="flex items-center gap-2">
      {bulkDeleteMode && (
        <input
          type="checkbox"
          checked={selectedEventIds.includes(event._id)}
          onChange={() => {
            setSelectedEventIds((prev) =>
              prev.includes(event._id)
                ? prev.filter((id) => id !== event._id)
                : [...prev, event._id]
            );
          }}
        />
      )}
      <span>{event.title}</span>
    </div>
  );

  return (
    <div style={{ height: "100%", padding: "1rem" }}>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/home")}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            ← Back to Home
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Event
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-gray-300" />
          Class
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-gray-300" />
          Midterm / Final / Quiz 
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow-md p-4 rounded mb-4 max-w-md mx-auto">
          <h2 className="text-lg font-bold mb-4">Add New Event</h2>

          <div className="flex mb-4">
            <button
              className={`flex-1 py-2 rounded-l ${eventType === "class" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => setEventType("class")}
            >
              Class
            </button>
            <button
              className={`flex-1 py-2 rounded-r ${eventType === "exam" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => setEventType("exam")}
            >
              Exam
            </button>
          </div>

          <input
            className="border px-2 py-1 w-full mb-2"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <label className="block mb-1">Date:</label>
          <input
            type="date"
            className="border px-2 py-1 w-full mb-2"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <label className="block mb-1">Start Time:</label>
          <input
            type="time"
            className="border px-2 py-1 w-full mb-2"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
          <label className="block mb-1">End Time:</label>
          <input
            type="time"
            className="border px-2 py-1 w-full mb-2"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />

          {eventType === "exam" && (
            <>
              <label className="block mb-1">Exam Type:</label>
              <select
                className="border px-2 py-1 w-full mb-2"
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
              >
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="quiz">Quiz</option>
              </select>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreateEvent}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-400 text-white px-4 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "600px" }}
        views={["month", "week", "day", "agenda"]}
        view={currentView}
        onView={setCurrentView}
        date={currentDate}
        onNavigate={setCurrentDate}
        components={{
          agenda: {
            event: CustomAgendaEvent,
          },
        }}
      />
    </div>
  );
}
