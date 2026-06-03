import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import "./Admin.css";

function Admin() {
  const [page, setPage] = useState("users");

  const users = [
    {
      name: "John Smith",
      email: "john@gmail.com",
      event: "Wedding",
      status: "active",
    },
    {
      name: "Sarah Wilson",
      email: "sarah@gmail.com",
      event: "Baby Shower",
      status: "inactive",
    },
    {
      name: "David Lee",
      email: "david@gmail.com",
      event: "Corporate Event",
      status: "active",
    },
    {
      name: "Emma Brown",
      email: "emma@gmail.com",
      event: "Graduation",
      status: "inactive",
    },
  ];

  const vendors = [
    {
      name: "Royal Catering",
      category: "Catering",
      location: "Kochi",
      contact: "9876543210",
    },
    {
      name: "Dream Decorations",
      category: "Decoration",
      location: "Thrissur",
      contact: "9876501234",
    },
    {
      name: "Lens Studio",
      category: "Photography",
      location: "Ernakulam",
      contact: "9123456789",
    },
  ];

  return (
    <div className="admin">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>EventRoots</h2>

        <ul>
          <li
            className={page === "users" ? "active-menu" : ""}
            onClick={() => setPage("users")}
          >
            Manage Users
          </li>

          <li
            className={page === "vendors" ? "active-menu" : ""}
            onClick={() => setPage("vendors")}
          >
            Manage Vendors
          </li>
        </ul>

        <div
          className={`settings-menu ${
            page === "settings" ? "active-menu" : ""
          }`}
          onClick={() => setPage("settings")}
        >
          <SettingsIcon />
          <span>Settings</span>
        </div>
      </div>

      {/* Content */}
      <div className="content">

        {/* Users */}
        {page === "users" && (
          <>
            <div className="top-section">
              <h1>Manage Users</h1>

              <input
                type="text"
                placeholder="Search users..."
                className="search"
              />
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user, index) => (
                    <tr key={index}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.event}</td>

                      <td>
                        <span className={`status ${user.status}`}>
                          {user.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit">
                            <EditIcon />
                          </button>

                          <button className="icon-btn delete">
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className="floating-btn">
                + Add New User
              </button>
            </div>
          </>
        )}

        {/* Vendors */}
        {page === "vendors" && (
          <>
            <div className="top-section">
              <h1>Manage Vendors</h1>

              <input
                type="text"
                placeholder="Search vendors..."
                className="search"
              />
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {vendors.map((vendor, index) => (
                    <tr key={index}>
                      <td>{vendor.name}</td>
                      <td>{vendor.category}</td>
                      <td>{vendor.location}</td>
                      <td>{vendor.contact}</td>

                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit">
                            <EditIcon />
                          </button>

                          <button className="icon-btn delete">
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className="floating-btn">
                + Add New Vendor
              </button>
            </div>
          </>
        )}

        {/* Settings */}
        {page === "settings" && (
          <div className="settings-card">
            <h1>Settings</h1>

            <div className="setting-item">
              <label>Admin Name</label>
              <input
                type="text"
                defaultValue="Admin"
              />
            </div>

            <div className="setting-item">
              <label>Email</label>
              <input
                type="email"
                defaultValue="admin@eventroots.com"
              />
            </div>

            <button className="save-btn">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;