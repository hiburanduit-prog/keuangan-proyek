import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, ListChecks, FolderKanban, BarChart3,
  Plus, Trash2, Pencil, Download, Printer, Wallet,
  TrendingUp, TrendingDown, X, AlertTriangle,
} from "lucide-react";

const COLORS = {
  bg: "#EEF3F2",
  surface: "#FFFFFF",
  ink: "#1B2B34",
  inkMuted: "#5C6B71",
  border: "#D7E0DE",
  accent: "#1F5673",
  accentSoft: "#DCE8EC",
  amber: "#C97D2B",
  amberSoft: "#F4E4D0",
  green: "#3F7A55",
  greenSoft: "#DDEBE1",
  red: "#A13D3D",
  redSoft: "#F3DEDE",
};

const CATEGORY_PALETTE = ["#1F5673", "#C97D2B", "#3F7A55", "#A13D3D", "#6B5B95", "#5C6B71", "#2E7D8C"];

const DEFAULT_CATEGORIES = [
  { id: "cat-material", name: "Material", type: "keluar" },
  { id: "cat-tenaga", name: "Tenaga kerja", type: "keluar" },
  { id: "cat-sewa", name: "Sewa alat", type: "keluar" },
  { id: "cat-transport", name: "Transportasi", type: "keluar" },
  { id: "cat-admin", name: "Administrasi", type: "keluar" },
  { id: "cat-lain-keluar", name: "Lain-lain", type: "keluar" },
  { id: "cat-termin", name: "Termin proyek", type: "masuk" },
  { id: "cat-talangan", name: "Dana talangan", type: "masuk" },
  { id: "cat-lain-masuk", name: "Lain-lain", type: "masuk" },
];

const STORAGE_KEY = "buku-kas-data";
const USERS_STORAGE_KEY = "buku-kas-users";
const SESSION_KEY = "buku-kas-session";
const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "Administrator" },
  { username: "staff", password: "staff123", role: "staff", name: "Staff Lapangan" }
];
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.round(n || 0));

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return d;
  }
};

const monoStyle = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontVariantNumeric: "tabular-nums" };
const headingFont = { fontFamily: "'Space Grotesk', sans-serif" };

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: "1px solid " + COLORS.border,
  borderRadius: 6,
  background: "#fff",
  color: COLORS.ink,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: COLORS.inkMuted, display: "block", marginBottom: 5 };
const cardStyle = { background: COLORS.surface, borderRadius: 10, border: "1px solid " + COLORS.border, padding: 16 };

const buttonPrimary = {
  background: COLORS.accent, color: "#fff", border: "none", borderRadius: 6,
  padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};

const buttonGhost = {
  background: "transparent", color: COLORS.accent, border: "1px solid " + COLORS.accent,
  borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};

