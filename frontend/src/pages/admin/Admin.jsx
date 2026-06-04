import { useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import "./Admin.css";

const INIT_USERS = [
  { id: 1,  name: "John Smith",   email: "john@gmail.com",   event: "Wedding",         status: "active" },
  { id: 2,  name: "Sarah Wilson", email: "sarah@gmail.com",  event: "Baby Shower",     status: "inactive" },
  { id: 3,  name: "David Lee",    email: "david@gmail.com",  event: "Corporate Event", status: "active" },
  { id: 4,  name: "Emma Brown",   email: "emma@gmail.com",   event: "Graduation",      status: "inactive" },
  { id: 5,  name: "Arjun Nair",   email: "arjun@gmail.com",  event: "Wedding",         status: "active" },
  { id: 6,  name: "Priya Menon",  email: "priya@gmail.com",  event: "Birthday",        status: "active" },
  { id: 7,  name: "Rahul Sharma", email: "rahul@gmail.com",  event: "Corporate Event", status: "inactive" },
  { id: 8,  name: "Divya Pillai", email: "divya@gmail.com",  event: "Baby Shower",     status: "active" },
  { id: 9,  name: "Ananya Das",   email: "ananya@gmail.com", event: "Graduation",      status: "active" },
  { id: 10, name: "Kiran Raj",    email: "kiran@gmail.com",  event: "Wedding",         status: "inactive" },
  { id: 11, name: "Meera Iyer",   email: "meera@gmail.com",  event: "Birthday",        status: "active" },
  { id: 12, name: "Suresh Kumar", email: "suresh@gmail.com", event: "Corporate Event", status: "active" },
];

const INIT_VENDORS = [
  { id: 1, name: "Royal Catering",    category: "Catering",    location: "Kochi",     contact: "9876543210" },
  { id: 2, name: "Dream Decorations", category: "Decoration",  location: "Thrissur",  contact: "9876501234" },
  { id: 3, name: "Lens Studio",       category: "Photography", location: "Ernakulam", contact: "9123456789" },
  { id: 4, name: "Star Events",       category: "Decoration",  location: "Kochi",     contact: "9988776655" },
  { id: 5, name: "Click Masters",     category: "Photography", location: "Thrissur",  contact: "9011223344" },
  { id: 6, name: "Spice Route",       category: "Catering",    location: "Kollam",    contact: "9845123456" },
];

const unique  = (arr, key) => [...new Set(arr.map(x => x[key]))];
const nextId  = arr => Math.max(...arr.map(x => x.id)) + 1;
const sortArr = (arr, key) => {
  const [field, dir] = key.split("-");
  return [...arr].sort((a, b) => {
    const c = (a[field] || "").localeCompare(b[field] || "");
    return dir === "asc" ? c : -c;
  });
};

const validate = (form, isUser) => {
  const e = {};
  if (!form.name?.trim()) e.name = "Required";
  if (isUser) {
    if (!form.email?.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.event?.trim()) e.event = "Required";
  } else {
    if (!form.category?.trim()) e.category = "Required";
    if (!form.location?.trim()) e.location = "Required";
    if (!form.contact?.trim())  e.contact  = "Required";
    else if (!/^\d{10}$/.test(form.contact)) e.contact = "10-digit number";
  }
  return e;
};

function Pagination({ total, page, size, onChange, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const nums = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push("...");
    nums.push(pages);
  }
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  return (
    <div className="pagination-bar">
      <span className="pg-info">
        {total === 0 ? "No results" : `${start}–${Math.min(page * size, total)} of ${total}`}
      </span>
      <div className="pg-controls">
        <button className="pg-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>
          <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
        </button>
        {nums.map((n, i) =>
          n === "..." ? <span key={i} className="pg-dot">…</span> :
          <button key={n} className={`pg-btn${n === page ? " active" : ""}`} onClick={() => onChange(n)}>{n}</button>
        )}
        <button className="pg-btn" onClick={() => onChange(page + 1)} disabled={page === pages}>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
      <div className="pg-size">
        <label>Rows</label>
        <select value={size} onChange={e => onSize(Number(e.target.value))}>
          {[10, 50, 100].map(n => <option key={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSave, saveLabel, danger, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}><CloseRoundedIcon fontSize="small" /></button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className={danger ? "btn-delete" : "btn-save"} onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, error, select, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      {select
        ? <select name={name} value={value || ""} onChange={onChange}>
            {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        : <input name={name} value={value || ""} onChange={onChange} placeholder={placeholder} />}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export default function Admin() {
  const [tab,     setTab]     = useState("users");
  const [users,   setUsers]   = useState(INIT_USERS);
  const [vendors, setVendors] = useState(INIT_VENDORS);

  const [uSearch, setUSearch] = useState(""); const [uStatus, setUStatus] = useState("all"); const [uEvent,  setUEvent]  = useState("all"); const [uSort, setUSort] = useState("name-asc"); const [showUF, setShowUF] = useState(false);
  const [vSearch, setVSearch] = useState(""); const [vCat,    setVCat]    = useState("all"); const [vLoc,    setVLoc]    = useState("all"); const [vSort, setVSort] = useState("name-asc"); const [showVF, setShowVF] = useState(false);

  const [uPage, setUPage] = useState(1); const [uSize, setUSize] = useState(10);
  const [vPage, setVPage] = useState(1); const [vSize, setVSize] = useState(10);

  const [edit,   setEdit]   = useState(null);
  const [add,    setAdd]    = useState(null);
  const [del,    setDel]    = useState(null);
  const [form,   setForm]   = useState({});
  const [errors, setErrors] = useState({});

  const onForm = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const filteredUsers = sortArr(users.filter(u => {
    const q = uSearch.toLowerCase();
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (uStatus === "all" || u.status === uStatus)
      && (uEvent  === "all" || u.event  === uEvent);
  }), uSort);

  const filteredVendors = sortArr(vendors.filter(v => {
    const q = vSearch.toLowerCase();
    return (v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q))
      && (vCat === "all" || v.category === vCat)
      && (vLoc === "all" || v.location === vLoc);
  }), vSort);

  const uRows = filteredUsers.slice((uPage - 1) * uSize, uPage * uSize);
  const vRows = filteredVendors.slice((vPage - 1) * vSize, vPage * vSize);

  const saveEdit = () => {
    const errs = validate(form, edit.type === "user");
    if (Object.keys(errs).length) return setErrors(errs);
    if (edit.type === "user") setUsers(users.map(u => u.id === form.id ? form : u));
    else setVendors(vendors.map(v => v.id === form.id ? form : v));
    setEdit(null);
  };

  const saveAdd = () => {
    const errs = validate(form, add === "user");
    if (Object.keys(errs).length) return setErrors(errs);
    if (add === "user") setUsers([...users, { id: nextId(users), ...form }]);
    else setVendors([...vendors, { id: nextId(vendors), ...form }]);
    setAdd(null);
  };

  const confirmDel = () => {
    if (del.type === "user") setUsers(users.filter(u => u.id !== del.id));
    else setVendors(vendors.filter(v => v.id !== del.id));
    setDel(null);
  };

  const openEdit = (type, item) => { setEdit({ type, item }); setForm({ ...item }); setErrors({}); };
  const openAdd  = type => { setAdd(type); setForm(type === "user" ? { status: "active" } : {}); setErrors({}); };

  const userFields = (
    <>
      <Field label="Name"   name="name"   value={form.name}   onChange={onForm} placeholder="Full name"          error={errors.name} />
      <Field label="Email"  name="email"  value={form.email}  onChange={onForm} placeholder="email@example.com"  error={errors.email} />
      <Field label="Event"  name="event"  value={form.event}  onChange={onForm} placeholder="Event type"         error={errors.event} />
      <Field label="Status" name="status" value={form.status} onChange={onForm} select options={[["active","Active"],["inactive","Inactive"]]} />
    </>
  );

  const vendorFields = (
    <>
      <Field label="Name"     name="name"     value={form.name}     onChange={onForm} placeholder="Vendor name"     error={errors.name} />
      <Field label="Category" name="category" value={form.category} onChange={onForm} placeholder="e.g. Catering"  error={errors.category} />
      <Field label="Location" name="location" value={form.location} onChange={onForm} placeholder="City"            error={errors.location} />
      <Field label="Contact"  name="contact"  value={form.contact}  onChange={onForm} placeholder="10-digit number" error={errors.contact} />
    </>
  );

  return (
    <div className="admin">

      <aside className="sidebar">
        <h2>EventRoots</h2>
        <ul>
          {[["users","Manage Users"],["vendors","Manage Vendors"]].map(([key, label]) => (
            <li key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</li>
          ))}
        </ul>
        <div className="logout" onClick={() => window.confirm("Logout?") && alert("Logged out.")}>
          <LogoutRoundedIcon fontSize="small" /> Logout
        </div>
      </aside>

      <main className="main">

        {tab === "users" && (
          <>
            <div className="topbar">
              <h1>Manage Users</h1>
              <div className="controls">
                <input className="search" placeholder="Search users…" value={uSearch}
                  onChange={e => { setUSearch(e.target.value); setUPage(1); }} />
                <button className={`filter-btn${showUF ? " on" : ""}`} onClick={() => setShowUF(!showUF)}>
                  <FilterListRoundedIcon fontSize="small" /> Filter
                </button>
                <div className="sort-wrap">
                  <SwapVertRoundedIcon fontSize="small" />
                  <select value={uSort} onChange={e => { setUSort(e.target.value); setUPage(1); }}>
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                    <option value="event-asc">Event A–Z</option>
                    <option value="event-desc">Event Z–A</option>
                  </select>
                </div>
              </div>
            </div>

            {showUF && (
              <div className="filter-bar">
                <div className="fg">
                  <label>Status</label>
                  <select value={uStatus} onChange={e => { setUStatus(e.target.value); setUPage(1); }}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Event</label>
                  <select value={uEvent} onChange={e => { setUEvent(e.target.value); setUPage(1); }}>
                    <option value="all">All</option>
                    {unique(users, "event").map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <button className="clear-btn" onClick={() => { setUStatus("all"); setUEvent("all"); setUPage(1); }}>Clear</button>
              </div>
            )}

            <div className="table-wrap">
              <div className="tscroll">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Event</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {uRows.length ? uRows.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td><td>{u.email}</td><td>{u.event}</td>
                        <td><span className={`badge ${u.status}`}>{u.status}</span></td>
                        <td>
                          <div className="actions">
                            <button className="ic edit" onClick={() => openEdit("user", u)}><EditOutlinedIcon sx={{ fontSize: 16 }} /></button>
                            <button className="ic del"  onClick={() => setDel({ type: "user", id: u.id })}><DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="5" className="empty">No users found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="tfoot">
                <Pagination total={filteredUsers.length} page={uPage} size={uSize}
                  onChange={p => setUPage(p)} onSize={s => { setUSize(s); setUPage(1); }} />
              </div>
            </div>
            <button className="fab" onClick={() => openAdd("user")}>
              <PersonAddAltRoundedIcon sx={{ fontSize: 18 }} /> Add User
            </button>
          </>
        )}

        {tab === "vendors" && (
          <>
            <div className="topbar">
              <h1>Manage Vendors</h1>
              <div className="controls">
                <input className="search" placeholder="Search vendors…" value={vSearch}
                  onChange={e => { setVSearch(e.target.value); setVPage(1); }} />
                <button className={`filter-btn${showVF ? " on" : ""}`} onClick={() => setShowVF(!showVF)}>
                  <FilterListRoundedIcon fontSize="small" /> Filter
                </button>
                <div className="sort-wrap">
                  <SwapVertRoundedIcon fontSize="small" />
                  <select value={vSort} onChange={e => { setVSort(e.target.value); setVPage(1); }}>
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                    <option value="category-asc">Category A–Z</option>
                    <option value="category-desc">Category Z–A</option>
                    <option value="location-asc">Location A–Z</option>
                    <option value="location-desc">Location Z–A</option>
                  </select>
                </div>
              </div>
            </div>

            {showVF && (
              <div className="filter-bar">
                <div className="fg">
                  <label>Category</label>
                  <select value={vCat} onChange={e => { setVCat(e.target.value); setVPage(1); }}>
                    <option value="all">All</option>
                    {unique(vendors, "category").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label>Location</label>
                  <select value={vLoc} onChange={e => { setVLoc(e.target.value); setVPage(1); }}>
                    <option value="all">All</option>
                    {unique(vendors, "location").map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <button className="clear-btn" onClick={() => { setVCat("all"); setVLoc("all"); setVPage(1); }}>Clear</button>
              </div>
            )}

            <div className="table-wrap">
              <div className="tscroll">
                <table>
                  <thead>
                    <tr><th>Vendor</th><th>Category</th><th>Location</th><th>Contact</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {vRows.length ? vRows.map(v => (
                      <tr key={v.id}>
                        <td>{v.name}</td><td>{v.category}</td><td>{v.location}</td><td>{v.contact}</td>
                        <td>
                          <div className="actions">
                            <button className="ic edit" onClick={() => openEdit("vendor", v)}><EditOutlinedIcon sx={{ fontSize: 16 }} /></button>
                            <button className="ic del"  onClick={() => setDel({ type: "vendor", id: v.id })}><DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="5" className="empty">No vendors found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="tfoot">
                <Pagination total={filteredVendors.length} page={vPage} size={vSize}
                  onChange={p => setVPage(p)} onSize={s => { setVSize(s); setVPage(1); }} />
              </div>
            </div>
            <button className="fab" onClick={() => openAdd("vendor")}>
              <StorefrontRoundedIcon sx={{ fontSize: 18 }} /> Add Vendor
            </button>
          </>
        )}
      </main>

      {edit && (
        <Modal title={`Edit ${edit.type === "user" ? "User" : "Vendor"}`}
          onClose={() => setEdit(null)} onSave={saveEdit}
          saveLabel={<><SaveRoundedIcon sx={{ fontSize: 14 }} /> Save</>}>
          {edit.type === "user" ? userFields : vendorFields}
        </Modal>
      )}

      {add && (
        <Modal title={`Add ${add === "user" ? "User" : "Vendor"}`}
          onClose={() => setAdd(null)} onSave={saveAdd}
          saveLabel={<><SaveRoundedIcon sx={{ fontSize: 14 }} /> Add</>}>
          {add === "user" ? userFields : vendorFields}
        </Modal>
      )}

      {del && (
        <Modal title="Confirm Delete" onClose={() => setDel(null)} onSave={confirmDel}
          saveLabel={<><DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} /> Delete</>} danger>
          <p className="del-msg">Are you sure you want to delete this {del.type}? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}