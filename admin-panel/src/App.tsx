import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight,
  Settings,
  Users,
  Activity,
  Calendar,
  Link,
  FileImage,
  Camera,
  CheckCircle,
  X,
  Lock,
  ArrowRight
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'challenges' | 'banners' | 'events' | 'registrations'>('dashboard');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'challenge' | 'banner' | 'event' | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const savedPass = localStorage.getItem('admin_secret');
    if (savedPass) {
        axios.defaults.headers.common['x-admin-secret'] = savedPass;
        setIsAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    }
  }, [activeTab, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length > 3) {
        localStorage.setItem('admin_secret', password);
        axios.defaults.headers.common['x-admin-secret'] = password;
        setIsAuthorized(true);
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
        setChallenges(res.data.challenges || []);
      }
      if (activeTab === 'banners' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/banners`);
        setBanners(res.data.banners || []);
      }
      if (activeTab === 'events' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/events`);
        setEvents(res.data.events || []);
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
    try {
      let endpoint = '';
      if (modalType === 'challenge') endpoint = 'admin/challenges';
      else if (modalType === 'banner') endpoint = 'admin/banners';
      else if (modalType === 'event') endpoint = 'admin/events';

      await axios.post(`${API_URL}/${endpoint}`, formData);
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (e: any) {
      alert('Save failed: ' + (e.response?.data?.message || 'Unauthorized'));
    }
  };

  const handleApprove = async (userId: string, challengeId: string) => {
    try {
      await axios.post(`${API_URL}/admin/registrations/approve`, { userId, challengeId });
      fetchData();
    } catch (e) { alert('Approval failed'); }
  };

  const handleDelete = async (pk: string, sk: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API_URL}/admin/item?pk=${pk}&sk=${sk}`);
      fetchData();
    } catch (e) { alert('Delete failed'); }
  };

  const openAddModal = (type: 'challenge' | 'banner' | 'event') => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleUpload = async (file: File, field: string) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/admin/generate-upload-url`, {
        fileName: file.name,
        contentType: file.type
      });
      const { uploadUrl, publicUrl } = res.data;
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
      setFormData((prev: any) => ({ ...prev, [field]: publicUrl }));
      alert('Upload successful');
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center font-sans p-6">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="inline-flex w-20 h-20 bg-[#ff7a00]/10 rounded-3xl items-center justify-center mb-4 border border-[#ff7a00]/20">
                    <Lock size={32} className="text-[#ff7a00]" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">RunAstra <span className="text-[#ff7a00]">Admin</span></h1>
                    <p className="text-white/40 mt-2 font-medium tracking-wide">Enter master key to access mission control.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative group">
                        <input 
                            type="password"
                            autoFocus
                            placeholder="Master Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#16161e] border border-white/10 rounded-2xl px-6 py-5 text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-normal placeholder:text-white/20"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-[#ff7a00] hover:bg-[#ff8c20] text-black h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-xl shadow-[#ff7a00]/20 group"
                    >
                        Initialize Session <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">Authorized Access Only • System v1.0.4</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#16161e] border-r border-white/5 flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter text-[#ff7a00]">RunAstra</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
          />
          <NavItem 
            active={activeTab === 'challenges'} 
            onClick={() => setActiveTab('challenges')} 
            icon={<Trophy size={20} />} 
            label="Challenges" 
          />
          <NavItem 
            active={activeTab === 'events'} 
            onClick={() => setActiveTab('events')} 
            icon={<Calendar size={20} />} 
            label="Events Hub" 
          />
          <NavItem 
            active={activeTab === 'registrations'} 
            onClick={() => setActiveTab('registrations')} 
            icon={<CheckCircle size={20} />} 
            label="Approvals" 
          />
          <NavItem 
            active={activeTab === 'banners'} 
            onClick={() => setActiveTab('banners')} 
            icon={<ImageIcon size={20} />} 
            label="Sponsor Banners" 
          />
          <div className="pt-8 opacity-20 px-4">
             <div className="h-px bg-white w-full mb-4" />
          </div>
          <NavItem active={false} icon={<Users size={20} />} label="Users" />
          <NavItem active={false} icon={<Settings size={20} />} label="Settings" onClick={handleLogout} />
        </nav>

        <div className="p-4 mt-auto">
          <button onClick={handleLogout} className="w-full bg-[#1c1c28] p-4 rounded-xl border border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors">
             <div className="w-8 h-8 rounded-full bg-[#ff7a00] flex items-center justify-center font-bold text-xs text-black">A</div>
             <div className="text-left">
                <p className="text-sm font-bold">Admin</p>
                <p className="text-[10px] text-white/40">Solution Architect</p>
             </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#0f0f13]/80 backdrop-blur-xl sticky top-0 z-10">
          <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="h-10 px-4 bg-white/5 rounded-full flex items-center gap-2 border border-white/5">
               <Activity size={16} className="text-[#ff7a00]" />
               <span className="text-xs font-medium text-white/60">System Online</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-4 gap-6">
                 <StatCard label="Challenges" value={challenges.length} color="text-blue-400" />
                 <StatCard label="Pending" value={registrations.length} color="text-yellow-400" />
                 <StatCard label="Banners" value={banners.length} color="text-[#ff7a00]" />
                 <StatCard label="Users" value="1,042" color="text-green-400" />
              </div>

              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Recent Challenges</h3>
                    <button className="text-[#ff7a00] text-sm font-bold flex items-center gap-1 hover:underline">
                       View All <ChevronRight size={14} />
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {challenges.slice(0, 4).map((c, i) => (
                      <div key={i} className="bg-[#16161e] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#ff7a00]/10 rounded-xl flex items-center justify-center">
                               <Trophy className="text-[#ff7a00]" size={24} />
                            </div>
                            <div>
                               <p className="font-bold">{c.name}</p>
                               <p className="text-xs text-white/40">{c.type}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-bold">{c.goal?.toLocaleString()} target</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className="space-y-6">
               <h3 className="text-lg font-bold">Pending Approvals</h3>
               <div className="bg-[#16161e] rounded-2xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-white/40">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Challenge ID</th>
                        <th className="px-6 py-4">Date Requested</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {registrations.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-6 font-bold">{reg.userName || reg.userId}</td>
                          <td className="px-6 py-6 text-sm text-white/40">{reg.challengeId}</td>
                          <td className="px-6 py-6 text-sm text-white/40">{new Date(reg.joinedAt || reg.requestedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-6 text-right">
                             <button 
                                onClick={() => handleApprove(reg.userId, reg.challengeId)}
                                className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-bold text-xs transition-transform active:scale-95"
                             >
                               Approve
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {registrations.length === 0 && <div className="p-20 text-center text-white/20 font-bold uppercase tracking-widest text-xs">No pending requests</div>}
               </div>
            </div>
          )}

          {(activeTab === 'challenges' || activeTab === 'banners' || activeTab === 'events') && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <p className="text-white/40 text-sm">Manage all platform {activeTab} content.</p>
                  <button 
                    onClick={() => openAddModal(activeTab === 'challenges' ? 'challenge' : activeTab === 'banners' ? 'banner' : 'event')}
                    className="bg-[#ff7a00] hover:bg-[#ff8c20] text-black px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Plus size={18} /> Add {activeTab === 'challenges' ? 'Challenge' : activeTab === 'banners' ? 'Banner' : 'Event'}
                  </button>
               </div>

               <div className="bg-[#16161e] rounded-2xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-white/40">
                      <tr>
                        <th className="px-6 py-4">Title / Name</th>
                        <th className="px-6 py-4">Type / Info</th>
                        <th className="px-6 py-4">Assets</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(activeTab === 'challenges' ? challenges : activeTab === 'banners' ? banners : events).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-6 font-bold">
                            {item.name || item.title}
                            {item.status === 'past' && <span className="ml-2 text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white/40">PAST</span>}
                          </td>
                          <td className="px-6 py-6 text-sm text-white/40">{item.type || item.date || item.subtitle}</td>
                          <td className="px-6 py-6">
                             <div className="flex gap-2">
                                {item.registrationUrl && <Link size={14} className="text-blue-400" />}
                                {item.flyerTemplateUrl && <FileImage size={14} className="text-[#ff7a00]" />}
                                {item.photosUrl && <Camera size={14} className="text-green-400" />}
                             </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                onClick={() => {
                                    setFormData(item);
                                    setModalType(activeTab === 'challenges' ? 'challenge' : activeTab === 'banners' ? 'banner' : 'event');
                                    setShowModal(true);
                                }}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                               >
                                <Save size={16} className="text-white/40" />
                               </button>
                               <button 
                                onClick={() => handleDelete(item.PK, item.SK)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                               >
                                <Trash2 size={16} className="text-red-400" />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && <div className="p-10 text-center text-white/20 font-bold uppercase tracking-widest text-xs">Loading...</div>}
                  {!loading && (activeTab === 'challenges' ? challenges : activeTab === 'banners' ? banners : events).length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                          {activeTab === 'challenges' ? <Trophy size={32} className="text-white/20" /> : activeTab === 'events' ? <Calendar size={32} className="text-white/20" /> : <ImageIcon size={32} className="text-white/20" />}
                       </div>
                       <p className="text-white/40 font-bold">No {activeTab} found</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL FOR ADDING/EDITING */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-[#1c1c28] w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-xl font-bold uppercase tracking-tight">
                    {formData.SK ? 'Edit' : 'Add New'} {modalType}
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                 {modalType === 'challenge' && (
                    <>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Challenge Name</label>
                          <input 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                            placeholder="e.g. 100k Steps Monthly"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Type</label>
                          <select 
                            value={formData.type || 'STEPS'} 
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full bg-[#16161e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors text-white"
                          >
                            <option value="STEPS">Steps Based</option>
                            <option value="DISTANCE">Distance Based</option>
                            <option value="WEB_TRACKER">Web Tracker (Manual)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Goal</label>
                          <input 
                            type="number"
                            value={formData.goal || ''} 
                            onChange={(e) => setFormData({...formData, goal: parseInt(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                            placeholder="10000"
                          />
                       </div>
                       {formData.type === 'WEB_TRACKER' && (
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Web URL</label>
                            <input 
                                value={formData.url || ''} 
                                onChange={(e) => setFormData({...formData, url: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                                placeholder="https://..."
                            />
                         </div>
                       )}
                    </>
                 )}

                 {modalType === 'banner' && (
                    <>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Banner Title</label>
                          <input 
                            value={formData.title || ''} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                            placeholder="e.g. Get 20% Off at Reebok"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Subtitle</label>
                          <input 
                            value={formData.subtitle || ''} 
                            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                            placeholder="Exclusive Runner Offer"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Image URL</label>
                          <div className="flex gap-2">
                            <input 
                                value={formData.imageUrl || ''} 
                                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                                placeholder="https://..."
                            />
                            <label className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2 border border-white/10 transition-colors">
                                <Camera size={16} />
                                <span className="text-xs font-bold">Upload</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'imageUrl')}
                                />
                            </label>
                          </div>
                       </div>
                    </>
                 )}

                 {modalType === 'event' && (
                    <>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Event Title</label>
                          <input 
                            value={formData.title || ''} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                            placeholder="e.g. Noida Monsoon Run"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Subtitle / Tagline</label>
                          <input 
                            value={formData.subtitle || ''} 
                            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                            placeholder="e.g. Run for a greener future"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Start Date</label>
                             <input 
                                type="date"
                                value={formData.startDate || ''} 
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">End Date</label>
                             <input 
                                type="date"
                                value={formData.endDate || ''} 
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                             />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Status</label>
                             <select 
                                value={formData.status || 'upcoming'} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="w-full bg-[#16161e] border border-white/10 rounded-xl px-4 py-3 text-white"
                             >
                               <option value="upcoming">Upcoming</option>
                               <option value="past">Past</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Event Category</label>
                             <select 
                                value={formData.eventType || 'on_ground'} 
                                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                                className="w-full bg-[#16161e] border border-white/10 rounded-xl px-4 py-3 text-white"
                             >
                               <option value="on_ground">On Ground</option>
                               <option value="virtual">Virtual</option>
                             </select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Description (HTML Supported)</label>
                          <textarea 
                            value={formData.description || ''} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors resize-none"
                            placeholder="Detailed event information..."
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Registration URL</label>
                          <input 
                            value={formData.registrationUrl || ''} 
                            onChange={(e) => setFormData({...formData, registrationUrl: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                            placeholder="https://..."
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Flyer Template URL</label>
                          <div className="flex gap-2">
                            <input 
                                value={formData.flyerTemplateUrl || ''} 
                                onChange={(e) => setFormData({...formData, flyerTemplateUrl: e.target.value})}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ff7a00] transition-colors"
                                placeholder="https://..."
                            />
                            <label className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2 border border-white/10 transition-colors">
                                <FileImage size={16} />
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'flyerTemplateUrl')}
                                />
                            </label>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Photos Drive Link (for Past)</label>
                          <input 
                            value={formData.photosUrl || ''} 
                            onChange={(e) => setFormData({...formData, photosUrl: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                            placeholder="https://drive.google.com/..."
                          />
                       </div>
                    </>
                 )}
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4">
                 <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                    onClick={handleSave}
                    className="flex-1 px-6 py-4 rounded-2xl bg-[#ff7a00] text-black font-black hover:bg-[#ff8c20] transition-colors shadow-lg shadow-[#ff7a00]/20"
                 >
                   Save {modalType}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
        active ? 'bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/20' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-[#16161e] p-6 rounded-2xl border border-white/5 shadow-xl">
      <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-2">{label}</p>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default App;
