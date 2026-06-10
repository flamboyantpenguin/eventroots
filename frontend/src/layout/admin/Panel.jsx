import { useState, useEffect, useMemo, useCallback } from "react";

import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  FilterListOutlined,
  LogoutOutlined,
  SaveOutlined,
  StorefrontOutlined,
  SwapVertOutlined,
  PersonAddOutlined,
  HourglassBottomOutlined,
  ErrorOutlineOutlined,
  BlockOutlined,
  SettingsBackupRestoreOutlined,
  RestoreOutlined,
} from "@mui/icons-material";

import { usePanelDir } from "../../hooks/admin/usePanelDir";
import { useAuth } from "../../hooks/useAuth";

import Logo from "/src/assets/favicon.svg";

const unique = (arr, key) => [...new Set(arr?.map((x) => x[key]) || [])];

const sortArr = (arr, key) => {
  if (!key) return arr;
  const [field, dir] = key.split("-");
  return [...arr].sort((a, b) => {
    const c = (a[field] || "")
      .toString()
      .localeCompare((b[field] || "").toString());
    return dir === "asc" ? c : -c;
  });
};

function Pagination({ styles, total, page, size, onChange, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const nums = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++)
      nums.push(i);
    if (page < pages - 2) nums.push("...");
    nums.push(pages);
  }
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  return (
    <div className={styles.paginationBar}>
      <span className={styles.pgInfo}>
        {total === 0
          ? "No results"
          : `${start}–${Math.min(page * size, total)} of ${total}`}
      </span>
      <div className={styles.pgControls}>
        <button
          className={styles.pgBtn}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeftOutlined />
        </button>
        {nums.map((n, i) =>
          n === "..." ? (
            <span key={i} className={styles.pgDot}>
              …
            </span>
          ) : (
            <button
              key={n}
              className={`${styles.pgBtn} ${n === page ? styles.active : ""}`}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ),
        )}
        <button
          className={styles.pgBtn}
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
        >
          <ChevronRightOutlined />
        </button>
      </div>
      <div className={styles.pgSize}>
        <label>Rows</label>
        <select value={size} onChange={(e) => onSize(Number(e.target.value))}>
          {[10, 50, 100].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Modal({
  styles,
  title,
  onClose,
  onSave,
  saveLabel,
  danger,
  children,
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h2>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseOutlined fontSize="small" />
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button
            className={danger ? styles.btnDelete : styles.btnSave}
            onClick={onSave}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  styles,
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  select,
  options,
}) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {select ? (
        <select name={name} value={value || ""} onChange={onChange}>
          {options.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
      {error && <span className={styles.err}>{error}</span>}
    </div>
  );
}

const Panel = ({ styles }) => {
  const {
    users,
    vendors,
    isUsersLoading,
    usersError,
    loadUsers,
    loadVendors,
    saveItem,
  } = usePanelDir();

  const [tab, setTab] = useState("users");
  const { openProfile } = useAuth();

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    if (tab === "vendors" && vendors.length === 0) loadVendors();
  }, [tab, loadUsers, loadVendors, users.length, vendors.length]);

  const [uSearch, setUSearch] = useState("");
  const [uStatus, setUStatus] = useState("all");
  const [uSort, setUSort] = useState("name-asc");
  const [showUF, setShowUF] = useState(false);
  const [vSearch, setVSearch] = useState("");
  const [vCat, setVCat] = useState("all");
  const [vLoc, setVLoc] = useState("all");
  const [vSort, setVSort] = useState("name-asc");
  const [showVF, setShowVF] = useState(false);

  const [uPage, setUPage] = useState(1);
  const [uSize, setUSize] = useState(10);
  const [vPage, setVPage] = useState(1);
  const [vSize, setVSize] = useState(10);

  const [edit, setEdit] = useState(null);
  const [add, setAdd] = useState(null);
  const [switchDel, setSwitchDel] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const onForm = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      return { ...prev, [name]: value };
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const filteredUsers = useMemo(() => {
    const q = uSearch.toLowerCase();
    const filtered = users.filter((u) => {
      return (
        (u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)) &&
        (uStatus === "all" ||
          (uStatus === "active" ? u.is_active : !u.is_active))
      );
    });
    return sortArr(filtered, uSort);
  }, [users, uSearch, uStatus, uSort]);

  const filteredVendors = useMemo(() => {
    const q = vSearch.toLowerCase();
    const filtered = vendors.filter((v) => {
      return (
        (v.name?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q)) &&
        (vCat === "all" || v.category_name === vCat) &&
        (vLoc === "all" || v.location === vLoc)
      );
    });
    return sortArr(filtered, vSort);
  }, [vendors, vSearch, vCat, vLoc, vSort]);

  const uniqueCategories = useMemo(
    () => unique(vendors, "category_name"),
    [vendors],
  );
  const uniqueLocations = useMemo(() => unique(vendors, "location"), [vendors]);

  const uRows = useMemo(() => {
    return filteredUsers.slice((uPage - 1) * uSize, uPage * uSize);
  }, [filteredUsers, uPage, uSize]);

  const vRows = useMemo(() => {
    return filteredVendors.slice((vPage - 1) * vSize, vPage * vSize);
  }, [filteredVendors, vPage, vSize]);

  const saveEdit = async () => {
    const fieldToCheck = edit.type === "user" ? form.username : form.name;
    if (!fieldToCheck) {
      setErrors({
        [edit.type === "user" ? "username" : "name"]: "Name field is required",
      });
      return;
    }

    try {
      await saveItem(form.id, edit.type, form);
      setEdit(null);
    } catch (err) {
      console.error(`Component - Update targeting ${edit.type} failed:`, err);
    }
  };

  const saveAdd = async () => {
    if (add === "user" && !form.username) {
      setErrors({ username: "Username is required" });
      return;
    }
    if (add === "vendor" && !form.name) {
      setErrors({ name: "Name is required" });
      return;
    }

    try {
      await saveItem(add, form);
      setAdd(null);
    } catch (err) {
      console.error("Component - Submission failed:", err);
    }
  };

  const confirmSwitchDel = async () => {
    if (!switchDel) return;
    try {
      await saveItem(switchDel.id, switchDel.type, {
        is_active: !switchDel.is_active,
      });
      setSwitchDel(null);
    } catch (err) {
      console.error(`Component - Restore of ${switchDel.type} failed:`, err);
    }
  };

  const openEdit = (type, item) => {
    setEdit({ type, item });
    setForm({
      ...item,
      data: item.data || { contact_email: "" },
    });
    setErrors({});
  };

  const openAdd = (type) => {
    setAdd(type);
    setForm(
      type === "user"
        ? { is_active: true, username: "", email: "", password: "" }
        : { name: "", category: "", location: "", data: { contact_email: "" } },
    );
    setErrors({});
  };

  const userFields = (
    <>
      <Field
        styles={styles}
        label="Username"
        name="username"
        value={form.username || ""}
        onChange={onForm}
      />
      <Field
        styles={styles}
        label="Email Address"
        name="email"
        value={form.email || ""}
        onChange={onForm}
      />
      <Field
        styles={styles}
        label="Account Status"
        name="is_active"
        value={
          form.is_active !== undefined ? form.is_active.toString() : "true"
        }
        onChange={(e) =>
          setForm((p) => ({ ...p, is_active: e.target.value === "true" }))
        }
        select
        options={[
          ["true", "Active"],
          ["false", "Suspended / Inactive"],
        ]}
      />
      <Field
        styles={styles}
        label="Reset Password (Optional)"
        name="password"
        value={form.password || ""}
        onChange={onForm}
        placeholder="Leave blank to keep current"
      />
    </>
  );

  const vendorFields = (
    <>
      <Field
        styles={styles}
        label="Name"
        name="name"
        value={form.name || ""}
        onChange={onForm}
        placeholder="Vendor name"
        error={errors.name}
      />
      <Field
        styles={styles}
        label="Category"
        name="category"
        value={form.category || ""}
        onChange={onForm}
        placeholder="e.g. Catering"
        error={errors.category}
      />
      <Field
        styles={styles}
        label="Location"
        name="location"
        value={form.location || ""}
        onChange={onForm}
        placeholder="City"
        error={errors.location}
      />
      <Field
        styles={styles}
        label="Contact"
        name="contact"
        value={form.data?.contact_email || ""}
        onChange={onForm}
        placeholder="email"
        error={errors.contact}
      />
    </>
  );

  return (
    <>
      <div className={styles.admin}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <img src={Logo} alt="App Logo" />
          </div>
          <ul>
            {[
              ["users", "Manage Users"],
              ["vendors", "Manage Vendors"],
            ].map(([key, label]) => (
              <li
                key={key}
                className={tab === key ? styles.active : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </li>
            ))}
          </ul>
          <div className={styles.logout} onClick={openProfile}>
            <LogoutOutlined fontSize="small" /> Logout
          </div>
        </aside>

        <main className={styles.main}>
          {tab === "users" && (
            <>
              <div className={styles.topbar}>
                <div className={styles.topTitle}>
                  <h1>Manage Users </h1>
                  {isUsersLoading && (
                    <div className={`${styles.longBtn}`}>
                      <HourglassBottomOutlined />
                      Loading...
                    </div>
                  )}
                  {usersError && (
                    <div className={`${styles.longBtn} ${styles.errBdg}`}>
                      <ErrorOutlineOutlined />
                      Loading Failed!
                    </div>
                  )}
                </div>
                <div className={styles.controls}>
                  <input
                    className={styles.search}
                    placeholder="Search users…"
                    value={uSearch}
                    onChange={(e) => {
                      setUSearch(e.target.value);
                      setUPage(1);
                    }}
                  />
                  <button
                    className={`${styles.filterBtn} ${showUF ? styles.on : ""}`}
                    onClick={() => setShowUF(!showUF)}
                  >
                    <FilterListOutlined fontSize="small" /> Filter
                  </button>
                  <div className={styles.sortWrap}>
                    <SwapVertOutlined fontSize="small" />
                    <select
                      value={uSort}
                      onChange={(e) => {
                        setUSort(e.target.value);
                        setUPage(1);
                      }}
                    >
                      <option value="name-asc">Name A–Z</option>
                      <option value="name-desc">Name Z–A</option>
                    </select>
                  </div>
                </div>
              </div>

              {showUF && (
                <div className={styles.filterBar}>
                  <div className={styles.fg}>
                    <label>Status</label>
                    <select
                      value={uStatus}
                      onChange={(e) => {
                        setUStatus(e.target.value);
                        setUPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <button
                    className={styles.clearBtn}
                    onClick={() => {
                      setUStatus("all");
                      setUPage(1);
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className={styles.tableWrap}>
                <div className={styles.tscroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Last Online</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uRows.length ? (
                        uRows.map((u) => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.last_online}</td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  u.is_active ? styles.active : styles.inactive
                                }`}
                              >
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  className={`${styles.ic} ${styles.edit}`}
                                  onClick={() => openEdit("user", u)}
                                >
                                  <EditOutlined />
                                </button>
                                {u.is_active == false && (
                                  <button
                                    className={`${styles.ic} ${styles.spec}`}
                                    onClick={() =>
                                      setSwitchDel({
                                        type: "user",
                                        id: u.id,
                                        is_active: u.is_active,
                                      })
                                    }
                                  >
                                    <SettingsBackupRestoreOutlined />
                                  </button>
                                )}
                                {u.is_active == true && (
                                  <button
                                    className={`${styles.ic} ${styles.del}`}
                                    onClick={() =>
                                      setSwitchDel({
                                        type: "user",
                                        id: u.id,
                                        is_active: u.is_active,
                                      })
                                    }
                                  >
                                    <BlockOutlined />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className={styles.empty}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={styles.tfoot}>
                  <Pagination
                    styles={styles}
                    total={filteredUsers.length}
                    page={uPage}
                    size={uSize}
                    onChange={(p) => setUPage(p)}
                    onSize={(s) => {
                      setUSize(s);
                      setUPage(1);
                    }}
                  />
                </div>
              </div>
              <button className={styles.fab} onClick={() => openAdd("user")}>
                <PersonAddOutlined /> Add User
              </button>
            </>
          )}

          {tab === "vendors" && (
            <>
              <div className={styles.topbar}>
                <div className={styles.topTitle}>
                  <h1>Manage Vendors </h1>
                </div>
                <div className={styles.controls}>
                  <input
                    className={styles.search}
                    placeholder="Search vendors…"
                    value={vSearch}
                    onChange={(e) => {
                      setVSearch(e.target.value);
                      setVPage(1);
                    }}
                  />
                  <button
                    className={`${styles.filterBtn} ${showVF ? styles.on : ""}`}
                    onClick={() => setShowVF(!showVF)}
                  >
                    <FilterListOutlined fontSize="small" /> Filter
                  </button>
                  <div className={styles.sortWrap}>
                    <SwapVertOutlined fontSize="small" />
                    <select
                      value={vSort}
                      onChange={(e) => {
                        setVSort(e.target.value);
                        setVPage(1);
                      }}
                    >
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
                <div className={styles.filterBar}>
                  <div className={styles.fg}>
                    <label>Category</label>
                    <select
                      value={vCat}
                      onChange={(e) => {
                        setVCat(e.target.value);
                        setVPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      {uniqueCategories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fg}>
                    <label>Location</label>
                    <select
                      value={vLoc}
                      onChange={(e) => {
                        setVLoc(e.target.value);
                        setVPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      {uniqueLocations.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className={styles.clearBtn}
                    onClick={() => {
                      setVCat("all");
                      setVLoc("all");
                      setVPage(1);
                    }}
                  >
                    Categories Clear
                  </button>
                </div>
              )}

              <div className={styles.tableWrap}>
                <div className={styles.tscroll}>
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
                      {vRows.length ? (
                        vRows.map((v) => (
                          <tr key={v.id}>
                            <td>{v.name}</td>
                            <td>{v.category_name}</td>
                            <td>{v.location}</td>
                            <td>{v.data?.contact_email}</td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  className={`${styles.ic} ${styles.edit}`}
                                  onClick={() => setSwitchDel("vendor", v)}
                                >
                                  <EditOutlined />
                                </button>
                                <button
                                  className={`${styles.ic} ${styles.del}`}
                                  onClick={() =>
                                    setSwitchDel({ type: "vendor", id: v.id })
                                  }
                                >
                                  <DeleteOutlineOutlined />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className={styles.empty}>
                            No vendors found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={styles.tfoot}>
                  <Pagination
                    styles={styles}
                    total={filteredVendors.length}
                    page={vPage}
                    size={vSize}
                    onChange={(p) => setVPage(p)}
                    onSize={(s) => {
                      setVSize(s);
                      setVPage(1);
                    }}
                  />
                </div>
              </div>
              <button className={styles.fab} onClick={() => openAdd("vendor")}>
                <StorefrontOutlined /> Add Vendor
              </button>
            </>
          )}
        </main>

        {edit && (
          <Modal
            styles={styles}
            title={`Edit ${edit.type === "user" ? "User" : "Vendor"}`}
            onClose={() => setEdit(null)}
            onSave={saveEdit}
            saveLabel={
              <>
                <SaveOutlined /> Save
              </>
            }
          >
            {edit.type === "user" ? userFields : vendorFields}
          </Modal>
        )}

        {add && (
          <Modal
            styles={styles}
            title={`Add ${add === "user" ? "User" : "Vendor"}`}
            onClose={() => setAdd(null)}
            onSave={saveAdd}
            saveLabel={
              <>
                <SaveOutlined /> Add
              </>
            }
          >
            {add === "user" ? userFields : vendorFields}
          </Modal>
        )}

        {switchDel && (
          <Modal
            styles={styles}
            title={switchDel.is_active ? "Delete User?" : "Restore User?"}
            onClose={() => setSwitchDel(null)}
            onSave={confirmSwitchDel}
            saveLabel={
              <>
                {switchDel.is_active ? (
                  <>
                    <DeleteOutlineOutlined /> Delete
                  </>
                ) : (
                  <>
                    <RestoreOutlined /> Restore
                  </>
                )}
              </>
            }
            danger
          >
            <p className={styles.delMsg}>
              {form.is_active ? (
                <>Are you sure you want to delete this {switchDel.type}?</>
              ) : (
                <>Are you sure you want to restore this {switchDel.type}?</>
              )}
            </p>
          </Modal>
        )}
      </div>
    </>
  );
};

export default Panel;
