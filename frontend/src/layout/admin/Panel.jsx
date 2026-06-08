import { useState, useEffect } from "react";
import { usePanelDir } from "../../hooks/admin/usePanelDir";
import { useAuth } from "../../hooks/useAuth";
import {
  ChevronLeftOutlined, ChevronRightOutlined, CloseOutlined,
  EditOutlined, FilterListOutlined, LogoutOutlined, SaveOutlined,
  StorefrontOutlined, SwapVertOutlined, BlockOutlined,
  CheckCircleOutlineOutlined,
} from "@mui/icons-material";
import "../../pages/admin/Admin.css";

const unique  = (arr, key) => [...new Set(arr.map(x => x[key]))];
const sortArr = (arr, key) => {
  const [f, d] = key.split("-");
  return [...arr].sort((a, b) => (a[f]||"").localeCompare(b[f]||"") * (d==="asc"?1:-1));
};

function Pagination({ total, page, size, onChange, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const nums = pages <= 7
    ? Array.from({ length: pages }, (_, i) => i + 1)
    : [1, ...(page>3?["..."]:[] ), ...Array.from({length:3},(_,i)=>Math.max(2,page-1)+i).filter(n=>n>1&&n<pages), ...(page<pages-2?["..."]:[] ), pages];
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  return (
    <div className="pagination-bar">
      <span className="pg-info">{total===0?"No results":`${start}–${Math.min(page*size,total)} of ${total}`}</span>
      <div className="pg-controls">
        <button className="pg-btn" onClick={()=>onChange(page-1)} disabled={page===1}><ChevronLeftOutlined sx={{fontSize:16}}/></button>
        {nums.map((n,i) => n==="..." ? <span key={i} className="pg-dot">…</span> :
          <button key={n} className={`pg-btn${n===page?" active":""}`} onClick={()=>onChange(n)}>{n}</button>)}
        <button className="pg-btn" onClick={()=>onChange(page+1)} disabled={page===pages}><ChevronRightOutlined sx={{fontSize:16}}/></button>
      </div>
      <div className="pg-size">
        <label>Rows</label>
        <select value={size} onChange={e=>onSize(Number(e.target.value))}>
          {[10,50,100].map(n=><option key={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSave, saveLabel, danger, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}><CloseOutlined fontSize="small"/></button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className={danger?"btn-danger":"btn-save"} onClick={onSave}>{saveLabel}</button>
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
        ? <select name={name} value={value||""} onChange={onChange}>{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select>
        : <input name={name} value={value||""} onChange={onChange} placeholder={placeholder}/>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export default function Panel() {
  const { users, vendors, loadUsers, loadVendors, saveItem, toggleUserStatus, toggleVendorStatus } = usePanelDir();
  const { logout } = useAuth();

  const [tab, setTab]       = useState("users");
  const [edit, setEdit]     = useState(null);
  const [add, setAdd]       = useState(null);
  const [toggle, setToggle] = useState(null);
  const [form, setForm]     = useState({});
  const [errors, setErrors] = useState({});

  const [uSearch,setUSearch]=useState(""); const [uStatus,setUStatus]=useState("all"); const [uEvent,setUEvent]=useState("all"); const [uSort,setUSort]=useState("name-asc"); const [showUF,setShowUF]=useState(false);
  const [vSearch,setVSearch]=useState(""); const [vCat,setVCat]=useState("all");       const [vLoc,setVLoc]=useState("all");     const [vSort,setVSort]=useState("name-asc"); const [showVF,setShowVF]=useState(false);
  const [uPage,setUPage]=useState(1); const [uSize,setUSize]=useState(10);
  const [vPage,setVPage]=useState(1); const [vSize,setVSize]=useState(10);

  useEffect(() => {
    if (tab==="users"   && !users.length)   loadUsers();
    if (tab==="vendors" && !vendors.length) loadVendors();
  }, [tab]);

  const onForm = e => {
    const { name, value } = e.target;
    setForm(p => name==="contact" ? {...p, data:{...p.data, contact_email:value}} : {...p, [name]:value});
    setErrors(p => ({...p, [name]:""}));
  };

  const fUsers = sortArr((users||[]).filter(u => {
    const q = uSearch.toLowerCase();
    return (u.username?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q))
      && (uStatus==="all"||u.status===uStatus) && (uEvent==="all"||u.event===uEvent);
  }), uSort);

  const fVendors = sortArr((vendors||[]).filter(v => {
    const q = vSearch.toLowerCase();
    return (v.name?.toLowerCase().includes(q)||v.location?.toLowerCase().includes(q))
      && (vCat==="all"||v.category===vCat) && (vLoc==="all"||v.location===vLoc);
  }), vSort);

  const uRows = fUsers.slice((uPage-1)*uSize, uPage*uSize);
  const vRows = fVendors.slice((vPage-1)*vSize, vPage*vSize);

  const doEdit   = async () => { try { await saveItem(edit.type, form); setEdit(null); } catch(e) { console.error(e); } };
  const doAdd    = async () => { if (!form.name) return setErrors({name:"Required"}); try { await saveItem(add,form); setAdd(null); } catch(e) { console.error(e); } };
  const doToggle = async () => { try { toggle.type==="user" ? await toggleUserStatus(toggle.id,toggle.active) : await toggleVendorStatus(toggle.id,toggle.active); setToggle(null); } catch(e) { console.error(e); } };

  const openEdit   = (type,item) => { setEdit({type}); setForm({...item, data:item.data||{contact_email:""}}); setErrors({}); };
  const openAdd    = type => { setAdd(type); setForm(type==="user"?{status:"active"}:{data:{contact_email:""}}); setErrors({}); };
  const openToggle = (type,item) => setToggle({type, id:item.id, name:item.username||item.name, active:item.is_active??item.status});

  const userFields = <>
    <Field label="Username" name="username" value={form.username} onChange={onForm} placeholder="Username"         error={errors.username}/>
    <Field label="Email"    name="email"    value={form.email}    onChange={onForm} placeholder="email@example.com" error={errors.email}/>
    <Field label="Status"   name="status"   value={form.status}   onChange={onForm} select options={[["active","Active"],["inactive","Inactive"]]}/>
  </>;

  const vendorFields = <>
    <Field label="Name"     name="name"     value={form.name}               onChange={onForm} placeholder="Vendor name"     error={errors.name}/>
    <Field label="Category" name="category" value={form.category}           onChange={onForm} placeholder="e.g. Catering"  error={errors.category}/>
    <Field label="Location" name="location" value={form.location}           onChange={onForm} placeholder="City"            error={errors.location}/>
    <Field label="Contact"  name="contact"  value={form.data?.contact_email||""} onChange={onForm} placeholder="email"    error={errors.contact}/>
  </>;

  const SideBar = (
    <aside className="sidebar">
      <h2>EventRoots</h2>
      <ul>
        {[["users","Manage Users"],["vendors","Manage Vendors"]].map(([k,l])=>(
          <li key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</li>
        ))}
      </ul>
      <div className="logout" onClick={async()=>{try{await logout();window.location.href="/admin";}catch(e){console.error(e);}}}>
        <LogoutOutlined fontSize="small"/> Logout
      </div>
    </aside>
  );

  return (
    <div className="admin">
      {SideBar}
      <div className="main-wrapper">

        {/* ── USERS ── */}
        {tab==="users" && <main className="main">
          <div className="topbar">
            <h1>Manage Users</h1>
            <div className="controls">
              <input className="search" placeholder="Search users…" value={uSearch} onChange={e=>{setUSearch(e.target.value);setUPage(1);}}/>
              <button className={`filter-btn${showUF?" on":""}`} onClick={()=>setShowUF(p=>!p)}><FilterListOutlined fontSize="small"/> Filter</button>
              <div className="sort-wrap"><SwapVertOutlined fontSize="small"/>
                <select value={uSort} onChange={e=>{setUSort(e.target.value);setUPage(1);}}>
                  <option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>
                  <option value="event-asc">Event A–Z</option><option value="event-desc">Event Z–A</option>
                </select>
              </div>
            </div>
          </div>
          {showUF && <div className="filter-bar">
            <div className="fg"><label>Status</label>
              <select value={uStatus} onChange={e=>{setUStatus(e.target.value);setUPage(1);}}>
                <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="fg"><label>Event</label>
              <select value={uEvent} onChange={e=>{setUEvent(e.target.value);setUPage(1);}}>
                <option value="all">All</option>{unique(users,"event").map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
            <button className="clear-btn" onClick={()=>{setUStatus("all");setUEvent("all");setUPage(1);}}>Clear</button>
          </div>}
          <div className="table-wrap">
            <div className="tscroll"><table>
              <thead><tr><th>Name</th><th>Email</th><th>Last Online</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {uRows.length ? uRows.map(u=>(
                  <tr key={u.id}>
                    <td>{u.username}</td><td>{u.email}</td><td>{u.last_online}</td>
                    <td><span className={`badge ${u.is_active?"active":"inactive"}`}>{u.is_active?"Active":"Inactive"}</span></td>
                    <td><div className="actions">
                      <button className="ic edit" title="Edit" onClick={()=>openEdit("user",u)}><EditOutlined sx={{fontSize:16}}/></button>
                      <button className={`ic ${u.is_active?"deactivate":"activate"}`} title={u.is_active?"Deactivate":"Activate"} onClick={()=>openToggle("user",u)}>
                        {u.is_active?<BlockOutlined sx={{fontSize:16}}/>:<CheckCircleOutlineOutlined sx={{fontSize:16}}/>}
                      </button>
                    </div></td>
                  </tr>
                )) : <tr><td colSpan="5" className="empty">No users found.</td></tr>}
              </tbody>
            </table></div>
            <div className="tfoot"><Pagination total={fUsers.length} page={uPage} size={uSize} onChange={setUPage} onSize={s=>{setUSize(s);setUPage(1);}}/></div>
          </div>
        </main>}

        {/* ── VENDORS ── */}
        {tab==="vendors" && <main className="main">
          <div className="topbar">
            <h1>Manage Vendors</h1>
            <div className="controls">
              <input className="search" placeholder="Search vendors…" value={vSearch} onChange={e=>{setVSearch(e.target.value);setVPage(1);}}/>
              <button className={`filter-btn${showVF?" on":""}`} onClick={()=>setShowVF(p=>!p)}><FilterListOutlined fontSize="small"/> Filter</button>
              <div className="sort-wrap"><SwapVertOutlined fontSize="small"/>
                <select value={vSort} onChange={e=>{setVSort(e.target.value);setVPage(1);}}>
                  <option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>
                  <option value="category-asc">Category A–Z</option><option value="category-desc">Category Z–A</option>
                  <option value="location-asc">Location A–Z</option><option value="location-desc">Location Z–A</option>
                </select>
              </div>
            </div>
          </div>
          {showVF && <div className="filter-bar">
            <div className="fg"><label>Category</label>
              <select value={vCat} onChange={e=>{setVCat(e.target.value);setVPage(1);}}>
                <option value="all">All</option>{unique(vendors,"category").map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg"><label>Location</label>
              <select value={vLoc} onChange={e=>{setVLoc(e.target.value);setVPage(1);}}>
                <option value="all">All</option>{unique(vendors,"location").map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <button className="clear-btn" onClick={()=>{setVCat("all");setVLoc("all");setVPage(1);}}>Clear</button>
          </div>}
          <div className="table-wrap">
            <div className="tscroll"><table>
              <thead><tr><th>Vendor</th><th>Category</th><th>Location</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {vRows.length ? vRows.map(v=>(
                  <tr key={v.id}>
                    <td>{v.name}</td><td>{v.category}</td><td>{v.location}</td><td>{v.data?.contact_email}</td>
                    <td><span className={`badge ${v.is_active?"active":"inactive"}`}>{v.is_active?"Active":"Inactive"}</span></td>
                    <td><div className="actions">
                      <button className="ic edit" title="Edit" onClick={()=>openEdit("vendor",v)}><EditOutlined sx={{fontSize:16}}/></button>
                      <button className={`ic ${v.is_active?"deactivate":"activate"}`} title={v.is_active?"Deactivate":"Activate"} onClick={()=>openToggle("vendor",v)}>
                        {v.is_active?<BlockOutlined sx={{fontSize:16}}/>:<CheckCircleOutlineOutlined sx={{fontSize:16}}/>}
                      </button>
                    </div></td>
                  </tr>
                )) : <tr><td colSpan="6" className="empty">No vendors found.</td></tr>}
              </tbody>
            </table></div>
            <div className="tfoot"><Pagination total={fVendors.length} page={vPage} size={vSize} onChange={setVPage} onSize={s=>{setVSize(s);setVPage(1);}}/></div>
          </div>
          <button className="fab" onClick={()=>openAdd("vendor")}><StorefrontOutlined sx={{fontSize:18}}/> Add Vendor</button>
        </main>}
      </div>

      {edit && <Modal title={`Edit ${edit.type==="user"?"User":"Vendor"}`} onClose={()=>setEdit(null)} onSave={doEdit} saveLabel={<><SaveOutlined sx={{fontSize:14}}/> Save</>}>
        {edit.type==="user" ? userFields : vendorFields}
      </Modal>}

      {add && <Modal title={`Add ${add==="user"?"User":"Vendor"}`} onClose={()=>setAdd(null)} onSave={doAdd} saveLabel={<><SaveOutlined sx={{fontSize:14}}/> Add</>}>
        {add==="user" ? userFields : vendorFields}
      </Modal>}

      {toggle && <Modal title={toggle.active?"Deactivate?":"Activate?"} onClose={()=>setToggle(null)} onSave={doToggle} danger={!!toggle.active}
        saveLabel={toggle.active?<><BlockOutlined sx={{fontSize:14}}/> Deactivate</>:<><CheckCircleOutlineOutlined sx={{fontSize:14}}/> Activate</>}>
        <p className="del-msg">{toggle.active
          ?`Deactivate "${toggle.name}"? They lose access but can be reactivated anytime.`
          :`Activate "${toggle.name}"? They will regain access immediately.`}
        </p>
      </Modal>}
    </div>
  );
}