const iconButton = {
  background: "transparent", border: "none", cursor: "pointer", padding: 6,
  borderRadius: 6, display: "inline-flex", color: COLORS.inkMuted,
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transaksi", label: "Transaksi", icon: ListChecks },
  { id: "proyek", label: "Proyek & kategori", icon: FolderKanban },
  { id: "laporan", label: "Laporan", icon: BarChart3 },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [data, setData] = useState({ projects: [], categories: DEFAULT_CATEGORIES, transactions: [] });
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // 1. Seed or load user database
        let storedUsersRes = await window.storage.get(USERS_STORAGE_KEY);
        let currentUsersList = DEFAULT_USERS;
        if (storedUsersRes && storedUsersRes.value) {
          currentUsersList = JSON.parse(storedUsersRes.value);
        } else {
          await window.storage.set(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        }
        setUsers(currentUsersList);

        // 2. Retrieve active session
        const cachedUser = localStorage.getItem(SESSION_KEY);
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
        }

        // 3. Load project data
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          const next = {
            projects: parsed.projects || [],
            categories: parsed.categories && parsed.categories.length ? parsed.categories : DEFAULT_CATEGORIES,
            transactions: parsed.transactions || [],
          };
          setData(next);
          if (next.projects.length) setSelectedProjectId(next.projects[0].id);
        }
      } catch (e) {
        // belum ada data tersimpan, pakai default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = (username, password) => {
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true };
    }
    return { success: false, message: "Username atau password salah." };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const persist = async (next) => {
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(next));
      setSaveError(!result);
    } catch (e) {
      setSaveError(true);
    }
  };

  const updateData = (next) => {
    setData(next);
    persist(next);
  };

  const addOrUpdateProject = (project) => {
    let nextProjects;
    if (project.id) {
      nextProjects = data.projects.map((p) => (p.id === project.id ? project : p));
    } else {
      const newProject = { ...project, id: uid() };
      nextProjects = [...data.projects, newProject];
      setSelectedProjectId(newProject.id);
    }
    updateData({ ...data, projects: nextProjects });
  };

  const deleteProject = (id) => {
    if (!window.confirm("Hapus proyek ini beserta seluruh transaksinya?")) return;
    const nextProjects = data.projects.filter((p) => p.id !== id);
    const nextTransactions = data.transactions.filter((t) => t.projectId !== id);
    updateData({ ...data, projects: nextProjects, transactions: nextTransactions });
    if (selectedProjectId === id) {
      setSelectedProjectId(nextProjects.length ? nextProjects[0].id : null);
    }
  };

  const addCategory = (cat) => {
    updateData({ ...data, categories: [...data.categories, { ...cat, id: uid() }] });
  };

  const deleteCategory = (id) => {
    if (!window.confirm("Hapus kategori ini?")) return;
    updateData({ ...data, categories: data.categories.filter((c) => c.id !== id) });
  };

  const addTransaction = (tx) => {
    updateData({ ...data, transactions: [...data.transactions, { ...tx, id: uid() }] });
  };

  const deleteTransaction = (id) => {
    if (!window.confirm("Hapus transaksi ini?")) return;
    updateData({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });
  };

  const resetAll = () => {
    if (!window.confirm("Hapus SEMUA data proyek, kategori, dan transaksi? Tindakan ini tidak bisa dibatalkan.")) return;
    const next = { projects: [], categories: DEFAULT_CATEGORIES, transactions: [] };
    updateData(next);
    setSelectedProjectId(null);
  };

  const selectedProject = data.projects.find((p) => p.id === selectedProjectId) || null;

  const projectTransactions = useMemo(
    () => data.transactions.filter((t) => t.projectId === selectedProjectId),
    [data.transactions, selectedProjectId]
  );

  const totals = useMemo(() => {
    let masuk = 0, keluar = 0;
    projectTransactions.forEach((t) => {
      if (t.type === "masuk") masuk += t.amount; else keluar += t.amount;
    });
    return { masuk, keluar, saldo: masuk - keluar };
  }, [projectTransactions]);

  const budgetPct = selectedProject && selectedProject.budget
    ? Math.round((totals.keluar / selectedProject.budget) * 100)
    : 0;

  const categoryBreakdown = useMemo(() => {
    const map = {};
    projectTransactions.filter((t) => t.type === "keluar").forEach((t) => {
      const cat = data.categories.find((c) => c.id === t.categoryId);
      const name = cat ? cat.name : "Lainnya";
      map[name] = (map[name] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [projectTransactions, data.categories]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    projectTransactions.forEach((t) => {
      const key = (t.date || "").slice(0, 7);
      if (!key) return;
      if (!map[key]) map[key] = { key, masuk: 0, keluar: 0 };
      if (t.type === "masuk") map[key].masuk += t.amount; else map[key].keluar += t.amount;
    });
    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((m) => ({ ...m, label: new Date(m.key + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }) }));
  }, [projectTransactions]);

  const recentTransactions = useMemo(
    () => [...projectTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [projectTransactions]
  );

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.inkMuted, borderRadius: 12, border: "1px solid " + COLORS.border }}>
        Memuat data...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: COLORS.bg, color: COLORS.ink, minHeight: 600, borderRadius: 12, overflow: "hidden", border: "1px solid " + COLORS.border }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');"}</style>

      <div style={{ background: COLORS.accent, color: "#fff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ ...headingFont, fontSize: 20, fontWeight: 700, margin: 0 }}>Buku kas proyek</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>Pencatatan keuangan proyek konstruksi</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{currentUser.name}</p>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.75, textTransform: "capitalize" }}>{currentUser.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              background: "rgba(255, 255, 255, 0.15)", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6, 
              padding: "6px 12px", 
              fontSize: 12, 
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.25)"}
            onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.15)"}
          >
            Logout
          </button>
        </div>
      </div>

      {saveError && (
        <div style={{ background: COLORS.redSoft, color: COLORS.red, padding: "8px 24px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={14} /> Gagal menyimpan perubahan. Coba lagi.
        </div>
      )}

      <div style={{ display: "flex", gap: 4, padding: "0 20px", borderBottom: "1px solid " + COLORS.border, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                color: active ? COLORS.accent : COLORS.inkMuted,
                background: active ? COLORS.surface : "transparent",
                border: "none",
                borderTop: active ? "3px solid " + COLORS.accent : "3px solid transparent",
                borderRadius: "8px 8px 0 0", cursor: "pointer", marginBottom: -1,
              }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 24 }}>
        {activeTab === "proyek" ? (
          <ProyekTab
            data={data}
            currentUser={currentUser}
            addOrUpdateProject={addOrUpdateProject}
            deleteProject={deleteProject}
            addCategory={addCategory}
            deleteCategory={deleteCategory}
            onResetAll={resetAll}
          />
        ) : data.projects.length === 0 ? (
          <EmptyProjectState onGo={() => setActiveTab("proyek")} />
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardTab
                data={data} selectedProject={selectedProject} selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId} totals={totals} budgetPct={budgetPct}
                categoryBreakdown={categoryBreakdown} monthlyTrend={monthlyTrend} recentTransactions={recentTransactions}
                onGoTransaksi={() => setActiveTab("transaksi")}
              />
            )}
            {activeTab === "transaksi" && (
              <TransaksiTab
                data={data} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId}
                projectTransactions={projectTransactions} addTransaction={addTransaction} deleteTransaction={deleteTransaction}
              />
            )}
            {activeTab === "laporan" && <LaporanTab data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyProjectState({ onGo }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.inkMuted }}>
      <FolderKanban size={36} style={{ margin: "0 auto 12px", color: COLORS.accent, display: "block" }} />
      <p style={{ ...headingFont, fontSize: 16, fontWeight: 600, color: COLORS.ink, margin: "0 0 6px" }}>Belum ada proyek</p>
      <p style={{ fontSize: 14, margin: "0 0 16px" }}>Tambahkan proyek pertama untuk mulai mencatat keuangan.</p>
      <button style={buttonPrimary} onClick={onGo}><Plus size={15} /> Tambah proyek</button>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "Aktif";
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
      background: active ? COLORS.greenSoft : COLORS.bg,
      color: active ? COLORS.green : COLORS.inkMuted,
    }}>{status}</span>
  );
}

