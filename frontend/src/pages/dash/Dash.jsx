import "./Dash.css";

const templates = [
  {
    title: "Wedding",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552",
    desc: "Plan your dream wedding",
  },
  {
    title: "House Warming",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    desc: "Make your new house a home",
  },
  {
    title: "Funeral",
    image: "https://images.unsplash.com/photo-1516589091380-5d8e87df6999",
    desc: "Respectful farewell planning",
  },
  {
    title: "Birthday",
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
    desc: "Celebrate special moments",
  },
  {
    title: "Concert",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    desc: "Plan a music event",
  },
];

const events = [
  {
    title: "Arun & Diya Wedding",
    status: "Upcoming",
    progress: "60%",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
  },
  {
    title: "Our House Warming",
    status: "Completed",
    progress: "100%",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
  },
  {
    title: "Live in Kochi Concert",
    status: "Planning",
    progress: "30%",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  },
  {
    title: "Ayesha's Birthday",
    status: "Planning",
    progress: "20%",
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
  },
];

export default function Dash() {
  return (
    <div className="dash-container">
      {/* Header */}
      <header className="dash-header">
        <div className="logo">EventRoots</div>

        <div className="header-actions">
          <button className="icon-btn">🔔</button>

          <div className="profile">
            <img
              src="https://i.pravatar.cc/100"
              alt="profile"
            />
            <span>Salwa</span>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="welcome-card">
        <h1>Welcome back, Salwa! 👋</h1>
        <p>Let's plan your next memorable event.</p>
      </section>

      {/* Event Templates */}
      <section className="section-card">
        <h2>Event Templates</h2>

        <div className="template-scroll">
          {templates.map((item, index) => (
            <div className="template-card" key={index}>
              <img src={item.image} alt={item.title} />
              <div className="template-content">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your Events */}
      <section className="section-card">
        <h2>Your Events</h2>

        <div className="events-grid">
          <div className="create-card">
            <div className="plus">+</div>
            <h3>Create New Event</h3>
          </div>

          {events.map((event, index) => (
            <div className="event-card" key={index}>
              <img src={event.image} alt={event.title} />

              <div className="event-content">
                <span className={`badge ${event.status.toLowerCase()}`}>
                  {event.status}
                </span>

                <h3>{event.title}</h3>

                <p>{event.progress} Planned</p>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: event.progress }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}