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
  const [formData, setFormData] = useState({
    title: "",
    days: [],
    startTime: "",
    endTime: "",
    startDate: "",
    endDate: "",
  });

  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/auth/me", {
          withCredentials: true,
        });
        setUserId(res.data._id);
      } catch (err) {
        console.error("❌ Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5001/api/calendar/${userId}`, {
        withCredentials: true,
      })
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

  const handleSelectSlot = () => {
    setShowForm(true);
  };

  const handleEventCheckbox = (eventId) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedEventIds.map((id) =>
          axios.delete(`http://localhost:5001/api/calendar/${id}`, {
            withCredentials: true,
          })
        )
      );
      setEvents((prev) => prev.filter((e) => !selectedEventIds.includes(e._id)));
      setSelectedEventIds([]);
      setBulkDeleteMode(false);
    } catch (err) {
      console.error("❌ Failed to delete selected events:", err);
    }
  };

  const handleCreateRecurringEvents = async () => {
    const { title, days, startTime, endTime, startDate, endDate } = formData;
    if (!userId || !title || !days.length || !startTime || !endTime || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start > end) {
      alert("Please enter a valid start and end date.");
      return;
    }

    const dayIndexMap = {
      SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
    };

    const newEvents = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayStr = Object.keys(dayIndexMap).find(key => dayIndexMap[key] === date.getDay());
      if (!formData.days.includes(dayStr)) continue;

      const [sh, sm] = startTime.split(":");
      const [eh, em] = endTime.split(":");

      const classStart = new Date(date);
      classStart.setHours(sh, sm, 0, 0);
      const classEnd = new Date(date);
      classEnd.setHours(eh, em, 0, 0);

      newEvents.push({
        userId,
        title,
        start: new Date(classStart),
        end: new Date(classEnd)
      });
    }

    try {
      const responses = await Promise.all(
        newEvents.map((event) =>
          axios.post("http://localhost:5001/api/calendar", event, {
            withCredentials: true,
          })
        )
      );

      const saved = responses.map((r) => ({
        ...r.data,
        start: new Date(r.data.start),
        end: new Date(r.data.end),
      }));

      setEvents((prev) => [...prev, ...saved]);
    } catch (err) {
      console.error("❌ Failed to create recurring events:", err);
    }

    setShowForm(false);
    setFormData({
      title: "",
      days: [],
      startTime: "",
      endTime: "",
      startDate: "",
      endDate: "",
    });
  };

  const CustomAgendaEvent = ({ event }) => (
    <div className="flex items-center gap-2">
      {bulkDeleteMode && (
        <input
          type="checkbox"
          checked={selectedEventIds.includes(event._id)}
          onChange={() => handleEventCheckbox(event._id)}
        />
      )}
      <span>{event.title}</span>
    </div>
  );

  return (
    <div style={{ height: "100%", padding: "1rem" }}>
      {/* Back to Home Button */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/home")}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          ← Back to Home
        </button>

        {currentView === "agenda" && (
          <button
            onClick={() => {
              setBulkDeleteMode((prev) => !prev);
              setSelectedEventIds([]);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            {bulkDeleteMode ? "Cancel Delete Mode" : "Delete Events"}
          </button>
        )}
      </div>

      {bulkDeleteMode && selectedEventIds.length > 0 && (
        <div className="mb-4 text-right">
          <button
            onClick={handleDeleteSelected}
            className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Delete Selected ({selectedEventIds.length})
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-4 rounded shadow-md max-w-md mx-auto mb-4">
          <h2 className="text-lg font-bold mb-2">Add Class</h2>
          <input
            className="border px-2 py-1 w-full mb-2"
            placeholder="Class Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          <label className="block mb-1">Start Date:</label>
          <input
            type="date"
            className="border px-2 py-1 w-full mb-2"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <label className="block mb-1">End Date:</label>
          <input
            type="date"
            className="border px-2 py-1 w-full mb-2"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
          <label className="block mb-1">Repeat On:</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {["MO", "TU", "WE", "TH", "FR"].map((day) => (
              <label key={day}>
                <input
                  type="checkbox"
                  checked={formData.days.includes(day)}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      days: prev.days.includes(day)
                        ? prev.days.filter((d) => d !== day)
                        : [...prev.days, day],
                    }))
                  }
                />
                <span className="ml-1">{day}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded"
              onClick={handleCreateRecurringEvents}
            >
              Add
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-1 rounded"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Calendar
        key={events.length} // ✅ force refresh to show updates
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "600px" }}
        selectable
        onSelectSlot={handleSelectSlot}
        views={["month", "week", "day", "agenda"]}
        view={currentView}
        onView={setCurrentView}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={() => {}} // disable single-click delete
        components={{
          agenda: {
            event: CustomAgendaEvent,
          },
        }}
      />
    </div>
  );
}