function ProjectSwitcher({ data, selectedProjectId, setSelectedProjectId, selectedProject }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      <select value={selectedProjectId || ""} onChange={(e) => setSelectedProjectId(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 220, fontWeight: 600 }}>
        {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {selectedProject && <StatusBadge status={selectedProject.status} />}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div style={cardStyle}>
      <p style={{ fontSize: 12, color: COLORS.inkMuted, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={14} /> {label}
      </p>
      <p style={{ ...monoStyle, fontSize: 19, fontWeight: 700, margin: 0, color: color || COLORS.ink }}>{value}</p>
    </div>
  );
}

function LedgerRow({ t, data, onDelete }) {
  const cat = data.categories.find((c) => c.id === t.categoryId);
  const isMasuk = t.type === "masuk";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 12px", borderLeft: "3px solid " + (isMasuk ? COLORS.green : COLORS.red),
      background: COLORS.bg, borderRadius: 6,
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{t.description || (cat ? cat.name : "Tanpa keterangan")}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: COLORS.inkMuted }}>{formatDate(t.date)} · {cat ? cat.name : "Lainnya"}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...monoStyle, fontSize: 13, fontWeight: 700, color: isMasuk ? COLORS.green : COLORS.red }}>
          {isMasuk ? "+" : "-"}{formatRupiah(t.amount)}
        </span>
        {onDelete && (
          <button style={iconButton} onClick={() => onDelete(t.id)} aria-label="Hapus transaksi"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ data, selectedProject, selectedProjectId, setSelectedProjectId, totals, budgetPct, categoryBreakdown, monthlyTrend, recentTransactions, onGoTransaksi }) {
  const progressColor = budgetPct >= 100 ? COLORS.red : budgetPct >= 80 ? COLORS.amber : COLORS.accent;
  const hasBudget = selectedProject && selectedProject.budget > 0;

  return (
    <div>
      <ProjectSwitcher data={data} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} selectedProject={selectedProject} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard icon={TrendingUp} label="Pemasukan" value={formatRupiah(totals.masuk)} color={COLORS.green} />
        <MetricCard icon={TrendingDown} label="Pengeluaran" value={formatRupiah(totals.keluar)} color={COLORS.red} />
        <MetricCard icon={Wallet} label="Saldo" value={formatRupiah(totals.saldo)} />
        <MetricCard icon={BarChart3} label="Anggaran terpakai" value={budgetPct + "%"} color={progressColor} />
      </div>

      {hasBudget && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.inkMuted, marginBottom: 6 }}>
            <span>Anggaran terpakai</span>
            <span style={monoStyle}>{formatRupiah(totals.keluar)} dari {formatRupiah(selectedProject.budget)}</span>
          </div>
          <div style={{ height: 8, background: COLORS.bg, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: Math.min(100, budgetPct) + "%", height: "100%", background: progressColor, borderRadius: 99 }} />
          </div>
          {budgetPct >= 100 && (
            <p style={{ fontSize: 12, color: COLORS.red, margin: "8px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={12} /> Pengeluaran sudah melebihi anggaran.
            </p>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 12, marginBottom: 16 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Pengeluaran per kategori</p>
          {categoryBreakdown.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.inkMuted }}>Belum ada data pengeluaran.</p>
          ) : (
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 6 }}>
                {categoryBreakdown.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.inkMuted }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block" }} />
                      {c.name}
                    </span>
                    <span style={monoStyle}>{formatRupiah(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Tren bulanan</p>
          {monthlyTrend.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.inkMuted }}>Belum ada data transaksi.</p>
          ) : (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.inkMuted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.inkMuted }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => formatRupiah(v)} />
                  <Bar dataKey="masuk" fill={COLORS.green} radius={[3, 3, 0, 0]} name="Pemasukan" />
                  <Bar dataKey="keluar" fill={COLORS.red} radius={[3, 3, 0, 0]} name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Transaksi terbaru</p>
          <button style={{ ...buttonGhost, padding: "6px 12px", fontSize: 12 }} onClick={onGoTransaksi}><Plus size={13} /> Tambah</button>
        </div>
        {recentTransactions.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkMuted }}>Belum ada transaksi untuk proyek ini.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentTransactions.map((t) => <LedgerRow key={t.id} t={t} data={data} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TransaksiTab({ data, selectedProjectId, setSelectedProjectId, projectTransactions, addTransaction, deleteTransaction }) {
  const [type, setType] = useState("keluar");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const availableCategories = data.categories.filter((c) => c.type === type);
  const selectedProject = data.projects.find((p) => p.id === selectedProjectId) || null;

  const handleSubmit = () => {
    const amt = Number(amount);
    if (!selectedProjectId) { setError("Pilih proyek terlebih dahulu."); return; }
    if (!date) { setError("Tanggal wajib diisi."); return; }
    if (!categoryId) { setError("Pilih kategori."); return; }
    if (!amt || amt <= 0) { setError("Jumlah harus lebih dari 0."); return; }
    setError("");
    addTransaction({ projectId: selectedProjectId, type, date, categoryId, amount: amt, description: description.trim() });
    setAmount("");
    setDescription("");
  };

  const sortedTransactions = [...projectTransactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <ProjectSwitcher data={data} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} selectedProject={selectedProject} />

      <div style={{ ...cardStyle, marginBottom: 20, maxWidth: 480 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => { setType("keluar"); setCategoryId(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: type === "keluar" ? COLORS.redSoft : COLORS.bg, color: type === "keluar" ? COLORS.red : COLORS.inkMuted }}>Pengeluaran</button>
          <button onClick={() => { setType("masuk"); setCategoryId(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: type === "masuk" ? COLORS.greenSoft : COLORS.bg, color: type === "masuk" ? COLORS.green : COLORS.inkMuted }}>Pemasukan</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
              <option value="">Pilih kategori</option>
              {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Jumlah (Rp)</label>
          <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Keterangan</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Semen 50 sak" style={inputStyle} />
        </div>

        {error && <p style={{ fontSize: 12, color: COLORS.red, margin: "0 0 10px" }}>{error}</p>}

        <button style={{ ...buttonPrimary, width: "100%", justifyContent: "center" }} onClick={handleSubmit}>
          <Plus size={15} /> Simpan transaksi
        </button>
      </div>

      <div style={cardStyle}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Semua transaksi proyek ini</p>
        {sortedTransactions.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkMuted }}>Belum ada transaksi.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedTransactions.map((t) => <LedgerRow key={t.id} t={t} data={data} onDelete={deleteTransaction} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProyekTab({ data, currentUser, addOrUpdateProject, deleteProject, addCategory, deleteCategory, onResetAll }) {
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [error, setError] = useState("");

  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("keluar");

  const startEdit = (p) => {
    setEditingProject(p.id);
    setName(p.name); setBudget(String(p.budget || "")); setStartDate(p.startDate || ""); setEndDate(p.endDate || ""); setStatus(p.status || "Aktif");
  };

  const resetForm = () => {
    setEditingProject(null); setName(""); setBudget(""); setStartDate(""); setEndDate(""); setStatus("Aktif"); setError("");
  };

  const handleSubmitProject = () => {
    if (!name.trim()) { setError("Nama proyek wajib diisi."); return; }
    setError("");
    addOrUpdateProject({ id: editingProject, name: name.trim(), budget: Number(budget) || 0, startDate, endDate, status });
    resetForm();
  };

  const handleAddCategory = () => {
    if (!catName.trim()) return;
    addCategory({ name: catName.trim(), type: catType });
    setCatName("");
  };

  const isAdmin = currentUser && currentUser.role === "admin";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))", gap: 16 }}>
        <div>
          <p style={{ ...headingFont, fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>Daftar proyek</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {data.projects.length === 0 && <p style={{ fontSize: 13, color: COLORS.inkMuted }}>Belum ada proyek.</p>}
            {data.projects.map((p) => (
              <div key={p.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.inkMuted, ...monoStyle }}>Anggaran: {formatRupiah(p.budget)}</p>
                  <div style={{ marginTop: 6 }}><StatusBadge status={p.status} /></div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {isAdmin && (
                    <>
                      <button style={iconButton} onClick={() => startEdit(p)} aria-label="Edit proyek"><Pencil size={15} /></button>
                      <button style={iconButton} onClick={() => deleteProject(p.id)} aria-label="Hapus proyek"><Trash2 size={15} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdmin ? (
            <div style={cardStyle}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>{editingProject ? "Edit proyek" : "Tambah proyek baru"}</p>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Nama proyek</label>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Renovasi Gudang B" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Anggaran total (Rp)</label>
                <input type="number" min="0" style={inputStyle} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Tanggal mulai</label>
                  <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal selesai</label>
                  <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Aktif">Aktif</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
              {error && <p style={{ fontSize: 12, color: COLORS.red, margin: "0 0 10px" }}>{error}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...buttonPrimary, flex: 1, justifyContent: "center" }} onClick={handleSubmitProject}>
                  {editingProject ? "Simpan perubahan" : <><Plus size={15} /> Tambah proyek</>}
                </button>
                {editingProject && <button style={buttonGhost} onClick={resetForm}><X size={14} /></button>}
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, background: "rgba(0,0,0,0.02)", borderStyle: "dashed", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100, textAlign: "center", color: COLORS.inkMuted }}>
              <div>
                <AlertTriangle size={20} style={{ margin: "0 auto 8px", color: COLORS.amber, display: "block" }} />
                <p style={{ margin: 0, fontSize: 12 }}>Hanya Administrator yang dapat mengelola proyek baru atau mengedit data proyek.</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <p style={{ ...headingFont, fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>Kategori</p>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkMuted, margin: "0 0 8px" }}>Kategori pengeluaran</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.categories.filter((c) => c.type === "keluar").map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid " + COLORS.bg }}>
                  {c.name}
                  {isAdmin && (
                    <button style={iconButton} onClick={() => deleteCategory(c.id)} aria-label="Hapus kategori"><Trash2 size={13} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkMuted, margin: "0 0 8px" }}>Kategori pemasukan</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.categories.filter((c) => c.type === "masuk").map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid " + COLORS.bg }}>
                  {c.name}
                  {isAdmin && (
                    <button style={iconButton} onClick={() => deleteCategory(c.id)} aria-label="Hapus kategori"><Trash2 size={13} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isAdmin ? (
            <div style={cardStyle}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Tambah kategori</p>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Nama kategori</label>
                <input style={inputStyle} value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Contoh: Konsumsi" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Jenis</label>
                <select style={inputStyle} value={catType} onChange={(e) => setCatType(e.target.value)}>
                  <option value="keluar">Pengeluaran</option>
                  <option value="masuk">Pemasukan</option>
                </select>
              </div>
              <button style={{ ...buttonPrimary, width: "100%", justifyContent: "center" }} onClick={handleAddCategory}><Plus size={15} /> Tambah kategori</button>
            </div>
          ) : (
            <div style={{ ...cardStyle, background: "rgba(0,0,0,0.02)", borderStyle: "dashed", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100, textAlign: "center", color: COLORS.inkMuted }}>
              <div>
                <AlertTriangle size={20} style={{ margin: "0 auto 8px", color: COLORS.amber, display: "block" }} />
                <p style={{ margin: 0, fontSize: 12 }}>Hanya Administrator yang dapat mengelola kategori transaksi.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <button style={{ ...buttonGhost, borderColor: COLORS.red, color: COLORS.red }} onClick={onResetAll}>
            <Trash2 size={14} /> Hapus semua data
          </button>
        </div>
      )}
    </div>
  );
}

function LaporanTab({ data }) {
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = useMemo(() => {
    return data.transactions.filter((t) => {
      if (filterProjectId !== "all" && t.projectId !== filterProjectId) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, filterProjectId, dateFrom, dateTo, filterType]);

  const summary = useMemo(() => {
    let masuk = 0, keluar = 0;
    filtered.forEach((t) => {
      if (t.type === "masuk") masuk += t.amount; else keluar += t.amount;
    });
    return { masuk, keluar, saldo: masuk - keluar };
  }, [filtered]);

  const exportCSV = () => {
    const rows = [["Tanggal", "Proyek", "Jenis", "Kategori", "Jumlah", "Keterangan"]];
    filtered.forEach((t) => {
      const proj = data.projects.find((p) => p.id === t.projectId);
      const cat = data.categories.find((c) => c.id === t.categoryId);
      rows.push([t.date, proj ? proj.name : "", t.type === "masuk" ? "Pemasukan" : "Pengeluaran", cat ? cat.name : "", t.amount, t.description || ""]);
    });
    const csv = rows.map((r) => r.map((f) => '"' + String(f).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "laporan-keuangan-proyek.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Proyek</label>
            <select style={inputStyle} value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)}>
              <option value="all">Semua proyek</option>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Dari tanggal</label>
            <input type="date" style={inputStyle} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Sampai tanggal</label>
            <input type="date" style={inputStyle} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Jenis</label>
            <select style={inputStyle} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Semua</option>
              <option value="masuk">Pemasukan</option>
              <option value="keluar">Pengeluaran</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={buttonGhost} onClick={exportCSV}><Download size={14} /> Export Excel (CSV)</button>
          <button style={buttonGhost} onClick={() => window.print()}><Printer size={14} /> Cetak / PDF</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard icon={TrendingUp} label="Total pemasukan" value={formatRupiah(summary.masuk)} color={COLORS.green} />
        <MetricCard icon={TrendingDown} label="Total pengeluaran" value={formatRupiah(summary.keluar)} color={COLORS.red} />
        <MetricCard icon={Wallet} label="Saldo" value={formatRupiah(summary.saldo)} />
      </div>

      <div style={cardStyle}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkMuted }}>Tidak ada transaksi pada filter ini.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid " + COLORS.border, textAlign: "left" }}>
                  <th style={{ padding: "8px 6px", color: COLORS.inkMuted, fontWeight: 600 }}>Tanggal</th>
                  <th style={{ padding: "8px 6px", color: COLORS.inkMuted, fontWeight: 600 }}>Proyek</th>
                  <th style={{ padding: "8px 6px", color: COLORS.inkMuted, fontWeight: 600 }}>Kategori</th>
                  <th style={{ padding: "8px 6px", color: COLORS.inkMuted, fontWeight: 600 }}>Keterangan</th>
                  <th style={{ padding: "8px 6px", color: COLORS.inkMuted, fontWeight: 600, textAlign: "right" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const proj = data.projects.find((p) => p.id === t.projectId);
                  const cat = data.categories.find((c) => c.id === t.categoryId);
                  const isMasuk = t.type === "masuk";
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid " + COLORS.bg }}>
                      <td style={{ padding: "8px 6px" }}>{formatDate(t.date)}</td>
                      <td style={{ padding: "8px 6px" }}>{proj ? proj.name : "-"}</td>
                      <td style={{ padding: "8px 6px" }}>{cat ? cat.name : "-"}</td>
                      <td style={{ padding: "8px 6px" }}>{t.description || "-"}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", ...monoStyle, fontWeight: 600, color: isMasuk ? COLORS.green : COLORS.red }}>
                        {isMasuk ? "+" : "-"}{formatRupiah(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Semua field wajib diisi.");
      return;
    }
    const res = onLogin(username.trim(), password);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: COLORS.bg,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');"}</style>
      <div style={{
        ...cardStyle,
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        padding: "32px 24px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            background: COLORS.accentSoft,
            color: COLORS.accent,
            width: 50,
            height: 50,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <Wallet size={24} />
          </div>
          <h2 style={{ ...headingFont, fontSize: 20, fontWeight: 700, margin: 0, color: COLORS.ink }}>Buku Kas Proyek</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.inkMuted }}>Silakan login untuk mengelola kas proyek</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: COLORS.red, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              ...buttonPrimary,
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: 14,
            }}
          >
            Masuk
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 12, background: COLORS.bg, borderRadius: 6, fontSize: 11, color: COLORS.inkMuted }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Info Akun Default:</p>
          <p style={{ margin: "2px 0" }}>• Admin: <strong>admin</strong> / <strong>admin123</strong></p>
          <p style={{ margin: "2px 0" }}>• Staff: <strong>staff</strong> / <strong>staff123</strong></p>
        </div>
      </div>
    </div>
  );
}
