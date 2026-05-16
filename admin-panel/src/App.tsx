import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Settings,
  Users,
  Activity,
  Calendar,
  X,
  Lock,
  ArrowRight,
  Download,
  Shield,
  Zap
} from 'lucide-react';
import axios from 'axios';

// --- Configuration ---
const API_URL = import.meta.env.VITE_API_URL || 'https://api.athleon.co.in';
const INTERNAL_SECRET = import.meta.env.VITE_INTERNAL_SECRET || 'runastra_internal_sync_secret';

// Configure Axios Defaults
axios.defaults.headers.common['x-internal-secret'] = INTERNAL_SECRET;

function App() {
  const [isAuthenticated, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [adminRole, setAdminRole] = useState<'MASTER' | 'ORGANIZER'>('ORGANIZER');
  const [assignedChallenges, setAssignedChallenges] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'challenges' | 'banners' | 'events' | 'registrations' | 'admins'>('dashboard');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'challenge' | 'banner' | 'event' | 'participants' | 'admin_user' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);

  useEffect(() => {
    const savedPass = localStorage.getItem('admin_secret');
    if (savedPass) {
        axios.defaults.headers.common['x-admin-secret'] = savedPass;
        performInitialLogin();
    }
  }, []);

  const performInitialLogin = async () => {
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/admin/login`);
        if (res.data.status === 'success') {
            setAdminRole(res.data.role);
            setAssignedChallenges(res.data.assignedChallenges || []);
            setIsAuthorized(true);
        }
    } catch (e) {
        handleLogout();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    }
  }, [activeTab, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length > 3) {
        setLoading(true);
        try {
            axios.defaults.headers.common['x-admin-secret'] = password;
            const res = await axios.post(`${API_URL}/admin/login`);
            if (res.data.status === 'success') {
                localStorage.setItem('admin_secret', password);
                setAdminRole(res.data.role);
                setAssignedChallenges(res.data.assignedChallenges || []);
                setIsAuthorized(true);
            }
        } catch (e) {
            alert('Invalid master key or unauthorized');
            delete axios.defaults.headers.common['x-admin-secret'];
        }
        setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_secret');
    delete axios.defaults.headers.common['x-admin-secret'];
    setIsAuthorized(false);
    setPassword('');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'challenges' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/challenges`);
        let list = res.data.challenges || [];
        if (adminRole === 'ORGANIZER') {
            list = list.filter((c: any) => assignedChallenges.includes(c.id));
        }
        setChallenges(list);
      }
      if (adminRole === 'MASTER') {
        if (activeTab === 'banners' || activeTab === 'dashboard') {
            const res = await axios.get(`${API_URL}/banners`);
            setBanners(res.data.banners || []);
        }
        if (activeTab === 'events' || activeTab === 'dashboard') {
            const res = await axios.get(`${API_URL}/events`);
            setEvents(res.data.events || []);
        }
        if (activeTab === 'admins') {
            const res = await axios.get(`${API_URL}/admin/users`);
            setAdminUsers(res.data.users || []);
        }
      }
      if (activeTab === 'registrations' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/admin/registrations`);
        setRegistrations(res.data.registrations || []);
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
      if (e.response?.status === 401 || e.response?.status === 403) {
          handleLogout();
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (modalType === 'challenge') endpoint = '/admin/challenges';
      else if (modalType === 'banner') endpoint = '/admin/banners';
      else if (modalType === 'event') endpoint = '/admin/events';
      else if (modalType === 'admin_user') endpoint = '/admin/users';

      await axios.post(`${API_URL}${endpoint}`, formData);
      setShowModal(false);
      fetchData();
    } catch (e) {
      alert('Save failed');
    }
    setLoading(false);
  };

  const handleDelete = async (pk: string, sk: string) => {
    if (!confirm('Are you sure?')) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/admin/item?pk=${pk}&sk=${sk}`);
      fetchData();
    } catch (e) {
      alert('Delete failed');
    }
    setLoading(false);
  };

  const [nextToken, setNextToken] = useState<string | null>(null);

  const fetchParticipants = async (challengeId: string, isLoadMore = false) => {
    setLoading(true);
    setCurrentChallengeId(challengeId);
    try {
        const url = `${API_URL}/admin/challenge/participants?challengeId=${challengeId}${isLoadMore && nextToken ? `&nextToken=${nextToken}` : ''}`;
        const res = await axios.get(url);
        if (isLoadMore) {
            setSelectedParticipants([...selectedParticipants, ...(res.data.participants || [])]);
        } else {
            setSelectedParticipants(res.data.participants || []);
        }
        setNextToken(res.data.nextToken || null);
        setModalType('participants');
        setShowModal(true);
    } catch (e) {
        alert('Failed to load participants');
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (!currentChallengeId) return;
    window.open(`${API_URL}/admin/challenge/export?challengeId=${currentChallengeId}&x-admin-secret=${localStorage.getItem('admin_secret')}`);
  };

  const addCategory = () => {
    const categories = formData.categories || [];
    setFormData({
        ...formData,
        categories: [...categories, { id: `cat_${Date.now()}`, name: '', goal: 0 }]
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#16161e] rounded-[32px] p-10 border border-white/5 shadow-2xl text-center">
          <div className="w-20 h-20 bg-[#ff7a00]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock size={32} className="text-[#ff7a00]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">ASTRA COMMAND</h1>
          <p className="text-white/40 mb-8 font-medium">Identify yourself to proceed</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="SECRET KEY" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-white focus:outline-none focus:border-[#ff7a00] transition-all tracking-[4px]"
            />
            <button disabled={loading} className="w-full bg-[#ff7a00] hover:bg-[#ff8c20] text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group">
              {loading ? 'AUTHENTICATING...' : 'LOG IN'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'ALL' },
    { id: 'challenges', label: 'My Challenges', icon: Trophy, role: 'ALL' },
    { id: 'events', label: 'Global Events', icon: Calendar, role: 'MASTER' },
    { id: 'banners', label: 'Sponsors', icon: ImageIcon, role: 'MASTER' },
    { id: 'registrations', label: 'Approvals', icon: Users, role: 'ALL' },
    { id: 'admins', label: 'Manage Admins', icon: Shield, role: 'MASTER' },
  ].filter(t => t.role === 'ALL' || adminRole === 'MASTER');

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#16161e] border-r border-white/5 flex flex-col p-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-[#ff7a00] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-black" />
          </div>
          <div>
            <div className="font-black text-xl tracking-tighter">ASTRA</div>
            <div className="text-[8px] font-black text-[#ff7a00] tracking-widest">{adminRole} PANEL</div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id ? 'bg-[#ff7a00] text-black' : 'text-white/40 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-4 px-6 py-4 text-white/20 hover:text-red-400 font-bold transition-colors">
          <Lock size={18} /> Logout
        </button>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tight">{activeTab}</h2>
            <p className="text-white/40 font-medium mt-1">
                {adminRole === 'MASTER' ? 'Complete platform command center' : 'Manage your assigned virtual events'}
            </p>
          </div>
          {['challenges', 'banners', 'events', 'admins'].includes(activeTab) && adminRole === 'MASTER' && (
            <button 
              onClick={() => {
                if (activeTab === 'admins') {
                    setFormData({ name: '', secret: '', status: 'active', assignedChallenges: [] });
                    setModalType('admin_user');
                } else {
                    setFormData({
                        type: 'STEPS', dataSource: 'STEPS', metric: 'STEPS',
                        rules: { aggregation: 'DAILY_TOTAL', dailyMin: 0, dailyMax: 10000, minActiveDays: 0, allowRankSurge: true },
                        categories: []
                    });
                    setModalType(activeTab === 'challenges' ? 'challenge' : activeTab === 'banners' ? 'banner' : 'event');
                }
                setShowModal(true);
              }}
              className="bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all border border-white/5"
            >
              <Plus size={20} /> CREATE NEW
            </button>
          )}
        </header>

        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-4 gap-8">
             {[
               { label: 'Active Users', val: '1,284', icon: Users, color: 'text-blue-400' },
               { label: 'Sync Requests', val: '48.2k', icon: Activity, color: 'text-[#ff7a00]' },
               { label: 'My Challenges', val: challenges.length, icon: Trophy, color: 'text-green-400' },
               { label: 'Pending Reg', val: registrations.length, icon: Shield, color: 'text-red-400' },
             ].map((stat, i) => (
               <div key={i} className="bg-[#16161e] p-8 rounded-[32px] border border-white/5">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div className="text-3xl font-black mb-1">{stat.val}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{stat.label}</div>
               </div>
             ))}
          </div>
        ) : activeTab === 'admins' ? (
            <div className="bg-[#16161e] rounded-[32px] border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-white/40">
                      <tr>
                        <th className="px-6 py-4">Organizer Name</th>
                        <th className="px-6 py-4">Secret Key</th>
                        <th className="px-6 py-4">Assigned Challenges</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {adminUsers.map((user, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-6">
                                    <div className="font-bold">{user.name}</div>
                                    <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mt-1 ${user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{user.status}</div>
                                </td>
                                <td className="px-6 py-6 font-mono text-xs text-white/40">{user.secret}</td>
                                <td className="px-6 py-6">
                                    <div className="flex flex-wrap gap-1">
                                        {(user.assignedChallenges || []).map((id: string) => (
                                            <span key={id} className="text-[8px] bg-white/5 px-2 py-1 rounded text-white/60 font-black">{id}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setFormData(user); setModalType('admin_user'); setShowModal(true); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Settings size={16} /></button>
                                        <button onClick={() => handleDelete('ADMIN_USER', user.SK)} className="p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} className="text-red-400/60" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="bg-[#16161e] rounded-[32px] border border-white/5 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-white/40">
                  <tr>
                    <th className="px-6 py-4">Title / Name</th>
                    <th className="px-6 py-4">Type / Config</th>
                    <th className="px-6 py-4">Rules</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(activeTab === 'challenges' ? challenges : activeTab === 'banners' ? banners : activeTab === 'events' ? events : []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-6">
                        <div className="font-bold text-lg">{item.name || item.title}</div>
                        <div className="text-[10px] font-black text-[#ff7a00] uppercase tracking-tighter mt-1">{item.dataSource || item.type} • {item.metric || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-1">
                            {(item.categories || []).map((c: any) => (
                                <span key={c.id} className="text-[8px] bg-white/5 px-2 py-1 rounded text-white/60 font-black">{c.name}: {c.goal}</span>
                            ))}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex gap-4">
                           {item.rules?.dailyMax && <div className="text-center"><div className="text-xs font-bold text-white/80">{item.rules.dailyMax}</div><div className="text-[8px] text-white/20 font-black">CAP</div></div>}
                           {item.rules?.minActiveDays && <div className="text-center"><div className="text-xs font-bold text-white/80">{item.rules.minActiveDays}</div><div className="text-[8px] text-white/20 font-black">DAYS</div></div>}
                           {item.rules?.allowRankSurge && <Zap size={14} className="text-yellow-400 self-center" />}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-end gap-2">
                           {activeTab === 'challenges' && (
                             <button onClick={() => fetchParticipants(item.id)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                <Users size={16} className="text-blue-400" />
                             </button>
                           )}
                           {(adminRole === 'MASTER' || (activeTab === 'challenges' && assignedChallenges.includes(item.id))) && (
                             <button 
                                onClick={() => {
                                    setFormData(item);
                                    setModalType(activeTab === 'challenges' ? 'challenge' : activeTab === 'banners' ? 'banner' : 'event');
                                    setShowModal(true);
                                }}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                               >
                                <Settings size={16} className="text-white/60" />
                               </button>
                           )}
                           {adminRole === 'MASTER' && (
                             <button 
                                onClick={() => handleDelete(item.PK, item.SK)}
                                className="p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all"
                               >
                                <Trash2 size={16} className="text-red-400/60" />
                               </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
             {loading && <div className="p-10 text-center text-white/20 font-black uppercase tracking-widest text-xs">Syncing with AWS...</div>}
          </div>
        )}
      </main>

      {/* DYNAMIC RULES & CONFIG MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
           <div className="bg-[#1c1c28] w-full max-w-4xl rounded-[40px] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">
                        {modalType === 'participants' ? 'Challenge Participants' : `${formData.SK ? 'Update' : 'Configure'} ${modalType}`}
                    </h3>
                    <p className="text-white/40 text-sm font-medium mt-1">Precision control for your virtual experience</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-10 flex-1 overflow-y-auto">
                 {modalType === 'participants' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5">
                            <div>
                                <div className="text-2xl font-black">{selectedParticipants.length}</div>
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Participants</div>
                            </div>
                            <button onClick={downloadCSV} className="bg-[#ff7a00] text-black px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-[#ff8c20] transition-all">
                                <Download size={18} /> DOWNLOAD CSV
                            </button>
                        </div>
                        <div className="bg-[#16161e] rounded-3xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Participant</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Progress</th>
                                        <th className="px-6 py-4">Stats</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {selectedParticipants.map((p, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 font-bold">{p.userName}<div className="text-[10px] text-white/20 font-medium">{p.email}</div></td>
                                            <td className="px-6 py-4"><span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-black">{p.categoryId}</span></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#ff7a00]" style={{ width: `${p.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs font-black">{p.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-white/60">{p.currentVal} {p.activeDays ? `• ${p.activeDays} Days` : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {nextToken && (
                            <button 
                                onClick={() => fetchParticipants(currentChallengeId!, true)} 
                                disabled={loading}
                                className="w-full py-4 border border-white/10 rounded-2xl font-black text-white/40 hover:bg-white/5 transition-all"
                            >
                                {loading ? 'LOADING...' : 'LOAD MORE PARTICIPANTS'}
                            </button>
                        )}
                    </div>
                 ) : modalType === 'admin_user' ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Organizer Name</label>
                                <input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold" placeholder="E.g. Sports Academy" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Secret Key (Login Password)</label>
                                <input value={formData.secret || ''} onChange={(e) => setFormData({...formData, secret: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-mono font-bold text-[#ff7a00]" placeholder="unique_secret_123" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Assigned Challenge IDs (Comma Separated)</label>
                            <input value={(formData.assignedChallenges || []).join(', ')} onChange={(e) => setFormData({...formData, assignedChallenges: e.target.value.split(',').map((s: string) => s.trim())})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold" placeholder="challenge_id_1, challenge_id_2" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Status</label>
                            <select value={formData.status || 'active'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="bg-[#16161e] border border-white/10 rounded-xl px-4 py-2 font-bold">
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>
                 ) : modalType === 'challenge' ? (
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">General Info</label>
                                <input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#ff7a00] transition-all font-bold" placeholder="Challenge Name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={formData.dataSource || 'STEPS'} onChange={(e) => setFormData({...formData, dataSource: e.target.value})} className="bg-[#16161e] border border-white/10 rounded-2xl px-6 py-4 font-bold">
                                        <option value="STEPS">Internal Steps</option>
                                        <option value="STRAVA">Strava Data</option>
                                    </select>
                                    <select value={formData.metric || 'STEPS'} onChange={(e) => setFormData({...formData, metric: e.target.value})} className="bg-[#16161e] border border-white/10 rounded-2xl px-6 py-4 font-bold">
                                        <option value="STEPS">Steps Count</option>
                                        <option value="DISTANCE">Distance (KM)</option>
                                        <option value="COUNT">Session Count</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Categories</label>
                                    <button onClick={addCategory} className="text-[10px] font-black text-[#ff7a00] flex items-center gap-1"><Plus size={12} /> ADD CATEGORY</button>
                                </div>
                                <div className="space-y-3">
                                    {(formData.categories || []).map((cat: any, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <input value={cat.name} onChange={(e) => {
                                                const cats = [...formData.categories];
                                                cats[i].name = e.target.value;
                                                setFormData({...formData, categories: cats});
                                            }} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold" placeholder="Label (e.g. Gold)" />
                                            <input type="number" value={cat.goal} onChange={(e) => {
                                                const cats = [...formData.categories];
                                                cats[i].goal = parseFloat(e.target.value);
                                                setFormData({...formData, categories: cats});
                                            }} className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-center" placeholder="Goal" />
                                            <button onClick={() => {
                                                const cats = formData.categories.filter((_: any, idx: number) => idx !== i);
                                                setFormData({...formData, categories: cats});
                                            }} className="p-3 text-red-400/40 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 bg-white/5 p-8 rounded-[32px] border border-white/5">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[#ff7a00] tracking-widest">Omni Engine Rules</label>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div><div className="font-bold text-sm">Daily Maximum Cap</div><div className="text-[10px] text-white/20 font-medium">Prevent weekend-warrior spikes</div></div>
                                        <input type="number" value={formData.rules?.dailyMax || ''} onChange={(e) => setFormData({...formData, rules: {...formData.rules, dailyMax: parseFloat(e.target.value)}})} className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div><div className="font-bold text-sm">Daily Minimum Goal</div><div className="text-[10px] text-white/20 font-medium">Minimum to count as active day</div></div>
                                        <input type="number" value={formData.rules?.dailyMin || ''} onChange={(e) => setFormData({...formData, rules: {...formData.rules, dailyMin: parseFloat(e.target.value)}})} className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div><div className="font-bold text-sm">Min Active Days</div><div className="text-[10px] text-white/20 font-medium">Participants must be regular</div></div>
                                        <input type="number" value={formData.rules?.minActiveDays || ''} onChange={(e) => setFormData({...formData, rules: {...formData.rules, minActiveDays: parseFloat(e.target.value)}})} className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div><div className="font-bold text-sm">Rank Surge</div><div className="text-[10px] text-white/20 font-medium">Accumulate data beyond goal</div></div>
                                        <button onClick={() => setFormData({...formData, rules: {...formData.rules, allowRankSurge: !formData.rules?.allowRankSurge}})} className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${formData.rules?.allowRankSurge ? 'bg-[#ff7a00]' : 'bg-white/10'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-black transition-all ${formData.rules?.allowRankSurge ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 ) : (
                    <div className="p-20 text-center text-white/20 font-black uppercase tracking-widest">Configuration Interface</div>
                 )}
              </div>

              <div className="p-10 border-t border-white/5 flex gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-5 rounded-2xl font-black text-white/40 hover:bg-white/5 transition-all">CANCEL</button>
                 {modalType !== 'participants' && (
                    <button disabled={loading} onClick={handleSave} className="flex-[2] bg-[#ff7a00] text-black py-5 rounded-2xl font-black hover:bg-[#ff8c20] transition-all shadow-lg shadow-[#ff7a00]/20 flex items-center justify-center gap-2">
                        {loading ? 'SAVING...' : 'COMMIT CHANGES'}
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
